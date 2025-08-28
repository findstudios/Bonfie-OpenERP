<template>
  <div
    class="overflow-hidden rounded-lg hover:shadow-md"
    :class="cardClass"
    :style="cardStyle"
  >
    <!-- 收合狀態 -->
    <div
      class="cursor-pointer p-4"
      @click="$emit('toggle-expand')"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <h3 class="truncate text-lg font-bold text-gray-900">
            {{ schedule.course?.course_name || '未知課程' }}
          </h3>
          <div class="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <span class="font-medium">{{ timeRange }}</span>
            <span class="text-gray-400">·</span>
            <span>{{ studentCountText }}</span>
          </div>
          <div v-if="schedule.has_trial" class="mt-2 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
            含試聽
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <div class="rounded-full px-2.5 py-1 text-xs font-bold" :class="timeClass">
            {{ formattedTime }}
          </div>
          <ChevronDownIcon
            class="size-5 text-gray-400 transition-transform duration-200"
            :class="isExpanded ? 'rotate-180' : ''"
          />
        </div>
      </div>
    </div>

    <!-- 展開狀態 - 學生名單 -->
    <div
      v-if="isExpanded"
      class="border-t bg-gray-50/50 px-4 pb-4"
      :class="borderClass"
    >
      <div class="mt-4">
        <div class="mb-4 flex items-center justify-between">
          <div class="text-sm">
            <span class="text-gray-500">授課老師：</span>
            <span class="font-semibold text-gray-700">{{ schedule.course?.instructor?.full_name || '未指派' }}</span>
          </div>
          <button
            @click.stop="$emit('navigate-attendance', schedule.schedule_id)"
            class="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
          >
            前往點名 →
          </button>
        </div>

        <!-- 學生名單 -->
        <StudentList :students="schedule.studentList || []" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import StudentList from './StudentList.vue'
import { useCategoryColors } from '@/composables/useCategoryColors'
import { formatTime, getFullTimeRange } from '@/utils/dashboard/formatters'
import { getScheduleCardClass, getTimeClass, getScheduleBorderClass } from '@/utils/dashboard/scheduleHelpers'
import type { Schedule } from '@/types/dashboard'

// Props
const props = defineProps<{
  schedule: Schedule
  isExpanded: boolean
}>()

// Emits
const emit = defineEmits<{
  'toggle-expand': []
  'navigate-attendance': [scheduleId: string]
}>()

// Composables
const { getCategoryStyles } = useCategoryColors()

// Computed
const cardClass = computed(() => getScheduleCardClass(props.schedule))
const cardStyle = computed(() => {
  const category = props.schedule.course?.category || '其他'
  const styles = getCategoryStyles(category)
  return {
    backgroundColor: styles.backgroundColor,
    borderLeftColor: styles.borderLeftColor
  }
})

const timeClass = computed(() => getTimeClass(props.schedule))
const borderClass = computed(() => getScheduleBorderClass(props.schedule))
const formattedTime = computed(() => formatTime(props.schedule.class_datetime))
const timeRange = computed(() => getFullTimeRange(props.schedule))
const studentCountText = computed(() => {
  const total = props.schedule.enrollments?.length || 0
  const attended = props.schedule.attendance_count || 0
  return `${attended}/${total} 人`
})
</script>
