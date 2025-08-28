<template>
  <RouterView #default="{ Component, route }">
    <PageTransition
      :name="currentTransition"
      :key="route.path"
      @before-enter="onBeforeEnter"
      @after-enter="onAfterEnter"
      @before-leave="onBeforeLeave"
      @after-leave="onAfterLeave"
    >
      <component :is="Component" />
    </PageTransition>
  </RouterView>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePageTransition, PAGE_TRANSITIONS } from '@/composables/usePageTransition'
import PageTransition from './PageTransition.vue'

// Props
const props = defineProps({
  // 默認過渡效果
  defaultTransition: {
    type: String,
    default: 'fade'
  },

  // 是否啟用方向檢測
  enableDirectionDetection: {
    type: Boolean,
    default: true
  },

  // 自定義過渡映射
  transitionMap: {
    type: Object,
    default: () => ({})
  },

  // 是否禁用過渡
  disabled: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits<{
  beforeEnter: [el: Element, route: any]
  afterEnter: [el: Element, route: any]
  beforeLeave: [el: Element, route: any]
  afterLeave: [el: Element, route: any]
  transitionStart: [from: any, to: any]
  transitionEnd: [from: any, to: any]
}>()

// Composables
const route = useRoute()
const router = useRouter()
const {
  transitionDirection,
  setTransition,
  beforeRouteTransition,
  afterRouteTransition,
  isTransitioning
} = usePageTransition()

// 當前過渡效果
const currentTransition = computed(() => {
  if (props.disabled) {
    return 'none'
  }

  // 檢查自定義過渡映射
  const customTransition = props.transitionMap[route.name as string]
  if (customTransition) {
    return customTransition
  }

  // 根據路由元信息設置過渡
  if (route.meta?.transition) {
    return route.meta.transition as string
  }

  // 根據方向檢測設置過渡
  if (props.enableDirectionDetection) {
    switch (transitionDirection.value) {
      case 'forward':
        return 'slideUp'
      case 'backward':
        return 'slideDown'
      default:
        return props.defaultTransition
    }
  }

  return props.defaultTransition
})

// 路由變化監聽
let previousRoute: any = null

watch(route, (to, from) => {
  if (from && from.name) {
    emit('transitionStart', from, to)
    beforeRouteTransition(to, from)
    previousRoute = from
  }
})

// 過渡事件處理
const onBeforeEnter = (el: Element) => {
  emit('beforeEnter', el, route)
}

const onAfterEnter = (el: Element) => {
  emit('afterEnter', el, route)
  if (previousRoute) {
    emit('transitionEnd', previousRoute, route)
    afterRouteTransition()
    previousRoute = null
  }
}

const onBeforeLeave = (el: Element) => {
  emit('beforeLeave', el, route)
}

const onAfterLeave = (el: Element) => {
  emit('afterLeave', el, route)
}

// 初始化
onMounted(() => {
  // 設置初始過渡效果
  if (PAGE_TRANSITIONS[currentTransition.value as keyof typeof PAGE_TRANSITIONS]) {
    setTransition(currentTransition.value as keyof typeof PAGE_TRANSITIONS)
  }
})
</script>

<style scoped>
/* 確保路由過渡容器正確顯示 */
:deep(.router-view-container) {
  position: relative;
  width: 100%;
  min-height: 100vh;
}

/* 路由過渡期間的樣式 */
:deep(.page-transition-container) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

/* 確保過渡期間的層級正確 */
:deep(.page-transition-enter-active) {
  z-index: 2;
}

:deep(.page-transition-leave-active) {
  z-index: 1;
}
</style>
