/**
 * Session 管理服務
 * 提供安全的 session 管理功能
 */

import { supabase } from './supabase'
import {
  generateSessionId,
  generateSecureToken,
  generateCSRFToken,
  sha256
} from '@/utils/crypto'

interface Session {
  session_id: string
  user_id: string
  token_hash: string
  csrf_token: string
  ip_address?: string
  user_agent?: string
  expires_at: string
  last_activity_at: string
  is_active: boolean
}

interface CreateSessionParams {
  user_id: string
  ip_address?: string
  user_agent?: string
  validity_hours?: number
}

interface SessionValidation {
  isValid: boolean
  session?: Session
  error?: string
}

class SessionService {
  private readonly SESSION_COOKIE_NAME = 'tutoring_session_token'
  private readonly CSRF_COOKIE_NAME = 'tutoring_csrf_token'
  private readonly DEFAULT_VALIDITY_HOURS = 8
  private readonly ACTIVITY_UPDATE_INTERVAL = 5 * 60 * 1000 // 5 分鐘

  /**
   * 建立新的 session
   */
  async createSession(params: CreateSessionParams): Promise<{
    sessionToken: string
    csrfToken: string
    sessionId: string
  }> {
    const sessionId = generateSessionId()
    const sessionToken = generateSecureToken(32)
    const csrfToken = generateCSRFToken()
    const tokenHash = await sha256(sessionToken)

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + (params.validity_hours || this.DEFAULT_VALIDITY_HOURS))

    // 建立 session 記錄
    const { error } = await supabase
      .from('sessions')
      .insert({
        session_id: sessionId,
        user_id: params.user_id,
        token_hash: tokenHash,
        csrf_token: csrfToken,
        ip_address: params.ip_address,
        user_agent: params.user_agent,
        expires_at: expiresAt.toISOString(),
        is_active: true
      })

    if (error) {
      console.error('建立 session 失敗:', error)
      throw new Error('無法建立登入會話')
    }

    // 設置 HttpOnly Cookie（注意：在前端無法設置 HttpOnly，需要後端 API）
    this.setSessionCookie(sessionToken, expiresAt)
    this.setCSRFCookie(csrfToken, expiresAt)

    return { sessionToken, csrfToken, sessionId }
  }

  /**
   * 驗證 session
   */
  async validateSession(sessionToken: string): Promise<SessionValidation> {
    if (!sessionToken) {
      return { isValid: false, error: '缺少 session token' }
    }

    try {
      const tokenHash = await sha256(sessionToken)

      // 查詢有效的 session
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('token_hash', tokenHash)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .single()

      if (error || !sessions) {
        return { isValid: false, error: 'Session 無效或已過期' }
      }

      // 更新最後活動時間
      await this.updateLastActivity(sessions.session_id)

      return { isValid: true, session: sessions }
    } catch (error) {
      console.error('驗證 session 失敗:', error)
      return { isValid: false, error: '驗證失敗' }
    }
  }

  /**
   * 撤銷 session
   */
  async revokeSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .update({ is_active: false })
      .eq('session_id', sessionId)

    if (error) {
      console.error('撤銷 session 失敗:', error)
      throw new Error('無法撤銷 session')
    }

    // 清除 cookies
    this.clearSessionCookie()
    this.clearCSRFCookie()
  }

  /**
   * 撤銷用戶的所有 session
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) {
      console.error('撤銷用戶所有 session 失敗:', error)
      throw new Error('無法撤銷所有 session')
    }
  }

  /**
   * 更新最後活動時間
   */
  private async updateLastActivity(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('session_id', sessionId)

    if (error) {
      console.error('更新活動時間失敗:', error)
    }
  }

  /**
   * 清理過期的 session
   */
  async cleanupExpiredSessions(): Promise<void> {
    const { error } = await supabase.rpc('cleanup_expired_sessions')

    if (error) {
      console.error('清理過期 session 失敗:', error)
    }
  }

  /**
   * 獲取 session token（從 cookie）
   */
  getSessionToken(): string | null {
    // 在實際應用中，HttpOnly cookie 無法被 JS 讀取
    // 這裡只是示範，實際需要從請求頭或其他方式獲取
    return this.getCookie(this.SESSION_COOKIE_NAME)
  }

  /**
   * 獲取 CSRF token
   */
  getCSRFToken(): string | null {
    return this.getCookie(this.CSRF_COOKIE_NAME)
  }

  /**
   * 設置 session cookie
   * 注意：在生產環境中，應該由後端設置 HttpOnly cookie
   */
  private setSessionCookie(token: string, expires: Date): void {
    // 在前端只能設置普通 cookie，無法設置 HttpOnly
    // 這裡僅作示範，實際應該通過後端 API 設置
    document.cookie = `${this.SESSION_COOKIE_NAME}=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Strict; Secure`
  }

  /**
   * 設置 CSRF cookie
   */
  private setCSRFCookie(token: string, expires: Date): void {
    document.cookie = `${this.CSRF_COOKIE_NAME}=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`
  }

  /**
   * 清除 session cookie
   */
  private clearSessionCookie(): void {
    document.cookie = `${this.SESSION_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  }

  /**
   * 清除 CSRF cookie
   */
  private clearCSRFCookie(): void {
    document.cookie = `${this.CSRF_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  }

  /**
   * 獲取 cookie 值
   */
  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null
    }
    return null
  }

  /**
   * 延長 session 有效期
   */
  async extendSession(sessionId: string, additionalHours: number = 4): Promise<void> {
    const newExpiresAt = new Date()
    newExpiresAt.setHours(newExpiresAt.getHours() + additionalHours)

    const { error } = await supabase
      .from('sessions')
      .update({
        expires_at: newExpiresAt.toISOString(),
        last_activity_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .eq('is_active', true)

    if (error) {
      console.error('延長 session 失敗:', error)
      throw new Error('無法延長 session')
    }
  }

  /**
   * 獲取用戶的活躍 session 數量
   */
  async getActiveSessionCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())

    if (error) {
      console.error('獲取活躍 session 數量失敗:', error)
      return 0
    }

    return count || 0
  }
}

export const sessionService = new SessionService()
export type { Session, CreateSessionParams, SessionValidation }
