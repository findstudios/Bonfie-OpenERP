<template>
  <div class="flex items-center justify-center">
    <div
      :class="[
        'animate-spin rounded-full border-b-2',
        sizeClasses,
        colorClasses
      ]"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'blue' | 'gray' | 'white'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'blue'
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }
  return sizes[props.size]
})

const colorClasses = computed(() => {
  const colors = {
    blue: 'border-blue-600',
    gray: 'border-gray-600',
    white: 'border-white'
  }
  return colors[props.color]
})
</script>
