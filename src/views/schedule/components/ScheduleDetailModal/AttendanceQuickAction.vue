<template>
  <div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
    <h4 class="mb-3 flex items-center text-lg font-medium text-gray-900">
      <ClipboardDocumentCheckIcon class="mr-2 size-5 text-yellow-600" />
      快速點名
    </h4>

    <!-- 載入中 -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="flex animate-pulse items-center">
        <div class="mr-3 size-8 rounded-full bg-gray-200"></div>
        <div class="flex-1">
          <div class="mb-1 h-4 w-1/3 rounded bg-gray-200"></div>
        </div>
        <div class="h-6 w-16 rounded bg-gray-200"></div>
      </div>
    </div>

    <!-- 有學生 -->
    <div v-else-if="students.length > 0" class="space-y-3">
      <div v-for="student in students" :key="student.id" class="flex items-center justify-between">
        <div class="flex items-center">
          <Avatar
            :name="student.chinese_name"
            :size="32"
            bg-color="bg-yellow-100"
            text-color="text-yellow-600"
            class="mr-3"
          />
          <div>
            <p class="text-sm font-medium text-gray-900">
              {{ student.chinese_name }}
            </p>
            <p class="text-xs text-gray-500">
              {{ student.student_id }}
            </p>
          </div>
        </div>

        <!-- 出席狀態按鈕 -->
        <div class="flex space-x-1">
          <button
            v-for="status in attendanceStatuses"
            :key="status.value"
            @click="setAttendanceStatus(student.id.toString(), status.value)"
            :class="[
              'rounded px-2 py-1 text-xs font-medium transition-colors duration-200',
              getAttendanceStatus(student.id.toString()) === status.value
                ? status.activeClass
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            ]"
          >
            {{ status.label }}
          </button>
        </div>
      </div>

      <!-- 批量操作 -->
      <div class="border-t border-yellow-200 pt-3">
        <div class="flex space-x-2">
          <button
            @click="markAllAs('present')"
            class="btn-sm btn-green"
          >
            全部出席
          </button>
          <button
            @click="markAllAs('absent')"
            class="btn-sm btn-red"
          >
            全部缺席
          </button>
          <button
            @click="clearAll"
            class="btn-sm btn-gray"
          >
            清除
          </button>
        </div>
      </div>

      <!-- 提交按鈕 -->
      <div class="border-t border-yellow-200 pt-3">
        <button
          @click="submitAttendance"
          :disabled="!hasAnyAttendance || submitting"
          class="btn btn-primary flex w-full items-center justify-center"
        >
          <svg v-if="submitting" class="-ml-1 mr-3 size-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-if="submitting">提交中...</span>
          <span v-else>
            提交點名記錄
            <span v-if="hasAnyAttendance" class="ml-1 text-sm">
              ({{ attendedCount }}/{{ students.length }})
            </span>
          </span>
        </button>

        <!-- 提示文字 -->
        <p v-if="!hasAnyAttendance" class="mt-2 text-center text-xs text-gray-500">
          請先為學生設定出席狀態
        </p>
        <p v-else-if="attendedCount === 0" class="mt-2 text-center text-xs text-amber-600">
          所有學生都是缺席/請假，確定要提交嗎？
        </p>
        <p v-else class="mt-2 text-center text-xs text-green-600">
          已設定 {{ Object.keys(attendanceData).length }} 名學生的出席狀態
        </p>
      </div>
    </div>

    <!-- 無學生 -->
    <div v-else class="py-4 text-center">
      <UserGroupIcon class="mx-auto mb-2 size-8 text-gray-300" />
      <p class="text-sm text-gray-500">目前沒有學生報名此課程</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ClipboardDocumentCheckIcon, UserGroupIcon } from '@heroicons/vue/24/outline'
import type { Student, Schedule } from '@/types'
import { db } from '@/services/supabase'
import { useAuthStore } from '@/stores/authSupabase'
import Avatar from './Avatar.vue'

interface Props {
  students: Student[]
  loading: boolean
  schedule: Schedule | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'attendance-submitted': []
}>()

// 獲取認證狀態
const authStore = useAuthStore()

// 出席狀態
const attendanceData = reactive<Record<string, string>>({})
const submitting = ref(false)

// 出席狀態選項
const attendanceStatuses = [
  { value: 'present', label: '出席', activeClass: 'text-white bg-green-600' },
  { value: 'absent', label: '缺席', activeClass: 'text-white bg-red-600' },
  { value: 'late', label: '遲到', activeClass: 'text-white bg-yellow-600' },
  { value: 'leave', label: '請假', activeClass: 'text-white bg-blue-600' }
]

// 計算屬性
const hasAnyAttendance = computed(() => {
  return Object.keys(attendanceData).length > 0
})

const attendedCount = computed(() => {
  return Object.values(attendanceData).filter(status =>
    ['present', 'late'].includes(status)
  ).length
})

// 方法
function getAttendanceStatus(studentId: string): string | undefined {
  return attendanceData[studentId]
}

function setAttendanceStatus(studentId: string, status: string) {
  attendanceData[studentId] = status
}

function markAllAs(status: string) {
  props.students.forEach(student => {
    attendanceData[student.id.toString()] = status
  })
}

function clearAll() {
  Object.keys(attendanceData).forEach(key => {
    delete attendanceData[key]
  })
}

async function submitAttendance() {
  if (!props.schedule || !hasAnyAttendance.value) return

  submitting.value = true

  // 獲取當前用戶資訊
  const authStore = useAuthStore()
  if (!authStore.user?.user_id) {
    alert('請先登入')
    submitting.value = false
    return
  }

  try {
    console.log('開始提交出席記錄，課程安排資訊:', {
      schedule_id: props.schedule!.schedule_id,
      course_id: props.schedule!.course_id,
      schedule: props.schedule
    })

    // 準備出席記錄資料
    const attendanceRecords = await Promise.all(
      Object.entries(attendanceData).map(async ([studentDbId, status]) => {
        // 找到對應的學生物件來獲取 student_id (studentDbId 是字符串)
        const student = props.students.find(s => s.id.toString() === studentDbId)
        if (!student) {
          console.error('找不到學生資料:', {
            searchId: studentDbId,
            searchIdType: typeof studentDbId,
            availableStudents: props.students.map(s => ({ id: s.id, idType: typeof s.id, name: s.chinese_name }))
          })
          throw new Error(`找不到學生資料 (DB ID: ${studentDbId})`)
        }

        // 根據學生ID和課程ID找到對應的enrollment_id
        const enrollmentData = await db.findOne('enrollments', {
          student_id: student.student_id,
          course_id: props.schedule!.course_id // 這個應該已經是正確的業務ID
        })

        if (!enrollmentData) {
          throw new Error(`找不到學生 ${student.student_id} (${student.chinese_name}) 在課程 ${props.schedule!.course_id} 的報名記錄`)
        }

        // 獲取當前用戶ID
        const currentUserId = authStore.user?.user_id
        if (!currentUserId) {
          throw new Error('無法獲取當前用戶ID，請重新登入')
        }

        return {
          schedule_id: props.schedule!.schedule_id, // 使用業務ID而非數據庫主鍵
          student_id: student.student_id,
          enrollment_id: enrollmentData.enrollment_id,
          status,
          session_deducted: ['present', 'late'].includes(status),
          marked_by: currentUserId, // 使用實際的用戶ID
          marked_at: new Date().toISOString(),
          teacher_notes: null
        }
      })
    )

    // 檢查是否已有出席記錄（防止重複提交）
    console.log('檢查現有出席記錄...')
    const existingAttendance = await db.findMany('attendance', {
      filters: { schedule_id: props.schedule!.schedule_id }
    })

    if (existingAttendance && existingAttendance.length > 0) {
      const confirmOverwrite = confirm(
        `此課程已有 ${existingAttendance.length} 筆出席記錄。\n是否要覆蓋現有記錄？`
      )
      if (!confirmOverwrite) {
        return
      }

      // 刪除現有記錄
      console.log('刪除現有出席記錄...')
      for (const existing of existingAttendance) {
        await db.delete('attendance', existing.id)
      }
    }

    // 批量提交出席記錄
    console.log('提交新的出席記錄...')
    for (const record of attendanceRecords) {
      await db.create('attendance', record)
    }

    // 清除資料
    clearAll()

    // 通知父組件
    emit('attendance-submitted')

    alert(`點名記錄已提交！記錄了 ${attendanceRecords.length} 名學生的出席狀況。`)

  } catch (error) {
    console.error('提交出席記錄失敗:', error)
    console.error('錯誤詳情:', {
      error,
      schedule: props.schedule,
      attendanceData
    })

    // 提供更詳細的錯誤訊息
    let errorMessage = '提交失敗，請稍後重試。'
    if (error instanceof Error) {
      if (error.message.includes('找不到學生')) {
        errorMessage = '學生資料有誤，請重新載入頁面後再試。'
      } else if (error.message.includes('找不到') && error.message.includes('報名記錄')) {
        errorMessage = '找不到學生的課程報名記錄，請確認學生已正確報名此課程。'
      } else if (error.message.includes('foreign key constraint')) {
        errorMessage = '資料關聯錯誤，請聯絡系統管理員。'
      }
    }
    alert(errorMessage)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.btn {
  @apply px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200;
}

.btn-primary {
  @apply text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-sm {
  @apply px-2 py-1 text-xs font-medium rounded transition-colors duration-200;
}

.btn-green {
  @apply text-white bg-green-600 hover:bg-green-700;
}

.btn-red {
  @apply text-white bg-red-600 hover:bg-red-700;
}

.btn-gray {
  @apply text-gray-700 bg-gray-200 hover:bg-gray-300;
}
</style>
