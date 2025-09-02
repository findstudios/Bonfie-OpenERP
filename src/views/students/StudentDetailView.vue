<template>
  <MainLayout>
    <div class="mx-auto max-w-[1152px] space-y-6">
      <!-- 載入中 -->
      <div v-if="loading" class="py-8 text-center">
        <div class="mx-auto size-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
        <p class="mt-4 text-gray-600">載入中...</p>
      </div>

      <!-- 錯誤狀態 -->
      <div v-else-if="error" class="py-8 text-center">
        <ExclamationTriangleIcon class="mx-auto size-12 text-red-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">載入失敗</h3>
        <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
        <button @click="loadStudent" class="mt-4 inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          重試
        </button>
      </div>

      <!-- 學生詳情 -->
      <div v-else-if="student" class="space-y-8">
        <!-- 返回導航 -->
        <div class="mb-4 flex items-center">
          <router-link
            to="/students"
            class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <ArrowLeftIcon class="mr-2 size-4" />
            返回學生列表
          </router-link>
        </div>

        <!-- 頁面標題 -->
        <div class="md:flex md:items-center md:justify-between">
          <div class="min-w-0 flex-1">
            <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              {{ student.chinese_name }}
              <span v-if="student.english_name" class="text-xl text-gray-500">
                ({{ student.english_name }})
              </span>
            </h2>
            <p class="mt-1 text-sm text-gray-500">
              學生編號：{{ student.student_id }}
            </p>
          </div>
          <div class="mt-4 flex space-x-4 md:ml-4 md:mt-0">
            <router-link :to="`/students/${student.id}/edit`" class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <PencilIcon class="mr-2 size-5" />
              編輯
            </router-link>
            <button @click="confirmDelete" class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-transparent bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
              <TrashIcon class="mr-2 size-5" />
              刪除
            </button>
          </div>
        </div>

        <!-- 基本資料與課程記錄並排 -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <!-- 基本資料 -->
          <div class="card space-y-4 p-6">
            <h3 class="border-b border-gray-200 pb-3 text-lg font-medium text-gray-900">基本資料</h3>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-sm font-medium text-gray-500">中文姓名</dt>
                <dd class="text-sm text-gray-900">{{ student.chinese_name }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm font-medium text-gray-500">英文姓名</dt>
                <dd class="text-sm text-gray-900">{{ student.english_name || '未設定' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm font-medium text-gray-500">出生日期</dt>
                <dd class="text-sm text-gray-900">{{ formatDate(student.birth_date) || '未設定' }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-sm font-medium text-gray-500">狀態</dt>
                <dd>
                  <span
                    :class="[
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      student.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    ]"
                  >
                    {{ student.is_active ? '有效' : '無效' }}
                  </span>
                </dd>
              </div>
              <div v-if="student.notes" class="border-t border-gray-200 pt-3">
                <dt class="mb-1 text-sm font-medium text-gray-500">當前備註</dt>
                <dd class="whitespace-pre-wrap text-sm text-gray-900">{{ student.notes }}</dd>
              </div>
            </dl>
          </div>

          <!-- 課程與出席記錄 (合併) -->
          <div class="card space-y-4 p-6">
            <div class="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 class="text-lg font-medium text-gray-900">課程與出席記錄</h3>
              <button
                @click="toggleCourseExpanded"
                class="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
              >
                <ChevronDownIcon
                  v-if="!courseExpanded"
                  class="inline-block size-5"
                />
                <ChevronUpIcon
                  v-else
                  class="inline-block size-5"
                />
                {{ courseExpanded ? '收合' : '展開' }}
              </button>
            </div>

            <!-- 摘要資訊 -->
            <div v-if="enrollmentsLoading || attendanceLoading" class="py-4 text-center">
              <div class="mx-auto size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p class="mt-2 text-sm text-gray-600">載入中...</p>
            </div>
            <div v-else class="grid grid-cols-2 gap-4">
              <div class="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 text-center">
                <AcademicCapIcon class="mx-auto size-8 text-blue-600" />
                <p class="mt-2 text-3xl font-bold text-blue-900">{{ courseStats.remainingSessions }}</p>
                <p class="text-sm font-medium text-blue-700">剩餘堂數</p>
                <p class="mt-1 text-xs text-gray-600">總購買 {{ courseStats.totalSessions }} 堂</p>
              </div>
              <div class="rounded-lg bg-gray-50 p-4 text-center">
                <ClipboardDocumentListIcon class="mx-auto size-8 text-green-500" />
                <p class="mt-2 text-2xl font-semibold text-gray-900">{{ attendanceStats.total }}</p>
                <p class="text-sm text-gray-500">總出席次數</p>
                <p class="mt-1 text-xs text-gray-400">出席率 {{ attendanceStats.attendanceRate }}%</p>
              </div>
            </div>

            <!-- 展開的詳細內容 -->
            <div v-if="courseExpanded" class="space-y-4 border-t border-gray-200 pt-4">
              <!-- 課程記錄 -->
              <div>
                <h4 class="mb-2 text-sm font-medium text-gray-700">課程記錄</h4>
                <div v-if="enrollments.length === 0" class="rounded-lg bg-gray-50 py-4 text-center text-gray-500">
                  <AcademicCapIcon class="mx-auto size-8 text-gray-400" />
                  <p class="mt-2 text-sm">暫無課程記錄</p>
                </div>
                <div v-else class="space-y-2">
                  <div
                    v-for="enrollment in enrollments"
                    :key="enrollment.enrollment_id"
                    class="rounded-lg bg-gray-50 p-3"
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        <p class="font-medium text-gray-900">{{ enrollment.courses?.course_name || '未知課程' }}</p>
                        <p class="text-xs text-gray-500">課程編號: {{ enrollment.course_id }}</p>
                      </div>
                      <div class="text-right">
                        <span
                          :class="[
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            enrollment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          ]"
                        >
                          {{ enrollment.status === 'active' ? '進行中' : '已結束' }}
                        </span>
                      </div>
                    </div>
                    <div class="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span class="text-gray-500">購買:</span>
                        <span class="font-medium text-gray-700"> {{ enrollment.purchased_sessions }}堂</span>
                      </div>
                      <div>
                        <span class="text-gray-500">贈送:</span>
                        <span class="font-medium text-gray-700"> {{ enrollment.bonus_sessions }}堂</span>
                      </div>
                      <div class="rounded bg-blue-50 px-2 py-1">
                        <span class="font-medium text-blue-700">剩餘:</span>
                        <span class="font-bold text-blue-900"> {{ enrollment.remaining_sessions }}堂</span>
                      </div>
                    </div>
                    <!-- 有效期限顯示 -->
                    <div class="mt-2 border-t border-gray-200 pt-2">
                      <ValidityDisplay
                        :enrollment="enrollment"
                        :show-extend-button="true"
                        @extend="handleExtendValidity(enrollment)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- 出席記錄 -->
              <div>
                <h4 class="mb-2 text-sm font-medium text-gray-700">最近出席記錄</h4>
                <div v-if="attendance.length === 0" class="rounded-lg bg-gray-50 py-4 text-center text-gray-500">
                  <ClipboardDocumentListIcon class="mx-auto size-8 text-gray-400" />
                  <p class="mt-2 text-sm">暫無出席記錄</p>
                </div>
                <div v-else class="space-y-2">
                  <div
                    v-for="record in attendance.slice(0, 5)"
                    :key="record.id"
                    class="rounded-lg bg-gray-50 p-3"
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        <p class="text-sm font-medium text-gray-900">
                          {{ record.schedules ? formatDateTime(record.schedules.class_datetime) : '未知時間' }}
                        </p>
                        <p class="text-xs text-gray-500">
                          教室: {{ record.schedules?.classroom || '未指定' }}
                        </p>
                      </div>
                      <div>
                        <span
                          :class="[
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            record.status === 'present' ? 'bg-green-100 text-green-800' :
                            record.status === 'absent' ? 'bg-red-100 text-red-800' :
                            record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          ]"
                        >
                          {{
                            record.status === 'present' ? '出席' :
                            record.status === 'absent' ? '缺席' :
                            record.status === 'late' ? '遲到' :
                            record.status === 'excused' ? '請假' :
                            record.status
                          }}
                        </span>
                      </div>
                    </div>
                    <div v-if="record.teacher_notes" class="mt-1">
                      <p class="text-xs text-gray-600">備註: {{ record.teacher_notes }}</p>
                    </div>
                  </div>

                  <div v-if="attendance.length > 5" class="pt-2 text-center">
                    <p class="text-xs text-gray-500">共 {{ attendance.length }} 筆出席記錄</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 學生備註 -->
        <div class="card space-y-6 p-6">
          <SimpleNotesHistory
            :student-id="student.student_id"
          />
        </div>

        <!-- 聯絡人資料 -->
        <div class="card space-y-6 p-6">
          <div class="flex items-center justify-between border-b border-gray-200 pb-3">
            <h3 class="text-lg font-medium text-gray-900">聯絡人資料</h3>
            <router-link
              :to="`/students/${student.id}/edit`"
              class="text-sm text-blue-600 hover:text-blue-800"
            >
              編輯聯絡人
            </router-link>
          </div>
          <ContactList
            :contacts="student.contacts"
            :show-add-hint="true"
          />
        </div>

        <!-- 訂單記錄 (獨立卡片) -->
        <div class="card space-y-6 p-6">
          <div class="flex items-center justify-between border-b border-gray-200 pb-3">
            <h3 class="text-lg font-medium text-gray-900">訂單記錄</h3>
            <router-link
              :to="`/orders/create?student_id=${student.student_id}`"
              class="text-sm text-blue-600 hover:text-blue-800"
            >
              新增訂單
            </router-link>
          </div>

          <!-- 載入中 -->
          <div v-if="ordersLoading" class="py-4 text-center">
            <div class="mx-auto size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p class="mt-2 text-sm text-gray-600">載入中...</p>
          </div>

          <!-- 訂單列表 -->
          <div v-else-if="orders && orders.length > 0" class="space-y-3">
            <div
              v-for="order in orders.slice(0, 5)"
              :key="order.order_id"
              class="cursor-pointer rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
              @click="$router.push(`/orders/${order.order_id}`)"
            >
              <div class="flex items-start justify-between">
                <div>
                  <p class="font-medium text-gray-900">{{ order.order_id }}</p>
                  <p class="text-sm text-gray-600">{{ formatDateTime(order.created_at) }}</p>
                </div>
                <div class="text-right">
                  <span :class="getStatusClass(order.status)" class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium">
                    {{ getStatusText(order.status) }}
                  </span>
                  <p class="mt-1 text-sm font-medium text-gray-900">
                    ${{ formatCurrency(order.final_amount) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- 查看更多 -->
            <div v-if="orders.length > 5" class="pt-2 text-center">
              <router-link
                :to="`/orders?student_id=${student.student_id}`"
                class="text-sm text-blue-600 hover:text-blue-800"
              >
                查看全部 {{ orders.length }} 筆訂單
              </router-link>
            </div>
          </div>

          <!-- 空狀態 -->
          <div v-else class="py-8 text-center text-gray-500">
            <ShoppingBagIcon class="mx-auto size-12 text-gray-400" />
            <p class="mt-2">暫無訂單記錄</p>
            <router-link
              :to="`/orders/create?student_id=${student.student_id}`"
              class="mt-3 inline-flex items-center justify-center rounded-md border border-transparent bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
            >
              新增第一筆訂單
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- 刪除確認對話框 -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="刪除學生"
      :message="`確定要刪除學生「${student?.chinese_name}」嗎？此操作無法復原。`"
      confirm-text="刪除"
      cancel-text="取消"
      type="danger"
      @confirm="deleteStudent"
      @cancel="showDeleteDialog = false"
    />

    <!-- 延長有效期對話框 -->
    <ExtendValidityDialog
      v-if="selectedEnrollment"
      :show="showExtendDialog"
      :enrollment="selectedEnrollment"
      @cancel="showExtendDialog = false"
      @confirm="handleExtendConfirm"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authSupabase'
import { db, supabase } from '@/services/supabase'
import MainLayout from '@/components/layout/MainLayout.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import SimpleNotesHistory from '@/components/notes/SimpleNotesHistory.vue'
import ContactList from '@/components/contacts/ContactList.vue'
import ValidityDisplay from '@/components/courses/ValidityDisplay.vue'
import ExtendValidityDialog from '@/components/courses/ExtendValidityDialog.vue'
import { creditManagementService } from '@/services/creditManagementService'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  ShoppingBagIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/vue/24/outline'
import type { Student } from '@/types'
import { loadOrdersList } from '@/services/orderService'
import { getStatusClass, getStatusText } from '@/services/orderStatus'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { loadStudentEnrollments, loadStudentAttendance, calculateAttendanceStats, type EnrollmentWithCourse, type AttendanceRecord } from '@/services/enrollmentService'

// 路由和狀態管理
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 狀態
const student = ref<Student | null>(null)
const loading = ref(false)
const error = ref('')
const showDeleteDialog = ref(false)
const showExtendDialog = ref(false)
const selectedEnrollment = ref<any>(null)

// 訂單相關狀態
const orders = ref<any[]>([])
const ordersLoading = ref(false)

// 儲值相關狀態
const credits = ref({
  theme: [],
  regular: [],
  expired: []
})
const creditsLoading = ref(false)

// 展開/收合狀態
const courseExpanded = ref(false)

// 課程註冊和出席記錄
const enrollments = ref<EnrollmentWithCourse[]>([])
const attendance = ref<AttendanceRecord[]>([])
const enrollmentsLoading = ref(false)
const attendanceLoading = ref(false)

// 載入學生資料
async function loadStudent() {
  loading.value = true
  error.value = ''

  try {
    const routeId = route.params.id as string
    let data: Student | null = null

    // 檢查是數字ID還是student_id字符串
    if (/^\d+$/.test(routeId)) {
      // 數字ID - 使用原來的查詢方式
      data = await db.findOne<Student>('students', routeId, `
        *,
        contacts:student_contacts(
          id,
          relationship,
          is_primary,
          is_emergency,
          is_billing,
          notes,
          contact:contacts(
            id,
            full_name,
            phone,
            email,
            address
          )
        )
      `)
    } else {
      // student_id字符串 - 使用student_id查詢
      const { data: studentData, error } = await supabase
        .from('students')
        .select(`
          *,
          contacts:student_contacts(
            id,
            relationship,
            is_primary,
            is_emergency,
            is_billing,
            notes,
            contact:contacts(
              id,
              full_name,
              phone,
              email,
              address
            )
          )
        `)
        .eq('student_id', routeId)
        .single()

      if (error) throw error
      data = studentData
    }

    if (!data) {
      throw new Error('找不到學生資料')
    }

    student.value = data

    // 載入該學生的訂單記錄
    await loadStudentOrders(data.student_id)

    // 載入該學生的課程註冊記錄
    await loadStudentEnrollmentsData(data.student_id)

    // 載入該學生的儲值資料
    await loadStudentCredits(data.student_id)

    // 載入該學生的出席記錄
    await loadStudentAttendanceData(data.student_id)
  } catch (err) {
    console.error('載入學生資料失敗:', err)
    error.value = err instanceof Error ? err.message : '載入學生資料失敗'
  } finally {
    loading.value = false
  }
}

// 載入學生訂單記錄
async function loadStudentOrders(studentId: string) {
  ordersLoading.value = true

  try {
    const ordersList = await loadOrdersList({
      student_id: studentId,
      limit: 10 // 載入最近 10 筆訂單
    })

    orders.value = ordersList || []
  } catch (err) {
    console.error('載入學生訂單失敗:', err)
    orders.value = []
  } finally {
    ordersLoading.value = false
  }
}

// 載入學生儲值資料
async function loadStudentCredits(studentId: string) {
  creditsLoading.value = true

  try {
    const creditData = await creditManagementService.getStudentCredits(studentId)
    credits.value = creditData
  } catch (err) {
    console.error('載入學生儲值失敗:', err)
    credits.value = {
      theme: [],
      regular: [],
      expired: []
    }
  } finally {
    creditsLoading.value = false
  }
}

// 處理新增備註
function handleNoteAdded() {
  // 重新載入學生資料以更新當前備註
  loadStudent()
}

// 處理延長有效期
function handleExtendValidity(enrollment: any) {
  selectedEnrollment.value = enrollment
  showExtendDialog.value = true
}

// 延長有效期確認後的處理
async function handleExtendConfirm() {
  showExtendDialog.value = false
  selectedEnrollment.value = null

  // 重新載入學生相關資料
  if (student.value) {
    await Promise.all([
      loadStudentCredits(student.value.student_id),
      loadStudentEnrollmentsData(student.value.student_id),
      loadStudentAttendanceData(student.value.student_id)
    ])
  }
}

// 確認刪除
function confirmDelete() {
  showDeleteDialog.value = true
}

// 刪除學生
async function deleteStudent() {
  if (!student.value) return

  try {
    // 先關閉對話框
    showDeleteDialog.value = false
    
    // 顯示刪除中的提示
    loading.value = true
    error.value = ''
    
    await db.delete('students', student.value.id)

    // 記錄稽核日誌 (如果函數存在)
    if (typeof authStore.logAudit === 'function') {
      try {
        await authStore.logAudit(
          'delete',
          'students',
          student.value.id.toString(),
          null,
          student.value
        )
      } catch (auditError) {
        console.warn('稽核日誌記錄失敗:', auditError)
        // 不中斷流程
      }
    }

    // 重定向到學生列表
    await router.push('/students')
  } catch (err) {
    console.error('刪除學生失敗:', err)
    loading.value = false
    showDeleteDialog.value = false
    
    // 顯示錯誤訊息
    if (err instanceof Error) {
      if (err.message?.includes('foreign key') || err.message?.includes('violates')) {
        error.value = '無法刪除此學生，因為還有相關的訂單或課程記錄。請先刪除相關資料。'
      } else {
        error.value = `刪除失敗：${err.message}`
      }
    } else {
      error.value = '刪除學生失敗，請稍後再試'
    }
  }
}

// 格式化日期
function formatDate(dateString: string | null): string {
  if (!dateString) return ''

  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 載入學生課程註冊記錄
async function loadStudentEnrollmentsData(studentId: string) {
  enrollmentsLoading.value = true

  try {
    enrollments.value = await loadStudentEnrollments(studentId)
  } catch (err) {
    console.error('載入課程註冊記錄失敗:', err)
    enrollments.value = []
  } finally {
    enrollmentsLoading.value = false
  }
}

// 載入學生出席記錄
async function loadStudentAttendanceData(studentId: string) {
  attendanceLoading.value = true

  try {
    attendance.value = await loadStudentAttendance(studentId)
  } catch (err) {
    console.error('載入出席記錄失敗:', err)
    attendance.value = []
  } finally {
    attendanceLoading.value = false
  }
}

// 計算總課程數和總堂數
const courseStats = computed(() => {
  const totalCourses = enrollments.value.filter(e => e.status === 'active').length
  const totalSessions = enrollments.value.reduce((sum, e) => {
    if (e.status === 'active') {
      return sum + e.purchased_sessions + e.bonus_sessions
    }
    return sum
  }, 0)
  const remainingSessions = enrollments.value.reduce((sum, e) => {
    if (e.status === 'active') {
      return sum + e.remaining_sessions
    }
    return sum
  }, 0)

  return {
    totalCourses,
    totalSessions,
    remainingSessions
  }
})

// 計算出席統計
const attendanceStats = computed(() => {
  return calculateAttendanceStats(attendance.value)
})

// 切換課程展開狀態
function toggleCourseExpanded() {
  courseExpanded.value = !courseExpanded.value
}

// 組件掛載時載入資料
onMounted(() => {
  loadStudent()
})
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
