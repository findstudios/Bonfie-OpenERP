<template>
  <div :class="containerClasses">
    <slot name="secondary">
      <!-- 重置按鈕 -->
      <SmartButton
        v-if="showReset"
        type="button"
        variant="tertiary"
        :disabled="loading"
        :class="resetButtonClasses"
        @click="handleReset"
      >
        {{ resetText }}
      </SmartButton>

      <!-- 取消按鈕 -->
      <SmartButton
        v-if="showCancel"
        type="button"
        variant="secondary"
        :disabled="loading"
        :class="cancelButtonClasses"
        @click="handleCancel"
      >
        {{ cancelText }}
      </SmartButton>
    </slot>

    <slot name="primary">
      <!-- 提交按鈕 -->
      <SmartButton
        type="submit"
        variant="primary"
        :loading="loading"
        :disabled="!isValid"
        :class="submitButtonClasses"
        @click="handleSubmit"
      >
        {{ submitText }}
      </SmartButton>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useResponsive } from '@/composables/useResponsive'
import SmartButton from '../SmartButton.vue'

interface Props {
  loading?: boolean
  isValid?: boolean
  submitText?: string
  cancelText?: string
  resetText?: string
  showCancel?: boolean
  showReset?: boolean
  mobileLayout?: 'stack' | 'horizontal'
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  isValid: true,
  submitText: '提交',
  cancelText: '取消',
  resetText: '重置',
  showCancel: true,
  showReset: false,
  mobileLayout: 'stack'
})

const emit = defineEmits<{
  submit: [event: Event]
  cancel: []
  reset: []
}>()

const { isMobile } = useResponsive()

const containerClasses = computed(() => {
  const classes = [
    'form-actions',
    'flex',
    'pt-6',
    'border-t',
    'border-[var(--color-border-primary)]'
  ]

  if (isMobile.value) {
    if (props.mobileLayout === 'stack') {
      classes.push('flex-col', 'space-y-3')
    } else {
      classes.push('flex-wrap', 'gap-3', 'justify-end')
    }
  } else {
    classes.push('justify-end', 'space-x-3')
  }

  return classes.join(' ')
})

const submitButtonClasses = computed(() => {
  const classes = []

  if (isMobile.value && props.mobileLayout === 'stack') {
    classes.push('w-full', 'order-1')
  }

  return classes.join(' ')
})

const cancelButtonClasses = computed(() => {
  const classes = []

  if (isMobile.value && props.mobileLayout === 'stack') {
    classes.push('w-full', 'order-2')
  }

  return classes.join(' ')
})

const resetButtonClasses = computed(() => {
  const classes = []

  if (isMobile.value && props.mobileLayout === 'stack') {
    classes.push('w-full', 'order-3')
  }

  return classes.join(' ')
})

const handleSubmit = (event: Event) => {
  emit('submit', event)
}

const handleCancel = () => {
  emit('cancel')
}

const handleReset = () => {
  emit('reset')
}
</script>

<style scoped>
.form-actions {
  @apply mt-6;
}

/* 響應式調整 */
@media (max-width: 640px) {
  .form-actions.flex-col .smart-button {
    @apply text-base py-3;
  }
}

/* 觸控優化 */
@media (hover: none) and (pointer: coarse) {
  .form-actions .smart-button {
    @apply min-h-[44px];
  }
}
</style>
