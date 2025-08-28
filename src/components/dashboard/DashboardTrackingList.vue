<template>
  <div class="min-h-[38rem] rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <div class="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
      <h2 class="text-xl font-bold text-gray-900">追蹤名單</h2>
      <button
        @click="$emit('refresh')"
        class="flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
        :disabled="loading"
      >
        <ArrowPathIcon class="size-4" :class="loading ? 'animate-spin' : ''" />
        重新整理
      </button>
    </div>

    <div class="max-h-[32rem] min-h-[30rem] space-y-3 overflow-y-auto">
      <TrackingItem
        v-for="item in items"
        :key="item.id"
        :item="item"
        @complete="$emit('complete', $event)"
      />

      <div v-if="items.length === 0 && !loading" class="py-12 text-center text-gray-400">
        <div class="text-base">無待追蹤項目</div>
      </div>

      <div v-if="loading" class="py-12 text-center text-gray-400">
        <div class="text-base">載入中...</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import TrackingItem from './TrackingItem.vue'
import type { TrackingItem as TrackingItemType } from '@/types/dashboard'

// Props
defineProps<{
  items: TrackingItemType[]
  loading: boolean
}>()

// Emits
defineEmits<{
  'refresh': []
  'complete': [data: { id: string; completed: boolean }]
}>()
</script>
