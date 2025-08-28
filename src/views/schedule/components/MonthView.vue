<template>
  <div class="calendar-view">
    <!-- 月檢視週標題 -->
    <div class="grid grid-cols-7 border-b border-gray-200">
      <div
        v-for="dayName in ['日', '一', '二', '三', '四', '五', '六']"
        :key="dayName"
        class="p-4 text-center text-sm font-medium text-gray-500"
      >
        {{ dayName }}
      </div>
    </div>

    <!-- 月曆格子 -->
    <div class="grid grid-cols-7">
      <div
        v-for="date in monthDates"
        :key="date.dateString"
        :class="[
          'min-h-[120px] cursor-pointer border-b border-r border-gray-200 p-2 hover:bg-gray-50',
          date.isCurrentMonth ? 'bg-white' : 'bg-gray-50',
          date.isToday ? 'bg-blue-50' : ''
        ]"
        @click="$emit('date-click', date.dateString)"
      >
        <div class="mb-2 flex items-start justify-between">
          <span :class="[
            'text-sm',
            date.isCurrentMonth ? 'text-gray-900' : 'text-gray-400',
            date.isToday ? 'font-bold text-blue-600' : ''
          ]">
            {{ date.day }}
          </span>
        </div>

        <!-- 當日課程 -->
        <div class="space-y-1">
          <div
            v-for="schedule in getSchedulesForDate(date.dateString)"
            :key="schedule.id"
            :style="getScheduleStyles(schedule)"
            class="cursor-pointer rounded-md border-l-4 p-1 text-xs shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
            @click.stop="$emit('schedule-click', schedule)"
          >
            <div class="truncate">
              {{ formatScheduleTime(schedule) }} {{ schedule.course?.course_name }}
            </div>
            <div class="mt-1 flex items-center text-xs opacity-75">
              <UserGroupIcon class="mr-1 size-3" />
              <span v-if="schedule.studentCount !== undefined">{{ schedule.studentCount }}人</span>
              <span v-else-if="schedule.loadingStudents" class="text-gray-400">...</span>
              <span v-else class="text-gray-400">-</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { UserGroupIcon } from '@heroicons/vue/24/outline'
import { db } from '@/services/supabase'
import type { Schedule } from '@/types'
import { useCategoryColors } from '@/composables/useCategoryColors'

// Props
interface Props {
  schedules: Schedule[]
  currentDate: Date
}

const props = defineProps<Props>()

// Emits
defineEmits<{
  'schedule-click': [schedule: Schedule]
  'date-click': [date: string]
}>()

// 使用分類顏色
const { loadCategories, getCategoryStyles } = useCategoryColors()

// 載入分類
onMounted(() => {
  loadCategories()
})

// 計算月份日期
const monthDates = computed(() => {
  const year = props.currentDate.getFullYear()
  const month = props.currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const startDate = new Date(firstDay)
  // 找到該月第一天是星期幾，然後往前推到週日
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  const dates = []
  const today = new Date()

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)

    dates.push({
      dateString: formatDateString(date),
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: date.toDateString() === today.toDateString()
    })
  }

  return dates
})

// ==================== 工具函數 ====================
function formatDateString(date: Date): string {
  // 使用本地時間格式化日期，避免時區問題
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 時間解析函數 - 確保正確解析本地時區時間
function parseAsLocalTime(timeString: string): Date {
  if (!timeString) return new Date()

  if (timeString.includes('T')) {
    // 創建一個新的日期對象，但保留原始的時間部分
    const [datePart, timePart] = timeString.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute, second = 0] = timePart.split(':').map(Number)

    // 創建本地時間的日期對象，不受時區影響
    return new Date(year, month - 1, day, hour, minute, second)
  } else {
    // 如果只有日期部分，也要避免時區問題
    const [year, month, day] = timeString.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
}

function formatTime(dateString: string): string {
  if (!dateString) return '--:--'

  const date = parseAsLocalTime(dateString)

  if (isNaN(date.getTime())) {
    return '--:--'
  }

  // 使用本地時間格式化
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// ==================== 課程行事曆處理 ====================
function getSchedulesForDate(date: string): Schedule[] {
  const dateSchedules = props.schedules.filter(schedule => {
    const scheduleDate = parseAsLocalTime(schedule.class_datetime)
    return formatDateString(scheduleDate) === date
  })

  // 為月檢視的每個課程行事曆載入學生人數
  dateSchedules.forEach(schedule => {
    if (!schedule.studentListLoaded && !schedule.loadingStudents) {
      loadStudentCountForSchedule(schedule)
    }
  })

  return dateSchedules
}

// 獲取課程樣式，處理已取消狀態
function getScheduleStyles(schedule: Schedule): object {
  // 檢查課程狀態，如果是已取消則使用灰色樣式
  if (schedule.status === 'cancelled') {
    return {
      backgroundColor: 'rgba(156, 163, 175, 0.1)', // 灰色背景
      borderLeftColor: '#9CA3AF', // 灰色邊框
      color: '#6B7280', // 灰色文字
      opacity: 0.7 // 降低透明度
    }
  }

  // 獲取分類顏色樣式
  const categoryName = schedule.course?.category || '其他'
  return getCategoryStyles(categoryName)
}

function formatScheduleTime(schedule: Schedule): string {
  // 優先使用課程的 schedule_pattern 中的預設時間
  if (schedule.course?.schedule_pattern) {
    const pattern = schedule.course.schedule_pattern

    if (pattern.start_time && pattern.end_time) {
      return `${pattern.start_time}`
    }
  }

  // 如果沒有 schedule_pattern，使用實際排程時間
  // 確保使用本地時間格式
  const startTime = parseAsLocalTime(schedule.class_datetime)

  const formatTimeString = (date: Date) => {
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  return formatTimeString(startTime)
}

// ==================== 學生人數載入 ====================
async function loadStudentCountForSchedule(schedule: Schedule) {
  if (schedule.studentListLoaded || schedule.loadingStudents) {
    return
  }

  schedule.loadingStudents = true
  schedule.studentCount = 0

  try {
    if (schedule.course_id) {
      // 使用標準 API 查詢報名人數
      const enrollments = await db.findMany('enrollments', {
        columns: 'student_id',
        filters: { course_id: schedule.course_id, status: 'active' }
      })

      schedule.studentCount = enrollments.length
    }
  } catch (error) {
    console.error('載入學生人數失敗:', error)
    schedule.studentCount = 0
  } finally {
    schedule.loadingStudents = false
    schedule.studentListLoaded = true
  }
}

// 組件掛載時載入學生人數
onMounted(() => {
  props.schedules.forEach(schedule => {
    if (!schedule.studentListLoaded && !schedule.loadingStudents) {
      loadStudentCountForSchedule(schedule)
    }
  })
})
</script>

<style scoped>
.calendar-view {
  @apply min-h-[600px] bg-white rounded-lg overflow-hidden;
}

/* 滾動條樣式 */
.calendar-view::-webkit-scrollbar {
  width: 6px;
}

.calendar-view::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.calendar-view::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.calendar-view::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
