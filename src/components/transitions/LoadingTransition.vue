<template>
  <div class="loading-transition" :class="containerClass">
    <!-- 載入覆蓋層 -->
    <Transition
      name="loading-overlay"
      @enter="onOverlayEnter"
      @leave="onOverlayLeave"
    >
      <div
        v-if="isVisible"
        class="loading-overlay"
        :class="overlayClass"
        @click="handleOverlayClick"
      >
        <!-- 載入內容 -->
        <div class="loading-content" :class="contentClass">
          <!-- 載入指示器 -->
          <div class="loading-indicator" :class="indicatorClass">
            <!-- 旋轉載入器 -->
            <div
              v-if="type === 'spinner'"
              class="loading-spinner"
              :class="spinnerClass"
              :style="{ width: size, height: size }"
            >
              <svg
                class="animate-spin"
                :class="spinnerIconClass"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>

            <!-- 點載入器 -->
            <div
              v-else-if="type === 'dots'"
              class="loading-dots"
              :class="dotsClass"
            >
              <div
                v-for="dot in 3"
                :key="dot"
                class="loading-dot"
                :class="dotClass"
                :style="{ animationDelay: `${(dot - 1) * 0.2}s` }"
              />
            </div>

            <!-- 脈衝載入器 -->
            <div
              v-else-if="type === 'pulse'"
              class="loading-pulse"
              :class="pulseClass"
              :style="{ width: size, height: size }"
            />

            <!-- 進度條載入器 -->
            <div
              v-else-if="type === 'progress'"
              class="loading-progress"
              :class="progressClass"
            >
              <div
                class="loading-progress-bar"
                :class="progressBarClass"
                :style="{ width: `${progress}%` }"
              />
            </div>

            <!-- 自定義載入器 -->
            <div
              v-else-if="type === 'custom'"
              class="loading-custom"
              :class="customClass"
            >
              <slot name="indicator" />
            </div>
          </div>

          <!-- 載入文字 -->
          <div
            v-if="showText && text"
            class="loading-text"
            :class="textClass"
          >
            {{ text }}
          </div>

          <!-- 進度文字 -->
          <div
            v-if="showProgress && type === 'progress'"
            class="loading-progress-text"
            :class="progressTextClass"
          >
            {{ Math.round(progress) }}%
          </div>

          <!-- 取消按鈕 -->
          <button
            v-if="showCancel"
            class="loading-cancel"
            :class="cancelClass"
            @click="handleCancel"
          >
            {{ cancelText }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, type PropType } from 'vue'
import { useLoadingAnimation } from '@/composables/usePageTransition'

// 載入類型
type LoadingType = 'spinner' | 'dots' | 'pulse' | 'progress' | 'custom'

// Props
const props = defineProps({
  // 顯示狀態
  modelValue: {
    type: Boolean,
    default: false
  },

  // 載入類型
  type: {
    type: String as PropType<LoadingType>,
    default: 'spinner'
  },

  // 載入文字
  text: {
    type: String,
    default: '載入中...'
  },

  // 顯示文字
  showText: {
    type: Boolean,
    default: true
  },

  // 進度值 (0-100)
  progress: {
    type: Number,
    default: 0,
    validator: (value: number) => value >= 0 && value <= 100
  },

  // 顯示進度
  showProgress: {
    type: Boolean,
    default: false
  },

  // 載入器大小
  size: {
    type: String,
    default: '2rem'
  },

  // 顯示取消按鈕
  showCancel: {
    type: Boolean,
    default: false
  },

  // 取消按鈕文字
  cancelText: {
    type: String,
    default: '取消'
  },

  // 點擊覆蓋層關閉
  closeOnOverlay: {
    type: Boolean,
    default: false
  },

  // 樣式類
  containerClass: {
    type: String,
    default: ''
  },
  overlayClass: {
    type: String,
    default: ''
  },
  contentClass: {
    type: String,
    default: ''
  },
  indicatorClass: {
    type: String,
    default: ''
  },
  textClass: {
    type: String,
    default: ''
  },
  cancelClass: {
    type: String,
    default: ''
  },

  // 特定類型的樣式類
  spinnerClass: {
    type: String,
    default: ''
  },
  spinnerIconClass: {
    type: String,
    default: ''
  },
  dotsClass: {
    type: String,
    default: ''
  },
  dotClass: {
    type: String,
    default: ''
  },
  pulseClass: {
    type: String,
    default: ''
  },
  progressClass: {
    type: String,
    default: ''
  },
  progressBarClass: {
    type: String,
    default: ''
  },
  progressTextClass: {
    type: String,
    default: ''
  },
  customClass: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  cancel: []
  overlayClick: []
}>()

// Composables
const { isLoading } = useLoadingAnimation()

// 計算屬性
const isVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

// 監聽載入狀態變化
watch(() => props.modelValue, (newValue) => {
  isLoading.value = newValue
})

// 事件處理
const handleCancel = () => {
  emit('cancel')
  isVisible.value = false
}

const handleOverlayClick = () => {
  emit('overlayClick')
  if (props.closeOnOverlay) {
    isVisible.value = false
  }
}

const onOverlayEnter = (el: Element) => {
  // 覆蓋層進入動畫
  el.classList.add('loading-overlay-enter')
}

const onOverlayLeave = (el: Element) => {
  // 覆蓋層離開動畫
  el.classList.add('loading-overlay-leave')
}
</script>

<style scoped>
.loading-transition {
  @apply relative;
}

/* 覆蓋層樣式 */
.loading-overlay {
  @apply fixed inset-0 z-50 flex items-center justify-center;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.dark .loading-overlay {
  background-color: rgba(0, 0, 0, 0.7);
}

/* 載入內容 */
.loading-content {
  @apply bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4;
  @apply flex flex-col items-center space-y-4;
}

.dark .loading-content {
  @apply bg-gray-800 text-white;
}

/* 載入指示器 */
.loading-indicator {
  @apply flex items-center justify-center;
}

/* 旋轉載入器 */
.loading-spinner {
  @apply text-blue-500;
}

.loading-spinner svg {
  @apply w-full h-full;
}

/* 點載入器 */
.loading-dots {
  @apply flex space-x-1;
}

.loading-dot {
  @apply w-2 h-2 bg-blue-500 rounded-full;
  animation: loading-dot-bounce 1.4s ease-in-out infinite both;
}

@keyframes loading-dot-bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* 脈衝載入器 */
.loading-pulse {
  @apply bg-blue-500 rounded-full;
  animation: loading-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes loading-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 進度條載入器 */
.loading-progress {
  @apply w-full bg-gray-200 rounded-full h-2 overflow-hidden;
}

.dark .loading-progress {
  @apply bg-gray-700;
}

.loading-progress-bar {
  @apply h-full bg-blue-500 rounded-full transition-all duration-300 ease-out;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
}

/* 載入文字 */
.loading-text {
  @apply text-gray-700 text-center font-medium;
}

.dark .loading-text {
  @apply text-gray-300;
}

/* 進度文字 */
.loading-progress-text {
  @apply text-sm text-gray-500 font-mono;
}

.dark .loading-progress-text {
  @apply text-gray-400;
}

/* 取消按鈕 */
.loading-cancel {
  @apply px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100;
  @apply border border-gray-300 rounded-md hover:bg-gray-200;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
  @apply transition-colors duration-200;
}

.dark .loading-cancel {
  @apply text-gray-300 bg-gray-700 border-gray-600 hover:bg-gray-600;
}

/* 覆蓋層過渡動畫 */
.loading-overlay-enter-active,
.loading-overlay-leave-active {
  transition: all 0.3s ease;
}

.loading-overlay-enter-from,
.loading-overlay-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

.loading-overlay-enter-from .loading-content,
.loading-overlay-leave-to .loading-content {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}

.loading-overlay-enter-to .loading-content,
.loading-overlay-leave-from .loading-content {
  transform: scale(1) translateY(0);
  opacity: 1;
}

/* 響應式調整 */
@media (max-width: 640px) {
  .loading-content {
    @apply mx-4 p-4;
  }

  .loading-text {
    @apply text-sm;
  }
}

/* 減少動畫偏好支援 */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner svg,
  .loading-dot,
  .loading-pulse {
    animation: none;
  }

  .loading-progress-bar {
    transition: none;
  }

  .loading-overlay-enter-active,
  .loading-overlay-leave-active {
    transition: none;
  }
}
</style>
