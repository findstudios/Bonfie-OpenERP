<template>
  <MainLayout>
    <div class="mx-auto max-w-6xl space-y-6">
      <!-- 頁面標題 -->
      <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {{ isEdit ? '編輯課程' : '新增課程' }}
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            {{ isEdit ? '更新課程資訊和設定' : '建立新的課程資訊和設定' }}
          </p>
        </div>
        <div class="mt-4 flex md:ml-4 md:mt-0">
          <router-link
            to="/courses"
            class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <ArrowLeftIcon class="mr-2 size-4" />
            返回列表
          </router-link>
        </div>
      </div>

      <!-- 表單內容 -->
      <form @submit.prevent="submitForm" class="space-y-6">
        <!-- 基本資訊 -->
        <div class="card p-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">基本資訊</h3>
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label for="course_name" class="mb-1 block text-sm font-medium text-gray-700">
                課程名稱 <span class="text-red-500">*</span>
              </label>
              <input
                id="course_name"
                v-model="form.course_name"
                type="text"
                required
                class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="輸入課程名稱"
              />
            </div>

            <div>
              <label for="category" class="mb-1 block text-sm font-medium text-gray-700">
                課程分類 <span class="text-red-500">*</span>
              </label>
              <select
                id="category"
                v-model="form.category"
                required
                class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">請選擇分類</option>
                <option v-if="categories.length === 0" value="" disabled class="text-gray-400">
                  請新增課程分類
                </option>
                <option
                  v-else
                  v-for="category in categories"
                  :key="category.value"
                  :value="category.value"
                >
                  {{ category.label }}
                </option>
              </select>
            </div>

            <div>
              <label for="course_category" class="mb-1 block text-sm font-medium text-gray-700">
                課程類別 <span class="text-red-500">*</span>
              </label>
              <select
                id="course_category"
                v-model="form.course_category"
                data-testid="course-category-select"
                required
                class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">請選擇類別</option>
                <option value="theme">主題課程</option>
                <option value="regular">常態課程</option>
              </select>
            </div>

            <div>
              <label for="course_type" class="mb-1 block text-sm font-medium text-gray-700">
                課程類型
              </label>
              <select
                id="course_type"
                v-model="form.course_type"
                class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="regular">常規課程</option>
                <option value="intensive">密集課程</option>
                <option value="makeup">補課</option>
              </select>
            </div>

            <div>
              <label for="status" class="mb-1 block text-sm font-medium text-gray-700">
                課程狀態
              </label>
              <select
                id="status"
                v-model="form.status"
                class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="planning">籌備中</option>
                <option value="active">進行中</option>
                <option value="full">已額滿</option>
                <option value="ended">已結束</option>
              </select>
            </div>
          </div>

          <div class="mt-6">
            <label for="description" class="mb-1 block text-sm font-medium text-gray-700">
              課程描述
            </label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="輸入課程描述和內容"
            ></textarea>
          </div>
        </div>

        <!-- 課程方案 (只在常態課程時顯示) -->
        <div v-if="form.course_category === 'regular'" class="card p-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">課程方案</h3>
          <PackageTemplateSelector
            v-model="selectedTemplateIds"
            :price-per-session="form.price_per_session"
          />

          <!-- 管理現有方案連結 (只在編輯模式且有方案時顯示) -->
          <div v-if="isEdit && hasExistingPackages" class="mt-4 border-t pt-4">
            <router-link
              :to="`/courses/${route.params.id}/packages`"
              data-testid="package-management-link"
              class="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <CogIcon class="mr-1 size-4" />
              管理現有方案
            </router-link>
          </div>
        </div>

        <!-- 課程設定 -->
        <div class="card p-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">課程設定</h3>
          <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label for="total_sessions" class="mb-1 block text-sm font-medium text-gray-700">
                總堂數 <span class="text-red-500">*</span>
              </label>
              <input
                id="total_sessions"
                v-model.number="form.total_sessions"
                type="number"
                min="1"
                required
                class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label for="price_per_session" class="mb-1 block text-sm font-medium text-gray-700">
                每堂費用 (NT$) <span class="text-red-500">*</span>
              </label>
              <input
                id="price_per_session"
                v-model.number="form.price_per_session"
                type="number"
                min="0"
                step="1"
                required
                class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label for="max_students" class="mb-1 block text-sm font-medium text-gray-700">
                最大人數 <span class="text-red-500">*</span>
              </label>
              <input
                id="max_students"
                v-model.number="form.max_students"
                type="number"
                min="1"
                required
                class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <!-- 課程排程設定 -->
        <div class="card p-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">課程排程設定</h3>

          <!-- 課程時段設定 -->
          <div class="space-y-4">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">
                上課時段設定
              </label>
              <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label for="day_of_week" class="mb-1 block text-sm font-medium text-gray-700">
                    星期幾 <span class="text-red-500">*</span>
                  </label>
                  <select
                    id="day_of_week"
                    v-model="form.day_of_week"
                    required
                    class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">請選擇</option>
                    <option value="0">星期日</option>
                    <option value="1">星期一</option>
                    <option value="2">星期二</option>
                    <option value="3">星期三</option>
                    <option value="4">星期四</option>
                    <option value="5">星期五</option>
                    <option value="6">星期六</option>
                  </select>
                </div>

                <div>
                  <label for="start_time" class="mb-1 block text-sm font-medium text-gray-700">
                    開始時間 <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="start_time"
                    v-model="form.start_time"
                    type="time"
                    required
                    class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label for="end_time" class="mb-1 block text-sm font-medium text-gray-700">
                    結束時間 <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="end_time"
                    v-model="form.end_time"
                    type="time"
                    required
                    class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label for="classroom" class="mb-1 block text-sm font-medium text-gray-700">
                指定教室
              </label>
              <select
                id="classroom"
                v-model="form.classroom"
                class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                :disabled="loadingClassrooms"
              >
                <option value="">請選擇教室</option>
                <option
                  v-for="classroom in classrooms"
                  :key="classroom"
                  :value="classroom"
                >
                  {{ classroom }}
                </option>
              </select>
              <p v-if="loadingClassrooms" class="mt-1 text-sm text-gray-500">
                載入教室清單中...
              </p>
              <p v-else-if="classrooms.length === 0" class="mt-1 text-sm text-gray-500">
                目前沒有可用教室，將使用預設教室清單
              </p>
            </div>
          </div>

          <!-- 課程期間設定（非常態課程） -->
          <div v-if="form.course_type !== 'regular'" class="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <h4 class="mb-3 text-sm font-medium text-gray-900">課程期間設定</h4>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label for="course_start_date" class="mb-1 block text-sm font-medium text-gray-700">
                  課程開始日期 <span class="text-red-500">*</span>
                </label>
                <input
                  id="course_start_date"
                  v-model="form.course_start_date"
                  type="date"
                  :required="form.course_type !== 'regular'"
                  class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label for="course_end_date" class="mb-1 block text-sm font-medium text-gray-700">
                  課程結束日期 <span class="text-red-500">*</span>
                </label>
                <input
                  id="course_end_date"
                  v-model="form.course_end_date"
                  type="date"
                  :required="form.course_type !== 'regular'"
                  class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <p class="mt-2 text-sm text-gray-600">
              {{ form.course_type === 'intensive' ? '密集課程需要設定明確的開始和結束日期' : '補課需要設定課程期間' }}
            </p>
          </div>

          <div v-else class="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div class="flex">
              <InformationCircleIcon class="mr-2 mt-0.5 size-5 text-blue-400" />
              <div class="text-sm text-blue-700">
                <p class="font-medium">常規課程說明</p>
                <p>常規課程將自動按照設定的時段每週重複排課，無需設定特定的開始和結束日期。</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 教師指派 -->
        <div class="card p-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">教師指派</h3>
          <div>
            <label for="instructor_id" class="mb-1 block text-sm font-medium text-gray-700">
              指派教師
            </label>
            <select
              id="instructor_id"
              v-model="form.instructor_id"
              class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              :disabled="loadingInstructors"
            >
              <option value="">暫不指派</option>
              <option
                v-for="instructor in instructors"
                :key="instructor.user_id"
                :value="instructor.user_id"
              >
                {{ instructor.full_name }}
              </option>
            </select>
            <p class="mt-1 text-sm text-gray-500">
              <span v-if="instructors.length === 0">
                目前沒有教師用戶，將自動指派給當前用戶
              </span>
              <span v-else>
                可選擇「暫不指派」，系統將自動指派預設教師
              </span>
            </p>
          </div>
        </div>

        <!-- 學生名單管理 -->
        <div class="card p-6" data-testid="student-management">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">學生名單管理</h3>
            <span class="text-sm text-gray-500">
              已選擇 {{ selectedStudents.length }} 名學生
              <span v-if="form.max_students > 0">
                / 最多 {{ form.max_students }} 名
              </span>
            </span>
          </div>

          <!-- 搜尋學生 -->
          <div class="mb-6">
            <label for="student_search" class="mb-2 block text-sm font-medium text-gray-700">
              搜尋並添加學生
            </label>
            <div class="relative">
              <input
                id="student_search"
                v-model="studentSearch"
                type="text"
                class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="輸入學生姓名或編號搜尋"
                @input="debounceStudentSearch"
              />
              <div v-if="loadingStudents" class="absolute right-3 top-3">
                <div class="size-4 animate-spin rounded-full border-b-2 border-blue-500"></div>
              </div>
            </div>

            <!-- 搜尋結果 -->
            <div v-if="searchResults.length > 0" class="mt-2 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm">
              <button
                v-for="student in searchResults"
                :key="student.id"
                @click="addStudent(student)"
                :disabled="isStudentSelected(student.id) || (form.max_students > 0 && selectedStudents.length >= form.max_students)"
                class="w-full border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium text-gray-900">
                      {{ student.chinese_name }}
                      <span v-if="student.english_name" class="text-gray-500">
                        ({{ student.english_name }})
                      </span>
                    </div>
                    <div class="text-sm text-gray-500">{{ student.student_id }}</div>
                  </div>
                  <div v-if="isStudentSelected(student.id)" class="text-sm text-green-600">
                    已選擇
                  </div>
                </div>
              </button>
            </div>

            <div v-else-if="studentSearch && !loadingStudents" class="mt-2 px-4 py-2 text-sm text-gray-500">
              找不到符合條件的學生
            </div>
          </div>

          <!-- 已選擇的學生清單 -->
          <div v-if="selectedStudents.length > 0">
            <h4 class="mb-3 text-sm font-medium text-gray-900">已選擇的學生</h4>
            <div class="space-y-2">
              <div
                v-for="student in selectedStudents"
                :key="student.id"
                class="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3"
              >
                <div class="flex items-center">
                  <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <span class="text-sm font-medium text-blue-600">
                      {{ student.chinese_name.charAt(0) }}
                    </span>
                  </div>
                  <div class="ml-3">
                    <div class="text-sm font-medium text-gray-900">
                      {{ student.chinese_name }}
                      <span v-if="student.english_name" class="text-gray-500">
                        ({{ student.english_name }})
                      </span>
                    </div>
                    <div class="text-xs text-gray-500">{{ student.student_id }}</div>
                  </div>
                </div>
                <button
                  @click="removeStudent(student.id)"
                  class="inline-flex items-center rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-100"
                  title="移除學生"
                >
                  <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- 人數限制提示 -->
            <div v-if="form.max_students > 0" class="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-gray-600">
              <div class="flex items-center">
                <svg class="mr-2 size-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  <span v-if="selectedStudents.length < form.max_students">
                    還可以添加 {{ form.max_students - selectedStudents.length }} 名學生
                  </span>
                  <span v-else class="font-medium text-yellow-700">
                    已達到課程人數上限
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div v-else class="py-8 text-center text-gray-500">
            <UserGroupIcon class="mx-auto mb-3 size-12 text-gray-300" />
            <p class="text-sm">尚未選擇任何學生</p>
            <p class="mt-1 text-xs">使用上方搜尋功能添加學生到課程中</p>
          </div>
        </div>

        <!-- 表單按鈕 -->
        <div class="mt-6 flex justify-end space-x-4 border-t border-gray-200 pt-6">
          <router-link
            to="/courses"
            class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            取消
          </router-link>
          <button
            type="submit"
            :disabled="loading"
            class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div v-if="loading" class="mr-2 size-4 animate-spin rounded-full border-b-2 border-white"></div>
            {{ isEdit ? '更新課程' : '建立課程' }}
          </button>
        </div>
      </form>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import { db, supabase, queries } from '@/services/supabase'
import { categoryService } from '@/services/categoryService'
import { useAuthStore } from '@/stores/auth'
import type { Course } from '@/types'
import { ArrowLeftIcon, InformationCircleIcon, UserGroupIcon, CogIcon } from '@heroicons/vue/24/outline'
import { coursePackageService } from '@/services/coursePackageService'
import PackageTemplateSelector from '@/components/courses/PackageTemplateSelector.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const loadingInstructors = ref(false)
const loadingClassrooms = ref(false)
const loadingStudents = ref(false)
const instructors = ref<Array<{user_id: string, full_name: string}>>([])
const classrooms = ref<string[]>([])
const categories = ref<Array<{value: string, label: string, color?: string}>>([])
const courseId = computed(() => route.params.id as string)
const isEdit = computed(() => !!courseId.value)
const currentCourseDbId = ref<number | null>(null)  // 保存資料庫的 id

// 學生選擇相關狀態
const selectedStudents = ref<Array<any>>([])
const studentSearch = ref('')
const searchResults = ref<Array<any>>([])
let studentSearchTimeout: NodeJS.Timeout

// 課程方案相關狀態
const selectedTemplateIds = ref<string[]>([])
const hasExistingPackages = ref(false)

const form = reactive({
  course_name: '',
  category: '',
  course_category: '' as 'theme' | 'regular' | '', // 新增：主題課/常態課
  allow_package_purchase: false, // 新增：是否允許套餐購買
  default_validity_days: 180, // 新增：預設有效天數
  course_type: 'regular' as const,
  status: 'planning' as const,
  description: '',
  total_sessions: 0,
  price_per_session: 0,
  max_students: 10,
  instructor_id: '',
  // 課程排程設定
  day_of_week: '',
  start_time: '',
  end_time: '',
  classroom: '',
  // 非常態課程期間設定
  course_start_date: '',
  course_end_date: ''
})

// 載入教師列表
async function loadInstructors() {
  try {
    loadingInstructors.value = true
    console.log('CourseFormView - 開始載入教師列表...')

    // 使用統一的教師查詢服務
    instructors.value = await queries.getInstructors()
    console.log('CourseFormView - 教師列表載入成功:', instructors.value.length, '位')

  } catch (error) {
    console.error('載入教師列表失敗:', error)
    // 如果沒有教師資料，提供空陣列
    instructors.value = []
  } finally {
    loadingInstructors.value = false
  }
}

// 載入教室列表
async function loadClassrooms() {
  try {
    loadingClassrooms.value = true
    console.log('CourseFormView - 開始載入教室列表...')

    // 使用統一的教室查詢服務，獲取教室名稱清單
    classrooms.value = await queries.getClassroomNames()
    console.log('CourseFormView - 教室列表載入成功:', classrooms.value.length, '個')

  } catch (error) {
    console.error('載入教室列表失敗:', error)
    // 如果載入失敗，提供預設教室清單
    classrooms.value = ['小教室 A', '小教室 B', '小會議室 C']
  } finally {
    loadingClassrooms.value = false
  }
}

// 載入課程分類
async function loadCategories() {
  try {
    console.log('CourseFormView - 開始載入課程分類...')

    // 使用課程分類服務獲取分類選項
    categories.value = await categoryService.getCategoryOptions()
    console.log('CourseFormView - 課程分類載入成功:', categories.value.length, '個')

  } catch (error) {
    console.error('載入課程分類失敗:', error)
    // 如果載入失敗，保持空陣列
    categories.value = []
  }
}


// 監聽方案模板選擇，自動啟用套餐購買
watch(selectedTemplateIds, (newValue) => {
  if (newValue.length > 0) {
    form.allow_package_purchase = true
  }
})

// 獲取預設教師ID（當沒有選擇教師時使用）
async function getDefaultInstructorId(): Promise<string> {
  const authStore = useAuthStore()

  try {
    // 如果沒有教師可選，使用當前登入的用戶
    if (authStore.user?.user_id) {
      console.log('CourseFormView - 使用當前用戶作為預設教師:', authStore.user.user_id)
      return authStore.user.user_id
    }

    // 嘗試獲取第一個可用的用戶
    const { data: firstUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (firstUser) {
      console.log('CourseFormView - 使用第一個可用用戶作為教師:', firstUser.user_id)
      return firstUser.user_id
    }

    // 最後的備用方案：拋出錯誤
    throw new Error('沒有可用的用戶作為預設教師')

  } catch (error) {
    console.error('獲取預設教師ID失敗:', error)
    throw new Error('無法獲取預設教師，請先創建用戶帳號')
  }
}

async function loadCourse() {
  if (!isEdit.value) return

  loading.value = true
  const startTime = performance.now()

  try {
    console.log('CourseFormView - 開始載入課程編輯資料:', courseId.value)

    // 從資料庫查詢課程 (使用 course_id)
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('course_id', courseId.value)
      .single()

    if (courseError) {
      console.error('CourseFormView - 查詢課程失敗:', courseError)
      if (courseError.code === 'PGRST116') {
        console.log('CourseFormView - 課程不存在')
        alert('課程不存在')
        router.push('/courses')
      } else {
        throw courseError
      }
    } else {
      console.log('CourseFormView - 課程資料載入成功:', course)

      // 保存資料庫的 id 用於更新
      currentCourseDbId.value = course.id

      Object.assign(form, {
        course_name: course.course_name || '',
        category: course.category || '',
        course_type: course.course_type || 'regular',
        status: course.status || 'planning',
        description: course.description || '',
        total_sessions: course.total_sessions || 0,
        price_per_session: course.price_per_session || 0,
        max_students: course.max_students || 10,
        instructor_id: course.instructor_id || '',
        // 排程設定部分 - 從 schedule_pattern JSON 欄位載入
        day_of_week: '',
        start_time: '',
        end_time: '',
        classroom: '',
        course_start_date: '',
        course_end_date: ''
      })

      // 載入課程的套餐設定
      form.course_category = course.course_category || ''
      form.allow_package_purchase = course.allow_package_purchase || false
      form.default_validity_days = course.default_validity_days || 180

      // 從 schedule_pattern JSON 欄位載入排程設定
      if (course.schedule_pattern) {
        try {
          const schedulePattern = typeof course.schedule_pattern === 'string'
            ? JSON.parse(course.schedule_pattern)
            : course.schedule_pattern

          console.log('CourseFormView - 從 schedule_pattern 載入排程:', schedulePattern)

          Object.assign(form, {
            day_of_week: schedulePattern.days && schedulePattern.days.length > 0
              ? schedulePattern.days[0].toString() : '',
            start_time: schedulePattern.start_time || '',
            end_time: schedulePattern.end_time || '',
            classroom: schedulePattern.classroom || '',
            course_start_date: schedulePattern.effective_date || '',
            course_end_date: schedulePattern.end_date || ''
          })

          console.log('CourseFormView - 排程設定載入成功，時間:', {
            start_time: form.start_time,
            end_time: form.end_time,
            day_of_week: form.day_of_week
          })
        } catch (parseError) {
          console.warn('CourseFormView - 解析 schedule_pattern 失敗:', parseError)
        }
      }

      console.log('CourseFormView - 表單資料設定完成:', form)

      // 備用：嘗試從 schedule_patterns 表載入（如果 JSON 欄位沒有資料）
      if (!form.start_time || !form.end_time) {
        try {
          const { data: schedulePattern, error: scheduleError } = await supabase
            .from('schedule_patterns')
            .select('*')
            .eq('course_id', courseId.value)
            .single()

          if (!scheduleError && schedulePattern) {
            Object.assign(form, {
              day_of_week: schedulePattern.day_of_week || form.day_of_week,
              start_time: schedulePattern.start_time || form.start_time,
              end_time: schedulePattern.end_time || form.end_time,
              classroom: schedulePattern.classroom || form.classroom,
              course_start_date: schedulePattern.course_start_date || form.course_start_date,
              course_end_date: schedulePattern.course_end_date || form.course_end_date
            })
            console.log('CourseFormView - 從 schedule_patterns 表補充載入:', schedulePattern)
          }
        } catch (scheduleError) {
          console.warn('CourseFormView - 載入 schedule_patterns 表失敗:', scheduleError)
        }
      }
    }

    const endTime = performance.now()
    console.log(`CourseFormView - 載入完成，耗時: ${(endTime - startTime).toFixed(2)}ms`)

  } catch (error) {
    console.error('CourseFormView - 載入課程失敗:', error)
    alert('載入課程資料失敗，請稍後再試')
    router.push('/courses')
  } finally {
    loading.value = false
  }
}

function generateCourseId(): string {
  // 根據標準API文檔生成課程 ID格式：CO + YYYY + 4位數字
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const second = String(now.getSeconds()).padStart(2, '0')
  return `CO${year}${month}${day}${hour}${minute}${second}`
}

// 計算課程時長（分鐘）
function calculateDuration(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 90 // 預設90分鐘

  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute

  return endMinutes - startMinutes
}

async function submitForm() {
  loading.value = true
  try {
    console.log('CourseFormView - 開始提交課程資料...')

    // 生成課程 ID（如果是新建課程）
    const newCourseId = isEdit.value ? route.params.id : generateCourseId()

    // 構建課程資料，符合資料庫結構
    const courseData = {
      course_id: newCourseId,
      course_name: form.course_name,
      category: form.category,
      course_category: form.course_category,
      allow_package_purchase: form.allow_package_purchase,
      default_validity_days: form.default_validity_days,
      course_type: form.course_type,
      status: form.status,
      description: form.description || '',
      total_sessions: form.total_sessions,
      price_per_session: form.price_per_session,
      max_students: form.max_students,
      instructor_id: form.instructor_id || await getDefaultInstructorId(),
      schedule_pattern: {
        type: 'weekly',
        days: form.day_of_week ? [parseInt(form.day_of_week)] : [],
        start_time: form.start_time || '',
        end_time: form.end_time || '',
        duration: form.start_time && form.end_time ?
          calculateDuration(form.start_time, form.end_time) : 90,
        classroom: form.classroom || '',
        effective_date: form.course_start_date || new Date().toISOString().split('T')[0],
        end_date: form.course_end_date || null
      }
    }

    console.log('CourseFormView - 課程資料:', courseData)

    let savedCourse

    if (isEdit.value) {
      console.log('CourseFormView - 更新課程:', courseId.value, '資料庫ID:', currentCourseDbId.value)

      if (!currentCourseDbId.value) {
        throw new Error('無法找到課程的資料庫ID，無法更新')
      }

      // 使用統一服務層API更新課程 - 使用資料庫 id
      savedCourse = await db.update('courses', currentCourseDbId.value, courseData)

      console.log('CourseFormView - 課程更新成功:', savedCourse)
      alert('課程更新成功')
    } else {
      console.log('CourseFormView - 建立新課程')

      // 使用統一服務層API創建課程
      savedCourse = await db.create('courses', courseData)

      console.log('CourseFormView - 課程建立成功:', savedCourse)
      alert('課程建立成功')
    }

    // 如果有設定排程，自動創建課程安排
    if (form.day_of_week && form.start_time && form.end_time) {
      await createCourseSchedules(savedCourse)
    }

    // 儲存學生關聯 - 使用 courseData 中的 course_id
    if (selectedStudents.value.length > 0) {
      console.log('準備儲存學生關聯，courseData.course_id:', courseData.course_id)
      await saveCourseStudents(courseData.course_id)
    }

    // 如果選擇了方案模板，創建套餐
    if (selectedTemplateIds.value.length > 0) {
      await createCoursePackagesFromTemplates(courseData.course_id)
    }

    router.push('/courses')
  } catch (error) {
    console.error('儲存課程失敗:', error)
    alert(`儲存課程失敗：${error.message}`)
  } finally {
    loading.value = false
  }
}

// 建立排程設定
async function createSchedulePattern(courseId: string, pattern: any) {
  try {
    const { data, error } = await supabase
      .from('schedule_patterns')
      .insert([{
        course_id: courseId,
        day_of_week: pattern.day_of_week,
        start_time: pattern.start_time,
        end_time: pattern.end_time,
        classroom: pattern.classroom,
        course_start_date: pattern.course_start_date,
        course_end_date: pattern.course_end_date
      }])

    if (error) {
      throw error
    }

    console.log('CourseFormView - 排程設定建立成功:', data)
  } catch (error) {
    console.warn('CourseFormView - 建立排程設定失敗:', error)
  }
}

// 更新排程設定
async function updateSchedulePattern(courseId: string, pattern: any) {
  try {
    const { data, error } = await supabase
      .from('schedule_patterns')
      .upsert([{
        course_id: courseId,
        day_of_week: pattern.day_of_week,
        start_time: pattern.start_time,
        end_time: pattern.end_time,
        classroom: pattern.classroom,
        course_start_date: pattern.course_start_date,
        course_end_date: pattern.course_end_date
      }])

    if (error) {
      throw error
    }

    console.log('CourseFormView - 排程設定更新成功:', data)
  } catch (error) {
    console.warn('CourseFormView - 更新排程設定失敗:', error)
  }
}

async function createCourseSchedules(course: any) {
  try {
    if (form.course_type === 'regular') {
      // 常規課程：創建未來4週的課程安排作為示例
      await createRegularCourseSchedules(course)
    } else {
      // 非常規課程：根據開始和結束日期創建課程安排
      await createTimeLimitedCourseSchedules(course)
    }
  } catch (error) {
    console.error('創建課程安排失敗:', error)
    // 不阻止課程保存，只記錄錯誤
  }
}

async function createRegularCourseSchedules(course: any) {
  const dayOfWeek = parseInt(form.day_of_week)
  const today = new Date()

  // 找到下一個指定的星期幾
  const nextClassDate = new Date(today)
  const daysUntilNext = (dayOfWeek + 7 - today.getDay()) % 7
  nextClassDate.setDate(today.getDate() + (daysUntilNext === 0 ? 7 : daysUntilNext))

  // 創建未來4週的課程安排
  for (let week = 0; week < 4; week++) {
    const classDate = new Date(nextClassDate)
    classDate.setDate(nextClassDate.getDate() + (week * 7))

    const startDateTime = new Date(classDate)
    const [startHour, startMinute] = form.start_time.split(':')
    startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0)

    const endDateTime = new Date(classDate)
    const [endHour, endMinute] = form.end_time.split(':')
    endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0)

    // 使用統一服務層API創建課程安排
    await db.create('schedules', {
      schedule_id: `${course.course_id}_${classDate.toISOString().split('T')[0]}`,
      course_id: course.course_id,
      class_datetime: startDateTime.toISOString(),
      end_datetime: endDateTime.toISOString(),
      classroom: form.classroom,
      status: 'scheduled',
      session_number: week + 1
    })
  }
}

async function createTimeLimitedCourseSchedules(course: any) {
  const startDate = new Date(form.course_start_date)
  const endDate = new Date(form.course_end_date)
  const dayOfWeek = parseInt(form.day_of_week)

  // 找到期間內所有指定的星期幾
  const currentDate = new Date(startDate)
  const daysUntilFirst = (dayOfWeek + 7 - currentDate.getDay()) % 7
  currentDate.setDate(startDate.getDate() + daysUntilFirst)

  let sessionNumber = 1

  while (currentDate <= endDate) {
    const startDateTime = new Date(currentDate)
    const [startHour, startMinute] = form.start_time.split(':')
    startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0)

    const endDateTime = new Date(currentDate)
    const [endHour, endMinute] = form.end_time.split(':')
    endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0)

    // 使用統一服務層API創建課程安排
    await db.create('schedules', {
      schedule_id: `${course.course_id}_${currentDate.toISOString().split('T')[0]}`,
      course_id: course.course_id,
      class_datetime: startDateTime.toISOString(),
      end_datetime: endDateTime.toISOString(),
      classroom: form.classroom,
      status: 'scheduled',
      session_number: sessionNumber
    })

    // 移動到下一週的同一天
    currentDate.setDate(currentDate.getDate() + 7)
    sessionNumber++
  }
}

// 學生搜尋防抖
function debounceStudentSearch() {
  clearTimeout(studentSearchTimeout)
  studentSearchTimeout = setTimeout(() => {
    if (studentSearch.value.trim()) {
      searchStudents()
    } else {
      searchResults.value = []
    }
  }, 300)
}

// 搜尋學生
async function searchStudents() {
  if (!studentSearch.value.trim()) {
    searchResults.value = []
    return
  }

  loadingStudents.value = true
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('is_active', true)
      .or(`chinese_name.ilike.%${studentSearch.value}%,english_name.ilike.%${studentSearch.value}%,student_id.ilike.%${studentSearch.value}%`)
      .limit(10)

    if (error) throw error

    searchResults.value = data || []
  } catch (error) {
    console.error('搜尋學生失敗:', error)
    searchResults.value = []
  } finally {
    loadingStudents.value = false
  }
}

// 添加學生到課程
function addStudent(student: any) {
  if (isStudentSelected(student.id)) return
  if (form.max_students > 0 && selectedStudents.value.length >= form.max_students) return

  selectedStudents.value.push(student)
  searchResults.value = []
  studentSearch.value = ''
}

// 移除學生
function removeStudent(studentId: number) {
  const index = selectedStudents.value.findIndex(s => s.id === studentId)
  if (index !== -1) {
    selectedStudents.value.splice(index, 1)
  }
}

// 檢查學生是否已選擇
function isStudentSelected(studentId: number): boolean {
  return selectedStudents.value.some(s => s.id === studentId)
}

// 載入現有課程的學生清單
async function loadCourseStudents() {
  if (!isEdit.value) return

  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select(`
        students (
          id,
          student_id,
          chinese_name,
          english_name,
          is_active
        )
      `)
      .eq('course_id', courseId.value)
      .eq('is_active', true)

    if (error) throw error

    if (data) {
      selectedStudents.value = data
        .map(enrollment => enrollment.students)
        .filter(student => student && student.is_active)
    }
  } catch (error) {
    console.error('載入課程學生清單失敗:', error)
  }
}

// 儲存課程學生關聯
async function saveCourseStudents(courseId: string) {
  try {
    console.log('開始儲存課程學生關聯, courseId:', courseId, 'selectedStudents:', selectedStudents.value.length)

    if (!courseId) {
      throw new Error('courseId 不能為空')
    }

    // 如果是編輯模式，先刪除現有的學生關聯
    if (isEdit.value) {
      console.log('編輯模式：先刪除現有學生關聯')
      const { error: deleteError } = await supabase
        .from('course_enrollments')
        .delete()
        .eq('course_id', courseId)

      if (deleteError) {
        console.error('刪除現有學生關聯失敗:', deleteError)
        throw deleteError
      }
    }

    // 添加新的學生關聯
    if (selectedStudents.value.length > 0) {
      const enrollments = selectedStudents.value.map((student, index) => ({
        enrollment_id: `${courseId}_${student.id}_${Date.now()}_${index}`,
        course_id: courseId,
        student_id: student.id,
        enrollment_date: new Date().toISOString().split('T')[0],
        status: 'enrolled',
        is_active: true
      }))

      console.log('準備插入的學生關聯資料:', enrollments)

      const { error } = await supabase
        .from('course_enrollments')
        .insert(enrollments)

      if (error) {
        console.error('插入學生關聯失敗:', error)
        throw error
      }
      console.log('課程學生關聯儲存成功:', enrollments.length, '筆')
    }
  } catch (error) {
    console.error('儲存課程學生關聯失敗:', error)
    throw error
  }
}

// 從模板創建課程套餐
async function createCoursePackagesFromTemplates(courseId: string) {
  try {
    console.log('開始從模板創建套餐, courseId:', courseId)

    // 先載入模板資料
    const { data, error } = await supabase
      .from('tutoring_center_settings')
      .select('setting_value')
      .eq('setting_key', 'package_templates')
      .single()

    if (error || !data?.setting_value) {
      console.error('載入模板失敗:', error)
      return
    }

    const templates = data.setting_value as any[]

    for (const templateId of selectedTemplateIds.value) {
      const template = templates.find(t => t.id === templateId)
      if (!template) continue

      const basePrice = form.price_per_session || 0
      const totalPrice = basePrice * template.session_count
      const discountAmount = totalPrice * (template.discount_percentage / 100)
      const finalPrice = totalPrice - discountAmount

      await coursePackageService.createPackage({
        course_id: courseId,
        package_name: template.name,
        session_count: template.session_count,
        price: finalPrice,
        discount_percentage: template.discount_percentage,
        validity_days: template.validity_days,
        sort_order: template.sort_order || 0,
        is_active: true
      })
    }

    console.log('套餐創建完成')
  } catch (error) {
    console.error('創建套餐失敗:', error)
    // 不阻止課程保存，只記錄錯誤
  }
}

// 載入現有的課程套餐設定
async function loadCoursePackages() {
  if (!isEdit.value || !courseId.value) return

  try {
    const packages = await coursePackageService.getPackagesByCourse(courseId.value)
    hasExistingPackages.value = packages.length > 0
  } catch (error) {
    console.error('載入課程套餐失敗:', error)
  }
}

onMounted(() => {
  loadInstructors()
  loadClassrooms()
  loadCategories()
  loadCourse()
  if (isEdit.value) {
    loadCourseStudents()
    loadCoursePackages()
  }
})
</script>
