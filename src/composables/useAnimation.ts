import { computed, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'

// 動畫配置類型定義
export interface AnimationConfig {
  duration?: number
  delay?: number
  easing?: string
  fill?: 'none' | 'forwards' | 'backwards' | 'both'
  iterations?: number | 'infinite'
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
}

export interface KeyframeAnimation {
  keyframes: Keyframe[]
  options: KeyframeAnimationOptions
}

export interface MicroAnimationConfig extends AnimationConfig {
  scale?: number
  translateX?: number
  translateY?: number
  opacity?: number
  rotate?: number
  transformOrigin?: string
}

// 預定義的動畫配置
export const ANIMATION_PRESETS = {
  // 按鈕動畫
  button: {
    hover: {
      duration: 150,
      easing: 'ease-out',
      fill: 'forwards' as const,
      keyframes: [
        { transform: 'scale(1)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
        { transform: 'scale(1.02)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
      ]
    },
    press: {
      duration: 100,
      easing: 'ease-in',
      fill: 'forwards' as const,
      keyframes: [
        { transform: 'scale(1.02)' },
        { transform: 'scale(0.98)' }
      ]
    },
    loading: {
      duration: 1000,
      easing: 'ease-in-out',
      iterations: 'infinite' as const,
      keyframes: [
        { opacity: 1 },
        { opacity: 0.7 },
        { opacity: 1 }
      ]
    }
  },

  // 卡片動畫
  card: {
    hover: {
      duration: 200,
      easing: 'ease-out',
      fill: 'forwards' as const,
      keyframes: [
        {
          transform: 'translateY(0px)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        },
        {
          transform: 'translateY(-2px)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }
      ]
    },
    tap: {
      duration: 100,
      easing: 'ease-in-out',
      fill: 'forwards' as const,
      keyframes: [
        { transform: 'scale(1)' },
        { transform: 'scale(0.99)' }
      ]
    }
  },

  // 表單動畫
  input: {
    focus: {
      duration: 200,
      easing: 'ease-out',
      fill: 'forwards' as const,
      keyframes: [
        {
          borderColor: '#e5e7eb',
          boxShadow: '0 0 0 0px rgba(59, 130, 246, 0)'
        },
        {
          borderColor: '#3b82f6',
          boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
        }
      ]
    },
    error: {
      duration: 400,
      easing: 'ease-in-out',
      fill: 'forwards' as const,
      keyframes: [
        { transform: 'translateX(0px)' },
        { transform: 'translateX(-5px)' },
        { transform: 'translateX(5px)' },
        { transform: 'translateX(-5px)' },
        { transform: 'translateX(5px)' },
        { transform: 'translateX(0px)' }
      ]
    },
    success: {
      duration: 300,
      easing: 'ease-out',
      fill: 'forwards' as const,
      keyframes: [
        {
          borderColor: '#e5e7eb',
          boxShadow: '0 0 0 0px rgba(16, 185, 129, 0)'
        },
        {
          borderColor: '#10b981',
          boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)'
        }
      ]
    }
  },

  // 頁面過渡動畫
  page: {
    enter: {
      duration: 300,
      easing: 'ease-out',
      fill: 'forwards' as const,
      keyframes: [
        { opacity: 0, transform: 'translateY(20px)' },
        { opacity: 1, transform: 'translateY(0px)' }
      ]
    },
    leave: {
      duration: 200,
      easing: 'ease-in',
      fill: 'forwards' as const,
      keyframes: [
        { opacity: 1, transform: 'translateY(0px)' },
        { opacity: 0, transform: 'translateY(-20px)' }
      ]
    }
  },

  // 模態框動畫
  modal: {
    enter: {
      duration: 250,
      easing: 'ease-out',
      fill: 'forwards' as const,
      keyframes: [
        {
          opacity: 0,
          transform: 'scale(0.95) translateY(-10px)'
        },
        {
          opacity: 1,
          transform: 'scale(1) translateY(0px)'
        }
      ]
    },
    leave: {
      duration: 200,
      easing: 'ease-in',
      fill: 'forwards' as const,
      keyframes: [
        {
          opacity: 1,
          transform: 'scale(1) translateY(0px)'
        },
        {
          opacity: 0,
          transform: 'scale(0.95) translateY(-10px)'
        }
      ]
    }
  },

  // 載入動畫
  loading: {
    spin: {
      duration: 1000,
      easing: 'linear',
      iterations: 'infinite' as const,
      keyframes: [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(360deg)' }
      ]
    },
    pulse: {
      duration: 1500,
      easing: 'ease-in-out',
      iterations: 'infinite' as const,
      keyframes: [
        { opacity: 1 },
        { opacity: 0.4 },
        { opacity: 1 }
      ]
    },
    bounce: {
      duration: 1000,
      easing: 'ease-in-out',
      iterations: 'infinite' as const,
      keyframes: [
        { transform: 'translateY(0px)' },
        { transform: 'translateY(-10px)' },
        { transform: 'translateY(0px)' }
      ]
    }
  },

  // 通知動畫
  notification: {
    slideIn: {
      duration: 300,
      easing: 'ease-out',
      fill: 'forwards' as const,
      keyframes: [
        { transform: 'translateX(100%)', opacity: 0 },
        { transform: 'translateX(0%)', opacity: 1 }
      ]
    },
    slideOut: {
      duration: 250,
      easing: 'ease-in',
      fill: 'forwards' as const,
      keyframes: [
        { transform: 'translateX(0%)', opacity: 1 },
        { transform: 'translateX(100%)', opacity: 0 }
      ]
    }
  }
} as const

/**
 * 動畫工具 composable
 * 提供統一的動畫API和微交互動畫
 */
export function useAnimation() {
  const activeAnimations = ref<Map<string, Animation>>(new Map())

  // 檢查是否應該禁用動畫
  const shouldReduceMotion = computed(() => {
    if (typeof window === 'undefined') return false
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    return mediaQuery?.matches || false
  })

  // 創建動畫
  const createAnimation = (
    element: Element,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions = {}
  ): Animation | null => {
    if (!element || shouldReduceMotion.value) {
      return null
    }

    try {
      const animation = element.animate(keyframes, {
        duration: 300,
        easing: 'ease-out',
        fill: 'forwards',
        ...options
      })

      return animation
    } catch (error) {
      console.warn('Failed to create animation:', error)
      return null
    }
  }

  // 播放預設動畫
  const playPresetAnimation = (
    element: Element,
    preset: keyof typeof ANIMATION_PRESETS,
    variant: string,
    customOptions?: Partial<KeyframeAnimationOptions>
  ): Animation | null => {
    const presetConfig = ANIMATION_PRESETS[preset]?.[variant as keyof typeof presetConfig]

    if (!presetConfig) {
      console.warn(`Animation preset not found: ${preset}.${variant}`)
      return null
    }

    const options: KeyframeAnimationOptions = {
      duration: presetConfig.duration || 300,
      easing: presetConfig.easing || 'ease-out',
      fill: presetConfig.fill || 'forwards',
      iterations: presetConfig.iterations || 1,
      direction: presetConfig.direction || 'normal',
      delay: presetConfig.delay || 0,
      ...customOptions
    }

    return createAnimation(element, presetConfig.keyframes, options)
  }

  // 停止動畫
  const stopAnimation = (animationId: string) => {
    const animation = activeAnimations.value.get(animationId)
    if (animation) {
      animation.cancel()
      activeAnimations.value.delete(animationId)
    }
  }

  // 停止所有動畫
  const stopAllAnimations = () => {
    activeAnimations.value.forEach(animation => animation.cancel())
    activeAnimations.value.clear()
  }

  // 等待動畫完成
  const waitForAnimation = (animation: Animation): Promise<void> => {
    return new Promise((resolve, reject) => {
      animation.addEventListener('finish', () => resolve())
      animation.addEventListener('cancel', () => reject(new Error('Animation cancelled')))
    })
  }

  // 創建微交互動畫
  const createMicroAnimation = (
    element: Element,
    config: MicroAnimationConfig
  ): Animation | null => {
    if (!element || shouldReduceMotion.value) {
      return null
    }

    const keyframes: Keyframe[] = [
      {
        transform: 'scale(1) translateX(0px) translateY(0px) rotate(0deg)',
        opacity: 1
      },
      {
        transform: `scale(${config.scale || 1}) translateX(${config.translateX || 0}px) translateY(${config.translateY || 0}px) rotate(${config.rotate || 0}deg)`,
        opacity: config.opacity !== undefined ? config.opacity : 1
      }
    ]

    const options: KeyframeAnimationOptions = {
      duration: config.duration || 200,
      easing: config.easing || 'ease-out',
      fill: config.fill || 'forwards',
      iterations: config.iterations || 1,
      direction: config.direction || 'normal',
      delay: config.delay || 0
    }

    if (config.transformOrigin) {
      (element as HTMLElement).style.transformOrigin = config.transformOrigin
    }

    return createAnimation(element, keyframes, options)
  }

  // 清理函數
  onUnmounted(() => {
    stopAllAnimations()
  })

  return {
    // 狀態
    shouldReduceMotion,
    activeAnimations,

    // 核心方法
    createAnimation,
    playPresetAnimation,
    createMicroAnimation,
    stopAnimation,
    stopAllAnimations,
    waitForAnimation,

    // 預設動畫
    presets: ANIMATION_PRESETS
  }
}

/**
 * 元素動畫 composable
 * 為特定元素提供動畫控制
 */
export function useElementAnimation(elementRef: Ref<Element | null>) {
  const { createAnimation, playPresetAnimation, createMicroAnimation, shouldReduceMotion } = useAnimation()

  // 淡入動畫
  const fadeIn = (duration = 300) => {
    if (!elementRef.value || shouldReduceMotion.value) return null

    return createAnimation(
      elementRef.value,
      [
        { opacity: 0 },
        { opacity: 1 }
      ],
      { duration, easing: 'ease-out', fill: 'forwards' }
    )
  }

  // 淡出動畫
  const fadeOut = (duration = 300) => {
    if (!elementRef.value || shouldReduceMotion.value) return null

    return createAnimation(
      elementRef.value,
      [
        { opacity: 1 },
        { opacity: 0 }
      ],
      { duration, easing: 'ease-in', fill: 'forwards' }
    )
  }

  // 滑入動畫
  const slideIn = (direction: 'up' | 'down' | 'left' | 'right' = 'up', duration = 300) => {
    if (!elementRef.value || shouldReduceMotion.value) return null

    const transforms = {
      up: ['translateY(20px)', 'translateY(0px)'],
      down: ['translateY(-20px)', 'translateY(0px)'],
      left: ['translateX(20px)', 'translateX(0px)'],
      right: ['translateX(-20px)', 'translateX(0px)']
    }

    return createAnimation(
      elementRef.value,
      [
        { transform: transforms[direction][0], opacity: 0 },
        { transform: transforms[direction][1], opacity: 1 }
      ],
      { duration, easing: 'ease-out', fill: 'forwards' }
    )
  }

  // 縮放動畫
  const scale = (from = 0.95, to = 1, duration = 300) => {
    if (!elementRef.value || shouldReduceMotion.value) return null

    return createAnimation(
      elementRef.value,
      [
        { transform: `scale(${from})`, opacity: 0 },
        { transform: `scale(${to})`, opacity: 1 }
      ],
      { duration, easing: 'ease-out', fill: 'forwards' }
    )
  }

  // 搖擺動畫（用於錯誤提示）
  const shake = (intensity = 5, duration = 400) => {
    if (!elementRef.value || shouldReduceMotion.value) return null

    return createAnimation(
      elementRef.value,
      [
        { transform: 'translateX(0px)' },
        { transform: `translateX(-${intensity}px)` },
        { transform: `translateX(${intensity}px)` },
        { transform: `translateX(-${intensity}px)` },
        { transform: `translateX(${intensity}px)` },
        { transform: 'translateX(0px)' }
      ],
      { duration, easing: 'ease-in-out' }
    )
  }

  // 彈跳動畫
  const bounce = (height = 10, duration = 600) => {
    if (!elementRef.value || shouldReduceMotion.value) return null

    return createAnimation(
      elementRef.value,
      [
        { transform: 'translateY(0px)' },
        { transform: `translateY(-${height}px)` },
        { transform: 'translateY(0px)' }
      ],
      { duration, easing: 'ease-in-out' }
    )
  }

  // 脈衝動畫
  const pulse = (scale = 1.05, duration = 1000) => {
    if (!elementRef.value || shouldReduceMotion.value) return null

    return createAnimation(
      elementRef.value,
      [
        { transform: 'scale(1)' },
        { transform: `scale(${scale})` },
        { transform: 'scale(1)' }
      ],
      { duration, easing: 'ease-in-out', iterations: Infinity }
    )
  }

  return {
    fadeIn,
    fadeOut,
    slideIn,
    scale,
    shake,
    bounce,
    pulse
  }
}

/**
 * 交互動畫 composable
 * 處理用戶交互觸發的動畫
 */
export function useInteractionAnimation() {
  const { playPresetAnimation, createMicroAnimation, shouldReduceMotion } = useAnimation()

  // 按鈕懸停動畫
  const animateButtonHover = (element: Element, enter = true) => {
    if (shouldReduceMotion.value) return null

    return playPresetAnimation(
      element,
      'button',
      enter ? 'hover' : 'press'
    )
  }

  // 卡片懸停動畫
  const animateCardHover = (element: Element, enter = true) => {
    if (shouldReduceMotion.value) return null

    if (enter) {
      return playPresetAnimation(element, 'card', 'hover')
    } else {
      // 恢復原狀
      return createMicroAnimation(element, {
        duration: 200,
        easing: 'ease-out'
      })
    }
  }

  // 表單焦點動畫
  const animateInputFocus = (element: Element, state: 'focus' | 'blur' | 'error' | 'success') => {
    if (shouldReduceMotion.value) return null

    return playPresetAnimation(element, 'input', state)
  }

  // 點擊反饋動畫
  const animateClickFeedback = (element: Element) => {
    if (shouldReduceMotion.value) return null

    return createMicroAnimation(element, {
      scale: 0.95,
      duration: 100,
      easing: 'ease-in-out'
    })
  }

  // 載入動畫
  const animateLoading = (element: Element, type: 'spin' | 'pulse' | 'bounce' = 'pulse') => {
    if (shouldReduceMotion.value) return null

    return playPresetAnimation(element, 'loading', type)
  }

  return {
    animateButtonHover,
    animateCardHover,
    animateInputFocus,
    animateClickFeedback,
    animateLoading
  }
}
