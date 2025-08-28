<template>
  <MainLayout>
    <div class="mx-auto max-w-6xl space-y-6">
      <!-- 頁面標題 -->
      <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            課程點名
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            記錄學生出席狀況
          </p>
        </div>
        <div class="mt-4 flex md:ml-4 md:mt-0">
          <router-link
            to="/attendance"
            class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <ArrowLeftIcon class="mr-1 size-4" />
            返回列表
          </router-link>
        </div>
      </div>

      <!-- 選擇課程 -->
      <div class="card p-6">
        <h3 class="mb-2 text-lg font-medium text-gray-900">
          {{ route.query.courseId ? '課程點名' : '選擇課程' }}
        </h3>
        <div v-if="route.query.courseId" class="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p class="text-sm text-blue-700">
            📅 已自動選擇課程和日期，請確認上課時段後開始點名
          </p>
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label for="schedule_date" class="mb-1 block text-sm font-medium text-gray-700">
              上課日期
            </label>
            <input
              id="schedule_date"
              v-model="selectedDate"
              type="date"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              @change="loadSchedules"
            />
          </div>
          <div>
            <label for="schedule_select" class="mb-1 block text-sm font-medium text-gray-700">
              課程安排
            </label>
            <select
              id="schedule_select"
              v-model="selectedScheduleId"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              @change="loadEnrolledStudents"
            >
              <option value="">
                {{ route.query.courseId ? '請選擇上課時段' : '請選擇課程' }}
                (共 {{ availableSchedules.length }} 個)
              </option>
              <option v-for="schedule in availableSchedules" :key="`schedule-${schedule.id}`" :value="schedule.id">
                {{ schedule.courses?.course_name || schedule.course?.course_name || 'Unknown Course' }} - {{ formatTime(schedule.class_datetime) }} ({{ schedule.classroom }})
              </option>
            </select>
            <!-- 調試資訊 -->
            <div class="mt-2 text-xs text-gray-500">
              <div>調試: 找到 {{ availableSchedules.length }} 個課程安排</div>
              <div v-if="availableSchedules.length > 0">
                課程列表:
                <span v-for="(schedule, index) in availableSchedules" :key="`debug-${schedule.id}`">
                  {{ index > 0 ? ', ' : '' }}{{ schedule.courses?.course_name || schedule.course?.course_name || 'Unknown' }}(ID:{{ schedule.id }})
                </span>
              </div>
              <div v-else>
                沒有找到符合條件的課程安排
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 學生名單 -->
      <div v-if="selectedSchedule" class="card">
        <div class="border-b border-gray-200 px-6 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-medium text-gray-900">
                {{ selectedSchedule.courses?.course_name || selectedSchedule.course?.course_name }}
              </h3>
              <p class="text-sm text-gray-500">
                {{ formatDateTime(selectedSchedule.class_datetime) }} - {{ selectedSchedule.classroom }}
              </p>
            </div>
            <div class="text-sm text-gray-500">
              共 {{ enrolledStudents.length }} 名學生
            </div>
          </div>
        </div>

        <!-- 學生出席列表 -->
        <div v-if="enrolledStudents.length === 0" class="p-6 text-center">
          <UserGroupIcon class="mx-auto size-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">沒有學生報名</h3>
          <p class="mt-1 text-sm text-gray-500">
            此課程目前沒有學生報名
          </p>
        </div>

        <div v-else class="p-6">
          <!-- 臨時學生管理區域 -->
          <div class="mb-6 rounded-lg bg-blue-50 p-4">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h3 class="text-sm font-semibold text-blue-900">
                  臨時學生管理
                </h3>
                <p class="mt-1 text-xs text-blue-700">管理試聽、補課或臨時付費學生</p>
              </div>
              <button
                @click="showAddTempStudent = true"
                :disabled="!canAddTempStudent"
                class="inline-flex items-center rounded-lg border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <UserPlusIcon class="mr-2 size-4" />
                加入學生
              </button>
            </div>

            <!-- 已加入的臨時學生列表 -->
            <div v-if="tempStudents.length > 0" class="space-y-2">
              <div v-for="temp in tempStudents" :key="temp.id"
                class="flex items-center justify-between rounded bg-white p-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium">{{ temp.student.chinese_name }}</span>
                  <span class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
                    :class="getTempTypeBadgeClass(temp.type)">
                    {{ getTempTypeLabel(temp.type) }}
                  </span>
                  <span v-if="temp.type === 'makeup'" class="text-xs text-gray-500">
                    (來自: {{ temp.originalCourse?.course_name }})
                  </span>
                </div>
                <button @click="removeTempStudent(temp.id)" class="text-red-500 hover:text-red-700">
                  <XMarkIcon class="size-4" />
                </button>
              </div>
            </div>
            <div v-else class="text-sm text-gray-500">
              尚未加入任何臨時學生
            </div>
          </div>

          <!-- 快速操作 -->
          <div class="mb-6">
            <div class="mb-4 flex items-center justify-between">
              <h4 class="text-sm font-semibold text-gray-900">快速操作</h4>
              <span class="text-xs text-gray-500">批量設定學生出席狀態</span>
            </div>
            <div class="flex flex-wrap gap-3">
              <button
                @click="markAllPresent"
                class="inline-flex items-center rounded-lg border border-transparent bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <CheckIcon class="mr-2 size-4" />
                全部出席
              </button>
              <button
                @click="markAllAbsent"
                class="inline-flex items-center rounded-lg border border-transparent bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <XMarkIcon class="mr-2 size-4" />
                全部缺席
              </button>
              <button
                @click="resetAttendance"
                class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <ArrowPathIcon class="mr-2 size-4" />
                重置
              </button>
            </div>
          </div>

          <!-- 學生列表 -->
          <div class="space-y-4">
            <div
              v-for="student in allStudents"
              :key="student.uniqueKey"
              class="rounded-lg border hover:bg-gray-50"
              :class="student.isTemporary ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'"
            >
              <div class="flex items-center justify-between p-4">
                <div class="flex items-center space-x-4">
                  <div class="size-10 shrink-0">
                    <div class="flex size-10 items-center justify-center rounded-full bg-blue-100">
                      <span class="text-sm font-medium text-blue-600">
                        {{ student.chinese_name.charAt(0) }}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      {{ student.chinese_name }}
                      <span v-if="student.english_name" class="text-gray-500">
                        ({{ student.english_name }})
                      </span>
                      <span v-if="student.isTemporary" class="ml-2 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
                        :class="getTempTypeBadgeClass(student.tempInfo?.type)">
                        {{ getTempTypeLabel(student.tempInfo?.type) }}
                      </span>
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ student.student_id }}
                      <span v-if="student.isTemporary && student.tempInfo?.type === 'makeup'" class="ml-2">
                        (來自: {{ student.tempInfo?.originalCourse?.course_name }})
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 出席狀態選擇 -->
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="status in attendanceStatuses"
                    :key="status.value"
                    @click="setAttendanceStatus(student.uniqueKey, status.value)"
                    :class="[
                      'rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-200',
                      attendanceData[student.uniqueKey]?.status === status.value
                        ? `${status.activeClass} border-transparent shadow-sm`
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    ]"
                  >
                    {{ status.label }}
                  </button>
                </div>
              </div>

              <!-- 個別備註 -->
              <div v-if="attendanceData[student.uniqueKey]?.status" class="px-4 pb-4">
                <label :for="`notes-${student.uniqueKey}`" class="mb-1 block text-xs font-medium text-gray-700">
                  備註
                </label>
                <input
                  :id="`notes-${student.uniqueKey}`"
                  v-model="attendanceData[student.uniqueKey].notes"
                  type="text"
                  class="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="記錄特殊狀況或備註"
                />
              </div>
            </div>
          </div>

          <!-- 備註 -->
          <div class="mt-6">
            <label for="notes" class="mb-1 block text-sm font-medium text-gray-700">
              課程備註
            </label>
            <textarea
              id="notes"
              v-model="classNotes"
              rows="3"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="記錄課程內容、學生表現或其他注意事項"
            ></textarea>
          </div>

          <!-- 提交按鈕 -->
          <div class="mt-8 border-t border-gray-200 pt-6">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <!-- 左側：統計資訊 -->
              <div class="text-sm text-gray-600">
                <span class="font-medium">已設定：{{ Object.keys(attendanceData).length }} / {{ allStudents.length }} 人</span>
                <span v-if="Object.keys(attendanceData).length > 0" class="ml-4">
                  出席：{{ Object.values(attendanceData).filter(a => a.status === 'present').length }} 人
                </span>
              </div>

              <!-- 右側：操作按鈕 -->
              <div class="flex gap-3">
                <button
                  @click="saveDraft"
                  :disabled="saving"
                  class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  儲存草稿
                </button>
                <button
                  @click="submitAttendance"
                  :disabled="saving || !hasAttendanceData"
                  class="inline-flex items-center rounded-lg border border-transparent bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  <div v-if="saving" class="mr-2 size-4 animate-spin rounded-full border-b-2 border-white"></div>
                  {{ saving ? '提交中...' : '提交點名' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加入臨時學生的 Modal -->
    <Teleport to="body">
      <div v-if="showAddTempStudent" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex min-h-screen items-center justify-center px-4">
          <!-- 背景遮罩 -->
          <div class="fixed inset-0 bg-black opacity-50" @click="cancelAddTemp"></div>

          <!-- Modal 內容 -->
          <div class="relative w-full max-w-md rounded-lg bg-white p-6">
            <h3 class="mb-4 text-lg font-medium">加入臨時學生</h3>

            <!-- 步驟 1: 選擇學生 -->
            <div v-if="addTempStep === 1" class="space-y-4">
              <div>
                <label class="mb-2 block text-sm font-medium">搜尋學生</label>
                <input
                  v-model="searchStudent"
                  @input="onSearchStudent"
                  placeholder="輸入學生姓名或編號"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- 搜尋結果 -->
              <div v-if="searchResults.length > 0" class="max-h-60 overflow-y-auto rounded-lg border">
                <div v-for="student in searchResults" :key="student.student_id"
                  @click="selectTempStudent(student)"
                  class="cursor-pointer border-b p-3 last:border-b-0 hover:bg-gray-50">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="font-medium">
                        {{ student.chinese_name }}
                        <span v-if="student._type === 'lead'" class="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-800">
                          試聽
                        </span>
                      </div>
                      <div class="text-sm text-gray-500">{{ student.student_id }}</div>
                      <!-- 顯示聯絡人資訊 -->
                      <div v-if="student.primary_contact" class="mt-1 text-xs text-gray-400">
                        <span class="font-medium">{{ student.primary_contact.relationship }}：</span>
                        {{ student.primary_contact.full_name }} - {{ student.primary_contact.phone }}
                      </div>
                      <!-- 顯示備註或其他資訊 -->
                      <div v-if="student.notes" class="mt-1 text-xs text-gray-400">
                        {{ student.notes }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else-if="searchStudent && !searchingStudent" class="py-4 text-center text-sm text-gray-500">
                沒有找到符合的學生
              </div>
            </div>

            <!-- 步驟 2: 選擇類型 -->
            <div v-if="addTempStep === 2" class="space-y-4">
              <div class="mb-2 text-sm">
                學生: <span class="font-medium">{{ selectedTempStudent.chinese_name }}</span>
                <span v-if="selectedTempStudent._type === 'lead'" class="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-800">
                  試聽
                </span>
                <div v-if="selectedTempStudent.primary_contact" class="mt-1 text-xs text-gray-500">
                  {{ selectedTempStudent.primary_contact.relationship }}：{{ selectedTempStudent.primary_contact.full_name }} - {{ selectedTempStudent.primary_contact.phone }}
                </div>
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium">加入類型</label>
                <select v-model="tempType" class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" @change="onTempTypeChange">
                  <option value="">請選擇</option>
                  <option value="makeup">補課</option>
                  <option value="trial">試聽</option>
                  <option value="temporary">臨時付費</option>
                </select>
              </div>

              <!-- 補課：選擇原課程 -->
              <div v-if="tempType === 'makeup'" class="space-y-3">
                <div>
                  <label class="mb-2 block text-sm font-medium">選擇原課程</label>
                  <select v-model="selectedOriginalEnrollment" class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500">
                    <option value="">請選擇</option>
                    <option v-for="enrollment in studentEnrollments"
                      :key="enrollment.enrollment_id"
                      :value="enrollment.enrollment_id"
                      :disabled="enrollment.remaining_sessions <= 0">
                      {{ enrollment.course.course_name }}
                      (剩餘 {{ enrollment.remaining_sessions }} 堂)
                    </option>
                  </select>
                </div>

                <div v-if="selectedOriginalEnrollment" class="rounded bg-yellow-50 p-3 text-sm">
                  <p class="font-medium text-yellow-800">注意事項：</p>
                  <ul class="mt-1 space-y-1 text-yellow-700">
                    <li>• 此次出席將從原課程扣除 1 堂</li>
                    <li>• 剩餘堂數：{{ getSelectedEnrollmentSessions }} 堂</li>
                    <li>• 請確認學生同意此安排</li>
                  </ul>
                </div>
              </div>

              <!-- 臨時付費：記錄費用 -->
              <div v-if="tempType === 'temporary'" class="space-y-3">
                <div>
                  <label class="mb-2 block text-sm font-medium">收費金額</label>
                  <input v-model.number="tempFee" type="number" class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" placeholder="請輸入金額">
                </div>
                <div class="rounded bg-blue-50 p-3 text-sm text-blue-700">
                  請記得在課後收取費用並開立收據
                </div>
              </div>

              <!-- 備註 -->
              <div>
                <label class="mb-2 block text-sm font-medium">備註</label>
                <textarea v-model="tempNotes" rows="2" class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"></textarea>
              </div>
            </div>

            <!-- 按鈕 -->
            <div class="mt-6 flex justify-end gap-2">
              <button @click="cancelAddTemp" class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                取消
              </button>
              <button v-if="addTempStep === 1"
                @click="nextStep"
                :disabled="!selectedTempStudent"
                class="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                下一步
              </button>
              <button v-if="addTempStep === 2"
                @click="confirmAddTemp"
                :disabled="!canConfirmTemp"
                class="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                確認加入
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import { db, supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'
import type { Schedule, Student } from '@/types'
import {
  ArrowLeftIcon,
  CheckIcon,
  ArrowPathIcon,
  UserGroupIcon,
  XMarkIcon,
  UserPlusIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const selectedDate = ref((route.query.date as string) || new Date().toISOString().split('T')[0]) // 使用查詢參數的日期，否則使用今天
const selectedScheduleId = ref('')
const availableSchedules = ref<Schedule[]>([])
const enrolledStudents = ref<Student[]>([])
const attendanceData = reactive<Record<string, { status: string; notes?: string }>>({})
const classNotes = ref('')
const saving = ref(false)

// 臨時學生相關變量
const tempStudents = ref<any[]>([])
const showAddTempStudent = ref(false)
const addTempStep = ref(1)
const searchStudent = ref('')
const searchingStudent = ref(false)
const searchResults = ref<Student[]>([])
const selectedTempStudent = ref<Student | null>(null)
const tempType = ref('')
const selectedOriginalEnrollment = ref('')
const studentEnrollments = ref<any[]>([])
const tempFee = ref<number | null>(null)
const tempNotes = ref('')

const selectedSchedule = computed(() => {
  return availableSchedules.value.find(s => s.id === Number(selectedScheduleId.value))
})

const hasAttendanceData = computed(() => {
  return Object.keys(attendanceData).length > 0
})

const attendanceStatuses = [
  { value: 'present', label: '出席', activeClass: 'text-white bg-green-600' },
  { value: 'absent', label: '缺席', activeClass: 'text-white bg-red-600' },
  { value: 'late', label: '遲到', activeClass: 'text-white bg-yellow-600' },
  { value: 'leave', label: '請假', activeClass: 'text-white bg-blue-600' }
]

// 權限控制
const canAddTempStudent = computed(() => {
  const userRole = authStore.user?.role?.role_code || authStore.user?.role_code
  return userRole === 'ADMIN' || userRole === 'TEACHER' || userRole === 'STAFF'
})

// 合併正常學生和臨時學生
const allStudents = computed(() => {
  const normalStudents = enrolledStudents.value.map(student => ({
    ...student,
    uniqueKey: `student_${student.id}`,
    isTemporary: false
  }))

  const tempStudentsList = tempStudents.value.map(temp => ({
    ...temp.student,
    uniqueKey: `temp_${temp.id}`,
    isTemporary: true,
    tempInfo: temp
  }))

  return [...normalStudents, ...tempStudentsList]
})

// 計算屬性
const canConfirmTemp = computed(() => {
  if (!tempType.value) return false
  if (tempType.value === 'makeup' && !selectedOriginalEnrollment.value) return false
  if (tempType.value === 'temporary' && (!tempFee.value || tempFee.value <= 0)) return false
  return true
})

const getSelectedEnrollmentSessions = computed(() => {
  const enrollment = studentEnrollments.value.find(e => e.enrollment_id === selectedOriginalEnrollment.value)
  return enrollment?.remaining_sessions || 0
})

// 輔助函數
function getTempTypeBadgeClass(type: string) {
  switch(type) {
    case 'makeup': return 'bg-yellow-100 text-yellow-800'
    case 'trial': return 'bg-green-100 text-green-800'
    case 'temporary': return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getTempTypeLabel(type: string) {
  switch(type) {
    case 'makeup': return '補課'
    case 'trial': return '試聽'
    case 'temporary': return '臨時'
    default: return '未知'
  }
}

async function loadSchedules() {
  try {
    console.log('Loading schedules for date:', selectedDate.value)

    // 檢查是否有指定的 courseId 參數
    const courseId = route.query.courseId as string
    console.log('CourseId from query:', courseId)

    const filters: any = {
      status: 'scheduled'
    }

    // 如果有指定 courseId，則只載入該課程的排程
    if (courseId) {
      filters.course_id = courseId
    }

    const data = await db.findMany('schedules', {
      columns: `
        id,
        schedule_id,
        course_id,
        class_datetime,
        end_datetime,
        classroom,
        status,
        courses(course_id, course_name, category)
      `,
      filters,
      orderBy: 'class_datetime',
      ascending: true
    })

    console.log('All schedules from database:', data)

    // 篩選指定日期的課程
    availableSchedules.value = data.filter(schedule => {
      // 處理時區問題 - 直接比較日期字符串的前10個字符
      const scheduleDateStr = schedule.class_datetime.substring(0, 10)

      console.log('Schedule date:', schedule.class_datetime, '-> Date string:', scheduleDateStr, 'Selected:', selectedDate.value)
      return scheduleDateStr === selectedDate.value
    })

    console.log('Filtered schedules:', availableSchedules.value)

    // 檢查是否有指定的 scheduleId 參數（支援路由參數和查詢參數）
    const scheduleId = route.params.id as string || route.query.scheduleId as string

    // 如果有 scheduleId，根據 schedule_id 欄位查找對應的課程
    if (scheduleId) {
      const matchingSchedule = availableSchedules.value.find(s => s.schedule_id === scheduleId)
      if (matchingSchedule) {
        selectedScheduleId.value = matchingSchedule.id.toString()
        // 自動載入學生名單
        loadEnrolledStudents()
      } else {
        // 如果沒找到匹配的 schedule_id，嘗試用 id 欄位匹配（向後相容）
        if (availableSchedules.value.some(s => s.id.toString() === scheduleId)) {
          selectedScheduleId.value = scheduleId
          loadEnrolledStudents()
        }
      }
    } else {
      // 清除選擇
      selectedScheduleId.value = ''
      enrolledStudents.value = []
      Object.keys(attendanceData).forEach(key => delete attendanceData[key])
    }

    // 使用 nextTick 確保 DOM 更新
    await nextTick()
    console.log('DOM updated, availableSchedules count:', availableSchedules.value.length)

    // 額外調試信息
    availableSchedules.value.forEach((schedule, index) => {
      console.log(`Schedule ${index}:`, {
        id: schedule.id,
        schedule_id: schedule.schedule_id,
        course_id: schedule.course_id,
        course_name: schedule.courses?.course_name || schedule.course?.course_name,
        class_datetime: schedule.class_datetime,
        classroom: schedule.classroom,
        status: schedule.status,
        full_object: schedule
      })
    })
  } catch (error) {
    console.error('載入課程安排失敗:', error)
  }
}

async function loadEnrolledStudents() {
  if (!selectedScheduleId.value) {
    enrolledStudents.value = []
    return
  }

  try {
    // 通過 enrollments 表獲取報名學生
    const enrollments = await db.findMany('enrollments', {
      columns: `
        id,
        student_id,
        course_id,
        status,
        student:students(
          id,
          student_id,
          chinese_name,
          english_name,
          is_active
        )
      `,
      filters: {
        course_id: selectedSchedule.value?.course_id,
        status: 'active'
      }
    })

    enrolledStudents.value = enrollments
      .map(enrollment => enrollment.student)
      .filter(student => student && student.is_active)

    // 重置出席資料
    Object.keys(attendanceData).forEach(key => delete attendanceData[key])
  } catch (error) {
    console.error('載入學生名單失敗:', error)
  }
}

function setAttendanceStatus(uniqueKey: string, status: string) {
  if (!attendanceData[uniqueKey]) {
    attendanceData[uniqueKey] = { status, notes: '' }
  } else {
    attendanceData[uniqueKey].status = status
  }
}

function markAllPresent() {
  allStudents.value.forEach(student => {
    if (!attendanceData[student.uniqueKey]) {
      attendanceData[student.uniqueKey] = { status: 'present', notes: '' }
    } else {
      attendanceData[student.uniqueKey].status = 'present'
    }
  })
}

function markAllAbsent() {
  allStudents.value.forEach(student => {
    if (!attendanceData[student.uniqueKey]) {
      attendanceData[student.uniqueKey] = { status: 'absent', notes: '' }
    } else {
      attendanceData[student.uniqueKey].status = 'absent'
    }
  })
}

function resetAttendance() {
  Object.keys(attendanceData).forEach(key => delete attendanceData[key])
}

async function saveDraft() {
  saving.value = true
  try {
    // 儲存草稿到本地存儲
    const draftData = {
      scheduleId: selectedScheduleId.value,
      attendanceData: { ...attendanceData },
      classNotes: classNotes.value,
      timestamp: new Date().toISOString()
    }

    localStorage.setItem('attendance_draft', JSON.stringify(draftData))
    alert('草稿已儲存')
  } catch (error) {
    console.error('儲存草稿失敗:', error)
    alert('儲存草稿失敗')
  } finally {
    saving.value = false
  }
}

async function submitAttendance() {
  saving.value = true
  try {
    // 驗證必要資料
    if (!selectedSchedule.value) {
      alert('請先選擇課程')
      return
    }

    if (Object.keys(attendanceData).length === 0) {
      alert('請至少選擇一位學生的出席狀態')
      return
    }

    // 檢查用戶認證狀態
    console.log('檢查用戶認證狀態:', {
      'authStore.user': authStore.user,
      'authStore.isAuthenticated': authStore.isAuthenticated
    })

    // 最後檢查
    if (!authStore.user) {
      alert('用戶未登入，請重新登入')
      return
    }

    console.log('Current user:', authStore.user)
    console.log('Selected schedule:', selectedSchedule.value)
    console.log('Course ID:', selectedSchedule.value?.course_id)
    console.log('Enrolled students:', enrolledStudents.value)

    // 獲取對應的 enrollment_id
    const enrollments = await db.findMany('enrollments', {
      columns: 'id, enrollment_id, student_id, course_id',
      filters: {
        course_id: selectedSchedule.value?.course_id,
        status: 'active'
      }
    })

    console.log('Enrollments found:', enrollments)

    // 建立學生ID到enrollment的映射
    const studentToEnrollment = new Map()
    enrollments.forEach(enrollment => {
      // 學生資料中的 id 對應到 enrollment 的 student_id
      studentToEnrollment.set(enrollment.student_id, enrollment)
    })

    console.log('Student to enrollment mapping:', studentToEnrollment)

    // 獲取當前用戶ID
    const userId = authStore.user?.user_id
    if (!userId) {
      alert('用戶資料錯誤，請重新登入')
      router.push('/login')
      return
    }
    console.log('當前用戶 user_id:', userId)

    // 提交所有出席記錄
    const attendanceRecords = []
    const tempAttendanceRecords = []

    for (const [uniqueKey, data] of Object.entries(attendanceData)) {
      // 判斷是正常學生還是臨時學生
      const isTemp = uniqueKey.startsWith('temp_')

      if (isTemp) {
        // 處理臨時學生
        const tempStudent = tempStudents.value.find(t => `temp_${t.id}` === uniqueKey)
        if (!tempStudent) continue

        tempAttendanceRecords.push({
          uniqueKey,
          data,
          tempStudent
        })
      } else {
        // 處理正常學生
        const studentIdNum = parseInt(uniqueKey.replace('student_', ''))
        const student = enrolledStudents.value.find(s => s.id === studentIdNum)
        const enrollment = studentToEnrollment.get(student?.student_id)

        if (!enrollment) {
          console.error(`找不到學生 ${student?.chinese_name} 的報名記錄`)
          alert(`找不到學生 ${student?.chinese_name} 的報名記錄，請檢查學生是否已報名此課程`)
          return
        }

        const record = {
          schedule_id: selectedSchedule.value.schedule_id,
          student_id: student.student_id, // 使用學生編號，不是 id
          enrollment_id: enrollment.enrollment_id,
          status: data.status,
          session_deducted: data.status === 'present' || data.status === 'late',
          teacher_notes: data.notes || null,
          marked_at: new Date().toISOString(),
          marked_by: userId
        }

        console.log('準備創建出席記錄:', record)
        console.log('使用的 user_id:', record.marked_by)
        attendanceRecords.push(record)
      }
    }

    // 檢查是否已經有出席記錄
    console.log('檢查重複記錄...')
    const existingRecords = await db.findMany('attendance', {
      columns: 'id, schedule_id, student_id, status',
      filters: {
        schedule_id: selectedSchedule.value.schedule_id
      }
    })

    console.log('現有記錄:', existingRecords)

    if (existingRecords && existingRecords.length > 0) {
      const confirmation = confirm(`此課程已有 ${existingRecords.length} 筆出席記錄，是否要覆蓋？`)
      if (!confirmation) {
        return
      }

      // 刪除現有記錄
      for (const existing of existingRecords) {
        await db.delete('attendance', existing.id)
        console.log('刪除現有記錄:', existing.id)
      }
    }

    // 批次創建出席記錄
    for (const record of attendanceRecords) {
      try {
        console.log('嘗試創建出席記錄:', record)
        const result = await db.create('attendance', record)
        console.log('✅ 成功創建出席記錄:', result.id, '學生:', record.student_id)
      } catch (error) {
        console.error('❌ 創建出席記錄失敗:', error)
        console.error('失敗的記錄:', record)

        // 直接拋出錯誤，不嘗試繞過 RLS
        throw new Error(`學生 ${record.student_id} 的出席記錄創建失敗: ${error.message}`)
      }
    }

    // 處理臨時學生出席記錄
    for (const temp of tempAttendanceRecords) {
      const { data, tempStudent } = temp

      const tempRecord = {
        schedule_id: selectedSchedule.value.schedule_id,
        student_id: tempStudent.student.student_id,
        enrollment_id: tempStudent.originalEnrollmentId || null,
        status: data.status,
        attendance_type: tempStudent.type,
        makeup_from_enrollment_id: tempStudent.type === 'makeup' ? tempStudent.originalEnrollmentId : null,
        session_deducted: tempStudent.type === 'makeup' && (data.status === 'present' || data.status === 'late'),
        teacher_notes: data.notes || tempStudent.notes || null,
        marked_at: new Date().toISOString(),
        marked_by: userId
      }

      console.log('準備創建臨時學生出席記錄:', tempRecord)

      try {
        await db.create('attendance', tempRecord)
        console.log('臨時學生出席記錄創建成功')

        // 如果是補課且需要扣堂數
        if (tempStudent.type === 'makeup' && tempStudent.originalEnrollmentId && tempRecord.session_deducted) {
          // 扣除原課程的剩餘堂數
          const enrollment = await db.findOne('enrollments', tempStudent.originalEnrollmentId, 'enrollment_id, remaining_sessions')
          if (enrollment && enrollment.remaining_sessions > 0) {
            await db.update('enrollments', enrollment.id, {
              remaining_sessions: enrollment.remaining_sessions - 1
            })
            console.log(`已扣除原課程 ${tempStudent.originalEnrollmentId} 的堂數`)
          }
        }

        // 如果是臨時付費，記錄待收費用（可以擴展到另一個表）
        if (tempStudent.type === 'temporary' && tempStudent.fee) {
          console.log(`臨時付費學生 ${tempStudent.student.chinese_name}，應收費用：${tempStudent.fee}`)
          // TODO: 可以在這裡記錄到待收費表
        }

      } catch (error) {
        console.error('創建臨時學生出席記錄失敗:', error)
        alert(`臨時學生 ${tempStudent.student.chinese_name} 的出席記錄創建失敗: ${error.message}`)
      }
    }

    // 更新課程安排備註
    if (classNotes.value) {
      await db.update('schedules', selectedSchedule.value?.id, {
        notes: classNotes.value
      })
    }

    // 清除草稿
    localStorage.removeItem('attendance_draft')

    alert('點名記錄提交成功')
    router.push('/attendance')
  } catch (error) {
    console.error('提交點名失敗:', error)

    // 處理 RLS 權限錯誤
    if (error.code === '42501' || error.message?.includes('row-level security')) {
      alert('您沒有權限執行此操作。請確認您的角色權限是否正確。')
    } else if (error.message?.includes('foreign key violation')) {
      alert('資料關聯錯誤。請確認所有資料都正確無誤。')
    } else {
      alert(`提交失敗: ${error.message || '未知錯誤'}`)
    }
  } finally {
    saving.value = false
  }
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('zh-TW', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Taipei',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// 載入草稿
function loadDraft() {
  const draft = localStorage.getItem('attendance_draft')
  if (draft) {
    try {
      const draftData = JSON.parse(draft)
      selectedScheduleId.value = draftData.scheduleId
      Object.assign(attendanceData, draftData.attendanceData)
      classNotes.value = draftData.classNotes || ''
    } catch (error) {
      console.error('載入草稿失敗:', error)
    }
  }
}

// 臨時學生相關函數
async function onSearchStudent() {
  if (!searchStudent.value || searchStudent.value.length < 2) {
    searchResults.value = []
    return
  }

  searchingStudent.value = true
  try {
    const searchTerm = searchStudent.value.trim()
    const results: any[] = []

    // 1. 搜尋學生（按姓名、學號或聯絡人電話）
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select(`
        *,
        student_contacts(
          relationship,
          is_primary,
          contact:contacts(
            contact_id,
            full_name,
            phone
          )
        )
      `)
      .eq('is_active', true)
      .limit(20)

    if (studentsError) {
      console.error('搜尋學生失敗:', studentsError)
    } else if (studentsData) {
      // 過濾符合條件的學生
      const filteredStudents = studentsData.filter(student => {
        // 檢查學生姓名或學號
        if (student.chinese_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.student_id?.toLowerCase().includes(searchTerm.toLowerCase())) {
          return true
        }

        // 檢查聯絡人電話
        if (student.student_contacts?.some((sc: any) =>
          sc.contact?.phone?.includes(searchTerm)
        )) {
          return true
        }

        return false
      })

      // 為每個學生添加主要聯絡人資訊
      filteredStudents.forEach(student => {
        const primaryContact = student.student_contacts?.find((sc: any) => sc.is_primary)
        if (primaryContact) {
          student.primary_contact = {
            full_name: primaryContact.contact.full_name,
            phone: primaryContact.contact.phone,
            relationship: primaryContact.relationship
          }
        }
        student._type = 'student'
      })

      results.push(...filteredStudents)
    }

    // 2. 搜尋潛在客戶（試聽學生）
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,parent_name.ilike.%${searchTerm}%`)
      .in('status', ['new', 'contacted', 'interested', 'trial_scheduled', 'trial_completed'])
      .limit(10)

    if (leadsError) {
      console.error('搜尋潛在客戶失敗:', leadsError)
    } else if (leadsData) {
      // 將潛在客戶轉換為類似學生的格式
      leadsData.forEach(lead => {
        results.push({
          student_id: `LEAD-${lead.lead_id}`,
          chinese_name: lead.full_name,
          english_name: '',
          notes: `來源：${lead.source} / 狀態：${lead.status}`,
          primary_contact: {
            full_name: lead.parent_name || '本人',
            phone: lead.phone,
            relationship: lead.parent_name ? '家長' : '本人'
          },
          _type: 'lead',
          _leadData: lead
        })
      })
    }

    searchResults.value = results.slice(0, 15) // 限制總結果數
  } catch (error) {
    console.error('搜尋失敗:', error)
    searchResults.value = []
  } finally {
    searchingStudent.value = false
  }
}

function selectTempStudent(student: any) {
  selectedTempStudent.value = student
  searchResults.value = []
  searchStudent.value = ''

  // 如果選擇的是潛在客戶（試聽），自動設定為試聽類型
  if (student._type === 'lead') {
    tempType.value = 'trial'
  }
}

function nextStep() {
  if (selectedTempStudent.value) {
    addTempStep.value = 2
    // 如果是補課，載入該學生的所有報名記錄
    if (tempType.value === 'makeup') {
      loadStudentEnrollments()
    }
  }
}

async function onTempTypeChange() {
  if (tempType.value === 'makeup' && selectedTempStudent.value) {
    await loadStudentEnrollments()
  }
}

async function loadStudentEnrollments() {
  if (!selectedTempStudent.value) return

  try {
    // 載入該學生的所有活躍報名記錄
    const enrollments = await db.findMany('enrollments', {
      columns: `
        enrollment_id,
        student_id,
        course_id,
        remaining_sessions,
        course:courses(course_id, course_name)
      `,
      filters: {
        student_id: selectedTempStudent.value.student_id,
        status: 'active'
      }
    })

    // 只顯示還有剩餘堂數的課程
    studentEnrollments.value = enrollments.filter(e => e.remaining_sessions > 0)
  } catch (error) {
    console.error('載入學生報名記錄失敗:', error)
    studentEnrollments.value = []
  }
}

function confirmAddTemp() {
  if (!canConfirmTemp.value || !selectedTempStudent.value) return

  const tempStudent = {
    id: `temp_${Date.now()}`,
    student: selectedTempStudent.value,
    type: tempType.value,
    attendance_type: tempType.value,
    originalEnrollmentId: selectedOriginalEnrollment.value,
    originalCourse: studentEnrollments.value.find(
      e => e.enrollment_id === selectedOriginalEnrollment.value
    )?.course,
    fee: tempFee.value,
    notes: tempNotes.value,
    addedBy: authStore.user?.user_id,
    addedAt: new Date()
  }

  tempStudents.value.push(tempStudent)

  // 重置表單
  resetAddTempForm()
}

function removeTempStudent(tempId: string) {
  const index = tempStudents.value.findIndex(t => t.id === tempId)
  if (index !== -1) {
    // 同時移除出席記錄
    const uniqueKey = `temp_${tempId}`
    delete attendanceData[uniqueKey]

    // 從列表中移除
    tempStudents.value.splice(index, 1)
  }
}

function cancelAddTemp() {
  showAddTempStudent.value = false
  resetAddTempForm()
}

function resetAddTempForm() {
  showAddTempStudent.value = false
  addTempStep.value = 1
  searchStudent.value = ''
  searchResults.value = []
  selectedTempStudent.value = null
  tempType.value = ''
  selectedOriginalEnrollment.value = ''
  studentEnrollments.value = []
  tempFee.value = null
  tempNotes.value = ''
}

onMounted(() => {
  loadSchedules()
  loadDraft()
})
</script>
