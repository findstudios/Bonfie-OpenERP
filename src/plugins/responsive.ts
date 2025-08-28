/**
 * 響應式系統插件
 * 用於初始化響應式狀態管理和事件監聽
 */

import type { App } from 'vue'
import { useResponsiveStore } from '@/stores/responsive'

// 響應式插件選項
export interface ResponsivePluginOptions {
  // 是否自動初始化
  autoInit?: boolean

  // 是否啟用調試模式
  debug?: boolean

  // 自定義配置
  config?: any
}

// 預設選項
const defaultOptions: ResponsivePluginOptions = {
  autoInit: true,
  debug: false,
}

/**
 * 響應式插件
 */
export const ResponsivePlugin = {
  install(app: App, options: ResponsivePluginOptions = {}) {
    const opts = { ...defaultOptions, ...options }

    // 提供全域配置
    app.provide('responsiveOptions', opts)

    // 全域屬性
    app.config.globalProperties.$responsive = {
      store: null as any,
      initialized: false,
    }

    // 初始化函數
    const initResponsive = () => {
      if (typeof window === 'undefined') {
        if (opts.debug) {
          console.warn('[ResponsivePlugin] 在伺服器端環境中跳過初始化')
        }
        return
      }

      try {
        const responsiveStore = useResponsiveStore()

        // 更新自定義配置
        if (opts.config) {
          responsiveStore.updateConfig(opts.config)
        }

        // 初始化響應式狀態
        responsiveStore.initialize()

        // 設置全域屬性
        app.config.globalProperties.$responsive.store = responsiveStore
        app.config.globalProperties.$responsive.initialized = true

        if (opts.debug) {
          console.log('[ResponsivePlugin] 響應式系統初始化完成')
          console.log('當前狀態:', responsiveStore.state)
          console.log('當前斷點:', responsiveStore.currentBreakpoint)
        }

        // 監聽狀態變化（僅在調試模式下）
        if (opts.debug) {
          const originalUpdateScreenSize = responsiveStore.updateScreenSize
          responsiveStore.updateScreenSize = function() {
            originalUpdateScreenSize.call(this)
            console.log('[ResponsivePlugin] 螢幕尺寸更新:', {
              width: this.state.screenWidth,
              height: this.state.screenHeight,
              breakpoint: this.currentBreakpoint,
              isMobile: this.state.isMobile,
              isTablet: this.state.isTablet,
              isDesktop: this.state.isDesktop,
            })
          }
        }

      } catch (error) {
        console.error('[ResponsivePlugin] 初始化失敗:', error)
      }
    }

    // 自動初始化
    if (opts.autoInit) {
      // 在 DOM 準備就緒後初始化
      if (typeof window !== 'undefined') {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initResponsive)
        } else {
          // DOM 已經準備就緒
          setTimeout(initResponsive, 0)
        }
      }
    }

    // 提供手動初始化方法
    app.config.globalProperties.$initResponsive = initResponsive
  }
}

/**
 * 響應式系統工具函數
 */
export const ResponsiveUtils = {
  /**
   * 檢查響應式系統是否已初始化
   */
  isInitialized(): boolean {
    if (typeof window === 'undefined') return false

    try {
      const responsiveStore = useResponsiveStore()
      return responsiveStore.state.screenWidth > 0
    } catch {
      return false
    }
  },

  /**
   * 強制更新響應式狀態
   */
  forceUpdate(): void {
    if (typeof window === 'undefined') return

    try {
      const responsiveStore = useResponsiveStore()
      responsiveStore.updateScreenSize()
    } catch (error) {
      console.error('[ResponsiveUtils] 強制更新失敗:', error)
    }
  },

  /**
   * 獲取當前響應式狀態
   */
  getCurrentState() {
    if (typeof window === 'undefined') {
      return {
        screenWidth: 1024,
        screenHeight: 768,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        currentBreakpoint: 'desktop'
      }
    }

    try {
      const responsiveStore = useResponsiveStore()
      return {
        screenWidth: responsiveStore.state.screenWidth,
        screenHeight: responsiveStore.state.screenHeight,
        isMobile: responsiveStore.state.isMobile,
        isTablet: responsiveStore.state.isTablet,
        isDesktop: responsiveStore.state.isDesktop,
        currentBreakpoint: responsiveStore.currentBreakpoint,
      }
    } catch {
      return {
        screenWidth: window.innerWidth || 1024,
        screenHeight: window.innerHeight || 768,
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1200,
        isDesktop: window.innerWidth >= 1200,
        currentBreakpoint: window.innerWidth < 768 ? 'mobile' :
          window.innerWidth < 1200 ? 'tablet' : 'desktop'
      }
    }
  },

  /**
   * 等待響應式系統初始化完成
   */
  async waitForInit(timeout = 5000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isInitialized()) {
        resolve(true)
        return
      }

      const startTime = Date.now()
      const checkInterval = setInterval(() => {
        if (this.isInitialized()) {
          clearInterval(checkInterval)
          resolve(true)
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval)
          resolve(false)
        }
      }, 100)
    })
  },

  /**
   * 添加響應式狀態變化監聽器
   */
  onStateChange(callback: (state: any) => void): () => void {
    if (typeof window === 'undefined') {
      return () => {}
    }

    try {
      const responsiveStore = useResponsiveStore()

      // 創建一個包裝函數來監聽狀態變化
      const unwatch = responsiveStore.$subscribe((mutation, state) => {
        callback(state)
      })

      return unwatch
    } catch {
      return () => {}
    }
  }
}

// 預設導出
export default ResponsivePlugin
