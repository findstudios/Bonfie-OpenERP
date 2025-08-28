import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute, type RouteLocationNormalized } from 'vue-router'
import { useAnimation, ANIMATION_PRESETS } from './useAnimation'

// 頁面過渡類型定義
export interface PageTransitionConfig {
  name: string
  mode?: 'out-in' | 'in-out' | 'default'
  duration?: number
  enterFrom?: string
  enterActive?: string
  enterTo?: string
  leaveFrom?: string
  leaveActive?: string
  leaveTo?: string
  appear?: boolean
}

// 預定義的頁面過渡效果
export const PAGE_TRANSITIONS = {
  // 淡入淡出
  fade: {
    name: 'fade',
    mode: 'out-in' as const,
    duration: 300,
    enterFrom: 'opacity-0',
    enterActive: 'transition-opacity duration-300 ease-out',
    enterTo: 'opacity-100',
    leaveFrom: 'opacity-100',
    leaveActive: 'transition-opacity duration-300 ease-in',
    leaveTo: 'opacity-0',
    appear: true
  },

  // 滑動效果
  slide: {
    name: 'slide',
    mode: 'out-in' as const,
    duration: 350,
    enterFrom: 'transform translate-x-full opacity-0',
    enterActive: 'transition-all duration-350 ease-out',
    enterTo: 'transform translate-x-0 opacity-100',
    leaveFrom: 'transform translate-x-0 opacity-100',
    leaveActive: 'transition-all duration-350 ease-in',
    leaveTo: 'transform -translate-x-full opacity-0',
    appear: true
  },

  // 縮放效果
  scale: {
    name: 'scale',
    mode: 'out-in' as const,
    duration: 300,
    enterFrom: 'transform scale-95 opacity-0',
    enterActive: 'transition-all duration-300 ease-out',
    enterTo: 'transform scale-100 opacity-100',
    leaveFrom: 'transform scale-100 opacity-100',
    leaveActive: 'transition-all duration-300 ease-in',
    leaveTo: 'transform scale-105 opacity-0',
    appear: true
  },

  // 向上滑入
  slideUp: {
    name: 'slide-up',
    mode: 'out-in' as const,
    duration: 300,
    enterFrom: 'transform translate-y-4 opacity-0',
    enterActive: 'transition-all duration-300 ease-out',
    enterTo: 'transform translate-y-0 opacity-100',
    leaveFrom: 'transform translate-y-0 opacity-100',
    leaveActive: 'transition-all duration-300 ease-in',
    leaveTo: 'transform -translate-y-4 opacity-0',
    appear: true
  },

  // 向下滑入
  slideDown: {
    name: 'slide-down',
    mode: 'out-in' as const,
    duration: 300,
    enterFrom: 'transform -translate-y-4 opacity-0',
    enterActive: 'transition-all duration-300 ease-out',
    enterTo: 'transform translate-y-0 opacity-100',
    leaveFrom: 'transform translate-y-0 opacity-100',
    leaveActive: 'transition-all duration-300 ease-in',
    leaveTo: 'transform translate-y-4 opacity-0',
    appear: true
  },

  // 無過渡效果
  none: {
    name: 'none',
    mode: 'default' as const,
    duration: 0,
    enterFrom: '',
    enterActive: '',
    enterTo: '',
    leaveFrom: '',
    leaveActive: '',
    leaveTo: '',
    appear: false
  }
} as const

// 路由過渡方向檢測
export type TransitionDirection = 'forward' | 'backward' | 'none'

/**
 * 頁面過渡 composable
 * 提供路由級別的頁面過渡效果
 */
export function usePageTransition() {
  const router = useRouter()
  const route = useRoute()
  const { shouldReduceMotion } = useAnimation()

  // 過渡狀態
  const isTransitioning = ref(false)
  const transitionName = ref('fade')
  const transitionDirection = ref<TransitionDirection>('none')
  const currentTransition = ref<PageTransitionConfig>(PAGE_TRANSITIONS.fade)

  // 路由歷史記錄（用於判斷前進/後退）
  const routeHistory = ref<string[]>([])
  const historyIndex = ref(0)

  // 計算當前過渡配置
  const effectiveTransition = computed(() => {
    if (shouldReduceMotion.value) {
      return PAGE_TRANSITIONS.none
    }
    return currentTransition.value
  })

  // 設置過渡效果
  const setTransition = (transitionKey: keyof typeof PAGE_TRANSITIONS) => {
    currentTransition.value = PAGE_TRANSITIONS[transitionKey]
    transitionName.value = currentTransition.value.name
  }

  // 檢測過渡方向
  const detectTransitionDirection = (to: RouteLocationNormalized, from: RouteLocationNormalized): TransitionDirection => {
    const toPath = to.path
    const fromPath = from.path

    // 檢查是否在歷史記錄中
    const toIndex = routeHistory.value.indexOf(toPath)
    const fromIndex = routeHistory.value.indexOf(fromPath)

    if (toIndex !== -1 && fromIndex !== -1) {
      return toIndex > fromIndex ? 'forward' : 'backward'
    }

    // 根據路由深度判斷
    const toDepth = toPath.split('/').length
    const fromDepth = fromPath.split('/').length

    if (toDepth > fromDepth) {
      return 'forward'
    } else if (toDepth < fromDepth) {
      return 'backward'
    }

    return 'none'
  }

  // 更新路由歷史
  const updateRouteHistory = (path: string) => {
    const index = routeHistory.value.indexOf(path)

    if (index !== -1) {
      // 如果路由已存在，移除後面的記錄
      routeHistory.value = routeHistory.value.slice(0, index + 1)
      historyIndex.value = index
    } else {
      // 添加新路由
      routeHistory.value.push(path)
      historyIndex.value = routeHistory.value.length - 1
    }
  }

  // 根據方向選擇過渡效果
  const getTransitionByDirection = (direction: TransitionDirection): keyof typeof PAGE_TRANSITIONS => {
    switch (direction) {
      case 'forward':
        return 'slideUp'
      case 'backward':
        return 'slideDown'
      default:
        return 'fade'
    }
  }

  // 路由守衛：過渡開始前
  const beforeRouteTransition = (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
    isTransitioning.value = true

    // 檢測過渡方向
    const direction = detectTransitionDirection(to, from)
    transitionDirection.value = direction

    // 根據方向設置過渡效果
    const transitionKey = getTransitionByDirection(direction)
    setTransition(transitionKey)

    // 更新路由歷史
    updateRouteHistory(to.path)
  }

  // 路由守衛：過渡完成後
  const afterRouteTransition = () => {
    isTransitioning.value = false
  }

  // 手動觸發頁面過渡
  const triggerPageTransition = async (
    element: Element,
    type: 'enter' | 'leave' = 'enter',
    customTransition?: Partial<PageTransitionConfig>
  ) => {
    const transition = { ...effectiveTransition.value, ...customTransition }

    if (shouldReduceMotion.value || transition.duration === 0) {
      return Promise.resolve()
    }

    const keyframes = type === 'enter'
      ? ANIMATION_PRESETS.page.enter.keyframes
      : ANIMATION_PRESETS.page.leave.keyframes

    const options = {
      duration: transition.duration || 300,
      easing: 'ease-out',
      fill: 'forwards' as FillMode
    }

    const animation = element.animate(keyframes, options)

    return new Promise<void>((resolve) => {
      animation.addEventListener('finish', () => resolve())
      animation.addEventListener('cancel', () => resolve())
    })
  }

  // 初始化路由守衛
  const setupRouterGuards = () => {
    // 全局前置守衛
    router.beforeEach((to, from, next) => {
      if (from.name) {
        beforeRouteTransition(to, from)
      }
      next()
    })

    // 全局後置鉤子
    router.afterEach(() => {
      nextTick(() => {
        afterRouteTransition()
      })
    })
  }

  // 清理函數
  const cleanup = () => {
    routeHistory.value = []
    historyIndex.value = 0
    isTransitioning.value = false
  }

  // 初始化
  onMounted(() => {
    setupRouterGuards()
    updateRouteHistory(route.path)
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    // 狀態
    isTransitioning,
    transitionName,
    transitionDirection,
    currentTransition,
    effectiveTransition,
    routeHistory,

    // 方法
    setTransition,
    triggerPageTransition,
    detectTransitionDirection,
    beforeRouteTransition,
    afterRouteTransition,
    cleanup,

    // 預設過渡效果
    transitions: PAGE_TRANSITIONS
  }
}

/**
 * 載入狀態動畫 composable
 * 處理頁面載入時的骨架屏和載入動畫
 */
export function useLoadingAnimation() {
  const { shouldReduceMotion } = useAnimation()

  const isLoading = ref(false)
  const loadingProgress = ref(0)
  const loadingMessage = ref('')

  // 開始載入動畫
  const startLoading = (message = '載入中...') => {
    isLoading.value = true
    loadingProgress.value = 0
    loadingMessage.value = message
  }

  // 更新載入進度
  const updateProgress = (progress: number, message?: string) => {
    loadingProgress.value = Math.max(0, Math.min(100, progress))
    if (message) {
      loadingMessage.value = message
    }
  }

  // 完成載入動畫
  const finishLoading = () => {
    loadingProgress.value = 100

    // 短暫延遲後隱藏載入狀態
    setTimeout(() => {
      isLoading.value = false
      loadingProgress.value = 0
      loadingMessage.value = ''
    }, shouldReduceMotion.value ? 0 : 300)
  }

  // 創建骨架屏元素
  const createSkeletonElement = (config: {
    width?: string
    height?: string
    className?: string
    count?: number
  } = {}) => {
    const {
      width = '100%',
      height = '1rem',
      className = '',
      count = 1
    } = config

    const elements = []

    for (let i = 0; i < count; i++) {
      const element = document.createElement('div')
      element.className = `skeleton-loading ${className}`
      element.style.width = width
      element.style.height = height
      element.style.marginBottom = '0.5rem'
      elements.push(element)
    }

    return count === 1 ? elements[0] : elements
  }

  // 應用骨架屏到容器
  const applySkeletonToContainer = (
    container: Element,
    config: {
      lines?: number
      lineHeight?: string
      spacing?: string
    } = {}
  ) => {
    const {
      lines = 3,
      lineHeight = '1rem',
      spacing = '0.5rem'
    } = config

    // 清空容器
    container.innerHTML = ''

    // 添加骨架屏元素
    for (let i = 0; i < lines; i++) {
      const skeleton = createSkeletonElement({
        height: lineHeight,
        width: i === lines - 1 ? '75%' : '100%' // 最後一行稍短
      })

      container.appendChild(skeleton)

      if (i < lines - 1) {
        const spacer = document.createElement('div')
        spacer.style.height = spacing
        container.appendChild(spacer)
      }
    }
  }

  // 移除骨架屏
  const removeSkeletonFromContainer = (container: Element) => {
    const skeletons = container.querySelectorAll('.skeleton-loading')
    skeletons.forEach(skeleton => skeleton.remove())
  }

  return {
    // 狀態
    isLoading,
    loadingProgress,
    loadingMessage,

    // 方法
    startLoading,
    updateProgress,
    finishLoading,
    createSkeletonElement,
    applySkeletonToContainer,
    removeSkeletonFromContainer
  }
}

/**
 * 元素進入/離開動畫 composable
 * 處理元素的進入和離開動畫效果
 */
export function useElementTransition() {
  const { shouldReduceMotion, createAnimation } = useAnimation()

  // 元素進入動畫
  const animateElementEnter = async (
    element: Element,
    type: 'fade' | 'slide' | 'scale' = 'fade',
    options: {
      duration?: number
      delay?: number
      direction?: 'up' | 'down' | 'left' | 'right'
    } = {}
  ) => {
    if (shouldReduceMotion.value) {
      return Promise.resolve()
    }

    const {
      duration = 300,
      delay = 0,
      direction = 'up'
    } = options

    let keyframes: Keyframe[]

    switch (type) {
      case 'fade':
        keyframes = [
          { opacity: 0 },
          { opacity: 1 }
        ]
        break
      case 'slide':
        const transforms = {
          up: ['translateY(20px)', 'translateY(0px)'],
          down: ['translateY(-20px)', 'translateY(0px)'],
          left: ['translateX(20px)', 'translateX(0px)'],
          right: ['translateX(-20px)', 'translateX(0px)']
        }
        keyframes = [
          { transform: transforms[direction][0], opacity: 0 },
          { transform: transforms[direction][1], opacity: 1 }
        ]
        break
      case 'scale':
        keyframes = [
          { transform: 'scale(0.95)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1 }
        ]
        break
    }

    const animation = createAnimation(element, keyframes, {
      duration,
      delay,
      easing: 'ease-out',
      fill: 'forwards'
    })

    if (animation) {
      return new Promise<void>((resolve) => {
        animation.addEventListener('finish', () => resolve())
        animation.addEventListener('cancel', () => resolve())
      })
    }

    return Promise.resolve()
  }

  // 元素離開動畫
  const animateElementLeave = async (
    element: Element,
    type: 'fade' | 'slide' | 'scale' = 'fade',
    options: {
      duration?: number
      delay?: number
      direction?: 'up' | 'down' | 'left' | 'right'
    } = {}
  ) => {
    if (shouldReduceMotion.value) {
      return Promise.resolve()
    }

    const {
      duration = 250,
      delay = 0,
      direction = 'up'
    } = options

    let keyframes: Keyframe[]

    switch (type) {
      case 'fade':
        keyframes = [
          { opacity: 1 },
          { opacity: 0 }
        ]
        break
      case 'slide':
        const transforms = {
          up: ['translateY(0px)', 'translateY(-20px)'],
          down: ['translateY(0px)', 'translateY(20px)'],
          left: ['translateX(0px)', 'translateX(-20px)'],
          right: ['translateX(0px)', 'translateX(20px)']
        }
        keyframes = [
          { transform: transforms[direction][0], opacity: 1 },
          { transform: transforms[direction][1], opacity: 0 }
        ]
        break
      case 'scale':
        keyframes = [
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(0.95)', opacity: 0 }
        ]
        break
    }

    const animation = createAnimation(element, keyframes, {
      duration,
      delay,
      easing: 'ease-in',
      fill: 'forwards'
    })

    if (animation) {
      return new Promise<void>((resolve) => {
        animation.addEventListener('finish', () => resolve())
        animation.addEventListener('cancel', () => resolve())
      })
    }

    return Promise.resolve()
  }

  // 批量元素動畫
  const animateElementsBatch = async (
    elements: Element[],
    type: 'enter' | 'leave',
    animationType: 'fade' | 'slide' | 'scale' = 'fade',
    options: {
      stagger?: number
      duration?: number
      direction?: 'up' | 'down' | 'left' | 'right'
    } = {}
  ) => {
    const { stagger = 50 } = options

    const promises = elements.map((element, index) => {
      const delay = index * stagger
      const animationOptions = { ...options, delay }

      return type === 'enter'
        ? animateElementEnter(element, animationType, animationOptions)
        : animateElementLeave(element, animationType, animationOptions)
    })

    return Promise.all(promises)
  }

  return {
    animateElementEnter,
    animateElementLeave,
    animateElementsBatch
  }
}
