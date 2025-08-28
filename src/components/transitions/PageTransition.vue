<template>
  <Transition
    :name="effectiveTransition.name"
    :mode="effectiveTransition.mode"
    :appear="effectiveTransition.appear"
    :duration="effectiveTransition.duration"
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
import { usePageTransition, PAGE_TRANSITIONS, type PageTransitionConfig } from '@/composables/usePageTransition'

// Props
const props = defineProps({
  name: {
    type: String as PropType<keyof typeof PAGE_TRANSITIONS>,
    default: 'fade'
  },
  mode: {
    type: String as PropType<'out-in' | 'in-out' | 'default'>,
    default: undefined
  },
  duration: {
    type: Number,
    default: undefined
  },
  appear: {
    type: Boolean,
    default: undefined
  },
  disabled: {
    type: Boolean,
    default: false
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
const { effectiveTransition: baseTransition } = usePageTransition()

// 計算有效的過渡配置
const effectiveTransition = computed((): PageTransitionConfig => {
  if (props.disabled) {
    return PAGE_TRANSITIONS.none
  }

  const baseConfig = PAGE_TRANSITIONS[props.name] || baseTransition.value

  return {
    ...baseConfig,
    mode: props.mode ?? baseConfig.mode,
    duration: props.duration ?? baseConfig.duration,
    appear: props.appear ?? baseConfig.appear
  }
})

// 過渡事件處理
const onBeforeEnter = (el: Element) => {
  const config = effectiveTransition.value
  if (config.enterFrom) {
    el.className = `${el.className} ${config.enterFrom}`.trim()
  }
  emit('beforeEnter', el)
}

const onEnter = (el: Element, done: () => void) => {
  const config = effectiveTransition.value

  // 強制重排以確保初始狀態被應用
  el.offsetHeight

  // 移除進入前的類，添加進入中和進入後的類
  if (config.enterFrom) {
    el.classList.remove(...config.enterFrom.split(' '))
  }
  if (config.enterActive) {
    el.classList.add(...config.enterActive.split(' '))
  }
  if (config.enterTo) {
    el.classList.add(...config.enterTo.split(' '))
  }

  emit('enter', el, done)

  // 如果沒有持續時間，立即完成
  if (!config.duration) {
    done()
    return
  }

  // 設置定時器來完成過渡
  setTimeout(() => {
    done()
  }, config.duration)
}

const onAfterEnter = (el: Element) => {
  const config = effectiveTransition.value

  // 清理過渡類
  if (config.enterActive) {
    el.classList.remove(...config.enterActive.split(' '))
  }

  emit('afterEnter', el)
}

const onBeforeLeave = (el: Element) => {
  const config = effectiveTransition.value
  if (config.leaveFrom) {
    el.classList.add(...config.leaveFrom.split(' '))
  }
  emit('beforeLeave', el)
}

const onLeave = (el: Element, done: () => void) => {
  const config = effectiveTransition.value

  // 強制重排
  el.offsetHeight

  // 移除離開前的類，添加離開中和離開後的類
  if (config.leaveFrom) {
    el.classList.remove(...config.leaveFrom.split(' '))
  }
  if (config.leaveActive) {
    el.classList.add(...config.leaveActive.split(' '))
  }
  if (config.leaveTo) {
    el.classList.add(...config.leaveTo.split(' '))
  }

  emit('leave', el, done)

  // 如果沒有持續時間，立即完成
  if (!config.duration) {
    done()
    return
  }

  // 設置定時器來完成過渡
  setTimeout(() => {
    done()
  }, config.duration)
}

const onAfterLeave = (el: Element) => {
  const config = effectiveTransition.value

  // 清理過渡類
  if (config.leaveActive) {
    el.classList.remove(...config.leaveActive.split(' '))
  }
  if (config.leaveTo) {
    el.classList.remove(...config.leaveTo.split(' '))
  }

  emit('afterLeave', el)
}
</script>

<style scoped>
/* 確保過渡樣式被正確應用 */
:deep(.fade-enter-active),
:deep(.fade-leave-active) {
  transition: opacity 0.3s ease;
}

:deep(.fade-enter-from),
:deep(.fade-leave-to) {
  opacity: 0;
}

:deep(.slide-enter-active),
:deep(.slide-leave-active) {
  transition: all 0.35s ease;
}

:deep(.slide-enter-from) {
  transform: translateX(100%);
  opacity: 0;
}

:deep(.slide-leave-to) {
  transform: translateX(-100%);
  opacity: 0;
}

:deep(.scale-enter-active),
:deep(.scale-leave-active) {
  transition: all 0.3s ease;
}

:deep(.scale-enter-from) {
  transform: scale(0.95);
  opacity: 0;
}

:deep(.scale-leave-to) {
  transform: scale(1.05);
  opacity: 0;
}

:deep(.slide-up-enter-active),
:deep(.slide-up-leave-active) {
  transition: all 0.3s ease;
}

:deep(.slide-up-enter-from) {
  transform: translateY(20px);
  opacity: 0;
}

:deep(.slide-up-leave-to) {
  transform: translateY(-20px);
  opacity: 0;
}

:deep(.slide-down-enter-active),
:deep(.slide-down-leave-active) {
  transition: all 0.3s ease;
}

:deep(.slide-down-enter-from) {
  transform: translateY(-20px);
  opacity: 0;
}

:deep(.slide-down-leave-to) {
  transform: translateY(20px);
  opacity: 0;
}
</style>
