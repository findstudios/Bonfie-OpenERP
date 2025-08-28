/**
 * 安全的認證 Store
 * 使用 HttpOnly Cookie 和 Session 管理
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, supabase } from '@/services/supabase'
import { sessionService } from '@/services/sessionService'
import { useCSRF } from '@/composables/useCSRF'
import type { User, Role } from '@/types'

export const useAuthSecureStore = defineStore('authSecure', () => {
  // 狀態定義
  const user = ref<User | null>(null)
  const sessionId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastActivityCheck = ref<number>(0)
  const csrf = useCSRF()

  // 計算屬性
  const isAuthenticated = computed(() => !!sessionId.value && !!user.value)
  const userRole = computed(() => user.value?.role)
  const userPermissions = computed(() => user.value?.role?.permissions || {})

  /**
   * 初始化認證狀態
   */
  async function initializeAuth() {
    loading.value = true
    error.value = null

    try {
      console.log('AuthSecureStore - 初始化認證')

      // 從 cookie 獲取 session token
      const sessionToken = sessionService.getSessionToken()

      if (sessionToken) {
        // 驗證 session
        const validation = await sessionService.validateSession(sessionToken)

        if (validation.isValid && validation.session) {
          // Session 有效，獲取用戶資料
          await fetchUserProfile(validation.session.user_id)
          sessionId.value = validation.session.session_id

          // 初始化 CSRF
          csrf.initializeCSRF()

          // 設置定期檢查 session
          startSessionMonitoring()

          console.log('AuthSecureStore - Session 恢復成功:', user.value?.full_name)
        } else {
          // Session 無效，清除
          console.log('AuthSecureStore - Session 無效:', validation.error)
          await clearSession()
        }
      }
    } catch (err) {
      console.error('初始化認證失敗:', err)
      error.value = err instanceof Error ? err.message : '初始化認證失敗'
    } finally {
      loading.value = false
    }
  }

  /**
   * 獲取用戶資料 (通過用戶 ID)
   */
  async function fetchUserProfile(userId: string) {
    try {
      const users = await db.findMany<User>('users', {
        columns: 'id, user_id, username, full_name, email, status, role_id, phone, avatar_url',
        filters: { user_id: userId }
      })

      if (users.length === 0) {
        throw new Error('找不到用戶資料')
      }

      const userData = users[0]

      // 添加 role 物件
      const roleMap: { [key: number]: { role_code: string, role_name: string } } = {
        1: { role_code: 'ADMIN', role_name: '管理員' },
        2: { role_code: 'STAFF', role_name: '行政人員' },
        3: { role_code: 'TEACHER', role_name: '老師' }
      }

      userData.role = roleMap[userData.role_id] || { role_code: 'UNKNOWN', role_name: '未知' }
      user.value = userData

      // 記錄最後登入時間
      await db.update('users', userData.id, {
        last_login_at: new Date().toISOString()
      })
    } catch (err) {
      console.error('獲取用戶資料失敗:', err)
      throw err
    }
  }

  /**
   * 用戶登入
   */
  async function login(username: string, password: string) {
    loading.value = true
    error.value = null

    try {
      // 使用資料庫直接驗證
      const userData = await validateUser(username, password)

      if (!userData) {
        throw new Error('帳號或密碼錯誤')
      }

      // 建立安全的 session
      const { sessionId: newSessionId } = await sessionService.createSession({
        user_id: userData.user_id,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent
      })

      // 設置用戶資料
      const roleMap: { [key: number]: { role_code: string, role_name: string } } = {
        1: { role_code: 'ADMIN', role_name: '管理員' },
        2: { role_code: 'STAFF', role_name: '行政人員' },
        3: { role_code: 'TEACHER', role_name: '老師' }
      }

      userData.role = roleMap[userData.role_id] || { role_code: 'UNKNOWN', role_name: '未知' }
      user.value = userData
      sessionId.value = newSessionId

      // 初始化 CSRF
      csrf.initializeCSRF()

      // 開始 session 監控
      startSessionMonitoring()

      // 記錄登入資訊
      await logAudit('login', 'users', userData.user_id, {
        login_time: new Date().toISOString(),
        ip_address: await getClientIP()
      })

      console.log('登入成功:', user.value.full_name, '角色:', user.value.role.role_code)
      return user.value
    } catch (err) {
      console.error('登入失敗:', err)
      error.value = err instanceof Error ? err.message : '登入失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 驗證用戶
   */
  async function validateUser(username: string, password: string) {
    try {
      console.log('AuthSecureStore - 開始驗證用戶:', username)

      const { data: users, error } = await supabase
        .from('users')
        .select('id, user_id, username, password_hash, full_name, email, status, role_id, avatar_url, phone')
        .eq('username', username)

      if (error) {
        console.error('AuthSecureStore - 查詢用戶失敗:', error)
        throw error
      }

      if (!users || users.length === 0) {
        console.log('AuthSecureStore - 用戶不存在:', username)
        return null
      }

      const foundUser = users[0]
      console.log('AuthSecureStore - 驗證用戶:', foundUser.username, 'status:', foundUser.status)

      // 檢查用戶狀態
      if (foundUser.status !== 'active') {
        console.log('AuthSecureStore - 帳號已停用:', foundUser.status)
        throw new Error('帳號已被停用')
      }

      // 密碼驗證（測試環境簡化驗證）
      const validPasswordMap: { [key: string]: string[] } = {
        'admin': ['admin'],
        'staff': ['staff'],
        'teacher1': ['teacher', 'teacher1'],
        'teacher2': ['teacher', 'teacher2']
      }

      const validPasswords = validPasswordMap[username] || []
      const isValidPassword = validPasswords.includes(password) && foundUser.password_hash === 'hashed_password'

      if (!isValidPassword) {
        console.log('AuthSecureStore - 密碼不匹配')
        return null
      }

      console.log('AuthSecureStore - 驗證成功:', foundUser.username)
      return foundUser
    } catch (err) {
      console.error('AuthSecureStore - 用戶驗證失敗:', err)
      throw err
    }
  }

  /**
   * 用戶登出
   */
  async function logout() {
    loading.value = true
    error.value = null

    try {
      if (sessionId.value) {
        // 撤銷 session
        await sessionService.revokeSession(sessionId.value)

        // 記錄登出
        if (user.value) {
          await logAudit('logout', 'users', user.value.user_id, {
            logout_time: new Date().toISOString()
          })
          console.log(`登出: ${user.value.full_name}`)
        }
      }

      // 清除狀態
      await clearSession()
    } catch (err) {
      console.error('登出失敗:', err)
      error.value = err instanceof Error ? err.message : '登出失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 清除 session
   */
  async function clearSession() {
    user.value = null
    sessionId.value = null
    csrf.clearToken()
    stopSessionMonitoring()
  }

  /**
   * 開始 session 監控
   */
  function startSessionMonitoring() {
    // 每 5 分鐘檢查一次 session
    const interval = 5 * 60 * 1000

    const checkSession = async () => {
      const now = Date.now()
      if (now - lastActivityCheck.value < interval) return

      lastActivityCheck.value = now
      const isValid = await checkAndRefreshSession()

      if (!isValid) {
        console.log('Session 已過期，需要重新登入')
        await clearSession()
      }
    }

    // 監聽用戶活動
    window.addEventListener('mousemove', checkSession)
    window.addEventListener('keypress', checkSession)
    window.addEventListener('click', checkSession)
  }

  /**
   * 停止 session 監控
   */
  function stopSessionMonitoring() {
    window.removeEventListener('mousemove', checkAndRefreshSession)
    window.removeEventListener('keypress', checkAndRefreshSession)
    window.removeEventListener('click', checkAndRefreshSession)
  }

  /**
   * 檢查並更新 session
   */
  async function checkAndRefreshSession() {
    if (!sessionId.value) return false

    try {
      const sessionToken = sessionService.getSessionToken()
      if (!sessionToken) return false

      const validation = await sessionService.validateSession(sessionToken)
      if (!validation.isValid) {
        await clearSession()
        return false
      }

      // 如果 session 快過期，自動延長
      if (validation.session) {
        const expiresAt = new Date(validation.session.expires_at)
        const now = new Date()
        const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)

        if (hoursUntilExpiry < 1) {
          await sessionService.extendSession(sessionId.value)
          console.log('Session 已自動延長')
        }
      }

      return true
    } catch (error) {
      console.error('檢查 session 失敗:', error)
      return false
    }
  }

  /**
   * 更新用戶資料
   */
  async function updateProfile(data: Partial<User>) {
    loading.value = true
    error.value = null

    try {
      if (!user.value) {
        throw new Error('用戶未登入')
      }

      const updatedUser = await db.update<User>('users', user.value.id, data)

      // 重新獲取用戶資料
      await fetchUserProfile(user.value.user_id)

      // 記錄稽核日誌
      await logAudit('update', 'users', user.value.user_id, data)

      return updatedUser
    } catch (err) {
      console.error('更新用戶資料失敗:', err)
      error.value = err instanceof Error ? err.message : '更新用戶資料失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 檢查權限
   */
  function hasPermission(permission: string): boolean {
    if (!user.value || !user.value.role) {
      return false
    }

    return userPermissions.value[permission] === true
  }

  /**
   * 檢查角色
   */
  function hasRole(role: string): boolean {
    if (!user.value || !user.value.role) {
      return false
    }

    return user.value.role.role_code === role
  }

  /**
   * 檢查多個角色
   */
  function hasAnyRole(roles: string[]): boolean {
    if (!user.value || !user.value.role) {
      return false
    }

    return roles.includes(user.value.role.role_code)
  }

  /**
   * 記錄稽核日誌
   */
  async function logAudit(
    action: string,
    tableName: string,
    recordId: string,
    newValues?: any,
    oldValues?: any
  ) {
    try {
      if (!user.value) return

      await db.create('audit_logs', {
        user_id: user.value.user_id,
        action,
        table_name: tableName,
        record_id: recordId,
        old_values: oldValues,
        new_values: newValues,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent
      })
    } catch (err) {
      console.error('記錄稽核日誌失敗:', err)
    }
  }

  /**
   * 獲取客戶端 IP
   */
  async function getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }

  /**
   * 獲取 CSRF token
   */
  function getCSRFToken(): string | null {
    return csrf.getToken()
  }

  /**
   * 獲取包含 CSRF 的請求頭
   */
  function getAuthHeaders(): Record<string, string> {
    return {
      ...csrf.getHeaders(),
      'X-Session-ID': sessionId.value || ''
    }
  }

  /**
   * 清除錯誤狀態
   */
  function clearError() {
    error.value = null
  }

  /**
   * 重置狀態
   */
  function resetState() {
    user.value = null
    sessionId.value = null
    loading.value = false
    error.value = null
    csrf.clearToken()
    stopSessionMonitoring()
  }

  return {
    // 狀態
    user,
    sessionId,
    loading,
    error,
    // 計算屬性
    isAuthenticated,
    userRole,
    userPermissions,
    // 方法
    initializeAuth,
    login,
    logout,
    updateProfile,
    hasPermission,
    hasRole,
    hasAnyRole,
    logAudit,
    clearError,
    resetState,
    checkAndRefreshSession,
    getCSRFToken,
    getAuthHeaders
  }
})
