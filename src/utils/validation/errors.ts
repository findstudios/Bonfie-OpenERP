/**
 * 驗證錯誤處理
 * 統一的錯誤格式和處理機制
 */

import { ZodError } from 'zod'

// ============================================================================
// 錯誤類型定義
// ============================================================================

export interface ValidationError {
  code: string
  message: string
  field?: string
  details?: any
}

export interface ValidationResult<T = any> {
  success: boolean
  data?: T
  errors?: ValidationError[]
}

// ============================================================================
// 自定義錯誤類別
// ============================================================================

export class ValidationException extends Error {
  public errors: ValidationError[]

  constructor(errors: ValidationError[] | string) {
    const errorList = typeof errors === 'string'
      ? [{ code: 'VALIDATION_ERROR', message: errors }]
      : errors

    super(errorList.map(e => e.message).join(', '))
    this.name = 'ValidationException'
    this.errors = errorList
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      errors: this.errors
    }
  }
}

export class SecurityException extends Error {
  public code: string
  public details?: any

  constructor(message: string, code: string = 'SECURITY_ERROR', details?: any) {
    super(message)
    this.name = 'SecurityException'
    this.code = code
    this.details = details
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details
    }
  }
}

// ============================================================================
// 錯誤碼定義
// ============================================================================

export const ERROR_CODES = {
  // 通用錯誤
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_TYPE: 'INVALID_TYPE',
  OUT_OF_RANGE: 'OUT_OF_RANGE',

  // 安全性錯誤
  XSS_DETECTED: 'XSS_DETECTED',
  SQL_INJECTION_DETECTED: 'SQL_INJECTION_DETECTED',
  CSRF_TOKEN_INVALID: 'CSRF_TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // 業務邏輯錯誤
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  REFERENCE_NOT_FOUND: 'REFERENCE_NOT_FOUND',
  INVALID_STATE: 'INVALID_STATE',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',

  // 檔案錯誤
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED'
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

// ============================================================================
// 錯誤訊息對應
// ============================================================================

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // 通用錯誤
  REQUIRED_FIELD: '此欄位為必填',
  INVALID_FORMAT: '格式不正確',
  INVALID_TYPE: '資料類型錯誤',
  OUT_OF_RANGE: '數值超出允許範圍',

  // 安全性錯誤
  XSS_DETECTED: '偵測到潛在的 XSS 攻擊',
  SQL_INJECTION_DETECTED: '偵測到潛在的 SQL 注入攻擊',
  CSRF_TOKEN_INVALID: 'CSRF Token 無效',
  UNAUTHORIZED: '未授權的存取',
  FORBIDDEN: '禁止存取',

  // 業務邏輯錯誤
  DUPLICATE_ENTRY: '資料重複',
  REFERENCE_NOT_FOUND: '參照的資料不存在',
  INVALID_STATE: '無效的狀態',
  BUSINESS_RULE_VIOLATION: '違反業務規則',

  // 檔案錯誤
  FILE_TOO_LARGE: '檔案大小超過限制',
  INVALID_FILE_TYPE: '不支援的檔案類型',
  FILE_UPLOAD_FAILED: '檔案上傳失敗'
}

// ============================================================================
// 錯誤轉換函數
// ============================================================================

/**
 * 將 Zod 錯誤轉換為統一格式
 */
export function zodErrorToValidationErrors(error: ZodError): ValidationError[] {
  return error.issues.map(issue => ({
    code: issue.code,
    message: issue.message,
    field: issue.path.join('.'),
    details: {
      type: issue.code,
      path: issue.path
    }
  }))
}

/**
 * 建立驗證錯誤
 */
export function createValidationError(
  code: ErrorCode,
  field?: string,
  customMessage?: string,
  details?: any
): ValidationError {
  return {
    code,
    message: customMessage || ERROR_MESSAGES[code] || '驗證錯誤',
    field,
    details
  }
}

/**
 * 建立驗證結果
 */
export function createValidationResult<T>(
  success: boolean,
  data?: T,
  errors?: ValidationError[]
): ValidationResult<T> {
  return success
    ? { success: true, data }
    : { success: false, errors: errors || [] }
}

// ============================================================================
// 錯誤處理工具
// ============================================================================

/**
 * 安全的錯誤訊息格式化（避免洩漏敏感資訊）
 */
export function formatErrorForClient(error: Error): {
  message: string
  code?: string
  errors?: ValidationError[]
} {
  // 驗證例外
  if (error instanceof ValidationException) {
    return {
      message: '驗證失敗',
      code: 'VALIDATION_ERROR',
      errors: error.errors
    }
  }

  // 安全例外
  if (error instanceof SecurityException) {
    return {
      message: '安全性錯誤',
      code: error.code
    }
  }

  // Zod 錯誤
  if (error instanceof ZodError) {
    return {
      message: '輸入資料驗證失敗',
      code: 'VALIDATION_ERROR',
      errors: zodErrorToValidationErrors(error)
    }
  }

  // 一般錯誤（不洩漏詳細資訊）
  return {
    message: '系統錯誤，請稍後再試',
    code: 'SYSTEM_ERROR'
  }
}

/**
 * 記錄錯誤（用於伺服器端）
 */
export function logValidationError(
  error: Error | ValidationException | SecurityException,
  context?: Record<string, any>
): void {
  const timestamp = new Date().toISOString()
  const errorInfo = {
    timestamp,
    type: error.name,
    message: error.message,
    stack: error.stack,
    context
  }

  if (error instanceof ValidationException) {
    errorInfo['errors'] = error.errors
  }

  if (error instanceof SecurityException) {
    errorInfo['code'] = error.code
    errorInfo['details'] = error.details
  }

  console.error('[Validation Error]', errorInfo)
}

// ============================================================================
// 錯誤聚合工具
// ============================================================================

/**
 * 合併多個驗證結果
 */
export function mergeValidationResults<T>(
  results: ValidationResult<T>[]
): ValidationResult<T> {
  const errors: ValidationError[] = []
  let data: T | undefined

  for (const result of results) {
    if (!result.success && result.errors) {
      errors.push(...result.errors)
    } else if (result.success && result.data) {
      data = result.data
    }
  }

  return errors.length > 0
    ? createValidationResult(false, undefined, errors)
    : createValidationResult(true, data)
}

/**
 * 按欄位分組錯誤
 */
export function groupErrorsByField(
  errors: ValidationError[]
): Record<string, ValidationError[]> {
  return errors.reduce((acc, error) => {
    const field = error.field || '_general'
    if (!acc[field]) {
      acc[field] = []
    }
    acc[field].push(error)
    return acc
  }, {} as Record<string, ValidationError[]>)
}

// ============================================================================
// 導出錯誤處理工具
// ============================================================================

export const errorHandlers = {
  createError: createValidationError,
  createResult: createValidationResult,
  formatForClient: formatErrorForClient,
  logError: logValidationError,
  mergeResults: mergeValidationResults,
  groupByField: groupErrorsByField,
  fromZodError: zodErrorToValidationErrors
}
