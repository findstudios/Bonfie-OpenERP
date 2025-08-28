/**
 * 密碼和加密處理工具
 * 注意：敏感的加密操作應該在後端進行
 */

/**
 * 生成一個簡單的密碼雜湊（僅用於演示）
 * 在生產環境中，應該使用後端 API 進行密碼加密
 */
export function simpleHash(password: string): string {
  // 這只是一個示例，實際應該在後端使用 bcrypt
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

/**
 * 生成安全的隨機 token
 * @param length token 長度（字節）
 * @returns Base64 編碼的 token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * 生成 CSRF token
 * @returns CSRF token
 */
export function generateCSRFToken(): string {
  return generateSecureToken(24)
}

/**
 * 使用 Web Crypto API 計算 SHA-256 hash
 * @param message 要 hash 的訊息
 * @returns hex 格式的 hash 值
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * 生成 session ID
 * @returns 唯一的 session ID
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = generateSecureToken(16)
  return `sess_${timestamp}_${randomPart}`
}

/**
 * 驗證 CSRF token
 * @param token 要驗證的 token
 * @param storedToken 儲存的 token
 * @returns 是否有效
 */
export function validateCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) return false
  // 使用恆定時間比較避免時序攻擊
  return token.length === storedToken.length &&
    token.split('').every((char, i) => char === storedToken[i])
}

/**
 * 註：在實際應用中，你應該：
 * 1. 創建一個後端 API endpoint 來處理用戶註冊
 * 2. 在後端使用 bcrypt 或 argon2 進行密碼加密
 * 3. 永遠不要在前端進行密碼加密
 * 4. 使用 HTTPS 確保傳輸安全
 * 5. 實作適當的 rate limiting
 * 6. 使用安全的 session 管理
 */
export const passwordNote = `
密碼安全提示：
- 密碼長度至少 8 個字符
- 包含大小寫字母、數字和特殊字符
- 避免使用常見密碼
- 定期更換密碼
`
