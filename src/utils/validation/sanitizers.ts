/**
 * HTML 和資料清理工具
 * 防止 XSS 攻擊和其他注入攻擊
 */

import DOMPurify from 'dompurify'

// ============================================================================
// DOMPurify 配置
// ============================================================================

// 基礎 HTML 清理配置（用於一般文字內容）
const BASIC_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'span'],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false
}

// 豐富文字清理配置（用於筆記和描述）
const RICH_TEXT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'b', 'i', 'em', 'strong', 'u', 'br', 'p', 'span', 'div',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'blockquote', 'code', 'pre'
  ],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
}

// Markdown 渲染配置（支援更多標籤）
const MARKDOWN_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'b', 'i', 'em', 'strong', 'u', 'br', 'p', 'span', 'div',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'blockquote', 'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img', 'hr'
  ],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class', 'src', 'alt', 'width', 'height'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
}

// 模板預覽配置（用於收據模板預覽）
const TEMPLATE_PREVIEW_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'b', 'i', 'em', 'strong', 'u', 'br', 'p', 'span', 'div',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'blockquote', 'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img', 'hr', 'small',
    'style', // 允許內聯樣式標籤
    'iframe' // 允許 iframe（用於自定義模板）
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'target', 'rel', 'class', 'src', 'alt', 'width', 'height',
    'style', // 允許 style 屬性
    'srcdoc', 'sandbox' // iframe 屬性
  ],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  // 保留內聯樣式
  FORBID_TAGS: ['script'], // 明確禁止 script 標籤
  FORBID_ATTR: ['onerror', 'onload', 'onclick'] // 禁止事件屬性
}

// ============================================================================
// HTML 清理函數
// ============================================================================

/**
 * 清理基礎 HTML 內容
 */
export function sanitizeBasicHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, BASIC_CONFIG)
}

/**
 * 清理豐富文字內容
 */
export function sanitizeRichText(dirty: string): string {
  return DOMPurify.sanitize(dirty, RICH_TEXT_CONFIG)
}

/**
 * 清理 Markdown 渲染後的 HTML
 */
export function sanitizeMarkdown(dirty: string): string {
  return DOMPurify.sanitize(dirty, MARKDOWN_CONFIG)
}

/**
 * 完全移除所有 HTML 標籤
 */
export function stripHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] })
}

// ============================================================================
// 資料清理函數
// ============================================================================

/**
 * 清理用於 SQL 查詢的字串（防止 SQL 注入）
 * 注意：這只是額外的防護層，應該始終使用參數化查詢
 */
export function sanitizeSQLString(input: string): string {
  return input
    .replace(/'/g, "''")  // 轉義單引號
    .replace(/;/g, '')    // 移除分號
    .replace(/--/g, '')   // 移除 SQL 註解
    .replace(/\/\*/g, '') // 移除多行註解開始
    .replace(/\*\//g, '') // 移除多行註解結束
}

/**
 * 清理檔案名稱
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // 移除無效字元
    .replace(/\s+/g, '_')                   // 空格替換為底線
    .replace(/\.{2,}/g, '.')                // 多個點替換為單個點
    .slice(0, 255)                          // 限制長度
}

/**
 * 清理 URL 參數
 */
export function sanitizeURLParam(param: string): string {
  return encodeURIComponent(param)
}

/**
 * 清理 JSON 字串
 */
export function sanitizeJSON(jsonString: string): string | null {
  try {
    const parsed = JSON.parse(jsonString)
    return JSON.stringify(parsed)
  } catch {
    return null
  }
}

// ============================================================================
// 特殊內容清理
// ============================================================================

/**
 * 清理電話號碼
 */
export function sanitizePhoneNumber(phone: string): string {
  // 只保留數字和加號
  return phone.replace(/[^\d+]/g, '')
}

/**
 * 清理電子郵件地址
 */
export function sanitizeEmail(email: string): string {
  // 基本清理，移除可能的危險字元
  return email.trim().toLowerCase()
    .replace(/[<>"']/g, '')
    .slice(0, 255)
}

/**
 * 清理搜尋查詢
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[<>"']/g, '')     // 移除可能的 HTML/SQL 注入字元
    .replace(/\s+/g, ' ')       // 多個空格替換為單個
    .slice(0, 100)              // 限制長度
}

/**
 * 清理 Markdown 內容（在渲染前）
 */
export function sanitizeMarkdownInput(markdown: string): string {
  // 移除潛在的危險 Markdown 語法
  return markdown
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // 移除 script 標籤
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '') // 移除 iframe
    .replace(/javascript:/gi, '')                       // 移除 javascript: 協議
    .replace(/on\w+\s*=/gi, '')                        // 移除事件處理器
}

// ============================================================================
// 物件清理函數
// ============================================================================

/**
 * 深度清理物件中的字串值
 */
export function deepSanitizeObject<T extends Record<string, any>>(
  obj: T,
  sanitizer: (value: string) => string = stripHTML
): T {
  const cleaned: any = Array.isArray(obj) ? [] : {}

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key]

      if (typeof value === 'string') {
        cleaned[key] = sanitizer(value)
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = deepSanitizeObject(value, sanitizer)
      } else {
        cleaned[key] = value
      }
    }
  }

  return cleaned as T
}

// ============================================================================
// 驗證和清理組合函數
// ============================================================================

/**
 * 驗證並清理輸入
 */
export function validateAndSanitize<T>(
  value: string,
  validator: (value: string) => boolean,
  sanitizer: (value: string) => string
): { isValid: boolean; sanitized: string } {
  const sanitized = sanitizer(value)
  const isValid = validator(sanitized)

  return { isValid, sanitized }
}

// ============================================================================
// CSP (Content Security Policy) 生成器
// ============================================================================

/**
 * 生成 CSP 標頭
 */
export function generateCSPHeader(): string {
  const policies = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ]

  return policies.join('; ')
}

// ============================================================================
// XSS 防護工具
// ============================================================================

/**
 * 檢查字串是否包含潛在的 XSS 攻擊向量
 */
export function detectXSSPattern(input: string): boolean {
  const xssPatterns = [
    /<script[^>]*>/i,
    /<iframe[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<img[^>]*onerror=/i,
    /<svg[^>]*onload=/i,
    /eval\s*\(/i,
    /expression\s*\(/i
  ]

  return xssPatterns.some(pattern => pattern.test(input))
}

/**
 * 為動態內容添加 CSP nonce
 */
export function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
}

// ============================================================================
// 導出清理工具集
// ============================================================================

export const sanitizers = {
  html: {
    basic: sanitizeBasicHTML,
    rich: sanitizeRichText,
    markdown: sanitizeMarkdown,
    strip: stripHTML
  },
  data: {
    sql: sanitizeSQLString,
    filename: sanitizeFilename,
    url: sanitizeURLParam,
    json: sanitizeJSON,
    phone: sanitizePhoneNumber,
    email: sanitizeEmail,
    search: sanitizeSearchQuery,
    markdownInput: sanitizeMarkdownInput
  },
  object: {
    deep: deepSanitizeObject
  },
  security: {
    validateAndSanitize,
    generateCSP: generateCSPHeader,
    detectXSS: detectXSSPattern,
    generateNonce
  }
}
