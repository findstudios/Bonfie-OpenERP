<template>
  <div
    v-if="errors.length > 0"
    :class="containerClasses"
    role="alert"
    aria-live="polite"
  >
    <div class="flex">
      <div class="shrink-0">
        <ExclamationTriangleIcon :class="iconClasses" />
      </div>
      <div class="ml-3 flex-1">
        <h3 :class="titleClasses">
          {{ title }}
        </h3>
        <div :class="contentClasses">
          <ul class="list-inside list-disc space-y-1">
            <li
              v-for="error in errors"
              :key="error.field"
              :class="errorItemClasses"
            >
              <button
                v-if="showFieldLinks"
                type="button"
                :class="errorLinkClasses"
                @click="handleErrorClick(error.field)"
              >
                {{ error.error }}
              </button>
              <span v-else>{{ error.error }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

interface FormError {
  field: string
  error: string
}

interface Props {
  errors: FormError[]
  title?: string
  showFieldLinks?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '請修正以下錯誤',
  showFieldLinks: true
})

const emit = defineEmits<{
  'error-click': [fieldName: string]
}>()

const containerClasses = computed(() => {
  return [
    'error-summary',
    'bg-[var(--color-error-50)]',
    'border',
    'border-[var(--color-error-200)]',
    'rounded-md',
    'p-4',
    'mb-6'
  ].join(' ')
})

const iconClasses = computed(() => {
  return [
    'h-5',
    'w-5',
    'text-[var(--color-error-400)]'
  ].join(' ')
})

const titleClasses = computed(() => {
  return [
    'text-sm',
    'font-medium',
    'text-[var(--color-error-800)]'
  ].join(' ')
})

const contentClasses = computed(() => {
  return [
    'mt-2',
    'text-sm',
    'text-[var(--color-error-700)]'
  ].join(' ')
})

const errorItemClasses = computed(() => {
  return [
    'text-sm'
  ].join(' ')
})

const errorLinkClasses = computed(() => {
  return [
    'text-[var(--color-error-700)]',
    'hover:text-[var(--color-error-800)]',
    'underline',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-[var(--color-error-500)]',
    'focus:ring-offset-1',
    'rounded',
    'transition-colors',
    'duration-150'
  ].join(' ')
})

const handleErrorClick = (fieldName: string) => {
  emit('error-click', fieldName)
}
</script>

<style scoped>
.error-summary {
  /* 確保錯誤摘要在高對比度模式下清晰可見 */
}

@media (prefers-contrast: high) {
  .error-summary {
    border-width: 2px;
  }
}

/* 減少動畫偏好支援 */
@media (prefers-reduced-motion: reduce) {
  .error-summary button {
    transition: none;
  }
}
</style>
