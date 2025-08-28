<template>
  <MainLayout>
    <div class="space-y-6" v-if="course">
      <!-- 頁面標題 -->
      <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {{ course.course_name }}
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            課程編號: {{ course.course_id }}
          </p>
        </div>
        <div class="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          <router-link
            to="/courses"
            class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <ArrowLeftIcon class="mr-1 size-4" />
            返回列表
          </router-link>
          <router-link
            :to="`/courses/${course.course_id}/edit`"
            class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PencilIcon class="mr-1 size-4" />
            編輯課程
          </router-link>
        </div>
      </div>

      <!-- 課程基本資訊 -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- 課程詳情 -->
        <div class="space-y-6 lg:col-span-2">
          <!-- 基本資訊 -->
          <div class="card p-6">
            <h3 class="mb-4 text-lg font-medium text-gray-900">課程資訊</h3>
            <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt class="text-sm font-medium text-gray-500">課程名稱</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ course.course_name }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">課程分類</dt>
                <dd class="mt-1">
                  <span class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {{ course.category }}
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">課程類型</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ getCourseTypeText(course.course_type) }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">課程狀態</dt>
                <dd class="mt-1">
                  <span :class="getStatusClass(course.status)">
                    {{ getStatusText(course.status) }}
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">指派教師</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ course.users?.full_name || '未指派' }}
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">上課時間</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ formatClassTime() }}</dd>
              </div>
            </dl>

            <div v-if="course.description" class="mt-6">
              <dt class="mb-2 text-sm font-medium text-gray-500">課程描述</dt>
              <dd class="whitespace-pre-wrap text-sm text-gray-900">{{ course.description }}</dd>
            </div>
          </div>

          <!-- 課程設定 -->
          <div class="card p-6">
            <h3 class="mb-4 text-lg font-medium text-gray-900">課程設定</h3>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div class="rounded-lg bg-gray-50 p-4 text-center">
                <div class="text-2xl font-bold text-gray-900">{{ course.total_sessions }}</div>
                <div class="text-sm text-gray-500">總堂數</div>
              </div>
              <div class="rounded-lg bg-gray-50 p-4 text-center">
                <div class="text-2xl font-bold text-green-600">NT$ {{ formatCurrency(course.price_per_session) }}</div>
                <div class="text-sm text-gray-500">每堂費用</div>
              </div>
              <div class="rounded-lg bg-gray-50 p-4 text-center">
                <div class="text-2xl font-bold text-blue-600">{{ course.max_students }}</div>
                <div class="text-sm text-gray-500">最大人數</div>
              </div>
            </div>
          </div>

          <!-- 報名學生 -->
          <div class="card p-6">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900">報名學生</h3>
              <span class="text-sm text-gray-500">
                {{ enrolledStudents.length }} / {{ course.max_students }} 人
              </span>
            </div>

            <div v-if="enrolledStudents.length === 0" class="py-8 text-center text-gray-500">
              <UserGroupIcon class="mx-auto mb-4 size-12 text-gray-300" />
              <p>尚無學生報名此課程</p>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="student in enrolledStudents"
                :key="student.id"
                class="flex items-center justify-between rounded-lg border border-gray-200 p-3"
              >
                <div class="flex items-center">
                  <div class="flex size-8 items-center justify-center rounded-full bg-blue-100">
                    <UserIcon class="size-5 text-blue-600" />
                  </div>
                  <div class="ml-3">
                    <div class="text-sm font-medium text-gray-900">{{ student.chinese_name }}</div>
                    <div class="text-sm text-gray-500">{{ student.student_id }}</div>
                  </div>
                </div>
                <router-link
                  :to="`/students/${student.student_id}`"
                  class="text-sm text-blue-600 hover:text-blue-900"
                >
                  查看詳情
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- 側邊欄資訊 -->
        <div class="space-y-6">
          <!-- 快速統計 -->
          <div class="card p-6">
            <h3 class="mb-4 text-lg font-medium text-gray-900">課程統計</h3>
            <div class="space-y-4">
              <div class="flex justify-between">
                <span class="text-sm text-gray-500">報名人數</span>
                <span class="text-sm font-medium text-gray-900">
                  {{ enrolledStudents.length }} / {{ course.max_students }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-500">剩餘名額</span>
                <span class="text-sm font-medium text-gray-900">
                  {{ course.max_students - enrolledStudents.length }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-500">報名率</span>
                <span class="text-sm font-medium text-gray-900">
                  {{ Math.round((enrolledStudents.length / course.max_students) * 100) }}%
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-500">總課程費用</span>
                <span class="text-sm font-medium text-green-600">
                  NT$ {{ formatCurrency(course.total_sessions * course.price_per_session) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 快速操作 -->
          <div class="card p-6">
            <h3 class="mb-4 text-lg font-medium text-gray-900">快速操作</h3>
            <div class="space-y-3">
              <router-link
                :to="`/courses/${course.course_id}/edit`"
                class="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PencilIcon class="mr-1 size-4" />
                編輯課程
              </router-link>
              <router-link
                :to="`/attendance/take?courseId=${course.course_id}`"
                class="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <ClipboardDocumentCheckIcon class="mr-2 size-5" />
                點名
              </router-link>
              <router-link
                to="/schedule"
                class="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <CalendarDaysIcon class="mr-1 size-4" />
                課程安排
              </router-link>
              <router-link
                to="/orders/create"
                class="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <CreditCardIcon class="mr-1 size-4" />
                建立訂單
              </router-link>
            </div>
          </div>

          <!-- 最近活動 -->
          <div class="card p-6">
            <h3 class="mb-4 text-lg font-medium text-gray-900">最近活動</h3>
            <div class="space-y-3">
              <div class="flex items-start space-x-3">
                <div class="mt-0.5 flex size-6 items-center justify-center rounded-full bg-green-100">
                  <CheckIcon class="size-4 text-green-600" />
                </div>
                <div class="flex-1 text-sm">
                  <p class="text-gray-900">課程狀態更新為「{{ getStatusText(course.status) }}」</p>
                  <p class="mt-1 text-gray-500">{{ formatDate(course.updated_at) }}</p>
                </div>
              </div>
              <div class="flex items-start space-x-3">
                <div class="mt-0.5 flex size-6 items-center justify-center rounded-full bg-blue-100">
                  <PlusIcon class="size-4 text-blue-600" />
                </div>
                <div class="flex-1 text-sm">
                  <p class="text-gray-900">課程建立</p>
                  <p class="mt-1 text-gray-500">{{ formatDate(course.created_at) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 載入中狀態 -->
    <div v-else-if="loading" class="space-y-6">
      <div class="animate-pulse">
        <div class="mb-2 h-8 w-1/3 rounded bg-gray-200"></div>
        <div class="h-4 w-1/4 rounded bg-gray-200"></div>
      </div>
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          <div class="card p-6">
            <div class="animate-pulse space-y-4">
              <div class="h-4 w-1/4 rounded bg-gray-200"></div>
              <div class="space-y-2">
                <div class="h-4 rounded bg-gray-200"></div>
                <div class="h-4 w-2/3 rounded bg-gray-200"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="space-y-6">
          <div class="card p-6">
            <div class="animate-pulse space-y-4">
              <div class="h-4 w-1/2 rounded bg-gray-200"></div>
              <div class="h-4 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 錯誤狀態 -->
    <div v-else class="py-12 text-center">
      <ExclamationTriangleIcon class="mx-auto mb-4 size-12 text-red-400" />
      <h3 class="mb-2 text-lg font-medium text-gray-900">課程不存在</h3>
      <p class="mb-4 text-gray-500">找不到此課程，可能已被刪除或不存在</p>
      <router-link to="/courses" class="btn btn-primary">
        返回課程列表
      </router-link>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import { db, supabase } from '@/services/supabase'
import type { Course, Student } from '@/types'
import {
  ArrowLeftIcon,
  PencilIcon,
  UserGroupIcon,
  UserIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  CheckIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()

const loading = ref(true)
const course = ref<Course | null>(null)
const enrolledStudents = ref<Student[]>([])
const courseSchedules = ref<any[]>([])

async function loadCourse() {
  loading.value = true
  const startTime = performance.now()

  try {
    const courseId = route.params.id as string
    console.log('CourseDetailView - 開始載入課程:', courseId)

    // 使用課程編號查詢課程資料，同時載入教師資料
    const courseData = await db.findMany('courses', {
      columns: `
        *,
        users!instructor_id (
          user_id,
          full_name,
          email
        )
      `,
      filters: { course_id: courseId },
      limit: 1
    })

    const foundCourse = courseData && courseData.length > 0 ? courseData[0] : null

    if (!foundCourse) {
      console.log('CourseDetailView - 課程不存在')
      course.value = null
      return
    }
    console.log('CourseDetailView - 課程資料載入成功:', foundCourse)
    course.value = foundCourse

    // 教師資料已經在主查詢中載入
    if (foundCourse.users) {
      console.log('CourseDetailView - 教師資料載入成功:', foundCourse.users)
    }

    // 載入報名學生 (從 enrollments 表)
    try {
      // 使用 Supabase 直接查詢（複雜關聯查詢適合用 Supabase）
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          enrollment_id,
          purchased_sessions,
          remaining_sessions,
          bonus_sessions,
          status,
          students (
            student_id,
            chinese_name,
            english_name
          )
        `)
        .eq('course_id', courseId)
        .eq('status', 'active')

      if (!enrollmentError && enrollments) {
        enrolledStudents.value = enrollments
          .filter(e => e.students)
          .map(e => e.students)
          .slice(0, 5) // 只顯示前5個學生
        console.log('CourseDetailView - 報名學生載入成功:', enrolledStudents.value.length, '人')
      }
    } catch (enrollmentError) {
      console.warn('CourseDetailView - 載入報名學生失敗:', enrollmentError)
    }

    // 載入課程排程
    try {
      const { data: schedules, error: scheduleError } = await supabase
        .from('schedules')
        .select('*')
        .eq('course_id', courseId)
        .eq('status', 'scheduled')
        .order('class_datetime', { ascending: true })
        .limit(10)

      if (!scheduleError && schedules) {
        courseSchedules.value = schedules
        console.log('CourseDetailView - 課程排程載入成功:', schedules.length, '筆')
      }
    } catch (scheduleError) {
      console.warn('CourseDetailView - 載入課程排程失敗:', scheduleError)
    }

    const endTime = performance.now()
    console.log(`CourseDetailView - 載入完成，耗時: ${(endTime - startTime).toFixed(2)}ms`)

  } catch (error) {
    console.error('CourseDetailView - 載入課程失敗:', error)
    course.value = null
  } finally {
    loading.value = false
  }
}

function getCourseTypeText(type: string): string {
  const typeMap = {
    'regular': '常規課程',
    'intensive': '密集課程',
    'makeup': '補課'
  }
  return typeMap[type as keyof typeof typeMap] || type
}

function getStatusClass(status: string): string {
  const classes = {
    'planning': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
    'active': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800',
    'full': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800',
    'ended': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'
  }
  return classes[status as keyof typeof classes] || classes.planning
}

function getStatusText(status: string): string {
  const statusMap = {
    'planning': '籌備中',
    'active': '進行中',
    'full': '已額滿',
    'ended': '已結束'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-TW').format(amount)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatClassTime(): string {
  // 優先使用課程的 schedule_pattern 中的預設時間
  if (course.value?.schedule_pattern) {
    const pattern = course.value.schedule_pattern

    if (pattern.days && pattern.start_time && pattern.end_time) {
      const weekdays = ['日', '一', '二', '三', '四', '五', '六']
      const dayNames = pattern.days.map(day => `星期${weekdays[day]}`).join('、')

      return `${dayNames} ${pattern.start_time} - ${pattern.end_time}`
    }
  }

  // 如果沒有 schedule_pattern，才使用課程安排作為備用
  if (!courseSchedules.value || courseSchedules.value.length === 0) {
    return '尚未設定課程時間'
  }

  // 取得第一個排程作為示例（備用方案）
  const firstSchedule = courseSchedules.value[0]

  // 使用正確的時間解析函數
  const startDate = parseAsLocalTime(firstSchedule.class_datetime)
  const endDate = parseAsLocalTime(firstSchedule.end_datetime)

  // 星期幾對應
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[startDate.getDay()]

  // 格式化時間
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

  return `星期${weekday} ${startTime} - ${endTime}`
}

// 時間解析函數 - 確保正確解析本地時間
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

onMounted(() => {
  loadCourse()
})
</script>
