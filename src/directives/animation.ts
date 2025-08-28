import type { Directive, DirectiveBinding } from 'vue'
import { animationUtils, globalAnimationManager } from '@/utils/animation'
import { ANIMATION_PRESETS } from '@/composables/useAnimation'

// 動畫指令選項類型
interface AnimationDirectiveOptions {
  preset?: keyof typeof ANIMATION_PRESETS
  variant?: string
  trigger?: 'hover' | 'click' | 'focus' | 'visible' | 'mount'
  duration?: number
  delay?: number
  easing?: string
  once?: boolean
  threshold?: number
}

// 元素動畫狀態追蹤
const elementAnimationState = new WeakMap<Element, {
  animations: Animation[]
  options: AnimationDirectiveOptions
  observer?: IntersectionObserver
  hasTriggered?: boolean
}>()

// 創建動畫
function createElementAnimation(
  element: Element,
  options: AnimationDirectiveOptions
): Animation | null {
  const { preset = 'page', variant = 'enter', duration, delay, easing } = options

  const presetConfig = ANIMATION_PRESETS[preset]?.[variant as keyof typeof presetConfig]
  if (!presetConfig) {
    console.warn(`Animation preset not found: ${preset}.${variant}`)
    return null
  }

  const animationOptions: KeyframeAnimationOptions = {
    duration: duration || presetConfig.duration || 300,
    delay: delay || presetConfig.delay || 0,
    easing: easing || presetConfig.easing || 'ease-out',
    fill: presetConfig.fill || 'forwards',
    iterations: presetConfig.iterations || 1,
    direction: presetConfig.direction || 'normal'
  }

  const optimizedOptions = animationUtils.getOptimizedOptions(animationOptions)
  return animationUtils.createPerformantAnimation(element, presetConfig.keyframes, optimizedOptions)
}

// 處理可見性觸發
function setupVisibilityTrigger(element: Element, options: AnimationDirectiveOptions) {
  const state = elementAnimationState.get(element)
  if (!state) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && (!options.once || !state.hasTriggered)) {
          const animation = createElementAnimation(element, options)
          if (animation) {
            state.animations.push(animation)
            globalAnimationManager.register(animation)
            state.hasTriggered = true
          }

          if (options.once) {
            observer.disconnect()
          }
        }
      })
    },
    {
      threshold: options.threshold || 0.1,
      rootMargin: '50px'
    }
  )

  observer.observe(element)
  state.observer = observer
}

// 處理事件觸發
function setupEventTrigger(element: Element, options: AnimationDirectiveOptions) {
  const state = elementAnimationState.get(element)
  if (!state) return

  const triggerAnimation = () => {
    if (options.once && state.hasTriggered) return

    const animation = createElementAnimation(element, options)
    if (animation) {
      state.animations.push(animation)
      globalAnimationManager.register(animation)
      state.hasTriggered = true
    }
  }

  switch (options.trigger) {
    case 'hover':
      element.addEventListener('mouseenter', triggerAnimation)
      break
    case 'click':
      element.addEventListener('click', triggerAnimation)
      break
    case 'focus':
      element.addEventListener('focus', triggerAnimation)
      break
  }
}

/**
 * v-animate 指令
 * 用法：
 * v-animate="{ preset: 'page', variant: 'enter', trigger: 'visible' }"
 * v-animate:fade-in="{ duration: 500, delay: 100 }"
 */
export const vAnimate: Directive<Element, AnimationDirectiveOptions | string> = {
  mounted(el: Element, binding: DirectiveBinding<AnimationDirectiveOptions | string>) {
    let options: AnimationDirectiveOptions

    // 處理字符串參數（簡化語法）
    if (typeof binding.value === 'string') {
      const [preset, variant] = binding.value.split('.')
      options = {
        preset: preset as keyof typeof ANIMATION_PRESETS,
        variant: variant || 'enter',
        trigger: 'mount'
      }
    } else {
      options = binding.value || {}
    }

    // 處理修飾符
    if (binding.arg) {
      const [preset, variant] = binding.arg.split('-')
      options.preset = preset as keyof typeof ANIMATION_PRESETS
      options.variant = variant || 'enter'
    }

    // 初始化元素狀態
    elementAnimationState.set(el, {
      animations: [],
      options,
      hasTriggered: false
    })

    // 根據觸發方式設置動畫
    switch (options.trigger) {
      case 'mount':
        // 立即觸發動畫
        const animation = createElementAnimation(el, options)
        if (animation) {
          const state = elementAnimationState.get(el)!
          state.animations.push(animation)
          globalAnimationManager.register(animation)
        }
        break
      case 'visible':
        setupVisibilityTrigger(el, options)
        break
      case 'hover':
      case 'click':
      case 'focus':
        setupEventTrigger(el, options)
        break
      default:
        // 默認為可見性觸發
        setupVisibilityTrigger(el, options)
    }
  },

  updated(el: Element, binding: DirectiveBinding<AnimationDirectiveOptions | string>) {
    // 如果選項改變，重新設置動畫
    const state = elementAnimationState.get(el)
    if (state && JSON.stringify(state.options) !== JSON.stringify(binding.value)) {
      // 清理舊的動畫和觀察器
      state.animations.forEach(animation => animation.cancel())
      state.observer?.disconnect()

      // 重新掛載
      vAnimate.unmounted!(el, binding, null as any, null as any)
      vAnimate.mounted!(el, binding, null as any, null as any)
    }
  },

  unmounted(el: Element) {
    const state = elementAnimationState.get(el)
    if (state) {
      // 清理動畫
      state.animations.forEach(animation => {
        try {
          animation.cancel()
        } catch (error) {
          console.warn('Failed to cancel animation:', error)
        }
      })

      // 清理觀察器
      state.observer?.disconnect()

      // 清理狀態
      elementAnimationState.delete(el)
    }
  }
}

/**
 * v-micro-interaction 指令
 * 為元素添加微交互效果
 * 用法：
 * v-micro-interaction="'button'"
 * v-micro-interaction="{ type: 'card', hover: true, click: true }"
 */
interface MicroInteractionOptions {
  type?: 'button' | 'card' | 'input'
  hover?: boolean
  click?: boolean
  focus?: boolean
  scale?: number
  duration?: number
}

export const vMicroInteraction: Directive<Element, MicroInteractionOptions | string> = {
  mounted(el: Element, binding: DirectiveBinding<MicroInteractionOptions | string>) {
    let options: MicroInteractionOptions

    if (typeof binding.value === 'string') {
      options = { type: binding.value as 'button' | 'card' | 'input' }
    } else {
      options = binding.value || {}
    }

    const {
      type = 'button',
      hover = true,
      click = true,
      focus = true,
      scale = type === 'button' ? 1.02 : 0.99,
      duration = 150
    } = options

    // 添加基礎CSS類
    el.classList.add('transition-micro')

    // 懸停效果
    if (hover) {
      const handleMouseEnter = () => {
        if (animationUtils.shouldReduceMotion()) return

        const animation = animationUtils.createPerformantAnimation(
          el,
          [
            { transform: 'scale(1)' },
            { transform: `scale(${scale})` }
          ],
          { duration, easing: 'ease-out', fill: 'forwards' }
        )

        if (animation) {
          globalAnimationManager.register(animation)
        }
      }

      const handleMouseLeave = () => {
        if (animationUtils.shouldReduceMotion()) return

        const animation = animationUtils.createPerformantAnimation(
          el,
          [
            { transform: `scale(${scale})` },
            { transform: 'scale(1)' }
          ],
          { duration, easing: 'ease-out', fill: 'forwards' }
        )

        if (animation) {
          globalAnimationManager.register(animation)
        }
      }

      el.addEventListener('mouseenter', handleMouseEnter)
      el.addEventListener('mouseleave', handleMouseLeave)
    }

    // 點擊效果
    if (click) {
      const handleMouseDown = () => {
        if (animationUtils.shouldReduceMotion()) return

        const clickScale = type === 'button' ? 0.98 : 0.95
        const animation = animationUtils.createPerformantAnimation(
          el,
          [
            { transform: `scale(${scale})` },
            { transform: `scale(${clickScale})` }
          ],
          { duration: 100, easing: 'ease-in', fill: 'forwards' }
        )

        if (animation) {
          globalAnimationManager.register(animation)
        }
      }

      const handleMouseUp = () => {
        if (animationUtils.shouldReduceMotion()) return

        const animation = animationUtils.createPerformantAnimation(
          el,
          [
            { transform: `scale(${type === 'button' ? 0.98 : 0.95})` },
            { transform: `scale(${scale})` }
          ],
          { duration: 100, easing: 'ease-out', fill: 'forwards' }
        )

        if (animation) {
          globalAnimationManager.register(animation)
        }
      }

      el.addEventListener('mousedown', handleMouseDown)
      el.addEventListener('mouseup', handleMouseUp)
      el.addEventListener('mouseleave', handleMouseUp) // 處理拖拽離開的情況
    }

    // 焦點效果
    if (focus && type !== 'card') {
      el.classList.add('focus-ring')
    }
  }
}

/**
 * v-loading-animation 指令
 * 為載入狀態添加動畫
 * 用法：
 * v-loading-animation="isLoading"
 * v-loading-animation="{ loading: isLoading, type: 'pulse' }"
 */
interface LoadingAnimationOptions {
  loading: boolean
  type?: 'pulse' | 'spin' | 'skeleton'
  overlay?: boolean
}

export const vLoadingAnimation: Directive<Element, LoadingAnimationOptions | boolean> = {
  mounted(el: Element, binding: DirectiveBinding<LoadingAnimationOptions | boolean>) {
    const options = typeof binding.value === 'boolean'
      ? { loading: binding.value }
      : binding.value

    if (options.loading) {
      applyLoadingAnimation(el, options)
    }
  },

  updated(el: Element, binding: DirectiveBinding<LoadingAnimationOptions | boolean>) {
    const options = typeof binding.value === 'boolean'
      ? { loading: binding.value }
      : binding.value

    if (options.loading) {
      applyLoadingAnimation(el, options)
    } else {
      removeLoadingAnimation(el)
    }
  },

  unmounted(el: Element) {
    removeLoadingAnimation(el)
  }
}

function applyLoadingAnimation(el: Element, options: LoadingAnimationOptions) {
  const { type = 'pulse', overlay = false } = options

  // 添加載入狀態類
  el.classList.add('loading-state')

  if (overlay) {
    el.classList.add('loading-overlay')
  }

  // 根據類型添加動畫
  switch (type) {
    case 'pulse':
      el.classList.add('animate-pulse-soft')
      break
    case 'spin':
      el.classList.add('animate-spin-slow')
      break
    case 'skeleton':
      el.classList.add('skeleton-loading')
      break
  }
}

function removeLoadingAnimation(el: Element) {
  el.classList.remove(
    'loading-state',
    'loading-overlay',
    'animate-pulse-soft',
    'animate-spin-slow',
    'skeleton-loading'
  )
}

// 導出所有指令
export const animationDirectives = {
  animate: vAnimate,
  microInteraction: vMicroInteraction,
  loadingAnimation: vLoadingAnimation
}
