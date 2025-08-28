<template>
  <Transition
    :name="transitionName"
    :mode="mode"
    :appear="appear"
    :duration="duration"
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @after-enter="onAfterEnter"
    @before-leave="onBeforeLeave"
    @leave="onLeave"
    @after-leave="onAfterLeave"
  >
    <slot />
  </Transition>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { useElementTransition } from '@/composables/usePageTransition'

// 過渡類型
type TransitionType = 'fade' | 'slide' | 'scale' | 'bounce' | 'flip' | 'zoom'
type SlideDirection = 'up' | 'down' | 'left' | 'right'
type TransitionMode = 'out-in' | 'in-out' | 'default'

// Props
const props = defineProps({
  // 過渡類型
  type: {
    type: String as PropType<TransitionType>,
    default: 'fade'
  },

  // 滑動方向
  direction: {
    type: String as PropType<SlideDirection>,
    default: 'up'
  },

  // 過渡模式
  mode: {
    type: String as PropType<TransitionMode>,
    default: 'default'
  },

  // 持續時間
  duration: {
    type: [Number, Object],
    default: 300
  },

  // 延遲時間
  delay: {
    type: Number,
    default: 0
  },

  // 是否在初始渲染時應用過渡
  appear: {
    type: Boolean,
    default: false
  },

  // 是否禁用過渡
  disabled: {
    type: Boolean,
    default: false
  },

  // 交錯動畫延遲（用於列表項）
  stagger: {
    type: Number,
    default: 0
  },

  // 交錯索引
  staggerIndex: {
    type: Number,
    default: 0
  }
})

// Emits
const emit = defineEmits<{
  beforeEnter: [el: Element]
  enter: [el: Element, done: () => void]
  afterEnter: [el: Element]
  beforeLeave: [el: Element]
  leave: [el: Element, done: () => void]
  afterLeave: [el: Element]
}>()

// Composables
const { animateElementEnter, animateElementLeave } = useElementTransition()

// 計算過渡名稱
const transitionName = computed(() => {
  if (props.disabled) {
    return 'none'
  }

  return `element-${props.type}${props.type === 'slide' ? `-${props.direction}` : ''}`
})

// 計算實際延遲時間
const actualDelay = computed(() => {
  return props.delay + (props.stagger * props.staggerIndex)
})

// 過渡事件處理
const onBeforeEnter = (el: Element) => {
  // 設置初始狀態
  if (props.disabled) return

  const element = el as HTMLElement

  switch (props.type) {
    case 'fade':
      element.style.opacity = '0'
      break
    case 'slide':
      element.style.opacity = '0'
      switch (props.direction) {
        case 'up':
          element.style.transform = 'translateY(20px)'
          break
        case 'down':
          element.style.transform = 'translateY(-20px)'
          break
        case 'left':
          element.style.transform = 'translateX(20px)'
          break
        case 'right':
          element.style.transform = 'translateX(-20px)'
          break
      }
      break
    case 'scale':
      element.style.opacity = '0'
      element.style.transform = 'scale(0.9)'
      break
    case 'bounce':
      element.style.opacity = '0'
      element.style.transform = 'scale(0.3)'
      break
    case 'flip':
      element.style.opacity = '0'
      element.style.transform = 'rotateY(90deg)'
      break
    case 'zoom':
      element.style.opacity = '0'
      element.style.transform = 'scale(0)'
      break
  }

  emit('beforeEnter', el)
}

const onEnter = async (el: Element, done: () => void) => {
  if (props.disabled) {
    done()
    return
  }

  emit('enter', el, done)

  // 使用 Web Animations API 進行動畫
  try {
    await animateElementEnter(el, props.type === 'slide' ? 'slide' : props.type, {
      duration: typeof props.duration === 'number' ? props.duration : 300,
      delay: actualDelay.value,
      direction: props.direction
    })
    done()
  } catch (error) {
    console.warn('Element enter animation failed:', error)
    done()
  }
}

const onAfterEnter = (el: Element) => {
  // 清理樣式
  const element = el as HTMLElement
  element.style.opacity = ''
  element.style.transform = ''

  emit('afterEnter', el)
}

const onBeforeLeave = (el: Element) => {
  emit('beforeLeave', el)
}

const onLeave = async (el: Element, done: () => void) => {
  if (props.disabled) {
    done()
    return
  }

  emit('leave', el, done)

  // 使用 Web Animations API 進行動畫
  try {
    await animateElementLeave(el, props.type === 'slide' ? 'slide' : props.type, {
      duration: typeof props.duration === 'number' ? props.duration * 0.8 : 240,
      delay: 0,
      direction: props.direction
    })
    done()
  } catch (error) {
    console.warn('Element leave animation failed:', error)
    done()
  }
}

const onAfterLeave = (el: Element) => {
  emit('afterLeave', el)
}
</script>

<style scoped>
/* 淡入淡出 */
.element-fade-enter-active,
.element-fade-leave-active {
  transition: opacity 0.3s ease;
}

.element-fade-enter-from,
.element-fade-leave-to {
  opacity: 0;
}

/* 滑動效果 */
.element-slide-up-enter-active,
.element-slide-up-leave-active {
  transition: all 0.3s ease;
}

.element-slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.element-slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.element-slide-down-enter-active,
.element-slide-down-leave-active {
  transition: all 0.3s ease;
}

.element-slide-down-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.element-slide-down-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.element-slide-left-enter-active,
.element-slide-left-leave-active {
  transition: all 0.3s ease;
}

.element-slide-left-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.element-slide-left-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.element-slide-right-enter-active,
.element-slide-right-leave-active {
  transition: all 0.3s ease;
}

.element-slide-right-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.element-slide-right-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* 縮放效果 */
.element-scale-enter-active,
.element-scale-leave-active {
  transition: all 0.3s ease;
}

.element-scale-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.element-scale-leave-to {
  opacity: 0;
  transform: scale(1.1);
}

/* 彈跳效果 */
.element-bounce-enter-active {
  animation: element-bounce-in 0.5s ease;
}

.element-bounce-leave-active {
  animation: element-bounce-out 0.3s ease;
}

@keyframes element-bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes element-bounce-out {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.3);
  }
}

/* 翻轉效果 */
.element-flip-enter-active,
.element-flip-leave-active {
  transition: all 0.4s ease;
  transform-style: preserve-3d;
}

.element-flip-enter-from {
  opacity: 0;
  transform: rotateY(90deg);
}

.element-flip-leave-to {
  opacity: 0;
  transform: rotateY(-90deg);
}

/* 縮放效果 */
.element-zoom-enter-active {
  animation: element-zoom-in 0.3s ease;
}

.element-zoom-leave-active {
  animation: element-zoom-out 0.2s ease;
}

@keyframes element-zoom-in {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes element-zoom-out {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0);
  }
}

/* 無過渡效果 */
.none-enter-active,
.none-leave-active {
  transition: none;
}

/* 減少動畫偏好支援 */
@media (prefers-reduced-motion: reduce) {
  .element-fade-enter-active,
  .element-fade-leave-active,
  .element-slide-up-enter-active,
  .element-slide-up-leave-active,
  .element-slide-down-enter-active,
  .element-slide-down-leave-active,
  .element-slide-left-enter-active,
  .element-slide-left-leave-active,
  .element-slide-right-enter-active,
  .element-slide-right-leave-active,
  .element-scale-enter-active,
  .element-scale-leave-active,
  .element-flip-enter-active,
  .element-flip-leave-active {
    transition: none;
  }

  .element-bounce-enter-active,
  .element-bounce-leave-active,
  .element-zoom-enter-active,
  .element-zoom-leave-active {
    animation: none;
  }
}
</style>
