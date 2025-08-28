<template>
  <MainLayout>
    <div class="space-y-6">
      <!-- 頁面標題與操作 -->
      <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            課程管理
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            管理機構的所有課程資訊和設定
          </p>
        </div>
        <div class="mt-4 flex md:ml-4 md:mt-0">
          <router-link
            to="/courses/create"
            class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PlusIcon class="mr-2 size-4" />
            新增課程
          </router-link>
        </div>
      </div>

      <!-- 篩選和搜尋 -->
      <div class="card p-6">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label for="search" class="mb-1 block text-sm font-medium text-gray-700">
              搜尋課程
            </label>
            <input
              id="search"
              v-model="searchQuery"
              type="text"
              placeholder="輸入課程名稱..."
              class="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label for="category" class="mb-1 block text-sm font-medium text-gray-700">
              課程分類
            </label>
            <select
              id="category"
              v-model="selectedCategory"
              class="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部分類</option>
              <option v-if="categories.length === 0" value="" disabled class="text-gray-400">
                請新增課程分類
              </option>
              <option v-else v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>
          <div>
            <label for="status" class="mb-1 block text-sm font-medium text-gray-700">
              課程狀態
            </label>
            <select
              id="status"
              v-model="selectedStatus"
              class="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部狀態</option>
              <option value="planning">籌備中</option>
              <option value="active">進行中</option>
              <option value="ended">已結束</option>
            </select>
          </div>
          <div class="flex items-end">
            <button
              @click="resetFilters"
              class="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              重置篩選
            </button>
          </div>
        </div>
      </div>

      <!-- 課程列表 -->
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  課程資訊
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  分類
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  教師
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  價格/堂
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  人數
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  狀態
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-if="loading" v-for="n in 5" :key="n">
                <td colspan="7" class="px-6 py-4">
                  <div class="flex animate-pulse space-x-4">
                    <div class="size-10 rounded-full bg-gray-200"></div>
                    <div class="flex-1 space-y-2 py-1">
                      <div class="h-4 w-3/4 rounded bg-gray-200"></div>
                      <div class="h-4 w-1/2 rounded bg-gray-200"></div>
                    </div>
                  </div>
                </td>
              </tr>

              <tr v-else-if="filteredCourses.length === 0">
                <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                  <AcademicCapIcon class="mx-auto mb-4 size-12 text-gray-300" />
                  <p class="text-lg font-medium">沒有找到符合條件的課程</p>
                  <p class="mt-1 text-sm">試著調整搜尋條件或新增課程</p>
                </td>
              </tr>

              <tr v-else v-for="course in paginatedCourses" :key="course.id" class="hover:bg-gray-50">
                <td class="px-6 py-4">
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      {{ course.course_name }}
                    </div>
                    <div class="text-sm text-gray-500">
                      ID: {{ course.course_id }}
                    </div>
                  </div>
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    :style="getCategoryStyles(course.category)"
                  >
                    {{ course.category }}
                  </span>
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <div v-if="course.instructor" class="flex items-center">
                    <div class="size-8 shrink-0">
                      <img
                        v-if="course.instructor.avatar_url"
                        :src="course.instructor.avatar_url"
                        :alt="course.instructor.full_name"
                        class="size-8 rounded-full object-cover"
                      />
                      <div v-else class="flex size-8 items-center justify-center rounded-full bg-gray-300">
                        <span class="text-xs font-medium text-gray-600">
                          {{ course.instructor.full_name?.charAt(0) || '?' }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-3">
                      <div class="text-sm font-medium text-gray-900">
                        {{ course.instructor.full_name }}
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-sm text-gray-500">
                    未指派
                  </div>
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  NT$ {{ formatCurrency(course.price_per_session) }}
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {{ course.enrolled_count || 0 }} / {{ course.max_students }}
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <span :class="getStatusClass(course.status)">
                    {{ getStatusText(course.status) }}
                  </span>
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <div class="flex items-center space-x-4">
                    <router-link
                      :to="`/courses/${course.course_id}`"
                      class="flex size-8 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50 hover:text-blue-900"
                    >
                      查看
                    </router-link>
                    <router-link
                      :to="`/courses/${course.course_id}/edit`"
                      class="flex size-8 items-center justify-center rounded-full text-indigo-600 hover:bg-indigo-50 hover:text-indigo-900"
                    >
                      編輯
                    </router-link>
                    <button
                      @click="deleteCourse(course)"
                      class="flex size-8 items-center justify-center rounded-full text-red-600 hover:bg-red-50 hover:text-red-900"
                    >
                      刪除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分頁 -->
        <div v-if="totalPages > 1" class="border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div class="flex items-center justify-between">
            <div class="flex flex-1 justify-between sm:hidden">
              <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="relative inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                上一頁
              </button>
              <button
                @click="currentPage++"
                :disabled="currentPage === totalPages"
                class="relative ml-3 inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                下一頁
              </button>
            </div>
            <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p class="text-sm text-gray-700">
                  顯示 <span class="font-medium">{{ startIndex + 1 }}</span> 到
                  <span class="font-medium">{{ Math.min(endIndex, filteredCourses.length) }}</span> 筆，
                  共 <span class="font-medium">{{ filteredCourses.length }}</span> 筆結果
                </p>
              </div>
              <div>
                <nav class="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
                  <button
                    @click="currentPage--"
                    :disabled="currentPage === 1"
                    class="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white p-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeftIcon class="size-5" />
                  </button>

                  <button
                    v-for="page in visiblePages"
                    :key="page"
                    @click="currentPage = page"
                    :class="[
                      'relative inline-flex items-center border px-4 py-2 text-sm font-medium',
                      page === currentPage
                        ? 'z-10 border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                    ]"
                  >
                    {{ page }}
                  </button>

                  <button
                    @click="currentPage++"
                    :disabled="currentPage === totalPages"
                    class="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white p-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRightIcon class="size-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
// 移除模擬資料依賴，使用真實資料庫服務
import { db, supabase } from '@/services/supabase'
import type { Course } from '@/types'
import { categoryService } from '@/services/categoryService'
import { useCategoryColors } from '@/composables/useCategoryColors'
import {
  PlusIcon,
  AcademicCapIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const { getCategoryStyles } = useCategoryColors()

const loading = ref(false)
const courses = ref<Course[]>([])
const categories = ref<string[]>([])
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedStatus = ref('active')
const currentPage = ref(1)
const pageSize = 10

const filteredCourses = computed(() => {
  let filtered = courses.value

  if (searchQuery.value) {
    filtered = filtered.filter(course =>
      course.course_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      course.course_id.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (selectedCategory.value) {
    filtered = filtered.filter(course => course.category === selectedCategory.value)
  }

  if (selectedStatus.value) {
    filtered = filtered.filter(course => course.status === selectedStatus.value)
  }

  return filtered
})

const totalPages = computed(() => Math.ceil(filteredCourses.value.length / pageSize))

const startIndex = computed(() => (currentPage.value - 1) * pageSize)
const endIndex = computed(() => startIndex.value + pageSize)

const paginatedCourses = computed(() =>
  filteredCourses.value.slice(startIndex.value, endIndex.value)
)

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const delta = 2

  const range = []
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i)
  }

  if (current - delta > 2) {
    range.unshift('...')
  }
  if (current + delta < total - 1) {
    range.push('...')
  }

  range.unshift(1)
  if (total > 1) {
    range.push(total)
  }

  return range.filter((item, index, self) => self.indexOf(item) === index)
})

async function loadCategories() {
  try {
    const categoryData = await categoryService.getCategories()
    categories.value = categoryData.map(cat => cat.name)
    console.log('載入課程分類成功:', categories.value.length, '個分類')
  } catch (error) {
    console.error('載入課程分類失敗:', error)
    categories.value = []
  }
}

async function loadCourses() {
  loading.value = true
  const startTime = performance.now()

  try {
    console.log('CourseListView - 開始載入課程資料...')

    // 構建查詢篩選條件
    const queryFilters: any = {}

    // 添加分類篩選
    if (selectedCategory.value) {
      queryFilters.category = selectedCategory.value
    }

    // 添加狀態篩選
    if (selectedStatus.value) {
      queryFilters.status = selectedStatus.value
    }

    // 使用統一服務層API載入課程資料
    const data = await db.findMany('courses', {
      columns: 'id, course_id, course_name, category, status, price_per_session, max_students, total_sessions, course_type, description, created_at, instructor_id',
      filters: queryFilters,
      orderBy: 'course_name',
      ascending: true
    })

    // 如果有搜尋條件，進行前端篩選
    let filteredData = data
    if (searchQuery.value) {
      filteredData = data.filter(course =>
        course.course_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        course.course_id.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    }

    courses.value = filteredData
    console.log('CourseListView - 課程資料載入成功:', filteredData.length, '筆')

    // 批次載入教師資料和註冊人數
    if (filteredData.length > 0) {
      const instructorIds = filteredData
        .map(course => course.instructor_id)
        .filter(id => id) // 過濾空值

      const courseIds = filteredData.map(course => course.course_id)

      // 並行載入教師資料和註冊人數
      const promises = []

      // 載入教師資料
      if (instructorIds.length > 0) {
        promises.push(
          supabase
            .from('users')
            .select('user_id, full_name, avatar_url')
            .in('user_id', instructorIds)
        )
      } else {
        promises.push(Promise.resolve({ data: [], error: null }))
      }

      // 載入註冊人數
      promises.push(
        supabase
          .from('enrollments')
          .select('course_id')
          .in('course_id', courseIds)
          .eq('status', 'active')
      )

      try {
        const [instructorResult, enrollmentResult] = await Promise.all(promises)

        // 處理教師資料
        if (instructorResult.error) {
          console.warn('載入教師資料失敗:', instructorResult.error)
        } else {
          const instructorMap = new Map(instructorResult.data?.map(instructor => [instructor.user_id, instructor]) || [])
          courses.value.forEach(course => {
            if (course.instructor_id) {
              course.instructor = instructorMap.get(course.instructor_id)
            }
          })
          console.log('CourseListView - 教師資料載入成功:', instructorResult.data?.length || 0, '筆')
        }

        // 處理註冊人數
        if (enrollmentResult.error) {
          console.warn('載入註冊人數失敗:', enrollmentResult.error)
        } else {
          // 計算每個課程的註冊人數
          const enrollmentCounts = new Map()
          enrollmentResult.data?.forEach(enrollment => {
            const courseId = enrollment.course_id
            enrollmentCounts.set(courseId, (enrollmentCounts.get(courseId) || 0) + 1)
          })

          courses.value.forEach(course => {
            course.enrolled_count = enrollmentCounts.get(course.course_id) || 0
          })
          console.log('CourseListView - 註冊人數載入成功')
        }
      } catch (error) {
        console.warn('載入關聯資料失敗:', error)
      }
    }

    const endTime = performance.now()
    console.log(`CourseListView - 資料載入完成，耗時: ${(endTime - startTime).toFixed(2)}ms`)
  } catch (error) {
    console.error('載入課程失敗:', error)
    // 顯示用戶友好的錯誤訊息
    alert('載入課程資料失敗，請檢查網路連線或稍後再試')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  searchQuery.value = ''
  selectedCategory.value = ''
  selectedStatus.value = 'active'
  currentPage.value = 1
  loadCourses()
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

async function deleteCourse(course: Course) {
  if (!confirm(`確定要刪除課程「${course.course_name}」嗎？\n\n⚠️ 此操作無法復原，相關的課程安排和報名記錄也會受到影響。`)) {
    return
  }

  try {
    // 使用統一服務層API刪除課程
    await db.delete('courses', course.id)

    console.log('課程刪除成功:', course.course_id)

    // 重新載入課程列表
    await loadCourses()

    // 顯示成功訊息
    alert(`課程「${course.course_name}」已成功刪除`)
  } catch (error) {
    console.error('刪除課程失敗:', error)

    // 根據錯誤類型顯示不同訊息
    if (error.code === '23503') {
      alert('無法刪除此課程，因為仍有相關的報名記錄或課程安排。請先處理相關資料。')
    } else {
      alert('刪除課程失敗，請稍後再試')
    }
  }
}

onMounted(async () => {
  await Promise.all([
    loadCategories(),
    loadCourses()
  ])
})
</script>
