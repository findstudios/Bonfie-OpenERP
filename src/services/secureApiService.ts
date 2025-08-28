/**
 * 安全 API 服務
 * 整合輸入驗證和安全檢查的 API 服務
 */

import { supabase } from './supabase'
import {
  validateWithSchema,
  contactSchema,
  studentSchema,
  orderSchema,
  leadSchema,
  sanitizers,
  middleware,
  ValidationException,
  SecurityException
} from '@/utils/validation'
import type { z } from 'zod'

// API 基礎配置
const EDGE_FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

// CSRF Token 管理
let csrfToken: string | null = null

/**
 * 初始化 CSRF Token
 */
export function initializeCSRFToken(): string {
  csrfToken = middleware.generateCSRFToken()
  // 儲存到 cookie
  document.cookie = `csrf_token=${csrfToken}; SameSite=Strict; Secure`
  return csrfToken
}

/**
 * 取得當前 CSRF Token
 */
export function getCSRFToken(): string {
  if (!csrfToken) {
    // 從 cookie 讀取
    const match = document.cookie.match(/csrf_token=([^;]+)/)
    csrfToken = match ? match[1] : initializeCSRFToken()
  }
  return csrfToken
}

/**
 * 安全的 API 請求包裝器
 */
async function secureRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    // 取得 session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new SecurityException('未授權的存取', 'UNAUTHORIZED')
    }

    // 設定安全 headers
    const headers = new Headers(options.headers)
    headers.set('Authorization', `Bearer ${session.access_token}`)
    headers.set('X-CSRF-Token', getCSRFToken())
    headers.set('Content-Type', 'application/json')

    // 發送請求
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    })

    // 檢查回應
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Secure request failed:', error)
    throw error
  }
}

/**
 * 驗證並清理資料
 */
function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  // 深度清理物件
  const sanitizedData = sanitizers.object.deep(data as any)

  // 驗證資料
  const result = validateWithSchema(schema, sanitizedData)

  if (!result.success) {
    throw new ValidationException(
      Object.entries(result.errors).map(([field, messages]) => ({
        code: 'VALIDATION_ERROR',
        field,
        message: messages.join(', ')
      }))
    )
  }

  return result.data
}

// ============================================================================
// 聯絡人 API
// ============================================================================

export const secureContactService = {
  /**
   * 創建聯絡人（含驗證）
   */
  async create(data: unknown) {
    // 前端驗證和清理
    const validatedData = validateAndSanitize(contactSchema, data)

    // 發送到 Edge Function 進行後端驗證
    const response = await secureRequest(`${EDGE_FUNCTIONS_URL}/input-validation`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'contact',
        data: validatedData,
        action: 'save'
      })
    })

    return response
  },

  /**
   * 更新聯絡人
   */
  async update(id: string, data: unknown) {
    // 驗證 ID
    if (!id.match(/^[A-Z0-9_-]+$/i)) {
      throw new ValidationException('無效的 ID 格式')
    }

    // 驗證和清理資料
    const validatedData = validateAndSanitize(contactSchema.partial(), data)

    // 使用 Supabase 更新
    const { data: result, error } = await supabase
      .from('contacts')
      .update(validatedData)
      .eq('contact_id', id)
      .select()
      .single()

    if (error) throw error
    return result
  },

  /**
   * 搜尋聯絡人
   */
  async search(query: string) {
    // 清理搜尋查詢
    const cleanQuery = sanitizers.data.search(query)

    // 檢查是否包含惡意內容
    if (sanitizers.security.detectXSS(cleanQuery)) {
      throw new SecurityException('偵測到不安全的搜尋內容', 'XSS_DETECTED')
    }

    // 執行搜尋
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .or(`full_name.ilike.%${cleanQuery}%,phone.ilike.%${cleanQuery}%,email.ilike.%${cleanQuery}%`)
      .limit(20)

    if (error) throw error
    return data
  }
}

// ============================================================================
// 學生 API
// ============================================================================

export const secureStudentService = {
  /**
   * 創建學生（含驗證）
   */
  async create(data: unknown) {
    // 前端驗證和清理
    const validatedData = validateAndSanitize(studentSchema, data)

    // 發送到 Edge Function 進行後端驗證
    const response = await secureRequest(`${EDGE_FUNCTIONS_URL}/input-validation`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'student',
        data: validatedData,
        action: 'save'
      })
    })

    return response
  },

  /**
   * 批次匯入學生
   */
  async batchImport(students: unknown[]) {
    // 驗證每個學生資料
    const validatedStudents = students.map((student, index) => {
      try {
        return validateAndSanitize(studentSchema, student)
      } catch (error) {
        throw new ValidationException(`第 ${index + 1} 筆資料驗證失敗: ${error.message}`)
      }
    })

    // 批次插入
    const { data, error } = await supabase
      .from('students')
      .insert(validatedStudents)
      .select()

    if (error) throw error
    return data
  }
}

// ============================================================================
// 訂單 API
// ============================================================================

export const secureOrderService = {
  /**
   * 創建訂單（含驗證）
   */
  async create(data: unknown) {
    // 前端驗證和清理
    const validatedData = validateAndSanitize(orderSchema, data)

    // 額外的業務邏輯驗證
    if (validatedData.discount_amount > validatedData.original_amount) {
      throw new ValidationException('折扣金額不能大於原始金額')
    }

    // 發送到 Edge Function 進行後端驗證
    const response = await secureRequest(`${EDGE_FUNCTIONS_URL}/input-validation`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'order',
        data: validatedData,
        action: 'save'
      })
    })

    return response
  }
}

// ============================================================================
// CRM Lead API
// ============================================================================

export const secureLeadService = {
  /**
   * 創建潛在客戶（含驗證）
   */
  async create(data: unknown) {
    // 前端驗證和清理
    const validatedData = validateAndSanitize(leadSchema, data)

    // 發送到 Edge Function 進行後端驗證
    const response = await secureRequest(`${EDGE_FUNCTIONS_URL}/input-validation`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'lead',
        data: validatedData,
        action: 'save'
      })
    })

    return response
  },

  /**
   * 追蹤跟進記錄（含 XSS 防護）
   */
  async addFollowUp(leadId: string, content: string) {
    // 清理內容
    const cleanContent = sanitizers.html.basic(content)

    // 檢查 XSS
    if (sanitizers.security.detectXSS(content)) {
      throw new SecurityException('偵測到不安全的內容', 'XSS_DETECTED')
    }

    const { data, error } = await supabase
      .from('follow_ups')
      .insert({
        lead_id: leadId,
        content: cleanContent,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// ============================================================================
// 安全監控 API
// ============================================================================

export const securityMonitorService = {
  /**
   * 記錄安全事件
   */
  async logSecurityEvent(event: {
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    details: string
    payload?: any
  }) {
    try {
      await secureRequest(`${EDGE_FUNCTIONS_URL}/security-monitor`, {
        method: 'POST',
        body: JSON.stringify(event)
      })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  },

  /**
   * 檢查請求安全性
   */
  async checkRequestSecurity(requestData: any) {
    const response = await secureRequest(`${EDGE_FUNCTIONS_URL}/security-monitor`, {
      method: 'POST',
      body: JSON.stringify(requestData)
    })

    return response
  }
}

// ============================================================================
// 檔案上傳服務
// ============================================================================

export const secureFileService = {
  /**
   * 安全的檔案上傳
   */
  async uploadFile(file: File, bucket: string = 'uploads') {
    // 驗證檔案
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      throw new ValidationException('不支援的檔案類型')
    }

    if (file.size > maxSize) {
      throw new ValidationException('檔案大小超過限制')
    }

    // 清理檔案名稱
    const cleanFilename = sanitizers.data.filename(file.name)
    const timestamp = Date.now()
    const uniqueFilename = `${timestamp}_${cleanFilename}`

    // 上傳檔案
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uniqueFilename, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // 取得公開 URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(uniqueFilename)

    return {
      filename: uniqueFilename,
      url: publicUrl,
      size: file.size,
      type: file.type
    }
  }
}

// ============================================================================
// 初始化
// ============================================================================

// 在應用程式啟動時初始化 CSRF Token
if (typeof window !== 'undefined') {
  initializeCSRFToken()
}
