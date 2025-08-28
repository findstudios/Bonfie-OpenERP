/**
 * 安全的 API 請求服務
 * 提供 CSRF 保護和 Session 管理
 */

import { supabase } from './supabase'
import { sessionService } from './sessionService'
import { useCSRF } from '@/composables/useCSRF'

interface RequestOptions {
  method?: string
  headers?: Record<string, string>
  body?: any
  skipCSRF?: boolean
}

interface ApiResponse<T = any> {
  data?: T
  error?: Error | null
}

class SecureApiService {
  private csrf = useCSRF()

  /**
   * 發送安全的 API 請求
   */
  async request<T = any>(
    url: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      const method = options.method || 'GET'
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers
      }

      // 檢查 session
      const sessionToken = sessionService.getSessionToken()
      if (!sessionToken) {
        throw new Error('未登入或 session 已過期')
      }

      // 添加 session ID
      const validation = await sessionService.validateSession(sessionToken)
      if (!validation.isValid || !validation.session) {
        throw new Error('Session 無效')
      }
      headers['X-Session-ID'] = validation.session.session_id

      // 添加 CSRF 保護
      if (!options.skipCSRF && this.csrf.needsCSRFProtection(method)) {
        const csrfHeaders = this.csrf.getHeaders()
        Object.assign(headers, csrfHeaders)
      }

      // 準備請求選項
      const fetchOptions: RequestInit = {
        method,
        headers,
        credentials: 'include', // 包含 cookies
      }

      // 添加請求體
      if (options.body && method !== 'GET' && method !== 'HEAD') {
        if (options.body instanceof FormData) {
          // FormData 不需要 Content-Type
          delete headers['Content-Type']
          // 添加 CSRF token 到 FormData
          if (!options.skipCSRF) {
            this.csrf.addTokenToForm(options.body)
          }
          fetchOptions.body = options.body
        } else {
          // JSON 請求體
          fetchOptions.body = JSON.stringify(options.body)
        }
      }

      // 發送請求
      const response = await fetch(url, fetchOptions)

      // 檢查響應
      if (!response.ok) {
        if (response.status === 401) {
          // Session 過期，清除並重定向到登入頁
          await this.handleUnauthorized()
          throw new Error('請重新登入')
        }

        if (response.status === 403) {
          throw new Error('沒有權限執行此操作')
        }

        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `請求失敗: ${response.status}`)
      }

      // 解析響應
      const data = await response.json()
      return { data, error: null }

    } catch (error) {
      console.error('API 請求失敗:', error)
      return {
        data: undefined,
        error: error instanceof Error ? error : new Error('未知錯誤')
      }
    }
  }

  /**
   * GET 請求
   */
  async get<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET', headers })
  }

  /**
   * POST 請求
   */
  async post<T = any>(
    url: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'POST', body, headers })
  }

  /**
   * PUT 請求
   */
  async put<T = any>(
    url: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'PUT', body, headers })
  }

  /**
   * PATCH 請求
   */
  async patch<T = any>(
    url: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'PATCH', body, headers })
  }

  /**
   * DELETE 請求
   */
  async delete<T = any>(
    url: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE', headers })
  }

  /**
   * 處理未授權錯誤
   */
  private async handleUnauthorized() {
    // 清除 session
    const sessionId = sessionService.getSessionToken()
    if (sessionId) {
      try {
        await sessionService.revokeSession(sessionId)
      } catch (error) {
        console.error('撤銷 session 失敗:', error)
      }
    }

    // 重定向到登入頁
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  /**
   * 使用 Supabase 進行安全查詢
   */
  async supabaseQuery<T = any>(
    table: string,
    query: (builder: any) => any
  ): Promise<ApiResponse<T>> {
    try {
      // 檢查 session
      const sessionToken = sessionService.getSessionToken()
      if (!sessionToken) {
        throw new Error('未登入或 session 已過期')
      }

      const validation = await sessionService.validateSession(sessionToken)
      if (!validation.isValid) {
        throw new Error('Session 無效')
      }

      // 執行查詢
      const queryBuilder = supabase.from(table)
      const finalQuery = query(queryBuilder)
      const { data, error } = await finalQuery

      if (error) {
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('Supabase 查詢失敗:', error)
      return {
        data: undefined,
        error: error instanceof Error ? error : new Error('查詢失敗')
      }
    }
  }

  /**
   * 上傳檔案（含 CSRF 保護）
   */
  async uploadFile(
    url: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<ApiResponse> {
    const formData = new FormData()
    formData.append('file', file)

    // 添加額外資料
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    return this.request(url, {
      method: 'POST',
      body: formData
    })
  }
}

export const secureApi = new SecureApiService()
export type { ApiResponse, RequestOptions }
