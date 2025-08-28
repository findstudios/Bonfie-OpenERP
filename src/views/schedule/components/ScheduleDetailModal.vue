<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-screen items-center justify-center px-4">
      <!-- 背景遮罩 -->
      <div class="fixed inset-0 bg-black opacity-50" @click="handleClose" />

      <!-- Modal 內容 -->
      <div class="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
        <!-- Header -->
        <ModalHeader
          :date="formatDetailDate(schedule?.class_datetime)"
          @close="handleClose"
        />

        <!-- Content -->
        <div v-if="schedule" class="max-h-[calc(90vh-120px)] space-y-6 overflow-y-auto p-6">
          <!-- 課程基本資訊 -->
          <CourseInfoSection
            :course="schedule.course"
            :classroom="schedule.classroom"
            :status="schedule.status"
            :is-makeup="schedule.is_makeup"
            :notes="schedule.notes"
            :class-time="formatClassTime()"
          />

          <!-- 教師資訊 -->
          <InstructorSection
            :instructor="instructor"
            :loading="loading"
          />

          <!-- 學生名單 -->
          <StudentsSection
            :students="students"
            :loading="loading"
          />

          <!-- 快速點名 (僅在課程狀態為已排程時顯示) -->
          <AttendanceQuickAction
            v-if="schedule.status === 'scheduled' && students.length > 0"
            :students="students"
            :loading="loading"
            :schedule="schedule"
            @attendance-submitted="handleAttendanceSubmitted"
          />

          <!-- 操作按鈕 -->
          <ActionButtons
            :can-mark-attendance="schedule.status === 'scheduled' && !showQuickAttendance"
            @close="handleClose"
            @mark-attendance="handleMarkAttendance"
            @delete="handleDelete"
            @reschedule="handleReschedule"
            @cancel-class="handleCancelClass"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Schedule, Instructor, Student } from '@/types'
import ModalHeader from './ScheduleDetailModal/ModalHeader.vue'
import CourseInfoSection from './ScheduleDetailModal/CourseInfoSection.vue'
import InstructorSection from './ScheduleDetailModal/InstructorSection.vue'
import StudentsSection from './ScheduleDetailModal/StudentsSection.vue'
import ActionButtons from './ScheduleDetailModal/ActionButtons.vue'
import AttendanceQuickAction from './ScheduleDetailModal/AttendanceQuickAction.vue'
import { useDateTimeFormatter } from '@/composables/useDateTimeFormatter'

// ==================== Props & Emits ====================
interface Props {
  schedule: Schedule | null
  loading: boolean
  instructor: Instructor | null
  students: Student[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'mark-attendance': []
  'delete': [scheduleId: number]
  'reschedule': [scheduleId: number]
  'cancel-class': [scheduleId: number]
}>()

// ==================== Composables ====================
const { parseAsLocalTime } = useDateTimeFormatter()

// ==================== Local State ====================
const showQuickAttendance = computed(() => {
  return props.schedule?.status === 'scheduled' && props.students.length > 0
})

// ==================== Computed ====================
const formattedDate = computed(() => {
  return formatDetailDate(props.schedule?.class_datetime)
})

const formattedClassTime = computed(() => {
  return formatClassTime()
})

// ==================== Methods ====================
function handleClose() {
  emit('close')
}

function handleMarkAttendance() {
  emit('mark-attendance')
}

function handleDelete() {
  if (props.schedule?.id) {
    emit('delete', props.schedule.id)
  }
}

function handleReschedule() {
  if (props.schedule?.id) {
    emit('reschedule', props.schedule.id)
  }
}

function handleCancelClass() {
  if (props.schedule?.id) {
    emit('cancel-class', props.schedule.id)
  }
}

function handleAttendanceSubmitted() {
  // 點名提交後可以選擇關閉 Modal 或刷新數據
  // 這裡暫時保持 Modal 開啟，讓用戶看到結果
  console.log('Attendance submitted successfully')
}

function formatDetailDate(dateString?: string): string {
  if (!dateString) return ''

  const date = parseAsLocalTime(dateString)

  if (isNaN(date.getTime())) {
    console.error('Invalid date:', dateString)
    return '日期格式錯誤'
  }

  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[date.getDay()]

  return `${month}/${day} 星期${weekday}`
}

function formatClassTime(): string {
  if (!props.schedule) return '尚未設定課程時間'

  // 優先使用課程的 schedule_pattern 中的預設時間
  if (props.schedule.course?.schedule_pattern) {
    const pattern = props.schedule.course.schedule_pattern

    if (pattern.start_time && pattern.end_time) {
      return `${pattern.start_time} - ${pattern.end_time}`
    }
  }

  // 如果沒有 schedule_pattern，使用實際排程時間
  if (props.schedule.class_datetime && props.schedule.end_datetime) {
    const startDate = parseAsLocalTime(props.schedule.class_datetime)
    const endDate = parseAsLocalTime(props.schedule.end_datetime)

    const startTime = startDate.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    const endTime = endDate.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })

    return `${startTime} - ${endTime}`
  }

  return '尚未設定課程時間'
}
</script>
