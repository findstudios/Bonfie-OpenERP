import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/authSupabase'
import type { AuthEventType, AuthEventHandler } from '@/stores/authSupabase'

/**
 * 使用認證事件的 Composable
 *
 * @example
 * ```vue
 * <script setup>
 * import { useAuthEvents } from '@/composables/useAuthEvents'
 *
 * // 監聽單一事件
 * useAuthEvents('SESSION_EXPIRING_SOON', (event, data) => {
 *   console.log('Session 即將過期:', data)
 * })
 *
 * // 監聽多個事件
 * useAuthEvents(['SIGNED_IN', 'SIGNED_OUT'], (event, data) => {
 *   console.log('認證狀態變化:', event, data)
 * })
 *
 * // 使用自定義 ID
 * useAuthEvents('TOKEN_REFRESHED', (event, data) => {
 *   console.log('Token 已刷新')
 * }, 'my-component-token-handler')
 * </script>
 * ```
 */
export function useAuthEvents(
  events: AuthEventType | AuthEventType[],
  handler: AuthEventHandler,
  id?: string
) {
  const authStore = useAuthStore()
  let unsubscribe: (() => void) | null = null

  const eventArray = Array.isArray(events) ? events : [events]
  const handlerId = id || `auth-event-${Date.now()}-${Math.random()}`

  const wrappedHandler: AuthEventHandler = (event, data) => {
    if (eventArray.includes(event)) {
      handler(event, data)
    }
  }

  onMounted(() => {
    unsubscribe = authStore.onAuthEvent(handlerId, wrappedHandler)
  })

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
    }
  })

  return {
    unsubscribe: () => {
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }
    }
  }
}

/**
 * 監聽 Session 相關事件的便利函數
 */
export function useSessionEvents(handlers: {
  onExpiringSoon?: (data: any) => void
  onExpired?: (data: any) => void
  onRefreshed?: (data: any) => void
}) {
  const events: AuthEventType[] = []

  if (handlers.onExpiringSoon) events.push('SESSION_EXPIRING_SOON')
  if (handlers.onExpired) events.push('SESSION_EXPIRED')
  if (handlers.onRefreshed) events.push('SESSION_REFRESHED')

  return useAuthEvents(events, (event, data) => {
    switch (event) {
      case 'SESSION_EXPIRING_SOON':
        handlers.onExpiringSoon?.(data)
        break
      case 'SESSION_EXPIRED':
        handlers.onExpired?.(data)
        break
      case 'SESSION_REFRESHED':
        handlers.onRefreshed?.(data)
        break
    }
  })
}

/**
 * 監聽認證狀態變化的便利函數
 */
export function useAuthStateEvents(handlers: {
  onSignIn?: (data: any) => void
  onSignOut?: (data: any) => void
  onUserUpdated?: (data: any) => void
  onUserDeleted?: (data: any) => void
}) {
  const events: AuthEventType[] = []

  if (handlers.onSignIn) events.push('SIGNED_IN')
  if (handlers.onSignOut) events.push('SIGNED_OUT')
  if (handlers.onUserUpdated) events.push('USER_UPDATED')
  if (handlers.onUserDeleted) events.push('USER_DELETED')

  return useAuthEvents(events, (event, data) => {
    switch (event) {
      case 'SIGNED_IN':
        handlers.onSignIn?.(data)
        break
      case 'SIGNED_OUT':
        handlers.onSignOut?.(data)
        break
      case 'USER_UPDATED':
        handlers.onUserUpdated?.(data)
        break
      case 'USER_DELETED':
        handlers.onUserDeleted?.(data)
        break
    }
  })
}
