<template>
  <div
    class="overflow-hidden rounded-lg border-2 transition-all duration-200"
    :class="itemClass"
  >
    <!-- 已完成項目 - 摺疊顯示 -->
    <div v-if="item.completed" class="p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <CheckCircleIcon class="size-5 text-green-500" />
          <div>
            <span class="text-base font-medium text-gray-600 line-through">{{ item.student.chinese_name }}</span>
            <span class="ml-2 text-xs text-gray-400">已完成追蹤</span>
          </div>
        </div>
        <button
          @click="$emit('complete', { id: item.id, completed: false })"
          class="rounded px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
        >
          重新追蹤
        </button>
      </div>
    </div>

    <!-- 未完成項目 - 完整顯示 -->
    <div v-else class="p-5">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <div class="mb-2 flex items-center gap-2">
            <h4 class="text-lg font-bold text-gray-900">
              {{ item.student.chinese_name }}
            </h4>
            <!-- 追蹤類型標籤 -->
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              :class="[typeStyle.bgColor, typeStyle.textColor]"
            >
              {{ typeText }}
            </span>
            <!-- 優先級指示器 -->
            <span
              v-if="item.priority === 'high'"
              class="inline-flex items-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white"
            >
              急
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <span v-if="item.course_name" class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">
              {{ item.course_name }}
            </span>
            <span v-if="item.class_time" class="font-medium text-gray-500">{{ item.class_time }}</span>
            <span v-if="item.scheduled_date && item.scheduled_time" class="font-medium text-gray-500">
              {{ formatDate(item.scheduled_date) }} {{ item.scheduled_time }}
            </span>
            <span v-if="item.due_date" class="font-medium text-orange-600">
              截止：{{ formatDate(item.due_date) }}
            </span>
          </div>
        </div>
        <button
          @click="$emit('complete', { id: item.id, completed: true })"
          class="flex shrink-0 items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700"
        >
          <CheckCircleIcon class="size-4" />
          已追蹤
        </button>
      </div>

      <div class="space-y-3 border-t border-gray-100 pt-3">
        <!-- 聯絡人資訊 -->
        <div class="rounded-lg bg-gray-50 p-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="text-sm">
                <span class="font-semibold text-gray-900">{{ item.contact.name }}</span>
                <span class="ml-2 text-gray-500">{{ item.contact.relationship }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 text-gray-800">
              <PhoneIcon class="size-4 shrink-0 text-gray-500" />
              <span class="font-mono text-sm font-medium">{{ item.contact.phone }}</span>
            </div>
          </div>
        </div>

        <!-- 備註 -->
        <div v-if="item.notes" class="rounded-r-lg border-l-4 border-yellow-400 bg-yellow-50 p-3">
          <p class="text-sm font-medium text-yellow-800">{{ item.notes }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircleIcon, PhoneIcon } from '@heroicons/vue/24/outline'
import { trackingService } from '@/services/trackingService'
import { formatDate } from '@/utils/formatters'
import type { TrackingItem } from '@/types/dashboard'

// Props
const props = defineProps<{
  item: TrackingItem
}>()

// Emits
const emit = defineEmits<{
  'complete': [data: { id: string; completed: boolean }]
}>()

// Computed
const itemClass = computed(() => {
  if (props.item.completed) {
    return 'bg-gray-50 border-gray-200'
  }
  return `${typeStyle.value.bgColor} ${typeStyle.value.borderColor} hover:shadow-sm`
})

const typeStyle = computed(() => trackingService.getTypeStyle(props.item.type))
const typeText = computed(() => trackingService.getTypeText(props.item.type))
</script>
