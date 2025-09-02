import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { supabase } from '@/services/supabase'
import type { User, Role } from '@/types'
import type { AuthError, Session, RealtimeChannel } from '@supabase/supabase-js'
import { createLogger } from '@/utils/logger'
import { withRetry, networkMonitor, waitForOnline } from '@/utils/networkRetry'

const log = createLogger('AuthStore')

// 認證事件類型
export type AuthEventType =
  | 'SESSION_REFRESHED'
  | 'SESSION_EXPIRING_SOON'
  | 'SESSION_EXPIRED'
  | 'AUTH_STATE_CHANGED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'TOKEN_REFRESHED'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'

// 認證事件處理器類型
export type AuthEventHandler = (event: AuthEventType, data?: any) => void

export const useAuthStore = defineStore('auth', () => {
  // 狀態定義
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 進階功能狀態
  const isRefreshingToken = ref(false)
  const tokenRefreshTimer = ref<NodeJS.Timeout | null>(null)
  const sessionExpiryTimer = ref<NodeJS.Timeout | null>(null)
  const authEventHandlers = ref<Map<string, AuthEventHandler>>(new Map())
  const realtimeSubscription = ref<RealtimeChannel | null>(null)

  // 計算屬性
  const isAuthenticated = computed(() => !!session.value && !!user.value)
  const userRole = computed(() => user.value?.role)
  const userPermissions = computed(() => user.value?.role?.permissions || {})

  // 計算 session 相關時間
  const sessionExpiresAt = computed(() => {
    if (!session.value?.expires_at) return null
    return new Date(session.value.expires_at * 1000)
  })

  const sessionExpiresIn = computed(() => {
    if (!sessionExpiresAt.value) return 0
    return Math.max(0, sessionExpiresAt.value.getTime() - Date.now())
  })

  const isSessionExpiringSoon = computed(() => {
    const fiveMinutes = 5 * 60 * 1000 // 5分鐘
    return sessionExpiresIn.value > 0 && sessionExpiresIn.value <= fiveMinutes
  })

  // 註冊認證事件處理器
  function onAuthEvent(id: string, handler: AuthEventHandler) {
    authEventHandlers.value.set(id, handler)

    return () => {
      authEventHandlers.value.delete(id)
    }
  }

  // 觸發認證事件
  function emitAuthEvent(event: AuthEventType, data?: any) {
    log.log(`觸發認證事件: ${event}`, data)

    authEventHandlers.value.forEach(handler => {
      try {
        handler(event, data)
      } catch (err) {
        log.error('認證事件處理器錯誤:', err)
      }
    })
  }

  // 自動刷新 Token
  async function refreshToken() {
    if (isRefreshingToken.value) {
      log.log('Token 正在刷新中，跳過重複刷新')
      return
    }

    isRefreshingToken.value = true

    try {
      log.log('開始刷新 Token')

      const { data, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError) {
        throw new Error(`Token 刷新失敗: ${refreshError.message}`)
      }

      if (!data.session) {
        throw new Error('刷新後沒有獲得新的 session')
      }

      session.value = data.session
      log.log('Token 刷新成功，新的過期時間:', new Date(data.session.expires_at! * 1000))

      emitAuthEvent('TOKEN_REFRESHED', { session: data.session })
      emitAuthEvent('SESSION_REFRESHED', { session: data.session })

      // 重新設置自動刷新
      setupTokenAutoRefresh()

      return data.session
    } catch (err) {
      log.error('Token 刷新失敗:', err)

      // 如果刷新失敗，可能需要重新登入
      emitAuthEvent('SESSION_EXPIRED', { error: err })

      // 清除狀態並登出
      await logout()

      throw err
    } finally {
      isRefreshingToken.value = false
    }
  }

  // 設置 Token 自動刷新
  function setupTokenAutoRefresh() {
    // 清除現有的計時器
    if (tokenRefreshTimer.value) {
      clearTimeout(tokenRefreshTimer.value)
      tokenRefreshTimer.value = null
    }

    if (sessionExpiryTimer.value) {
      clearTimeout(sessionExpiryTimer.value)
      sessionExpiryTimer.value = null
    }

    if (!session.value?.expires_at) {
      log.log('沒有 session 或過期時間，跳過設置自動刷新')
      return
    }

    const expiresAt = session.value.expires_at * 1000
    const now = Date.now()
    const timeUntilExpiry = expiresAt - now

    // 在過期前 15 分鐘刷新 token（提前一點以防網路延遲）
    const refreshTime = timeUntilExpiry - (15 * 60 * 1000)

    // 在過期前 5 分鐘發出警告
    const warningTime = timeUntilExpiry - (5 * 60 * 1000)

    if (refreshTime > 0) {
      log.log(`設置 Token 自動刷新，將在 ${Math.round(refreshTime / 1000 / 60)} 分鐘後刷新`)

      tokenRefreshTimer.value = setTimeout(async () => {
        try {
          await refreshToken()
        } catch (err) {
          log.error('自動刷新 Token 失敗:', err)
        }
      }, refreshTime)
    }

    if (warningTime > 0 && warningTime < refreshTime) {
      sessionExpiryTimer.value = setTimeout(() => {
        emitAuthEvent('SESSION_EXPIRING_SOON', {
          expiresAt: new Date(expiresAt),
          remainingTime: sessionExpiresIn.value
        })
      }, warningTime)
    }
  }

  // 設置 Realtime 認證狀態監聽
  function setupRealtimeAuthListener() {
    // 清除現有的訂閱
    if (realtimeSubscription.value) {
      supabase.removeChannel(realtimeSubscription.value)
      realtimeSubscription.value = null
    }

    if (!user.value?.id) {
      log.log('沒有用戶，跳過設置 Realtime 監聽')
      return
    }

    // 監聽用戶資料變更
    const channel = supabase
      .channel(`user-${user.value.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.value.id}`
        },
        async (payload) => {
          log.log('收到用戶資料變更:', payload)

          if (payload.eventType === 'UPDATE') {
            // 重新載入用戶資料
            try {
              await fetchUserProfile()
              emitAuthEvent('USER_UPDATED', { user: user.value })
            } catch (err) {
              log.error('更新用戶資料失敗:', err)
            }
          } else if (payload.eventType === 'DELETE') {
            // 用戶被刪除，登出
            emitAuthEvent('USER_DELETED', { userId: user.value.id })
            await logout()
          }
        }
      )
      .subscribe((status) => {
        log.log('Realtime 訂閱狀態:', status)
      })

    realtimeSubscription.value = channel
  }

  // 監聽 session 變化，自動設置刷新
  watch(session, (newSession) => {
    if (newSession) {
      setupTokenAutoRefresh()
      setupRealtimeAuthListener()
    } else {
      // 清除所有計時器和訂閱
      if (tokenRefreshTimer.value) {
        clearTimeout(tokenRefreshTimer.value)
        tokenRefreshTimer.value = null
      }

      if (sessionExpiryTimer.value) {
        clearTimeout(sessionExpiryTimer.value)
        sessionExpiryTimer.value = null
      }

      if (realtimeSubscription.value) {
        supabase.removeChannel(realtimeSubscription.value)
        realtimeSubscription.value = null
      }
    }
  })

  // 初始化認證狀態
  async function initializeAuth() {
    loading.value = true
    error.value = null

    try {
      log.log('開始初始化 Supabase Auth')
      console.log('[AuthStore] 開始初始化，URL:', supabase.auth.url)

      // 檢查網路連線
      if (!navigator.onLine) {
        log.warn('網路未連線，等待網路恢復...')
        await waitForOnline(10000).catch(() => {
          throw new Error('網路連線超時，請檢查您的網路連線')
        })
      }

      // 使用改進的重試機制獲取 session
      let currentSession = null
      let sessionError = null

      try {
        const result = await withRetry(
          async () => {
            const res = await supabase.auth.getSession()
            if (res.error) throw res.error
            return res
          },
          {
            maxRetries: 5,
            initialDelay: 1000,
            maxDelay: 5000,
            onRetry: (attempt, error) => {
              console.log(`[AuthStore] 重試獲取 session (第 ${attempt} 次)`, error.message)
            }
          }
        )
        
        currentSession = result.data.session
        sessionError = null
        console.log('[AuthStore] Session 獲取成功:', currentSession ? '已登入' : '未登入')
      } catch (error) {
        sessionError = error
        console.error('[AuthStore] Session 獲取最終失敗:', error)
      }

      if (sessionError) {
        throw new Error(`獲取認證狀態失敗: ${sessionError.message}`)
      }

      if (currentSession) {
        log.log('找到有效的 session，載入用戶資料')
        session.value = currentSession

        try {
          await fetchUserProfile()
        } catch (profileError) {
          log.error('載入用戶資料失敗:', profileError)
          // 清除無效的 session
          session.value = null
          await supabase.auth.signOut()
          throw profileError
        }
      } else {
        log.log('沒有找到有效的 session')
      }

      // 監聽認證狀態變化
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        log.log('認證狀態變化:', event)
        session.value = newSession

        // 觸發對應的認證事件
        emitAuthEvent('AUTH_STATE_CHANGED', { event, session: newSession })

        if (event === 'SIGNED_IN') {
          emitAuthEvent('SIGNED_IN', { session: newSession })
        } else if (event === 'SIGNED_OUT') {
          emitAuthEvent('SIGNED_OUT', {})
        } else if (event === 'TOKEN_REFRESHED') {
          emitAuthEvent('TOKEN_REFRESHED', { session: newSession })
        } else if (event === 'USER_UPDATED') {
          emitAuthEvent('USER_UPDATED', { session: newSession })
        }

        if (newSession) {
          try {
            await fetchUserProfile()
            // 設置自動刷新和 Realtime 監聽
            setupTokenAutoRefresh()
            setupRealtimeAuthListener()
          } catch (err) {
            log.error('狀態變化時載入用戶資料失敗:', err)
            user.value = null
          }
        } else {
          user.value = null
        }
      })

      // 保存訂閱以便清理
      ;(window as any).__authSubscription = subscription

      log.log('認證初始化成功')
    } catch (err) {
      log.error('初始化認證失敗:', err)
      error.value = err instanceof Error ? err.message : '初始化認證失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 獲取用戶資料
  async function fetchUserProfile() {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        throw new Error(`獲取認證用戶失敗: ${authError.message}`)
      }

      if (!authUser) {
        throw new Error('未找到認證使用者')
      }

      log.log('獲取用戶資料，auth_user_id:', authUser.id)

      // 從 public.users 獲取完整資料
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          role:roles(*)
        `)
        .eq('auth_user_id', authUser.id)
        .single()

      if (userError) {
        // 如果是找不到用戶記錄，提供更清楚的錯誤訊息
        if (userError.code === 'PGRST116') {
          throw new Error('用戶資料不存在，請聯繫管理員')
        }
        throw new Error(`載入用戶資料失敗: ${userError.message}`)
      }

      if (!userData) {
        throw new Error('用戶資料為空')
      }

      user.value = userData

      log.log('用戶資料載入成功:', userData.full_name, '角色:', userData.role?.role_code)
    } catch (err) {
      log.error('獲取用戶資料失敗:', err)
      throw err
    }
  }

  // 用戶登入
  async function login(email: string, password: string) {
    loading.value = true
    error.value = null

    try {
      // 檢查網路連線
      if (!navigator.onLine) {
        throw new Error('無網路連線，請檢查您的網路設定')
      }

      // 使用重試機制進行登入
      const { data, error: authError } = await withRetry(
        async () => {
          const result = await supabase.auth.signInWithPassword({
            email,
            password
          })
          if (result.error) {
            // 不重試認證錯誤（如密碼錯誤）
            if (result.error.message?.includes('Invalid login') ||
                result.error.message?.includes('Email not confirmed')) {
              throw { ...result.error, noRetry: true }
            }
            throw result.error
          }
          return result
        },
        {
          maxRetries: 3,
          retryCondition: (error) => !error.noRetry
        }
      )

      if (authError) throw authError

      session.value = data.session
      await fetchUserProfile()

      // 設置自動刷新和 Realtime 監聽
      setupTokenAutoRefresh()
      setupRealtimeAuthListener()

      // 觸發登入事件
      emitAuthEvent('SIGNED_IN', { session: data.session, user: user.value })

      log.log('登入成功:', user.value?.full_name)
      return user.value
    } catch (err) {
      log.error('登入失敗:', err)
      error.value = err instanceof Error ? err.message : '登入失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 用戶登出
  async function logout() {
    loading.value = true
    error.value = null

    try {
      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) throw signOutError

      // 清除狀態
      user.value = null
      session.value = null

      // 清除所有計時器和訂閱
      if (tokenRefreshTimer.value) {
        clearTimeout(tokenRefreshTimer.value)
        tokenRefreshTimer.value = null
      }

      if (sessionExpiryTimer.value) {
        clearTimeout(sessionExpiryTimer.value)
        sessionExpiryTimer.value = null
      }

      if (realtimeSubscription.value) {
        supabase.removeChannel(realtimeSubscription.value)
        realtimeSubscription.value = null
      }

      // 觸發登出事件
      emitAuthEvent('SIGNED_OUT', {})

      log.log('登出成功')
    } catch (err) {
      log.error('登出失敗:', err)
      error.value = err instanceof Error ? err.message : '登出失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 重設密碼
  async function resetPassword(email: string) {
    loading.value = true
    error.value = null

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (resetError) throw resetError

      return { success: true, message: '密碼重設郵件已發送' }
    } catch (err) {
      log.error('重設密碼失敗:', err)
      error.value = err instanceof Error ? err.message : '重設密碼失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新密碼
  async function updatePassword(newPassword: string) {
    loading.value = true
    error.value = null

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      return { success: true, message: '密碼更新成功' }
    } catch (err) {
      log.error('更新密碼失敗:', err)
      error.value = err instanceof Error ? err.message : '更新密碼失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新用戶資料
  async function updateProfile(data: Partial<User>) {
    loading.value = true
    error.value = null

    try {
      if (!user.value) {
        throw new Error('用戶未登入')
      }

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(data)
        .eq('id', user.value.id)
        .select()
        .single()

      if (updateError) throw updateError

      // 重新獲取用戶資料
      await fetchUserProfile()

      return updatedUser
    } catch (err) {
      log.error('更新用戶資料失敗:', err)
      error.value = err instanceof Error ? err.message : '更新用戶資料失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 檢查權限
  function hasPermission(permission: string): boolean {
    if (!user.value || !user.value.role) {
      return false
    }

    // 管理員有所有權限
    if (user.value.role.role_code === 'ADMIN') {
      return true
    }

    return userPermissions.value[permission] === true
  }

  // 檢查角色
  function hasRole(role: string): boolean {
    if (!user.value || !user.value.role) {
      return false
    }

    return user.value.role.role_code === role
  }

  // 檢查多個角色
  function hasAnyRole(roles: string[]): boolean {
    if (!user.value || !user.value.role) {
      return false
    }

    return roles.includes(user.value.role.role_code)
  }

  // 清除錯誤狀態
  function clearError() {
    error.value = null
  }

  // 重置狀態
  function resetState() {
    user.value = null
    session.value = null
    loading.value = false
    error.value = null
    isRefreshingToken.value = false

    // 清除所有計時器和訂閱
    if (tokenRefreshTimer.value) {
      clearTimeout(tokenRefreshTimer.value)
      tokenRefreshTimer.value = null
    }

    if (sessionExpiryTimer.value) {
      clearTimeout(sessionExpiryTimer.value)
      sessionExpiryTimer.value = null
    }

    if (realtimeSubscription.value) {
      supabase.removeChannel(realtimeSubscription.value)
      realtimeSubscription.value = null
    }

    // 清除事件處理器
    authEventHandlers.value.clear()
  }

  return {
    // 狀態
    user,
    session,
    loading,
    error,
    isRefreshingToken,
    // 計算屬性
    isAuthenticated,
    userRole,
    userPermissions,
    sessionExpiresAt,
    sessionExpiresIn,
    isSessionExpiringSoon,
    // 方法
    initializeAuth,
    login,
    logout,
    resetPassword,
    updatePassword,
    updateProfile,
    hasPermission,
    hasRole,
    hasAnyRole,
    clearError,
    resetState,
    // 進階功能
    refreshToken,
    onAuthEvent,
    emitAuthEvent,
    setupTokenAutoRefresh,
    setupRealtimeAuthListener
  }
})
