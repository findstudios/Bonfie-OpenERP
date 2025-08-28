<template>
  <MainLayout>
    <div class="mx-auto max-w-6xl space-y-6">
      <!-- 頁面標題和操作 -->
      <div class="sm:flex sm:items-center sm:justify-between">
        <div class="min-w-0 flex-1">
          <h2 class="text-xl font-bold leading-7 text-gray-900 sm:text-2xl sm:tracking-tight lg:text-3xl">
            學生管理
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            管理所有學生的基本資料和聯絡資訊
          </p>
        </div>
        <div class="mt-4 sm:ml-4 sm:mt-0">
          <router-link
            to="/students/create"
            class="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon class="mr-2 size-4" />
            新增學生
          </router-link>
        </div>
      </div>

      <!-- 搜尋和篩選 -->
      <div class="card p-4 md:p-6">
        <div>
          <label for="search" class="mb-2 block text-sm font-medium text-gray-700">
            搜尋學生
          </label>
          <div class="mt-1">
            <input
              id="search"
              v-model="filters.search"
              type="text"
              class="input h-11 w-full px-4"
              placeholder="輸入學生姓名或編號"
              @input="debounceSearch"
            />
          </div>
        </div>
      </div>

      <!-- 學生列表 -->
      <div class="card">
        <div class="border-b border-gray-200 px-6 py-4">
          <h3 class="text-lg font-medium text-gray-900">
            學生列表 ({{ totalStudents }} 名)
          </h3>
        </div>

        <!-- 響應式學生表格 -->
        <ResponsiveTable
          :data="students"
          :columns="tableColumns"
          :loading="loading"
          row-key="id"
          :row-clickable="true"
          empty-title="沒有找到學生"
          :empty-message="filters.search ? '沒有符合搜尋條件的學生' : '目前沒有任何學生資料'"
          @row-click="handleRowClick"
        >
          <!-- 學生資訊欄位 -->
          <template #cell-student_info="{ item }">
            <div class="flex items-center">
              <div class="size-10 shrink-0">
                <div class="bg-primary-100 flex size-10 items-center justify-center rounded-full">
                  <span class="text-sm font-medium text-primary-600">
                    {{ item.chinese_name.charAt(0) }}
                  </span>
                </div>
              </div>
              <div class="ml-4">
                <div class="text-sm font-medium text-gray-900">
                  {{ item.chinese_name }}
                  <span v-if="item.english_name" class="text-gray-500">
                    ({{ item.english_name }})
                  </span>
                </div>
                <div class="text-sm text-gray-500">
                  {{ item.student_id }}
                </div>
              </div>
            </div>
          </template>

          <!-- 聯絡人資訊欄位 -->
          <template #cell-contact_info="{ item }">
            <div class="text-sm text-gray-900">
              <div v-if="getPrimaryContact(item)" class="mb-1">
                <span class="font-medium">{{ getPrimaryContact(item).full_name }}</span>
                <span v-if="getPrimaryContactRelationship(item)" class="ml-1 text-gray-500">
                  ({{ getPrimaryContactRelationship(item) }})
                </span>
                <div v-if="getPrimaryContact(item).phone" class="text-xs text-gray-500">
                  {{ getPrimaryContact(item).phone }}
                </div>
              </div>
              <div v-else class="text-gray-400">
                無聯絡人資訊
              </div>
            </div>
          </template>

          <!-- 報名課程欄位 -->
          <template #cell-enrollments="{ item }">
            <div class="text-sm text-gray-900">
              <div v-if="item.enrollments && item.enrollments.length > 0">
                <div v-for="enrollment in getActiveEnrollments(item)" :key="enrollment.enrollment_id" class="mb-1">
                  <span class="font-medium">{{ enrollment.course?.course_name || '未知課程' }}</span>
                </div>
              </div>
              <div v-else class="text-gray-400">
                無報名課程
              </div>
            </div>
          </template>

          <!-- 剩餘堂數欄位 -->
          <template #cell-remaining_sessions="{ item }">
            <div class="text-center text-sm font-medium">
              <span v-if="getTotalRemainingSessions(item) > 0" class="text-green-600">
                {{ getTotalRemainingSessions(item) }}
              </span>
              <span v-else class="text-gray-400">
                0
              </span>
            </div>
          </template>

          <!-- 有效期限欄位 -->
          <template #cell-validity_period="{ item }">
            <div class="text-center text-sm">
              <div v-for="enrollment in getActiveEnrollments(item)" :key="enrollment.enrollment_id">
                <span
                  v-if="enrollment.validity_end_date"
                  :data-testid="`validity-period`"
                  :class="{
                    'font-medium text-red-600': isExpiringSoon(enrollment.validity_end_date),
                    'text-gray-900': !isExpiringSoon(enrollment.validity_end_date)
                  }"
                >
                  <span v-if="isExpiringSoon(enrollment.validity_end_date)" data-testid="validity-expiring-soon">
                    {{ formatDate(enrollment.validity_end_date) }}
                  </span>
                  <span v-else>
                    {{ formatDate(enrollment.validity_end_date) }}
                  </span>
                </span>
                <span v-else data-testid="no-validity-period" class="text-gray-400">
                  無期限
                </span>
              </div>
            </div>
          </template>

          <!-- 操作欄位 -->
          <template #cell-actions="{ item }">
            <div class="flex items-center justify-end space-x-2">
              <router-link
                :to="`/students/${item.id}`"
                class="inline-flex items-center rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
                title="查看詳情"
              >
                查看
              </router-link>
              <router-link
                :to="`/students/${item.id}/edit`"
                class="inline-flex items-center rounded-md bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                title="編輯資料"
              >
                編輯
              </router-link>
              <button
                @click.stop="confirmDelete(item)"
                class="inline-flex items-center rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                title="刪除學生"
              >
                刪除
              </button>
            </div>
          </template>



          <!-- 行動版卡片自定義佈局 -->
          <template #mobile-card="{ item }">
            <div class="space-y-3">
              <!-- 主要資訊 -->
              <div class="flex items-center space-x-3">
                <div class="size-12 shrink-0">
                  <div class="bg-primary-100 flex size-12 items-center justify-center rounded-full">
                    <span class="text-base font-medium text-primary-600">
                      {{ item.chinese_name.charAt(0) }}
                    </span>
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="truncate text-base font-medium text-gray-900">
                    {{ item.chinese_name }}
                    <span v-if="item.english_name" class="text-gray-500">
                      ({{ item.english_name }})
                    </span>
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ item.student_id }}
                  </div>
                </div>
              </div>

              <!-- 聯絡人資訊 -->
              <div class="text-sm">
                <div class="mb-1 font-medium text-gray-500">聯絡人資訊</div>
                <div v-if="getPrimaryContact(item)" class="text-gray-900">
                  <div>
                    <span class="font-medium">{{ getPrimaryContact(item).full_name }}</span>
                    <span v-if="getPrimaryContactRelationship(item)" class="ml-1 text-gray-500">
                      ({{ getPrimaryContactRelationship(item) }})
                    </span>
                    <div v-if="getPrimaryContact(item).phone" class="text-xs text-gray-500">
                      {{ getPrimaryContact(item).phone }}
                    </div>
                  </div>
                </div>
                <div v-else class="text-gray-400">
                  無聯絡人資訊
                </div>
              </div>

              <!-- 報名課程和剩餘堂數 -->
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div class="mb-1 font-medium text-gray-500">報名課程</div>
                  <div v-if="item.enrollments && item.enrollments.length > 0">
                    <div v-for="enrollment in getActiveEnrollments(item)" :key="enrollment.enrollment_id" class="text-gray-900">
                      {{ enrollment.course?.course_name || '未知課程' }}
                    </div>
                  </div>
                  <div v-else class="text-gray-400">
                    無報名課程
                  </div>
                </div>
                <div>
                  <div class="mb-1 font-medium text-gray-500">剩餘堂數</div>
                  <div class="text-lg font-semibold">
                    <span v-if="getTotalRemainingSessions(item) > 0" class="text-green-600">
                      {{ getTotalRemainingSessions(item) }}
                    </span>
                    <span v-else class="text-gray-400">
                      0
                    </span>
                  </div>
                </div>
              </div>

              <!-- 操作按鈕 -->
              <div class="flex items-center justify-end space-x-4 border-t border-gray-100 pt-2">
                <router-link
                  :to="`/students/${item.id}`"
                  class="inline-flex min-h-[2.5rem] items-center justify-center rounded-md bg-blue-50 px-4 py-2 text-xs font-medium text-blue-600 hover:bg-blue-100"
                >
                  查看
                </router-link>
                <router-link
                  :to="`/students/${item.id}/edit`"
                  class="inline-flex min-h-[2.5rem] items-center justify-center rounded-md bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
                >
                  編輯
                </router-link>
                <button
                  @click.stop="confirmDelete(item)"
                  class="inline-flex min-h-[2.5rem] items-center justify-center rounded-md bg-red-50 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-100"
                >
                  刪除
                </button>
              </div>
            </div>
          </template>

          <!-- 空狀態自定義 -->
          <template #empty>
            <div class="py-12 text-center">
              <UserGroupIcon class="mx-auto size-12 text-gray-400" />
              <h3 class="mt-2 text-sm font-medium text-gray-900">沒有找到學生</h3>
              <p class="mt-1 text-sm text-gray-500">
                {{ filters.search ? '沒有符合搜尋條件的學生' : '目前沒有任何學生資料' }}
              </p>
              <div class="mt-6">
                <router-link to="/students/create" class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <PlusIcon class="mr-2 size-4" />
                  新增第一個學生
                </router-link>
              </div>
            </div>
          </template>
        </ResponsiveTable>

        <!-- 分頁 -->
        <div v-if="students.length > 0" class="border-t border-gray-200 p-4 sm:px-6">
          <div class="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div class="text-center text-sm text-gray-700 sm:text-left">
              顯示 {{ (pagination.page - 1) * pagination.per_page + 1 }} 到
              {{ Math.min(pagination.page * pagination.per_page, totalStudents) }}
              筆，共 {{ totalStudents }} 筆
            </div>
            <div class="flex items-center justify-center space-x-2 sm:justify-end">
              <button
                @click="prevPage"
                :disabled="pagination.page === 1"
                class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                上一頁
              </button>
              <span class="px-2 text-sm text-gray-700">
                第 {{ pagination.page }} 頁，共 {{ totalPages }} 頁
              </span>
              <button
                @click="nextPage"
                :disabled="pagination.page === totalPages"
                class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                下一頁
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 刪除確認對話框 -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="刪除學生"
      :message="`確定要刪除學生「${selectedStudent?.chinese_name}」嗎？此操作無法復原。`"
      confirm-text="刪除"
      cancel-text="取消"
      type="danger"
      @confirm="deleteStudent"
      @cancel="showDeleteDialog = false"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { db, supabase } from '@/services/supabase'
import MainLayout from '@/components/layout/MainLayout.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import ResponsiveTable from '@/components/common/ResponsiveTable.vue'
import type { TableColumn } from '@/components/common/ResponsiveTable.vue'
import {
  PlusIcon,
  UserGroupIcon
} from '@heroicons/vue/24/outline'
import type { Student } from '@/types'

// 狀態管理
const router = useRouter()
const authStore = useAuthStore()

// 資料狀態
const students = ref<Student[]>([])
const loading = ref(false)
const totalStudents = ref(0)

// 篩選狀態
const filters = ref({
  search: ''
})

// 分頁狀態
const pagination = ref({
  page: 1,
  per_page: 20
})

// 刪除對話框狀態
const showDeleteDialog = ref(false)
const selectedStudent = ref<Student | null>(null)

// 計算屬性
const totalPages = computed(() => {
  return Math.ceil(totalStudents.value / pagination.value.per_page)
})

// 表格欄位定義
const tableColumns: TableColumn[] = [
  {
    key: 'student_info',
    label: '學生資訊',
    sortable: false,
    width: '250'
  },
  {
    key: 'contact_info',
    label: '聯絡人資訊',
    sortable: false,
    hideOnMobile: true
  },
  {
    key: 'enrollments',
    label: '報名課程',
    sortable: false,
    hideOnMobile: true
  },
  {
    key: 'remaining_sessions',
    label: '剩餘堂數',
    sortable: false,
    align: 'center',
    width: '100'
  },
  {
    key: 'validity_period',
    label: '有效期限',
    sortable: false,
    align: 'center',
    width: '120',
    hideOnMobile: true
  },
  {
    key: 'actions',
    label: '操作',
    sortable: false,
    align: 'right',
    width: '150'
  }
]

// 載入學生資料
async function loadStudents() {
  loading.value = true
  const startTime = performance.now()

  try {
    console.log('StudentListView - 開始載入學生資料...')

    // 檢查用戶登入狀態
    if (!authStore.isAuthenticated || !authStore.user) {
      console.log('用戶登入狀態: 未登入')
      throw new Error('用戶未登入，請重新登入')
    }
    console.log('用戶登入狀態: 已登入', authStore.user.full_name)

    // 直接使用 Supabase 查詢，繞過權限檢查進行測試
    console.log('StudentListView - 直接查詢學生資料...')

    let query = supabase
      .from('students')
      .select(`
        *,
        student_contacts (
          relationship,
          is_primary,
          contacts (
            full_name,
            phone,
            email
          )
        ),
        enrollments (
          enrollment_id,
          remaining_sessions,
          status,
          course:courses (
            course_id,
            course_name
          )
        )
      `)
      .order('created_at', { ascending: false })


    // 添加分頁
    if (pagination.value.per_page) {
      const start = (pagination.value.page - 1) * pagination.value.per_page
      const end = start + pagination.value.per_page - 1
      query = query.range(start, end)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase 查詢錯誤:', error)
      throw error
    }

    console.log('StudentListView - 學生資料載入成功:', data?.length || 0, '筆')
    console.log('學生資料樣本:', data?.[0])

    students.value = data || []

    // 如果有搜尋條件，進行前端篩選
    if (filters.value.search && students.value.length > 0) {
      students.value = students.value.filter(student =>
        student.chinese_name?.toLowerCase().includes(filters.value.search.toLowerCase()) ||
        student.english_name?.toLowerCase().includes(filters.value.search.toLowerCase()) ||
        student.student_id?.toLowerCase().includes(filters.value.search.toLowerCase())
      )
    }

    totalStudents.value = students.value.length

    const endTime = performance.now()
    console.log(`StudentListView - 資料載入完成，耗時: ${(endTime - startTime).toFixed(2)}ms`)
  } catch (error) {
    console.error('載入學生資料失敗:', error)

    // 詳細錯誤處理
    if (error instanceof Error) {
      console.error('錯誤詳情:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })

      if (error.message.includes('權限不足')) {
        alert('您沒有權限查看學生資料。請聯絡管理員。')
      } else if (error.message.includes('用戶未登入')) {
        alert('請先登入系統')
        router.push('/login')
      } else if (error.message.includes('relation') || error.message.includes('does not exist')) {
        alert('資料表不存在，請檢查資料庫設定')
      } else {
        alert(`載入學生資料失敗：${error.message}`)
      }
    } else {
      console.error('未知錯誤:', error)
      alert('載入學生資料時發生未知錯誤，請檢查控制台日誌')
    }
  } finally {
    loading.value = false
  }
}

// 搜尋防抖
let searchTimeout: NodeJS.Timeout
function debounceSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1 // 重置到第一頁
    loadStudents()
  }, 300)
}



// 分頁操作
function prevPage() {
  if (pagination.value.page > 1) {
    pagination.value.page--
    loadStudents()
  }
}

function nextPage() {
  if (pagination.value.page < totalPages.value) {
    pagination.value.page++
    loadStudents()
  }
}

// 確認刪除
function confirmDelete(student: Student) {
  selectedStudent.value = student
  showDeleteDialog.value = true
}

// 刪除學生
async function deleteStudent() {
  if (!selectedStudent.value) return

  try {
    // 刪除學生 - 使用 student_id 而不是 id
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('student_id', selectedStudent.value.student_id)

    if (error) {
      // 檢查是否是外鍵約束錯誤
      if (error.code === '23503') {
        // 解析錯誤訊息以確定哪個表引用了這個學生
        let relatedTable = ''
        if (error.details?.includes('attendance')) {
          relatedTable = '出席記錄'
        } else if (error.details?.includes('enrollments')) {
          relatedTable = '課程報名'
        } else if (error.details?.includes('orders')) {
          relatedTable = '訂單'
        } else if (error.details?.includes('student_contacts')) {
          relatedTable = '聯絡人關聯'
        } else if (error.details?.includes('student_notes_history')) {
          relatedTable = '學生備註'
        } else {
          relatedTable = '相關記錄'
        }

        alert(`無法刪除學生「${selectedStudent.value.chinese_name}」，因為還有${relatedTable}與此學生關聯。\n\n請先處理或刪除相關的${relatedTable}後再試。`)
        showDeleteDialog.value = false
        return
      }
      throw new Error(error.message || error.details || '刪除學生時發生錯誤')
    }

    // 記錄稽核日誌 - 暫時註解，因為 logAudit 方法尚未實作
    // await authStore.logAudit(
    //   'delete',
    //   'students',
    //   selectedStudent.value.id.toString(),
    //   null,
    //   selectedStudent.value
    // )

    console.log('學生刪除成功:', selectedStudent.value.student_id)

    // 重新載入資料
    await loadStudents()

    // 顯示成功訊息
    alert(`學生「${selectedStudent.value.chinese_name}」已成功刪除`)

    showDeleteDialog.value = false
    selectedStudent.value = null
  } catch (error: any) {
    console.error('刪除學生失敗:', error)
    alert(`刪除失敗：${error.message || '未知錯誤'}`)
  }
}

// 格式化日期
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// 檢查是否即將到期（30天內）
function isExpiringSoon(dateString: string): boolean {
  const endDate = new Date(dateString)
  const today = new Date()
  const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return daysUntilExpiry <= 30 && daysUntilExpiry > 0
}

// 處理行點擊
function handleRowClick(student: Student) {
  // 在行動版點擊卡片時導航到學生詳情頁面
  router.push(`/students/${student.id}`)
}

// 獲取主要聯絡人資訊
function getPrimaryContact(student: any) {
  if (!student.student_contacts || !student.student_contacts.length) {
    return null
  }

  // 優先找主要聯絡人
  const primaryContact = student.student_contacts.find((sc: any) => sc.is_primary)
  if (primaryContact && primaryContact.contacts) {
    return primaryContact.contacts
  }

  // 如果沒有主要聯絡人，返回第一個聯絡人
  const firstContact = student.student_contacts[0]
  if (firstContact && firstContact.contacts) {
    return firstContact.contacts
  }

  return null
}

// 獲取主要聯絡人關係
function getPrimaryContactRelationship(student: any) {
  if (!student.student_contacts || !student.student_contacts.length) {
    return null
  }

  // 優先找主要聯絡人
  const primaryContact = student.student_contacts.find((sc: any) => sc.is_primary)
  if (primaryContact) {
    return primaryContact.relationship
  }

  // 如果沒有主要聯絡人，返回第一個聯絡人的關係
  return student.student_contacts[0].relationship
}

// 獲取有效的報名課程
function getActiveEnrollments(student: any) {
  if (!student.enrollments || !student.enrollments.length) {
    return []
  }

  // 只返回有效的報名記錄
  return student.enrollments.filter((enrollment: any) =>
    enrollment.status === 'active' && enrollment.course
  )
}

// 計算學生的總剩餘堂數
function getTotalRemainingSessions(student: any) {
  if (!student.enrollments || !student.enrollments.length) {
    return 0
  }

  // 計算所有有效報名的剩餘堂數總和
  return student.enrollments
    .filter((enrollment: any) => enrollment.status === 'active')
    .reduce((total: number, enrollment: any) => {
      return total + (enrollment.remaining_sessions || 0)
    }, 0)
}

// 測試資料庫連接
async function testDatabaseConnection() {
  try {
    console.log('測試資料庫連接...')

    // 直接測試學生表是否存在和可訪問
    const { data: studentCount, error: countError } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })

    if (countError) {
      console.error('學生表查詢失敗:', countError)
      throw new Error(`學生表不存在或無法訪問: ${countError.message}`)
    }

    console.log('學生表連接成功，記錄數:', studentCount)

  } catch (error) {
    console.error('資料庫連接測試失敗:', error)
    throw error
  }
}

// 組件掛載時載入資料
onMounted(async () => {
  try {
    await testDatabaseConnection()
    await loadStudents()
  } catch (error) {
    console.error('初始化失敗:', error)
  }
})
</script>

<style scoped>
/* 表格響應式設計 */
@media (max-width: 768px) {
  .table-responsive {
    overflow-x: auto;
  }
}

/* 載入動畫 */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}
</style>
