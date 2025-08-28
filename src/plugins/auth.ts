import type { App } from 'vue'
import { useGlobalAuthInit } from '@/composables/useAuthInit'

export interface AuthPluginOptions {
  autoInit?: boolean
  debug?: boolean
}

export default {
  install(app: App, options: AuthPluginOptions = {}) {
    const { autoInit = true, debug = false } = options

    if (debug) {
      console.log('[AuthPlugin] 安裝認證插件', options)
    }

    // 獲取全局認證初始化實例
    const authInit = useGlobalAuthInit()

    // 提供全局屬性
    app.config.globalProperties.$authInit = authInit

    // 自動初始化
    if (autoInit) {
      // 在下一個 tick 中初始化，確保所有插件都已安裝
      Promise.resolve().then(() => {
        if (debug) {
          console.log('[AuthPlugin] 自動初始化認證系統')
        }
        authInit.initializeAuth()
      })
    }

    // 提供全局方法
    app.provide('authInit', authInit)
  }
}
