<template>
  <MainLayout>
    <div class="space-y-8">
      <!-- 頁面標題 -->
      <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <h1 class="text-3xl font-bold tracking-tight sm:text-4xl" :style="{ color: 'var(--color-text-primary)' }">
            今日學生管理
          </h1>
          <p class="mt-2 text-base font-medium" :style="{ color: 'var(--color-text-secondary)' }">
            {{ todayDateString }} · {{ authStore.user?.full_name }}
          </p>
        </div>
        <div class="mt-6 flex gap-4 md:ml-4 md:mt-0">
          <router-link
            to="/students/create"
            class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-400 hover:bg-gray-50"
          >
            <UserPlusIcon class="mr-2 size-5" />
            新增學生
          </router-link>
          <router-link
            to="/orders/create-simplified"
            class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700"
          >
            <PlusIcon class="mr-2 size-5" />
            新增訂單
          </router-link>
        </div>
      </div>

      <!-- 快速搜尋學生 -->
      <div class="relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <StudentSearchBox
          @select="handleStudentSelect"
          :show-contact-info="true"
        />
      </div>

      <!-- 主要內容區域 -->
      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <!-- 左側：今日課程 -->
        <div class="lg:col-span-1">
          <TodaySchedules
            :schedules="todaySchedules"
            :current-time="currentTime"
            :loading="loading"
            :schedule-students="scheduleStudents"
            :attendance-records="attendanceRecords"
            @refresh="refreshScheduleData"
            @navigate-attendance="handleNavigateAttendance"
            @export="handleExportSchedules"
          />
        </div>

        <!-- 中間：追蹤名單 -->
        <div class="lg:col-span-1">
          <DashboardTrackingList
            :items="trackingItems"
            :loading="trackingLoading"
            @refresh="refreshTrackingItems"
            @complete="handleTrackingComplete"
          />
        </div>

        <!-- 右側：注意事項 -->
        <div class="lg:col-span-1">
          <div class="min-h-[38rem] rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <HandoverNotes
              :notes="handoverNotes"
              :current-user="currentUser"
              @add-note="handleAddNote"
              @mark-read="handleMarkRead"
              @delete-note="handleDeleteNote"
              @mention-clicked="handleMentionClicked"
            />
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authSupabase'
import { format } from 'date-fns'
import { UserPlusIcon, PlusIcon } from '@heroicons/vue/24/outline'
import MainLayout from '@/components/layout/MainLayout.vue'
import StudentSearchBox from '@/components/students/StudentSearchBox.vue'
import TodaySchedules from '@/components/dashboard/TodaySchedules.vue'
import DashboardTrackingList from '@/components/dashboard/DashboardTrackingList.vue'
import HandoverNotes from '@/components/dashboard/HandoverNotes.vue'
import { useScheduleData } from '@/composables/dashboard/useScheduleData'
import { useTrackingData } from '@/composables/dashboard/useTrackingData'
import { useHandoverData } from '@/composables/dashboard/useHandoverData'
import { useCategoryColors } from '@/composables/useCategoryColors'

// Router and auth
const router = useRouter()
const authStore = useAuthStore()

// 使用組合式函數管理資料
const {
  todaySchedules,
  scheduleStudents,
  attendanceRecords,
  loading,
  loadTodaySchedules
} = useScheduleData()

const {
  trackingItems,
  trackingLoading,
  loadTrackingItems,
  handleItemComplete
} = useTrackingData()

const {
  handoverNotes,
  loadHandoverNotes,
  handleAddNote,
  handleMarkRead,
  handleDeleteNote,
  handleMentionClicked
} = useHandoverData()

const { loadCategories } = useCategoryColors()

// 時間相關
const currentTime = ref('')
let timeInterval: ReturnType<typeof setInterval> | null = null

// Current user for HandoverNotes component
const currentUser = computed(() => ({
  user_id: authStore.user?.user_id || '',
  full_name: authStore.user?.full_name || ''
}))

// 計算屬性
const todayDateString = computed(() => {
  const today = new Date()
  return today.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

// 更新當前時間
function updateCurrentTime() {
  currentTime.value = format(new Date(), 'HH:mm:ss')
}

// 處理學生選擇
function handleStudentSelect(student: any) {
  router.push(`/students/${student.student_id}`)
}

// 重新整理資料
async function refreshScheduleData() {
  await loadTodaySchedules()
}

async function refreshTrackingItems() {
  await loadTrackingItems()
}

// 處理追蹤項目完成狀態
async function handleTrackingComplete(data: { id: string; completed: boolean }) {
  await handleItemComplete(data.id, data.completed)
}

// 處理點名導航
function handleNavigateAttendance(scheduleId: string) {
  router.push(`/attendance/take?schedule=${scheduleId}`)
}

// 處理匯出課程名單
function handleExportSchedules() {
  // TODO: 實作匯出功能
  console.log('Export schedules')
}

// 定時器
let refreshInterval: number | undefined

// 初始化
onMounted(async () => {
  // 並行載入所有資料
  await Promise.all([
    loadCategories(), // 載入課程分類顏色
    loadTodaySchedules(),
    loadTrackingItems(),
    loadHandoverNotes()
  ])

  // 開始更新時間
  updateCurrentTime()
  timeInterval = setInterval(updateCurrentTime, 1000)

  // 每5分鐘更新資料
  refreshInterval = window.setInterval(() => {
    Promise.all([
      loadTodaySchedules(),
      loadTrackingItems(),
      loadHandoverNotes()
    ])
  }, 300000)
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<style scoped>
/* 自定義樣式已由 Tailwind 處理 */
</style>
