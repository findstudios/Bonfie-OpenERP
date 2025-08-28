<template>
  <div class="flex items-center justify-between border-b border-gray-200 p-6">
    <div>
      <h3 class="text-xl font-semibold text-gray-900">課程詳情</h3>
      <p class="mt-1 text-sm text-gray-500">{{ date }}</p>
    </div>
    <button
      @click="$emit('close')"
      class="text-gray-400 transition-colors duration-200 hover:text-gray-600"
    >
      <XMarkIcon class="size-6" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'

interface Props {
  date: string
}

defineProps<Props>()

defineEmits<{
  close: []
}>()
</script>
