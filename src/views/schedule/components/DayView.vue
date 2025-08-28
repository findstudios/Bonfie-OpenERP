<template>
  <div class="calendar-view">
    <div class="border-b border-gray-200 p-4">
      <h3 class="text-lg font-medium text-gray-900">
        {{ formatDate(currentDate) }}
      </h3>
    </div>

    <div class="space-y-4 p-4">
      <div
        v-for="schedule in getDaySchedules(currentDate)"
        :key="schedule.id"
        :style="getScheduleStyles(schedule)"
        class="cursor-pointer rounded-lg border-l-4 p-4 transition-shadow hover:shadow-md"
        @click="$emit('schedule-click', schedule)"
      >
        <div class="mb-3 flex items-start justify-between">
          <div class="flex-1">
            <div class="text-sm font-medium">{{ schedule.course?.course_name }}</div>
            <div class="mt-1 text-xs text-gray-600">
              {{ schedule.classroom }} |
              {{ formatTime(schedule.class_datetime) }} - {{ formatTime(schedule.end_datetime) }}
            </div>
          </div>
          <span :class="getStatusClass(schedule.status)">
            {{ getStatusText(schedule.status) }}
          </span>
        </div>

        <!-- 學生名單預覽 (僅日檢視顯示) -->
        <div class="mt-3 border-t border-gray-200 pt-3">
          <div class="mb-3 flex items-center justify-between">
            <div class="flex items-center">
              <UserGroupIcon class="mr-1 size-4 text-gray-500" />
              <span class="text-sm font-medium text-gray-700">
                學生名單
                <span v-if="schedule.studentCount !== undefined" class="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                  {{ schedule.studentCount }}人
                </span>
              </span>
            </div>
            <div v-if="schedule.loadingStudents" class="flex items-center text-xs text-gray-500">
              <svg class="-ml-1 mr-1 size-3 animate-spin text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              載入中...
            </div>
          </div>

          <!-- 學生名單內容 -->
          <div v-if="schedule.studentList && schedule.studentList.length > 0" class="max-h-48 overflow-y-auto">
            <div class="grid gap-2">
              <div
                v-for="(student, index) in schedule.studentList"
                :key="student.student_id"
                class="flex items-center justify-between rounded-lg bg-gray-50 p-2 transition-colors hover:bg-gray-100"
              >
                <div class="flex min-w-0 flex-1 items-center">
                  <div class="mr-2 flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600">
                    <span class="text-xs font-medium text-white">
                      {{ student.chinese_name?.charAt(0) || index + 1 }}
                    </span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium text-gray-900">
                      {{ student.chinese_name }}
                    </div>
                    <div v-if="student.english_name" class="truncate text-xs text-gray-600">
                      {{ student.english_name }}
                    </div>
                  </div>
                </div>
                <div class="ml-2 shrink-0">
                  <span class="inline-block rounded border border-gray-200 bg-white px-2 py-1 font-mono text-xs text-gray-600">
                    {{ student.student_id }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 載入失敗或無學生狀態 -->
          <div v-else-if="!schedule.loadingStudents" class="py-4 text-center">
            <div v-if="schedule.studentCount === 0" class="text-sm text-gray-500">
              <UserGroupIcon class="mx-auto mb-2 size-8 text-gray-300" />
              <p>目前沒有學生報名此課程</p>
            </div>
            <div v-else class="text-sm text-gray-500">
              <div class="mb-1 text-red-500">載入學生名單失敗</div>
              <button
                @click="retryLoadStudents(schedule)"
                class="text-xs text-blue-600 underline hover:text-blue-800"
              >
                點擊重試
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="getDaySchedules(currentDate).length === 0" class="py-8 text-center text-gray-500">
        <CalendarDaysIcon class="mx-auto mb-4 size-12 text-gray-300" />
        <p>今日沒有課程行事曆</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { UserGroupIcon, CalendarDaysIcon } from '@heroicons/vue/24/outline'
import { db, supabase } from '@/services/supabase'
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
}>()

// 使用分類顏色
const { loadCategories, getCategoryStyles } = useCategoryColors()

// 載入分類
onMounted(() => {
  loadCategories()
})

// ==================== 工具函數 ====================
function formatDateString(date: Date): string {
  // 使用本地時間格式化日期，避免時區問題
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
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

  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// ==================== 課程行事曆處理 ====================
function getDaySchedules(date: Date): Schedule[] {
  const daySchedules = getSchedulesForDate(formatDateString(date))

  // 為日檢視的每個課程行事曆載入學生名單
  daySchedules.forEach(schedule => {
    // 確保每個課程都有學生名單載入狀態
    if (schedule.studentListLoaded === undefined) {
      schedule.studentListLoaded = false
    }
    if (schedule.loadingStudents === undefined) {
      schedule.loadingStudents = false
    }
    if (schedule.studentList === undefined) {
      schedule.studentList = []
    }
    if (schedule.studentCount === undefined) {
      schedule.studentCount = 0
    }

    // 如果尚未載入學生名單，開始載入
    if (!schedule.studentListLoaded && !schedule.loadingStudents) {
      loadStudentListForSchedule(schedule)
    }
  })

  return daySchedules
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

function getSchedulesForDate(date: string): Schedule[] {
  return props.schedules.filter(schedule => {
    const scheduleDate = parseAsLocalTime(schedule.class_datetime)
    return formatDateString(scheduleDate) === date
  })
}

// 不再需要 getScheduleClass 函數，因為我們現在使用分類顏色

function getStatusClass(status: string): string {
  const classes = {
    'scheduled': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
    'completed': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800',
    'cancelled': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'
  }
  return classes[status as keyof typeof classes] || classes.scheduled
}

function getStatusText(status: string): string {
  const statusMap = {
    'scheduled': '已排程',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

// ==================== 學生名單載入 ====================
async function loadStudentListForSchedule(schedule: Schedule) {
  if (schedule.loadingStudents) {
    return
  }

  schedule.loadingStudents = true
  schedule.studentList = []
  schedule.studentCount = 0

  try {
    console.log('開始載入課程學生名單:', schedule.course_id)

    if (schedule.course_id) {
      // 使用標準 API 查詢報名此課程的學生
      const enrollments = await db.findMany('enrollments', {
        columns: 'student_id',
        filters: { course_id: schedule.course_id, status: 'active' }
      })

      console.log('找到報名記錄:', enrollments.length, '筆')

      if (enrollments.length > 0) {
        const studentIds = enrollments.map(e => e.student_id)

        // 批次查詢學生資料 (使用 Supabase 直接查詢支援 IN)
        const { data: students, error: studentsError } = await supabase
          .from('students')
          .select('id, student_id, chinese_name, english_name')
          .in('student_id', studentIds)
          .order('chinese_name')

        if (studentsError) {
          console.error('查詢學生資料失敗:', studentsError)
          throw studentsError
        }

        if (students) {
          console.log('成功載入學生資料:', students.length, '筆')
          schedule.studentList = students
          schedule.studentCount = students.length
        } else {
          schedule.studentList = []
          schedule.studentCount = 0
        }
      } else {
        schedule.studentList = []
        schedule.studentCount = 0
      }
    }
  } catch (error) {
    console.error('載入學生名單失敗:', error)
    schedule.studentList = []
    schedule.studentCount = undefined // 設為 undefined 表示載入失敗
  } finally {
    schedule.loadingStudents = false
    schedule.studentListLoaded = true
  }
}

// 重試載入學生名單
function retryLoadStudents(schedule: Schedule) {
  console.log('重試載入學生名單:', schedule.course_id)
  schedule.studentListLoaded = false
  loadStudentListForSchedule(schedule)
}

// 組件掛載時載入學生名單
onMounted(() => {
  const daySchedules = getDaySchedules(props.currentDate)
  daySchedules.forEach(schedule => {
    if (!schedule.studentListLoaded) {
      loadStudentListForSchedule(schedule)
    }
  })
})
</script>

<style scoped>
.calendar-view {
  @apply min-h-[600px];
}
</style>
