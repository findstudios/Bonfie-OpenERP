<template>
  <span :class="statusClass">
    {{ statusText }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status?: string | null
}

const props = defineProps<Props>()

const statusText = computed(() => {
  return props.status || '未點名'
})

const statusClass = computed(() => {
  const baseClass = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium'

  switch (props.status) {
    case 'present':
      return `${baseClass} bg-green-100 text-green-800`
    case 'absent':
      return `${baseClass} bg-red-100 text-red-800`
    case 'late':
      return `${baseClass} bg-yellow-100 text-yellow-800`
    case 'leave':
      return `${baseClass} bg-blue-100 text-blue-800`
    default:
      return `${baseClass} bg-gray-100 text-gray-800`
  }
})
</script>
