<template>
  <div class="min-h-[38rem] rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <div class="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
      <h2 class="text-xl font-bold text-gray-900">今日課程</h2>
      <button
        @click="$emit('export')"
        class="flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
      >
        <ArrowDownTrayIcon class="size-4" />
        匯出名單
      </button>
    </div>

    <div class="max-h-[32rem] min-h-[30rem] space-y-3 overflow-y-auto pr-2">
      <div
        v-for="schedule in schedules"
        :key="schedule.schedule_id"
        class="relative"
      >
        <ScheduleCard
          :schedule="schedule"
          :is-expanded="expandedSchedules[schedule.schedule_id] || false"
          @toggle-expand="toggleScheduleExpand(schedule.schedule_id)"
          @navigate-attendance="$emit('navigate-attendance', $event)"
        />

        <!-- 時間指示線 -->
        <div
          v-if="isCurrentTime(schedule)"
          class="absolute left-0 top-0 h-full w-1 rounded-l-lg bg-blue-500"
        ></div>
      </div>

      <div v-if="schedules.length === 0" class="py-12 text-center text-gray-400">
        <div class="text-base">今日無課程安排</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowDownTrayIcon } from '@heroicons/vue/24/outline'
import ScheduleCard from './ScheduleCard.vue'
import type { Schedule } from '@/types/dashboard'

// Props
const props = defineProps<{
  schedules: Schedule[]
}>()

// Emits
const emit = defineEmits<{
  'export': []
  'navigate-attendance': [scheduleId: string]
}>()

// 展開狀態管理
const expandedSchedules = ref<Record<string, boolean>>({})

// 切換展開狀態
function toggleScheduleExpand(scheduleId: string) {
  expandedSchedules.value[scheduleId] = !expandedSchedules.value[scheduleId]
}

// 檢查是否為當前時間
function isCurrentTime(schedule: Schedule): boolean {
  const now = new Date()
  const classTime = new Date(schedule.class_datetime)
  const endTime = new Date(schedule.end_datetime)
  return now >= classTime && now <= endTime
}
</script>
