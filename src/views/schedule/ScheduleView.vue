<template>
  <MainLayout>
    <div class="space-y-6">
      <!-- 頁面標題與操作 -->
      <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            課程行事曆
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            管理課程時間表和教室安排，支援臨時課程（調課、私人預約等）
          </p>
        </div>
        <div class="mt-4 flex md:ml-4 md:mt-0">
          <button
            @click="openCreateModal"
            class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PlusIcon class="mr-1 size-4" />
            新增臨時課程
          </button>
        </div>
      </div>

      <!-- 篩選和檢視選項 -->
      <div class="card p-4">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium text-gray-700">檢視模式:</label>
            <select
              v-model="viewMode"
              class="min-w-[100px] rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">週檢視</option>
              <option value="month">月檢視</option>
              <option value="day">日檢視</option>
            </select>
          </div>

          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium text-gray-700">課程篩選:</label>
            <select
              v-model="selectedCourseFilter"
              class="min-w-[120px] rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部課程</option>
              <option
                v-for="course in courses"
                :key="course.course_id"
                :value="course.course_id"
              >
                {{ course.course_name }}
              </option>
            </select>
          </div>

          <div class="flex items-center space-x-2">
            <button
              @click="goToPrevious"
              class="rounded p-1 hover:bg-gray-100"
            >
              <ChevronLeftIcon class="size-5" />
            </button>
            <span class="min-w-[120px] text-center text-sm font-medium text-gray-900">
              {{ currentPeriodText }}
            </span>
            <button
              @click="goToNext"
              class="rounded p-1 hover:bg-gray-100"
            >
              <ChevronRightIcon class="size-5" />
            </button>
            <button
              @click="goToToday"
              class="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
            >
              今天
            </button>
          </div>
        </div>
      </div>

      <!-- 行事曆內容 -->
      <div class="card overflow-hidden">
        <!-- 週檢視 -->
        <WeekView
          v-if="viewMode === 'week'"
          :schedules="filteredSchedules"
          :current-date="currentDate"
          @schedule-click="openScheduleDetail"
          @time-slot-click="openCreateScheduleAt"
        />

        <!-- 月檢視 -->
        <MonthView
          v-else-if="viewMode === 'month'"
          :schedules="filteredSchedules"
          :current-date="currentDate"
          @schedule-click="openScheduleDetail"
          @date-click="openCreateScheduleAt"
        />

        <!-- 日檢視 -->
        <DayView
          v-else-if="viewMode === 'day'"
          :schedules="filteredSchedules"
          :current-date="currentDate"
          @schedule-click="openScheduleDetail"
        />
      </div>
    </div>

    <!-- 建立臨時課程 Modal -->
    <CreateScheduleModal
      v-if="showCreateModal"
      :courses="courses"
      :new-schedule="newSchedule"
      :creating="creating"
      @close="closeCreateModal"
      @save="createSchedule"
    />

    <!-- 課程詳情 Modal -->
    <ScheduleDetailModal
      v-if="showDetailModal"
      :schedule="selectedSchedule"
      :loading="loadingDetails"
      :instructor="instructorInfo"
      :students="enrolledStudents"
      @close="closeDetailModal"
      @mark-attendance="markAttendance"
      @delete="handleDeleteSchedule"
      @reschedule="handleRescheduleSchedule"
      @cancel-class="handleCancelSchedule"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import { db, supabase } from '@/services/supabase'
import type { Schedule, Course } from '@/types'
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'
import { useCategoryColors } from '@/composables/useCategoryColors'
import { useAuthStore } from '@/stores/authSupabase'
import { trackingService } from '@/services/trackingService'

// 組件導入
import WeekView from './components/WeekView.vue'
import MonthView from './components/MonthView.vue'
import DayView from './components/DayView.vue'
import CreateScheduleModal from './components/CreateScheduleModal.vue'
import ScheduleDetailModal from './components/ScheduleDetailModal.vue'

// ==================== 響應式狀態 ====================
const router = useRouter()
const authStore = useAuthStore()
const viewMode = ref<'week' | 'month' | 'day'>('week')
const currentDate = ref(new Date())
const selectedCourseFilter = ref('')
const schedules = ref<Schedule[]>([])
const courses = ref<Course[]>([])

// 使用分類顏色
const { loadCategories } = useCategoryColors()

// Modal 狀態
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const creating = ref(false)
const loadingDetails = ref(false)

// 選中的排程和詳情
const selectedSchedule = ref<Schedule | null>(null)
const instructorInfo = ref<any>(null)
const enrolledStudents = ref<any[]>([])
const editingScheduleId = ref<number | null>(null)

// 新增排程表單
const newSchedule = reactive({
  course_id: '',
  course_name: '',
  date: '',
  start_time: '',
  end_time: '',
  classroom: '',
  notes: ''
})

// ==================== 計算屬性 ====================
const currentPeriodText = computed(() => {
  const date = currentDate.value
  if (viewMode.value === 'month') {
    return `${date.getFullYear()}年 ${date.getMonth() + 1}月`
  } else if (viewMode.value === 'week') {
    const startOfWeek = getStartOfWeek(date)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    const startMonth = startOfWeek.getMonth() + 1
    const startDay = startOfWeek.getDate()
    const endMonth = endOfWeek.getMonth() + 1
    const endDay = endOfWeek.getDate()

    if (startMonth === endMonth) {
      return `${startMonth}/${startDay}-${endDay}`
    } else {
      return `${startMonth}/${startDay} - ${endMonth}/${endDay}`
    }
  } else {
    return `${date.getFullYear()}年 ${date.getMonth() + 1}月 ${date.getDate()}日`
  }
})

const filteredSchedules = computed(() => {
  if (!selectedCourseFilter.value) {
    return schedules.value
  }
  return schedules.value.filter(schedule =>
    schedule.course_id === selectedCourseFilter.value
  )
})

// ==================== 時間解析函數 ====================
function parseAsLocalTime(timeString: string): Date {
  if (!timeString) return new Date()

  if (timeString.includes('T')) {
    const [datePart, timePart] = timeString.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute, second = 0] = timePart.split(':').map(Number)
    return new Date(year, month - 1, day, hour, minute, second)
  } else {
    return new Date(timeString)
  }
}

// ==================== 工具函數 ====================
function getStartOfWeek(date: Date): Date {
  const result = new Date(date)
  const day = result.getDay()
  const diff = result.getDate() - day
  result.setDate(diff)
  return result
}

function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}


// ==================== 導航函數 ====================
function goToPrevious() {
  const newDate = new Date(currentDate.value)
  if (viewMode.value === 'month') {
    newDate.setMonth(newDate.getMonth() - 1)
  } else if (viewMode.value === 'week') {
    newDate.setDate(newDate.getDate() - 7)
  } else {
    newDate.setDate(newDate.getDate() - 1)
  }
  currentDate.value = newDate
}

function goToNext() {
  const newDate = new Date(currentDate.value)
  if (viewMode.value === 'month') {
    newDate.setMonth(newDate.getMonth() + 1)
  } else if (viewMode.value === 'week') {
    newDate.setDate(newDate.getDate() + 7)
  } else {
    newDate.setDate(newDate.getDate() + 1)
  }
  currentDate.value = newDate
}

function goToToday() {
  currentDate.value = new Date()
}

// ==================== Modal 處理函數 ====================
function openCreateModal() {
  // 重置表單
  Object.assign(newSchedule, {
    course_id: '',
    course_name: '',
    date: formatDateString(new Date()),
    start_time: '',
    end_time: '',
    classroom: '',
    notes: ''
  })
  showCreateModal.value = true
}

function openCreateScheduleAt(date: string, hour?: number) {
  newSchedule.date = date
  newSchedule.course_name = ''
  if (hour !== undefined) {
    newSchedule.start_time = `${hour.toString().padStart(2, '0')}:00`
    newSchedule.end_time = `${(hour + 1).toString().padStart(2, '0')}:00`
  }
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
  editingScheduleId.value = null
  Object.assign(newSchedule, {
    course_id: '',
    course_name: '',
    date: '',
    start_time: '',
    end_time: '',
    classroom: '',
    notes: ''
  })
}

function openScheduleDetail(schedule: Schedule) {
  selectedSchedule.value = schedule
  showDetailModal.value = true
  loadScheduleDetails(schedule)
}

function closeDetailModal() {
  showDetailModal.value = false
  selectedSchedule.value = null
  instructorInfo.value = null
  enrolledStudents.value = []
}

// ==================== 課程選擇處理 ====================
// 臨時課程不需要載入預設設定，移除此函數

// ==================== CRUD 操作 ====================
async function createSchedule() {
  creating.value = true
  try {
    if (!newSchedule.course_name || !newSchedule.date || !newSchedule.start_time || !newSchedule.end_time) {
      alert('請填寫所有必要欄位')
      return
    }

    // 檢查是否為編輯模式
    if (editingScheduleId.value) {
      // 編輯現有課程安排（調課）
      const originalSchedule = schedules.value.find(s => s.id === editingScheduleId.value)
      if (!originalSchedule) {
        alert('找不到原課程安排')
        return
      }

      // 載入該課程的學生名單
      const enrolledStudents = await loadEnrolledStudentsForSchedule(originalSchedule)

      const scheduleData = {
        class_datetime: `${newSchedule.date}T${newSchedule.start_time}:00`,
        end_datetime: `${newSchedule.date}T${newSchedule.end_time}:00`,
        classroom: newSchedule.classroom || '',
        notes: newSchedule.notes || ''
      }

      await db.update('schedules', editingScheduleId.value, scheduleData)

      // 如果有學生，創建調課通知
      if (enrolledStudents.length > 0) {
        const originalTime = `${originalSchedule.class_datetime.split('T')[0]} ${originalSchedule.class_datetime.split('T')[1].substring(0, 5)}-${originalSchedule.end_datetime.split('T')[1].substring(0, 5)}`
        const newTime = `${newSchedule.start_time}-${newSchedule.end_time}`

        await trackingService.createRescheduleNotification(editingScheduleId.value, {
          course_name: originalSchedule.course?.course_name || '未知課程',
          original_time: originalTime,
          new_date: newSchedule.date,
          new_time: newTime,
          students: enrolledStudents.map(student => ({
            student_id: student.student_id,
            chinese_name: student.chinese_name,
            english_name: student.english_name
          }))
        }, authStore.user?.user_id || 'UNKNOWN')
      }

      alert('課程時間調整成功，相關學生已加入追蹤名單')
    } else {
      // 創建新的臨時課程
      const now = new Date()
      const scheduleId = `TEMP${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`

      // 為臨時課程創建一個特殊的課程記錄
      const tempCourseId = `TEMP_COURSE_${scheduleId}`

      try {
        // 創建臨時課程記錄
        await db.create('courses', {
          course_id: tempCourseId,
          course_name: newSchedule.course_name,
          instructor_id: authStore.user?.user_id || 'SYSTEM', // 使用當前用戶或系統預設
          course_type: 'temporary',
          total_sessions: 1,
          max_students: 1,
          status: 'active',
          description: '臨時課程（調課、私人預約等）'
        })
      } catch (courseError) {
        console.warn('創建臨時課程記錄失敗，將使用預設課程ID:', courseError)
      }

      const scheduleData = {
        schedule_id: scheduleId,
        course_id: tempCourseId,
        class_datetime: `${newSchedule.date}T${newSchedule.start_time}:00`,
        end_datetime: `${newSchedule.date}T${newSchedule.end_time}:00`,
        session_number: 1,
        classroom: newSchedule.classroom || '',
        status: 'scheduled',
        is_makeup: false,
        notes: newSchedule.notes || ''
      }

      await db.create('schedules', scheduleData)
      alert('臨時課程建立成功')
    }

    closeCreateModal()
    await loadSchedules()
  } catch (error) {
    console.error('建立臨時課程失敗:', error)

    if (error.code === '23505') {
      alert('課程ID已存在，請重試')
    } else {
      alert(`建立臨時課程失敗：${error.message || '未知錯誤'}`)
    }
  } finally {
    creating.value = false
  }
}

async function loadCourses() {
  try {
    const data = await db.findMany('courses', {
      columns: 'course_id, course_name, status, schedule_pattern',
      filters: { status: 'active' },
      orderBy: 'course_name',
      ascending: true
    })

    courses.value = data || []
    console.log('載入課程數量:', courses.value.length)
  } catch (error) {
    console.error('載入課程失敗:', error)
    courses.value = []
  }
}

async function loadSchedules() {
  try {
    console.log('開始載入課程行事曆...')

    const data = await db.findMany('schedules', {
      columns: 'id, schedule_id, course_id, class_datetime, end_datetime, classroom, status, is_makeup, notes, created_at',
      orderBy: 'class_datetime',
      ascending: true
    })

    if (data?.length > 0) {
      // 載入關聯的課程資料
      const courseIds = [...new Set(data.map(schedule => schedule.course_id).filter(id => id))]

      if (courseIds.length > 0) {
        // 由於 db.findMany 不支援 IN 查詢，我們需要使用 Supabase 直接查詢
        const { data: courseData, error } = await supabase
          .from('courses')
          .select('course_id, course_name, category, schedule_pattern')
          .in('course_id', courseIds)

        if (error) {
          console.error('載入課程資料失敗:', error)
        } else if (courseData) {
          const courseMap = new Map(courseData.map(course => [course.course_id, course]))
          data.forEach(schedule => {
            if (schedule.course_id) {
              const course = courseMap.get(schedule.course_id)
              schedule.course = course

              // 保持資料庫中的原始時間，不需要修正
            }
          })
        }
      }
    }

    schedules.value = data || []
    console.log('載入課程行事曆數量:', schedules.value.length)
  } catch (error) {
    console.error('載入課程行事曆失敗:', error)
    schedules.value = []
  }
}

async function loadScheduleDetails(schedule: Schedule) {
  loadingDetails.value = true

  try {
    instructorInfo.value = null
    enrolledStudents.value = []

    await Promise.all([
      loadInstructorInfo(schedule),
      loadEnrolledStudents(schedule)
    ])
  } catch (error) {
    console.error('載入課程詳情失敗:', error)
  } finally {
    loadingDetails.value = false
  }
}

async function loadInstructorInfo(schedule: Schedule) {
  try {
    if (schedule.course_id) {
      // 使用 findMany 來查詢課程，並加載關聯的教師資料
      const courseData = await db.findMany('courses', {
        columns: `
          instructor_id,
          users!instructor_id (
            user_id,
            full_name
          )
        `,
        filters: { course_id: schedule.course_id },
        limit: 1
      })

      if (courseData && courseData.length > 0 && courseData[0].users) {
        instructorInfo.value = courseData[0].users
        console.log('載入教師資訊成功:', instructorInfo.value)
      } else {
        console.log('課程未指派教師或教師資料不存在')
        instructorInfo.value = null
      }
    }
  } catch (error) {
    console.error('載入教師資訊失敗:', error)
    instructorInfo.value = null
  }
}

async function loadEnrolledStudents(schedule: Schedule) {
  try {
    if (schedule.course_id) {
      const enrollments = await db.findMany('enrollments', {
        columns: 'student_id',
        filters: { course_id: schedule.course_id, status: 'active' }
      })

      if (enrollments.length > 0) {
        const studentIds = enrollments.map(e => e.student_id)
        const students = await db.findMany('students', {
          columns: 'id, student_id, chinese_name, english_name',
          filters: { student_id: studentIds }
        })

        enrolledStudents.value = students || []
      }
    }
  } catch (error) {
    console.error('載入學生名單失敗:', error)
  }
}

function markAttendance() {
  if (!selectedSchedule.value) {
    console.error('No selected schedule')
    return
  }

  console.log('Starting attendance for schedule:', selectedSchedule.value)

  // 關閉詳情 Modal
  closeDetailModal()

  // 跳轉到出席頁面，並傳遞課程和排程資訊
  const targetPath = {
    path: '/attendance/take',
    query: {
      courseId: selectedSchedule.value.course_id,
      scheduleId: selectedSchedule.value.id.toString(),
      date: selectedSchedule.value.class_datetime.split('T')[0] // 提取日期部分
    }
  }

  console.log('Navigating to:', targetPath)
  router.push(targetPath)
}

async function handleDeleteSchedule(scheduleId: number) {
  try {
    // 先取得 schedule_id 用來刪除相關記錄
    const schedule = schedules.value.find(s => s.id === scheduleId)
    if (!schedule) {
      alert('找不到要刪除的課程安排')
      return
    }

    // 先刪除相關的出席記錄（使用 schedule_id）
    try {
      const { error: attendanceError } = await supabase
        .from('attendance')
        .delete()
        .eq('schedule_id', schedule.schedule_id)

      if (attendanceError) {
        console.warn('刪除出席記錄時發生錯誤:', attendanceError)
      }
    } catch (attendanceErr) {
      console.warn('刪除出席記錄失敗:', attendanceErr)
    }

    // 刪除課程安排（使用 id）
    await db.delete('schedules', scheduleId)

    alert('課程安排已成功刪除')
    closeDetailModal()
    await loadSchedules()
  } catch (error) {
    console.error('刪除課程安排失敗:', error)
    alert(`刪除失敗：${error.message || '未知錯誤'}`)
  }
}

async function handleRescheduleSchedule(scheduleId: number) {
  try {
    const schedule = schedules.value.find(s => s.id === scheduleId)
    if (!schedule) {
      alert('找不到要調課的課程安排')
      return
    }

    // 關閉詳情modal，開啟調課功能
    closeDetailModal()

    // 開啟調課對話框 - 使用現有的CreateScheduleModal，預填當前資料
    Object.assign(newSchedule, {
      course_id: schedule.course_id,
      course_name: schedule.course?.course_name || '',
      date: schedule.class_datetime.split('T')[0],
      start_time: schedule.class_datetime.split('T')[1].substring(0, 5),
      end_time: schedule.end_datetime.split('T')[1].substring(0, 5),
      classroom: schedule.classroom || '',
      notes: schedule.notes || ''
    })

    // 設置為編輯模式
    editingScheduleId.value = scheduleId
    showCreateModal.value = true

  } catch (error) {
    console.error('調課失敗:', error)
    alert(`調課失敗：${error.message || '未知錯誤'}`)
  }
}

async function handleCancelSchedule(scheduleId: number) {
  try {
    const schedule = schedules.value.find(s => s.id === scheduleId)
    if (!schedule) {
      alert('找不到要停課的課程安排')
      return
    }

    // 載入該課程的學生名單
    const enrolledStudents = await loadEnrolledStudentsForSchedule(schedule)

    // 更新課程狀態為已取消
    await db.update('schedules', scheduleId, {
      status: 'cancelled',
      notes: `${schedule.notes || ''}\n[系統] 課程已停課 - ${new Date().toLocaleString()}`
    })

    // 如果有學生，創建停課通知
    if (enrolledStudents.length > 0) {
      const classTime = `${schedule.class_datetime.split('T')[0]} ${schedule.class_datetime.split('T')[1].substring(0, 5)}-${schedule.end_datetime.split('T')[1].substring(0, 5)}`

      await trackingService.createCancelNotification(scheduleId, {
        course_name: schedule.course?.course_name || '未知課程',
        class_time: classTime,
        students: enrolledStudents.map(student => ({
          student_id: student.student_id,
          chinese_name: student.chinese_name,
          english_name: student.english_name
        }))
      }, authStore.user?.user_id || 'UNKNOWN')
    }

    alert('課程已成功停課，相關學生已加入追蹤名單')
    closeDetailModal()
    await loadSchedules()
  } catch (error) {
    console.error('停課失敗:', error)
    alert(`停課失敗：${error.message || '未知錯誤'}`)
  }
}

// ==================== 輔助函數 ====================
async function loadEnrolledStudentsForSchedule(schedule: Schedule) {
  try {
    if (!schedule.course_id) {
      return []
    }

    // 查詢該課程的所有活躍學生
    const enrollments = await db.findMany('enrollments', {
      columns: 'student_id',
      filters: { course_id: schedule.course_id, status: 'active' }
    })

    if (enrollments.length === 0) {
      return []
    }

    // 查詢學生詳細資訊
    const studentIds = enrollments.map(e => e.student_id)
    const { data: students, error } = await supabase
      .from('students')
      .select('student_id, chinese_name, english_name')
      .in('student_id', studentIds)

    if (error) {
      console.error('載入學生資訊失敗:', error)
      return []
    }

    return students || []
  } catch (error) {
    console.error('載入學生名單失敗:', error)
    return []
  }
}

// ==================== 生命週期 ====================
onMounted(() => {
  loadCategories() // 載入分類顏色
  loadCourses()
  loadSchedules()
})
</script>

<style scoped>
.calendar-view {
  @apply min-h-[600px];
}
</style>
