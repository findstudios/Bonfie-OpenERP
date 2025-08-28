<template>
  <div
    :class="[
      'flex items-center justify-center rounded-full',
      bgColor,
      textColor,
      sizeClass
    ]"
  >
    <span :class="fontSizeClass">
      {{ initial }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  name?: string | null
  size?: number
  bgColor?: string
  textColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 40,
  bgColor: 'bg-gray-100',
  textColor: 'text-gray-600'
})

const initial = computed(() => {
  return props.name?.charAt(0)?.toUpperCase() || '?'
})

const sizeClass = computed(() => {
  return `h-${Math.floor(props.size / 4)} w-${Math.floor(props.size / 4)}`
})

const fontSizeClass = computed(() => {
  if (props.size >= 48) return 'text-lg font-medium'
  if (props.size >= 32) return 'text-base font-medium'
  return 'text-sm font-medium'
})
</script>
