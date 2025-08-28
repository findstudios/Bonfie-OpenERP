import { useAuthStore } from '@/stores/authSupabase'
import type { AuthEventType } from '@/stores/authSupabase'
import { ElNotification, ElMessageBox } from 'element-plus'

/**
 * 認證事件處理服務
 *
 * 這個服務負責處理各種認證事件，包括：
 * - Token 即將過期的提醒
 * - Session 失效的自動登出
 * - 認證狀態變化的通知
 */
export class AuthEventHandler {
  private authStore = useAuthStore()
  private unsubscribers: (() => void)[] = []
  private hasShownExpiryWarning = false

  /**
   * 初始化認證事件處理器
   */
  initialize() {
    console.log('[AuthEventHandler] 初始化認證事件處理器')

    // 監聽 Session 即將過期
    this.unsubscribers.push(
      this.authStore.onAuthEvent('session-expiry-handler', (event, data) => {
        if (event === 'SESSION_EXPIRING_SOON') {
          this.handleSessionExpiringSoon(data)
        }
      })
    )

    // 監聽 Session 已過期
    this.unsubscribers.push(
      this.authStore.onAuthEvent('session-expired-handler', (event, data) => {
        if (event === 'SESSION_EXPIRED') {
          this.handleSessionExpired(data)
        }
      })
    )

    // 監聽 Token 刷新成功
    this.unsubscribers.push(
      this.authStore.onAuthEvent('token-refresh-handler', (event, data) => {
        if (event === 'TOKEN_REFRESHED') {
          this.handleTokenRefreshed(data)
        }
      })
    )

    // 監聽登入事件
    this.unsubscribers.push(
      this.authStore.onAuthEvent('sign-in-handler', (event, data) => {
        if (event === 'SIGNED_IN') {
          this.handleSignedIn(data)
        }
      })
    )

    // 監聽登出事件
    this.unsubscribers.push(
      this.authStore.onAuthEvent('sign-out-handler', (event, data) => {
        if (event === 'SIGNED_OUT') {
          this.handleSignedOut(data)
        }
      })
    )

    // 監聽用戶更新事件
    this.unsubscribers.push(
      this.authStore.onAuthEvent('user-update-handler', (event, data) => {
        if (event === 'USER_UPDATED') {
          this.handleUserUpdated(data)
        }
      })
    )

    // 監聽用戶被刪除事件
    this.unsubscribers.push(
      this.authStore.onAuthEvent('user-deleted-handler', (event, data) => {
        if (event === 'USER_DELETED') {
          this.handleUserDeleted(data)
        }
      })
    )
  }

  /**
   * 處理 Session 即將過期
   */
  private async handleSessionExpiringSoon(data: any) {
    // 避免重複顯示警告
    if (this.hasShownExpiryWarning) return
    this.hasShownExpiryWarning = true

    const remainingMinutes = Math.round(data.remainingTime / 1000 / 60)

    try {
      await ElMessageBox.confirm(
        `您的登入狀態將在 ${remainingMinutes} 分鐘後過期。是否要延長登入時間？`,
        '登入即將過期',
        {
          confirmButtonText: '延長登入',
          cancelButtonText: '稍後提醒',
          type: 'warning',
          center: true
        }
      )

      // 用戶選擇延長登入，立即刷新 Token
      await this.authStore.refreshToken()
    } catch {
      // 用戶選擇稍後提醒
      console.log('[AuthEventHandler] 用戶選擇稍後提醒')

      // 2分鐘後再次提醒
      setTimeout(() => {
        this.hasShownExpiryWarning = false
      }, 2 * 60 * 1000)
    }
  }

  /**
   * 處理 Session 已過期
   */
  private handleSessionExpired(data: any) {
    ElNotification({
      title: '登入已過期',
      message: '您的登入狀態已過期，請重新登入。',
      type: 'error',
      duration: 5000,
      position: 'top-right'
    })

    // 重定向到登入頁面
    setTimeout(() => {
      window.location.href = '/login'
    }, 1000)
  }

  /**
   * 處理 Token 刷新成功
   */
  private handleTokenRefreshed(data: any) {
    this.hasShownExpiryWarning = false

    console.log('[AuthEventHandler] Token 刷新成功，新的過期時間:', data.session.expires_at)

    // 可以選擇性地顯示成功通知
    // ElNotification({
    //   title: '登入狀態已更新',
    //   message: '您的登入狀態已自動延長。',
    //   type: 'success',
    //   duration: 3000,
    //   position: 'top-right'
    // })
  }

  /**
   * 處理登入成功
   */
  private handleSignedIn(data: any) {
    const userName = data.user?.full_name || data.user?.email || '用戶'

    ElNotification({
      title: '登入成功',
      message: `歡迎回來，${userName}！`,
      type: 'success',
      duration: 3000,
      position: 'top-right'
    })
  }

  /**
   * 處理登出
   */
  private handleSignedOut(data: any) {
    ElNotification({
      title: '已登出',
      message: '您已成功登出系統。',
      type: 'info',
      duration: 3000,
      position: 'top-right'
    })
  }

  /**
   * 處理用戶資料更新
   */
  private handleUserUpdated(data: any) {
    ElNotification({
      title: '資料已更新',
      message: '您的用戶資料已更新。',
      type: 'success',
      duration: 3000,
      position: 'top-right'
    })
  }

  /**
   * 處理用戶被刪除
   */
  private handleUserDeleted(data: any) {
    ElNotification({
      title: '帳號已被停用',
      message: '您的帳號已被系統管理員停用。',
      type: 'error',
      duration: 5000,
      position: 'top-right'
    })

    // 重定向到登入頁面
    setTimeout(() => {
      window.location.href = '/login'
    }, 2000)
  }

  /**
   * 清理事件監聽器
   */
  destroy() {
    console.log('[AuthEventHandler] 清理認證事件處理器')

    // 取消所有事件訂閱
    this.unsubscribers.forEach(unsubscribe => unsubscribe())
    this.unsubscribers = []
  }
}

// 創建單例實例
export const authEventHandler = new AuthEventHandler()
