<template>
  <div class="form-header">
    <slot name="header">
      <!-- 標題 -->
      <h2
        v-if="title"
        :id="titleId"
        :class="titleClasses"
      >
        {{ title }}
      </h2>

      <!-- 描述 -->
      <p
        v-if="description"
        :id="descriptionId"
        :class="descriptionClasses"
      >
        {{ description }}
      </p>
    </slot>

    <!-- 進度指示器 -->
    <ProgressIndicator
      v-if="progress !== undefined"
      :progress="progress"
      :show-percentage="showProgressPercentage"
      :color="progressColor"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useResponsive } from '@/composables/useResponsive'
import ProgressIndicator from './ProgressIndicator.vue'

interface Props {
  title?: string
  description?: string
  titleId?: string
  descriptionId?: string
  progress?: number
  showProgressPercentage?: boolean
  progressColor?: 'primary' | 'success' | 'warning' | 'error'
}

const props = withDefaults(defineProps<Props>(), {
  showProgressPercentage: true,
  progressColor: 'primary'
})

const { isMobile, isTablet } = useResponsive()

const titleClasses = computed(() => {
  const classes = [
    'form-title',
    'font-bold',
    'leading-tight',
    'text-[var(--color-text-primary)]',
    'mb-2'
  ]

  if (isMobile.value) {
    classes.push('text-xl', 'sm:text-2xl')
  } else if (isTablet.value) {
    classes.push('text-2xl')
  } else {
    classes.push('text-2xl', 'sm:text-3xl')
  }

  return classes.join(' ')
})

const descriptionClasses = computed(() => {
  return [
    'form-description',
    'text-[var(--color-text-secondary)]',
    'leading-relaxed',
    isMobile.value ? 'text-sm' : 'text-base'
  ].join(' ')
})
</script>

<style scoped>
.form-header {
  @apply mb-6;
}

.form-title {
  @apply select-none;
}

.form-description {
  @apply select-none;
}
</style>
