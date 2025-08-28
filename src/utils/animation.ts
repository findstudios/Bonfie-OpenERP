/**
 * 動畫性能優化工具
 */

// 動畫性能監控
export class AnimationPerformanceMonitor {
  private static instance: AnimationPerformanceMonitor
  private performanceEntries: Map<string, number[]> = new Map()
  private frameCount = 0
  private lastFrameTime = 0
  private fps = 60

  static getInstance(): AnimationPerformanceMonitor {
    if (!AnimationPerformanceMonitor.instance) {
      AnimationPerformanceMonitor.instance = new AnimationPerformanceMonitor()
    }
    return AnimationPerformanceMonitor.instance
  }

  // 開始監控動畫性能
  startMonitoring(animationId: string) {
    if (!this.performanceEntries.has(animationId)) {
      this.performanceEntries.set(animationId, [])
    }

    const startTime = performance.now()
    this.performanceEntries.get(animationId)!.push(startTime)

    return startTime
  }

  // 結束監控動畫性能
  endMonitoring(animationId: string, startTime: number) {
    const endTime = performance.now()
    const duration = endTime - startTime

    const entries = this.performanceEntries.get(animationId)
    if (entries) {
      entries.push(duration)

      // 保持最近100次記錄
      if (entries.length > 200) {
        entries.splice(0, entries.length - 200)
      }
    }

    return duration
  }

  // 獲取動畫平均性能
  getAveragePerformance(animationId: string): number {
    const entries = this.performanceEntries.get(animationId)
    if (!entries || entries.length < 2) return 0

    // 跳過第一個元素（開始時間），計算持續時間的平均值
    const durations = entries.slice(1)
    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length
  }

  // 檢查動畫是否性能良好
  isPerformanceGood(animationId: string): boolean {
    const avgDuration = this.getAveragePerformance(animationId)
    // 如果平均動畫時間超過16.67ms（60fps），認為性能不佳
    return avgDuration < 16.67
  }

  // 監控FPS
  monitorFPS() {
    const now = performance.now()

    if (this.lastFrameTime) {
      const delta = now - this.lastFrameTime
      this.fps = 1000 / delta
    }

    this.lastFrameTime = now
    this.frameCount++

    requestAnimationFrame(() => this.monitorFPS())
  }

  // 獲取當前FPS
  getCurrentFPS(): number {
    return Math.round(this.fps)
  }

  // 清理性能數據
  clearPerformanceData(animationId?: string) {
    if (animationId) {
      this.performanceEntries.delete(animationId)
    } else {
      this.performanceEntries.clear()
    }
  }
}

// 動畫隊列管理器
export class AnimationQueue {
  private queue: Array<() => Promise<void>> = []
  private isProcessing = false
  private maxConcurrent = 3
  private currentAnimations = 0

  // 添加動畫到隊列
  add(animationFn: () => Promise<void>, priority = 0): Promise<void> {
    return new Promise((resolve, reject) => {
      const wrappedFn = async () => {
        try {
          await animationFn()
          resolve()
        } catch (error) {
          reject(error)
        }
      }

      // 根據優先級插入隊列
      const insertIndex = this.queue.findIndex((_, index) => {
        // 簡單的優先級實現，可以根據需要擴展
        return priority > 0 && index === 0
      })

      if (insertIndex >= 0) {
        this.queue.splice(insertIndex, 0, wrappedFn)
      } else {
        this.queue.push(wrappedFn)
      }

      this.processQueue()
    })
  }

  // 處理動畫隊列
  private async processQueue() {
    if (this.isProcessing || this.currentAnimations >= this.maxConcurrent) {
      return
    }

    const animationFn = this.queue.shift()
    if (!animationFn) return

    this.isProcessing = true
    this.currentAnimations++

    try {
      await animationFn()
    } catch (error) {
      console.warn('Animation queue error:', error)
    } finally {
      this.currentAnimations--
      this.isProcessing = false

      // 繼續處理隊列
      if (this.queue.length > 0) {
        this.processQueue()
      }
    }
  }

  // 清空隊列
  clear() {
    this.queue.length = 0
  }

  // 獲取隊列長度
  get length() {
    return this.queue.length
  }
}

// 動畫緩存管理器
export class AnimationCache {
  private static instance: AnimationCache
  private cache: Map<string, KeyframeEffect> = new Map()
  private maxCacheSize = 50

  static getInstance(): AnimationCache {
    if (!AnimationCache.instance) {
      AnimationCache.instance = new AnimationCache()
    }
    return AnimationCache.instance
  }

  // 生成緩存鍵
  private generateCacheKey(keyframes: Keyframe[], options: KeyframeAnimationOptions): string {
    return JSON.stringify({ keyframes, options })
  }

  // 獲取緩存的動畫效果
  get(keyframes: Keyframe[], options: KeyframeAnimationOptions): KeyframeEffect | null {
    const key = this.generateCacheKey(keyframes, options)
    return this.cache.get(key) || null
  }

  // 設置緩存的動畫效果
  set(keyframes: Keyframe[], options: KeyframeAnimationOptions, effect: KeyframeEffect) {
    const key = this.generateCacheKey(keyframes, options)

    // 如果緩存已滿，刪除最舊的條目
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, effect)
  }

  // 清理緩存
  clear() {
    this.cache.clear()
  }

  // 獲取緩存大小
  get size() {
    return this.cache.size
  }
}

// 動畫工具函數
export const animationUtils = {
  // 檢查瀏覽器是否支持Web Animations API
  isWebAnimationsSupported(): boolean {
    return typeof Element !== 'undefined' && 'animate' in Element.prototype
  },

  // 檢查是否應該減少動畫
  shouldReduceMotion(): boolean {
    if (typeof window === 'undefined') return false

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    return mediaQuery.matches
  },

  // 獲取優化的動畫選項
  getOptimizedOptions(options: KeyframeAnimationOptions): KeyframeAnimationOptions {
    const reducedMotion = this.shouldReduceMotion()

    if (reducedMotion) {
      return {
        ...options,
        duration: Math.min(options.duration as number || 300, 150),
        easing: 'ease-out'
      }
    }

    return options
  },

  // 創建性能友好的動畫
  createPerformantAnimation(
    element: Element,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions
  ): Animation | null {
    if (!this.isWebAnimationsSupported()) {
      console.warn('Web Animations API not supported')
      return null
    }

    const optimizedOptions = this.getOptimizedOptions(options)
    const monitor = AnimationPerformanceMonitor.getInstance()
    const animationId = `animation-${Date.now()}-${Math.random()}`

    try {
      const startTime = monitor.startMonitoring(animationId)
      const animation = element.animate(keyframes, optimizedOptions)

      animation.addEventListener('finish', () => {
        monitor.endMonitoring(animationId, startTime)
      })

      animation.addEventListener('cancel', () => {
        monitor.endMonitoring(animationId, startTime)
      })

      return animation
    } catch (error) {
      console.warn('Failed to create animation:', error)
      return null
    }
  },

  // 批量創建動畫
  createBatchAnimations(
    elements: Element[],
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
    stagger = 0
  ): Animation[] {
    const animations: Animation[] = []

    elements.forEach((element, index) => {
      const staggeredOptions = {
        ...options,
        delay: (options.delay || 0) + (index * stagger)
      }

      const animation = this.createPerformantAnimation(element, keyframes, staggeredOptions)
      if (animation) {
        animations.push(animation)
      }
    })

    return animations
  },

  // 等待多個動畫完成
  waitForAnimations(animations: Animation[]): Promise<void[]> {
    const promises = animations.map(animation =>
      new Promise<void>((resolve, reject) => {
        animation.addEventListener('finish', () => resolve())
        animation.addEventListener('cancel', () => reject(new Error('Animation cancelled')))
      })
    )

    return Promise.all(promises)
  },

  // 取消多個動畫
  cancelAnimations(animations: Animation[]) {
    animations.forEach(animation => {
      try {
        animation.cancel()
      } catch (error) {
        console.warn('Failed to cancel animation:', error)
      }
    })
  },

  // 暫停多個動畫
  pauseAnimations(animations: Animation[]) {
    animations.forEach(animation => {
      try {
        animation.pause()
      } catch (error) {
        console.warn('Failed to pause animation:', error)
      }
    })
  },

  // 恢復多個動畫
  resumeAnimations(animations: Animation[]) {
    animations.forEach(animation => {
      try {
        animation.play()
      } catch (error) {
        console.warn('Failed to resume animation:', error)
      }
    })
  },

  // 動畫緩動函數
  easingFunctions: {
    // 標準緩動
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',

    // 彈性緩動
    easeOutBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    easeInBack: 'cubic-bezier(0.36, 0, 0.66, -0.56)',

    // 彈跳緩動
    easeOutBounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

    // 快速緩動
    easeOutQuart: 'cubic-bezier(0.25, 1, 0.5, 1)',
    easeInQuart: 'cubic-bezier(0.5, 0, 0.75, 0)',

    // 平滑緩動
    easeInOutSine: 'cubic-bezier(0.37, 0, 0.63, 1)',
    easeOutSine: 'cubic-bezier(0.39, 0.575, 0.565, 1)',
    easeInSine: 'cubic-bezier(0.47, 0, 0.745, 0.715)'
  },

  // 響應式動畫持續時間
  getResponsiveDuration(baseDuration: number): number {
    if (typeof window === 'undefined') return baseDuration

    const width = window.innerWidth

    // 在小屏幕上縮短動畫時間
    if (width < 768) {
      return Math.max(baseDuration * 0.7, 150)
    } else if (width < 1024) {
      return Math.max(baseDuration * 0.85, 200)
    }

    return baseDuration
  },

  // 動畫性能檢查
  checkAnimationPerformance(): {
    fps: number
    isGoodPerformance: boolean
    recommendations: string[]
    } {
    const monitor = AnimationPerformanceMonitor.getInstance()
    const fps = monitor.getCurrentFPS()
    const isGoodPerformance = fps >= 55 // 允許一些波動
    const recommendations: string[] = []

    if (!isGoodPerformance) {
      recommendations.push('考慮減少同時運行的動畫數量')
      recommendations.push('使用 transform 和 opacity 屬性進行動畫')
      recommendations.push('避免動畫會觸發重排的屬性')
      recommendations.push('考慮啟用硬件加速 (will-change: transform)')
    }

    if (fps < 30) {
      recommendations.push('設備性能較低，建議啟用減少動畫模式')
    }

    return {
      fps,
      isGoodPerformance,
      recommendations
    }
  }
}

// 全局動畫管理器
export class GlobalAnimationManager {
  private static instance: GlobalAnimationManager
  private activeAnimations: Set<Animation> = new Set()
  private animationQueue = new AnimationQueue()
  private performanceMonitor = AnimationPerformanceMonitor.getInstance()

  static getInstance(): GlobalAnimationManager {
    if (!GlobalAnimationManager.instance) {
      GlobalAnimationManager.instance = new GlobalAnimationManager()
    }
    return GlobalAnimationManager.instance
  }

  // 註冊動畫
  register(animation: Animation) {
    this.activeAnimations.add(animation)

    animation.addEventListener('finish', () => {
      this.activeAnimations.delete(animation)
    })

    animation.addEventListener('cancel', () => {
      this.activeAnimations.delete(animation)
    })
  }

  // 暫停所有動畫
  pauseAll() {
    this.activeAnimations.forEach(animation => {
      try {
        animation.pause()
      } catch (error) {
        console.warn('Failed to pause animation:', error)
      }
    })
  }

  // 恢復所有動畫
  resumeAll() {
    this.activeAnimations.forEach(animation => {
      try {
        animation.play()
      } catch (error) {
        console.warn('Failed to resume animation:', error)
      }
    })
  }

  // 取消所有動畫
  cancelAll() {
    this.activeAnimations.forEach(animation => {
      try {
        animation.cancel()
      } catch (error) {
        console.warn('Failed to cancel animation:', error)
      }
    })
    this.activeAnimations.clear()
  }

  // 獲取活動動畫數量
  getActiveCount(): number {
    return this.activeAnimations.size
  }

  // 獲取動畫隊列
  getQueue(): AnimationQueue {
    return this.animationQueue
  }

  // 獲取性能監控器
  getPerformanceMonitor(): AnimationPerformanceMonitor {
    return this.performanceMonitor
  }

  // 清理資源
  cleanup() {
    this.cancelAll()
    this.animationQueue.clear()
    this.performanceMonitor.clearPerformanceData()
  }
}

// 導出單例實例
export const globalAnimationManager = GlobalAnimationManager.getInstance()
export const animationPerformanceMonitor = AnimationPerformanceMonitor.getInstance()
export const animationCache = AnimationCache.getInstance()
