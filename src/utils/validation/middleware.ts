/**
 * 驗證中介層
 * 提供 API 請求的自動驗證和清理
 */

import { z } from 'zod'
import { sanitizers } from './sanitizers'
import {
  ValidationException,
  SecurityException,
  createValidationError,
  ERROR_CODES,
  errorHandlers
} from './errors'

// ============================================================================
// 請求驗證中介層
// ============================================================================

export interface ValidationMiddlewareOptions {
  bodySchema?: z.ZodSchema<any>
  querySchema?: z.ZodSchema<any>
  paramsSchema?: z.ZodSchema<any>
  headerSchema?: z.ZodSchema<any>
  sanitizeHtml?: boolean
  checkXSS?: boolean
  checkSQLInjection?: boolean
  requireCSRF?: boolean
}

/**
 * 建立驗證中介層
 */
export function createValidationMiddleware(options: ValidationMiddlewareOptions) {
  return async (req: any, res: any, next: any) => {
    try {
      // CSRF 檢查
      if (options.requireCSRF && !isValidCSRFToken(req)) {
        throw new SecurityException('CSRF Token 無效', ERROR_CODES.CSRF_TOKEN_INVALID)
      }

      // 驗證請求內容
      if (options.bodySchema && req.body) {
        req.body = await validateAndSanitizeData(
          req.body,
          options.bodySchema,
          options
        )
      }

      if (options.querySchema && req.query) {
        req.query = await validateAndSanitizeData(
          req.query,
          options.querySchema,
          options
        )
      }

      if (options.paramsSchema && req.params) {
        req.params = await validateAndSanitizeData(
          req.params,
          options.paramsSchema,
          options
        )
      }

      if (options.headerSchema && req.headers) {
        const validatedHeaders = await validateAndSanitizeData(
          req.headers,
          options.headerSchema,
          options
        )
        Object.assign(req.headers, validatedHeaders)
      }

      next()
    } catch (error) {
      handleValidationError(error, res)
    }
  }
}

// ============================================================================
// 資料驗證和清理
// ============================================================================

async function validateAndSanitizeData(
  data: any,
  schema: z.ZodSchema<any>,
  options: ValidationMiddlewareOptions
): Promise<any> {
  // 先進行安全檢查
  if (options.checkXSS) {
    checkForXSS(data)
  }

  if (options.checkSQLInjection) {
    checkForSQLInjection(data)
  }

  // 清理 HTML
  if (options.sanitizeHtml) {
    data = sanitizeDataRecursively(data)
  }

  // 執行 schema 驗證
  const result = await schema.safeParseAsync(data)

  if (!result.success) {
    throw new ValidationException(errorHandlers.fromZodError(result.error))
  }

  return result.data
}

// ============================================================================
// 安全檢查函數
// ============================================================================

function checkForXSS(data: any, path: string = ''): void {
  if (typeof data === 'string') {
    if (sanitizers.security.detectXSS(data)) {
      throw new SecurityException(
        `偵測到潛在的 XSS 攻擊: ${path}`,
        ERROR_CODES.XSS_DETECTED,
        { path, value: data.substring(0, 100) }
      )
    }
  } else if (typeof data === 'object' && data !== null) {
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        checkForXSS(data[key], path ? `${path}.${key}` : key)
      }
    }
  }
}

function checkForSQLInjection(data: any, path: string = ''): void {
  if (typeof data === 'string') {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/i,
      /(--|\/\*|\*\/|;|\||&&)/,
      /(\bOR\b.*=.*)/i,
      /('|(\')|"|(\"))/
    ]

    for (const pattern of sqlPatterns) {
      if (pattern.test(data)) {
        throw new SecurityException(
          `偵測到潛在的 SQL 注入攻擊: ${path}`,
          ERROR_CODES.SQL_INJECTION_DETECTED,
          { path, pattern: pattern.toString() }
        )
      }
    }
  } else if (typeof data === 'object' && data !== null) {
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        checkForSQLInjection(data[key], path ? `${path}.${key}` : key)
      }
    }
  }
}

function sanitizeDataRecursively(data: any): any {
  if (typeof data === 'string') {
    return sanitizers.html.strip(data)
  } else if (Array.isArray(data)) {
    return data.map(item => sanitizeDataRecursively(item))
  } else if (typeof data === 'object' && data !== null) {
    const sanitized: any = {}
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        sanitized[key] = sanitizeDataRecursively(data[key])
      }
    }
    return sanitized
  }
  return data
}

// ============================================================================
// CSRF 保護
// ============================================================================

/**
 * 生成 CSRF Token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
}

/**
 * 驗證 CSRF Token
 */
function isValidCSRFToken(req: any): boolean {
  const token = req.headers['x-csrf-token'] || req.body?._csrf
  const sessionToken = req.session?.csrfToken

  if (!token || !sessionToken) {
    return false
  }

  return token === sessionToken
}

// ============================================================================
// 錯誤處理
// ============================================================================

function handleValidationError(error: any, res: any): void {
  const errorResponse = errorHandlers.formatForClient(error)

  // 記錄錯誤
  errorHandlers.logError(error, {
    url: res.req?.url,
    method: res.req?.method,
    ip: res.req?.ip
  })

  // 決定 HTTP 狀態碼
  let statusCode = 400 // Bad Request

  if (error instanceof SecurityException) {
    switch (error.code) {
      case ERROR_CODES.UNAUTHORIZED:
        statusCode = 401
        break
      case ERROR_CODES.FORBIDDEN:
        statusCode = 403
        break
      case ERROR_CODES.CSRF_TOKEN_INVALID:
        statusCode = 403
        break
      default:
        statusCode = 400
    }
  }

  res.status(statusCode).json({
    success: false,
    error: errorResponse
  })
}

// ============================================================================
// 輔助中介層
// ============================================================================

/**
 * 速率限制中介層
 */
export function createRateLimitMiddleware(options: {
  windowMs: number
  maxRequests: number
  message?: string
}) {
  const requests = new Map<string, { count: number; resetTime: number }>()

  return (req: any, res: any, next: any) => {
    const key = req.ip || req.connection.remoteAddress
    const now = Date.now()

    const record = requests.get(key)

    if (!record || now > record.resetTime) {
      requests.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      })
      next()
    } else if (record.count < options.maxRequests) {
      record.count++
      next()
    } else {
      res.status(429).json({
        success: false,
        error: {
          message: options.message || '請求過於頻繁，請稍後再試',
          code: 'RATE_LIMIT_EXCEEDED'
        }
      })
    }
  }
}

/**
 * 輸入大小限制中介層
 */
export function createSizeLimitMiddleware(maxSizeInBytes: number) {
  return (req: any, res: any, next: any) => {
    let size = 0

    req.on('data', (chunk: Buffer) => {
      size += chunk.length

      if (size > maxSizeInBytes) {
        res.status(413).json({
          success: false,
          error: {
            message: '請求內容過大',
            code: 'PAYLOAD_TOO_LARGE'
          }
        })
        req.connection.destroy()
      }
    })

    req.on('end', () => {
      if (size <= maxSizeInBytes) {
        next()
      }
    })
  }
}

// ============================================================================
// 預設中介層組合
// ============================================================================

/**
 * 建立標準 API 中介層
 */
export function createStandardAPIMiddleware() {
  return [
    createSizeLimitMiddleware(10 * 1024 * 1024), // 10MB
    createRateLimitMiddleware({
      windowMs: 15 * 60 * 1000, // 15 分鐘
      maxRequests: 100
    })
  ]
}

// ============================================================================
// Vue Router 整合
// ============================================================================

/**
 * 建立路由驗證守衛
 */
export function createRouteValidator(schema: z.ZodSchema<any>) {
  return async (to: any, from: any, next: any) => {
    try {
      const data = {
        params: to.params,
        query: to.query
      }

      const result = await schema.safeParseAsync(data)

      if (!result.success) {
        console.error('Route validation failed:', result.error)
        next({ name: 'error', params: { code: 400 } })
      } else {
        next()
      }
    } catch (error) {
      console.error('Route validation error:', error)
      next({ name: 'error', params: { code: 500 } })
    }
  }
}

// ============================================================================
// 導出中介層工具
// ============================================================================

export const middleware = {
  createValidation: createValidationMiddleware,
  createRateLimit: createRateLimitMiddleware,
  createSizeLimit: createSizeLimitMiddleware,
  createStandardAPI: createStandardAPIMiddleware,
  createRouteValidator,
  generateCSRFToken
}
