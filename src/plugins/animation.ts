import type { App } from 'vue'
import { animationDirectives } from '@/directives/animation'
import { globalAnimationManager, animationPerformanceMonitor } from '@/utils/animation'

/**
 * 動畫系統插件
 * 註冊動畫指令並初始化動畫系統
 */
export default {
  install(app: App) {
    // 註冊動畫指令
    app.directive('animate', animationDirectives.animate)
    app.directive('micro-interaction', animationDirectives.microInteraction)
    app.directive('loading-animation', animationDirectives.loadingAnimation)

    // 初始化性能監控
    if (typeof window !== 'undefined') {
      animationPerformanceMonitor.monitorFPS()
    }

    // 提供全局動畫管理器
    app.provide('animationManager', globalAnimationManager)
    app.provide('animationPerformanceMonitor', animationPerformanceMonitor)

    // 在應用卸載時清理資源
    app.config.globalProperties.$onBeforeUnmount = () => {
      globalAnimationManager.cleanup()
    }

    // 添加全局屬性
    app.config.globalProperties.$animationManager = globalAnimationManager
    app.config.globalProperties.$animationPerformanceMonitor = animationPerformanceMonitor

    // 開發模式下的調試工具
    if (process.env.NODE_ENV === 'development') {
      // 添加全局調試方法
      (window as any).__ANIMATION_DEBUG__ = {
        manager: globalAnimationManager,
        monitor: animationPerformanceMonitor,
        getActiveAnimations: () => globalAnimationManager.getActiveCount(),
        getFPS: () => animationPerformanceMonitor.getCurrentFPS(),
        checkPerformance: () => {
          const fps = animationPerformanceMonitor.getCurrentFPS()
          const activeCount = globalAnimationManager.getActiveCount()

          console.group('🎬 Animation Performance Report')
          console.log(`FPS: ${fps}`)
          console.log(`Active Animations: ${activeCount}`)
          console.log(`Performance Status: ${fps >= 55 ? '✅ Good' : '⚠️ Poor'}`)

          if (fps < 55) {
            console.warn('Performance recommendations:')
            console.warn('- Reduce concurrent animations')
            console.warn('- Use transform and opacity for animations')
            console.warn('- Enable hardware acceleration')
            console.warn('- Consider reduced motion mode')
          }

          console.groupEnd()
        },
        pauseAll: () => globalAnimationManager.pauseAll(),
        resumeAll: () => globalAnimationManager.resumeAll(),
        cancelAll: () => globalAnimationManager.cancelAll()
      }

      console.log('🎬 Animation Debug Tools available at window.__ANIMATION_DEBUG__')
    }
  }
}
