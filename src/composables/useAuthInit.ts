import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authSupabase'

export interface AuthInitState {
  isInitialized: boolean
  isInitializing: boolean
  error: string | null
}

export function useAuthInit() {
  const authStore = useAuthStore()

  const state = ref<AuthInitState>({
    isInitialized: false,
    isInitializing: false,
    error: null
  })

  /**
   * 初始化認證系統
   */
  async function initializeAuth() {
    console.log('[AuthInit] 開始初始化認證系統')

    // 避免重複初始化
    if (state.value.isInitialized || state.value.isInitializing) {
      console.log('[AuthInit] 認證系統已初始化或正在初始化')
      return
    }

    state.value.isInitializing = true
    state.value.error = null

    try {
      // 初始化認證狀態
      await authStore.initializeAuth()

      state.value.isInitialized = true
      console.log('[AuthInit] 認證系統初始化成功')

      // 路由檢查將由 router guard 處理
    } catch (error) {
      console.error('[AuthInit] 認證系統初始化失敗:', error)
      state.value.error = error instanceof Error ? error.message : '認證初始化失敗'

      // 路由檢查將由 router guard 處理
    } finally {
      state.value.isInitializing = false
    }
  }

  /**
   * 等待認證初始化完成
   */
  async function waitForAuth(): Promise<boolean> {
    // 如果已經初始化完成，直接返回
    if (state.value.isInitialized) {
      return true
    }

    // 如果正在初始化，等待完成
    if (state.value.isInitializing) {
      console.log('[AuthInit] 等待認證初始化完成...')

      // 設置最大等待時間（10秒）
      const maxWaitTime = 10000
      const checkInterval = 100
      let waitTime = 0

      return new Promise((resolve) => {
        const timer = setInterval(() => {
          waitTime += checkInterval

          if (state.value.isInitialized || state.value.error || waitTime >= maxWaitTime) {
            clearInterval(timer)
            resolve(state.value.isInitialized)
          }
        }, checkInterval)
      })
    }

    // 尚未開始初始化，開始初始化
    await initializeAuth()
    return state.value.isInitialized
  }

  /**
   * 重置認證狀態
   */
  function resetAuthInit() {
    state.value = {
      isInitialized: false,
      isInitializing: false,
      error: null
    }
  }

  return {
    state,
    initializeAuth,
    waitForAuth,
    resetAuthInit
  }
}

// 全局認證初始化狀態 - 使用簡單的狀態管理避免依賴注入問題
const globalState = ref<AuthInitState>({
  isInitialized: false,
  isInitializing: false,
  error: null
})

/**
 * 獲取全局認證初始化實例
 */
export function useGlobalAuthInit() {
  const authStore = useAuthStore()

  async function initializeAuth() {
    console.log('[AuthInit] 開始初始化認證系統')

    // 避免重複初始化
    if (globalState.value.isInitialized || globalState.value.isInitializing) {
      console.log('[AuthInit] 認證系統已初始化或正在初始化')
      return
    }

    globalState.value.isInitializing = true
    globalState.value.error = null

    try {
      // 初始化認證狀態
      await authStore.initializeAuth()

      globalState.value.isInitialized = true
      console.log('[AuthInit] 認證系統初始化成功')
    } catch (error) {
      console.error('[AuthInit] 認證系統初始化失敗:', error)
      globalState.value.error = error instanceof Error ? error.message : '認證初始化失敗'
    } finally {
      globalState.value.isInitializing = false
    }
  }

  async function waitForAuth(): Promise<boolean> {
    // 如果已經初始化完成，直接返回
    if (globalState.value.isInitialized) {
      return true
    }

    // 如果正在初始化，等待完成
    if (globalState.value.isInitializing) {
      console.log('[AuthInit] 等待認證初始化完成...')

      // 設置最大等待時間（10秒）
      const maxWaitTime = 10000
      const checkInterval = 100
      let waitTime = 0

      return new Promise((resolve) => {
        const timer = setInterval(() => {
          waitTime += checkInterval

          if (globalState.value.isInitialized || globalState.value.error || waitTime >= maxWaitTime) {
            clearInterval(timer)
            resolve(globalState.value.isInitialized)
          }
        }, checkInterval)
      })
    }

    // 尚未開始初始化，開始初始化
    await initializeAuth()
    return globalState.value.isInitialized
  }

  function resetAuthInit() {
    globalState.value = {
      isInitialized: false,
      isInitializing: false,
      error: null
    }
  }

  return {
    state: globalState,
    initializeAuth,
    waitForAuth,
    resetAuthInit
  }
}
