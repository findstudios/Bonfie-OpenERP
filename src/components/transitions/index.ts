// 過渡組件導出
export { default as PageTransition } from './PageTransition.vue'
export { default as RouterTransition } from './RouterTransition.vue'
export { default as ElementTransition } from './ElementTransition.vue'
export { default as SkeletonLoader } from './SkeletonLoader.vue'
export { default as LoadingTransition } from './LoadingTransition.vue'

// 過渡相關 composables 導出
export {
  usePageTransition,
  useLoadingAnimation,
  useElementTransition,
  PAGE_TRANSITIONS,
  type PageTransitionConfig,
  type TransitionDirection
} from '@/composables/usePageTransition'
