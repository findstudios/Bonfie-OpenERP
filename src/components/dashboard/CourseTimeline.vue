<template>
  <div class="course-timeline">
    <!-- 時間刻度 -->
    <div class="relative h-full">
      <!-- 時間標籤 -->
      <div class="absolute inset-y-0 left-0 w-16 border-r border-gray-300">
        <div v-for="hour in timeScale" :key="hour" class="relative" :style="{ height: hourHeight + 'px' }">
          <span data-testid="time-label" class="absolute -top-2 left-2 text-xs text-gray-500">
            {{ hour }}:00
          </span>
        </div>
      </div>

      <!-- 課程內容區 -->
      <div class="relative ml-16 h-full">
        <!-- 當前時間指示線 -->
        <div
          v-if="showCurrentTime"
          data-testid="current-time-indicator"
          class="absolute inset-x-0 z-10 h-0.5 bg-red-500"
          :style="{ top: currentTimePosition + 'px' }"
        >
          <div class="absolute -left-2 -top-2 size-4 rounded-full bg-red-500"></div>
        </div>

        <!-- 課程卡片 -->
        <div
          v-for="schedule in schedules"
          :key="schedule.schedule_id"
          data-testid="course-card"
          class="absolute cursor-pointer rounded-lg p-3 transition-all hover:shadow-lg"
          :class="getCourseCardClass(schedule)"
          :style="getCourseCardStyle(schedule)"
          @click="toggleStudentList(schedule)"
        >
          <!-- 課程標題 -->
          <div class="mb-1 flex items-center justify-between">
            <h4 class="text-sm font-medium">{{ schedule.course?.course_name }}</h4>
            <span v-if="schedule.has_trial" class="rounded bg-yellow-200 px-2 py-0.5 text-xs text-yellow-800">
              試聽
            </span>
          </div>

          <!-- 時間和人數 -->
          <div class="text-xs text-gray-600">
            <div>{{ formatTimeRange(schedule.class_datetime, schedule.end_datetime) }}</div>
            <div class="mt-1">
              <span class="font-medium">{{ schedule.attendance_count }}</span> /
              <span>{{ schedule.enrollments?.length || 0 }}</span> 人
            </div>
          </div>

          <!-- 學生名單（展開時顯示） -->
          <div
            v-if="expandedSchedules.includes(schedule.schedule_id)"
            :data-testid="`student-list-${schedule.schedule_id}`"
            class="mt-3 border-t border-gray-200 pt-3"
            @click.stop
          >
            <div class="text-xs text-gray-700">
              <div class="mb-1 font-medium">學生名單：</div>
              <div v-for="enrollment in schedule.enrollments" :key="enrollment.student_id" class="ml-2">
                {{ enrollment.student_name }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface CourseSchedule {
  schedule_id: string
  course_id: string
  class_datetime: string
  end_datetime: string
  classroom: string
  status: string
  course?: {
    course_name: string
    instructor?: { full_name: string }
  }
  enrollments?: Array<{
    student_id: string
    student_name: string
  }>
  attendance_count: number
  has_trial?: boolean
}

const props = withDefaults(defineProps<{
  schedules: CourseSchedule[]
  currentTime?: Date
  startHour?: number
  endHour?: number
}>(), {
  currentTime: () => new Date(),
  startHour: 8,
  endHour: 22
})

const emit = defineEmits<{
  'course-click': [schedule: CourseSchedule]
}>()

// 展開的課程列表
const expandedSchedules = ref<string[]>([])

// 每小時的高度（像素）
const hourHeight = 60

// 時間刻度
const timeScale = computed(() => {
  const hours = []
  for (let i = props.startHour; i <= props.endHour; i++) {
    hours.push(i)
  }
  return hours
})

// 是否顯示當前時間
const showCurrentTime = computed(() => {
  const hour = props.currentTime.getHours()
  return hour >= props.startHour && hour <= props.endHour
})

// 當前時間位置
const currentTimePosition = computed(() => {
  const hour = props.currentTime.getHours()
  const minute = props.currentTime.getMinutes()
  const hoursSinceStart = hour - props.startHour + minute / 60
  return hoursSinceStart * hourHeight
})

// 獲取課程卡片樣式
function getCourseCardStyle(schedule: CourseSchedule) {
  const startTime = new Date(schedule.class_datetime)
  const endTime = new Date(schedule.end_datetime)

  const startHour = startTime.getHours()
  const startMinute = startTime.getMinutes()
  const endHour = endTime.getHours()
  const endMinute = endTime.getMinutes()

  const top = ((startHour - props.startHour) + startMinute / 60) * hourHeight
  const height = ((endHour - startHour) + (endMinute - startMinute) / 60) * hourHeight

  return {
    top: `${top}px`,
    height: `${height}px`,
    left: '10px',
    right: '10px'
  }
}

// 獲取課程卡片類別
function getCourseCardClass(schedule: CourseSchedule) {
  const baseClasses = ['border']

  if (schedule.status === 'completed') {
    baseClasses.push('bg-gray-100 border-gray-300')
  } else if (schedule.status === 'in_progress') {
    baseClasses.push('bg-green-100 border-green-300')
  } else if (schedule.attendance_count === 0) {
    baseClasses.push('bg-red-100 border-red-300')
  } else {
    baseClasses.push('bg-blue-100 border-blue-300')
  }

  return baseClasses
}

// 格式化時間範圍
function formatTimeRange(start: string, end: string) {
  const startTime = new Date(start)
  const endTime = new Date(end)

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  return `${formatTime(startTime)}-${formatTime(endTime)}`
}

// 切換學生名單顯示
function toggleStudentList(schedule: CourseSchedule) {
  const index = expandedSchedules.value.indexOf(schedule.schedule_id)
  if (index === -1) {
    expandedSchedules.value.push(schedule.schedule_id)
  } else {
    expandedSchedules.value.splice(index, 1)
  }
  emit('course-click', schedule)
}
</script>

<style scoped>
.course-timeline {
  height: calc((22 - 8 + 1) * 60px);
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}
</style>
