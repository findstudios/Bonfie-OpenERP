<template>
  <MainLayout>
    <div class="mx-auto max-w-6xl space-y-6">
      <!-- 頁面標題和操作 -->
      <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            新增訂單
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            建立新的課程報名或商品訂單
          </p>
        </div>
        <div class="mt-4 flex md:ml-4 md:mt-0">
          <router-link
            to="/"
            class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            返回首頁
          </router-link>
        </div>
      </div>

      <!-- 訂單表單 -->
      <form @submit.prevent="createOrder" class="space-y-6">
        <!-- 基本資訊 -->
        <div class="card">
          <div class="border-b border-gray-200 px-6 py-4">
            <h3 class="text-lg font-medium text-gray-900">基本資訊</h3>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div class="relative">
                <label for="student_input" class="mb-1 block text-sm font-medium text-gray-700">
                  學生 <span class="text-red-500">*</span>
                </label>
                <input
                  id="student_input"
                  v-model="studentSearch"
                  @input="onStudentSearch"
                  @focus="showStudentSuggestions = true"
                  @blur="hideStudentSuggestions"
                  placeholder="輸入學生姓名或學號進行搜尋..."
                  required
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  autocomplete="off"
                />

                <!-- 建議下拉清單 -->
                <div
                  v-if="showStudentSuggestions && filteredStudents.length > 0"
                  class="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg"
                >
                  <div
                    v-for="student in filteredStudents"
                    :key="student.student_id"
                    @mousedown="selectStudent(student)"
                    class="cursor-pointer border-b border-gray-100 px-3 py-2 last:border-b-0 hover:bg-blue-50"
                  >
                    <div class="font-medium text-gray-900">{{ student.chinese_name }}</div>
                    <div class="text-sm text-gray-500">學號: {{ student.student_id }}</div>
                  </div>
                </div>

                <!-- 無搜尋結果 -->
                <div
                  v-if="showStudentSuggestions && studentSearch && filteredStudents.length === 0"
                  class="absolute z-10 mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-500 shadow-lg"
                >
                  找不到符合的學生
                </div>
              </div>

              <div>
                <label for="contact_select" class="mb-1 block text-sm font-medium text-gray-700">
                  聯絡人 <span class="text-red-500">*</span>
                </label>
                <select
                  id="contact_select"
                  v-model="form.contact_id"
                  required
                  :disabled="!form.student_id"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">請選擇聯絡人</option>
                  <option v-for="contact in studentContacts" :key="contact.id" :value="contact.contact_id">
                    {{ contact.full_name }} ({{ contact.phone }})
                  </option>
                </select>
                <p v-if="!form.student_id" class="mt-1 text-xs text-gray-500">
                  請先選擇學生
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 訂單項目 -->
        <div class="card">
          <div class="border-b border-gray-200 px-6 py-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900">訂單項目</h3>
              <button
                type="button"
                @click="addOrderItem"
                class="inline-flex items-center rounded-md border border-transparent bg-blue-100 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PlusIcon class="mr-1 size-4" />
                新增項目
              </button>
            </div>
          </div>
          <div class="p-6">
            <div v-if="form.items.length === 0" class="py-8 text-center text-gray-500">
              <ShoppingCartIcon class="mx-auto size-12 text-gray-400" />
              <p class="mt-2">尚未添加任何項目</p>
              <button
                type="button"
                @click="addOrderItem"
                class="mt-4 inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PlusIcon class="mr-1 size-4" />
                新增第一個項目
              </button>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="(item, index) in form.items"
                :key="index"
                class="rounded-lg border border-gray-200 p-4"
              >
                <div class="grid grid-cols-1 gap-4 md:grid-cols-6">
                  <div class="md:col-span-2">
                    <label :for="`item_type_${index}`" class="mb-1 block text-sm font-medium text-gray-700">
                      項目類型
                    </label>
                    <select
                      :id="`item_type_${index}`"
                      v-model="item.item_type"
                      @change="loadItemOptions(index)"
                      required
                      class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">請選擇類型</option>
                      <option value="enrollment">課程報名</option>
                      <option value="material">教材費用</option>
                      <option value="activity">活動費用</option>
                    </select>
                  </div>

                  <div class="md:col-span-2">
                    <label :for="`item_name_${index}`" class="mb-1 block text-sm font-medium text-gray-700">
                      項目名稱
                    </label>
                    <select
                      v-if="item.item_type === 'enrollment'"
                      :id="`item_name_${index}`"
                      v-model="item.item_id"
                      @change="updateItemDetails(index)"
                      required
                      class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">請選擇課程</option>
                      <option v-for="course in courses" :key="course.course_id" :value="course.course_id">
                        {{ course.course_name }}
                      </option>
                    </select>
                    <input
                      v-else
                      :id="`item_name_${index}`"
                      v-model="item.item_name"
                      type="text"
                      required
                      class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      placeholder="輸入項目名稱"
                    />
                  </div>

                  <!-- 方案選擇器 - 只在選擇了支援方案的課程時顯示 -->
                  <div v-if="shouldShowPackageSelector(item)" class="mt-4 md:col-span-6">
                    <CoursePackageSelector
                      :course-id="item.item_id"
                      :model-value="null"
                      @change="(pkg) => onPackageSelected(index, pkg)"
                    />
                  </div>

                  <div>
                    <label :for="`quantity_${index}`" class="mb-1 block text-sm font-medium text-gray-700">
                      數量
                    </label>
                    <input
                      :id="`quantity_${index}`"
                      v-model.number="item.quantity"
                      type="number"
                      min="1"
                      required
                      @input="calculateItemTotal(index)"
                      class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label :for="`unit_price_${index}`" class="mb-1 block text-sm font-medium text-gray-700">
                      單價
                    </label>
                    <input
                      :id="`unit_price_${index}`"
                      v-model.number="item.unit_price"
                      type="number"
                      min="0"
                      step="1"
                      required
                      @input="calculateItemTotal(index)"
                      class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <label :for="`discount_${index}`" class="mb-1 block text-sm font-medium text-gray-700">
                      折扣金額
                    </label>
                    <input
                      :id="`discount_${index}`"
                      v-model.number="item.discount_amount"
                      type="number"
                      min="0"
                      :max="item.total_price"
                      step="1"
                      @input="calculateItemTotal(index)"
                      class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">
                      小計
                    </label>
                    <div class="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium">
                      ${{ formatCurrency(item.total_price) }}
                    </div>
                  </div>

                  <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">
                      實付金額
                    </label>
                    <div class="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-800">
                      ${{ formatCurrency(item.final_price) }}
                    </div>
                  </div>

                  <div class="flex items-end">
                    <button
                      type="button"
                      @click="removeOrderItem(index)"
                      class="inline-flex w-full items-center justify-center rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      <TrashIcon class="mr-1 size-4" />
                      移除
                    </button>
                  </div>
                </div>

                <div class="mt-4">
                  <label :for="`notes_${index}`" class="mb-1 block text-sm font-medium text-gray-700">
                    項目備註
                  </label>
                  <input
                    :id="`notes_${index}`"
                    v-model="item.notes"
                    type="text"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholder="選填"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 折扣與備註 -->
        <div class="card">
          <div class="border-b border-gray-200 px-6 py-4">
            <h3 class="text-lg font-medium text-gray-900">折扣與備註</h3>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label for="discount_amount" class="mb-1 block text-sm font-medium text-gray-700">
                  額外折扣金額
                </label>
                <input
                  id="discount_amount"
                  v-model.number="form.extra_discount"
                  type="number"
                  min="0"
                  :max="getTotalAmount()"
                  step="1"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label for="discount_reason" class="mb-1 block text-sm font-medium text-gray-700">
                  折扣原因
                </label>
                <input
                  id="discount_reason"
                  v-model="form.discount_reason"
                  type="text"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="選填"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 金額摘要 -->
        <div class="card">
          <div class="border-b border-gray-200 px-6 py-4">
            <h3 class="text-lg font-medium text-gray-900">金額摘要</h3>
          </div>
          <div class="p-6">
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">項目總計</span>
                <span class="font-medium">${{ formatCurrency(getTotalAmount()) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">項目折扣</span>
                <span class="font-medium text-red-600">-${{ formatCurrency(getItemDiscountTotal()) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">額外折扣</span>
                <span class="font-medium text-red-600">-${{ formatCurrency(form.extra_discount || 0) }}</span>
              </div>
              <div class="border-t border-gray-200 pt-2">
                <div class="flex justify-between text-lg font-bold">
                  <span>最終金額</span>
                  <span class="text-blue-600">${{ formatCurrency(getFinalAmount()) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 提交按鈕 -->
        <div class="flex justify-end space-x-3">
          <router-link
            to="/orders"
            class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            取消
          </router-link>
          <button
            type="submit"
            :disabled="creating || form.items.length === 0"
            class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <div v-if="creating" class="mr-2 size-4 animate-spin rounded-full border-b-2 border-white"></div>
            建立訂單
          </button>
        </div>
      </form>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import CoursePackageSelector from '@/components/courses/CoursePackageSelector.vue'
import { db } from '@/services/supabase'
import { useAuthStore } from '@/stores/authSupabase'
import type { Student, Course, Contact, CoursePackage } from '@/types'
import {
  ArrowLeftIcon,
  PlusIcon,
  ShoppingCartIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

// 導入重構後的工具函數
import { formatCurrency } from '@/utils/formatters'
import { calculateItemTotal as calculateTotal } from '@/utils/paymentCalculator'
import { createOrder as createOrderService, loadStudents as loadStudentsService, loadCourses as loadCoursesService, loadStudentContacts as loadStudentContactsService } from '@/services/orderFormService'

const router = useRouter()
const authStore = useAuthStore()

interface OrderItem {
  item_type: 'enrollment' | 'material' | 'activity' | ''
  item_id: string
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
  discount_amount: number
  final_price: number
  notes: string
  package_id?: string | null
  validity_days?: number
}

const creating = ref(false)
const students = ref<Student[]>([])
const courses = ref<Course[]>([])
const studentContacts = ref<Contact[]>([])

// 自動完成相關變數
const studentSearch = ref('')
const showStudentSuggestions = ref(false)
const filteredStudents = ref<Student[]>([])
const selectedStudent = ref<Student | null>(null)

const form = reactive({
  student_id: '',
  contact_id: '',
  items: [] as OrderItem[],
  extra_discount: 0,
  discount_reason: ''
})

async function loadStudents() {
  const result = await loadStudentsService()
  if (result.success) {
    students.value = result.data
    filteredStudents.value = result.data.slice(0, 10)
  } else {
    alert(`載入學生資料失敗: ${result.error}`)
  }
}

async function loadCourses() {
  const result = await loadCoursesService()
  if (result.success) {
    courses.value = result.data
  } else {
    alert(`載入課程資料失敗: ${result.error}`)
  }
}

async function loadStudentContacts() {
  if (!form.student_id) {
    studentContacts.value = []
    return
  }

  const result = await loadStudentContactsService(form.student_id)
  if (result.success) {
    studentContacts.value = result.data
  } else {
    alert(`載入學生聯絡人失敗: ${result.error}`)
    studentContacts.value = []
  }
}

// 學生搜尋相關功能
function onStudentSearch() {
  const searchTerm = studentSearch.value.toLowerCase().trim()

  if (searchTerm === '') {
    filteredStudents.value = students.value.slice(0, 10) // 預設顯示前10個學生
  } else {
    filteredStudents.value = students.value.filter(student =>
      student.chinese_name.toLowerCase().includes(searchTerm) ||
      student.english_name?.toLowerCase().includes(searchTerm) ||
      student.student_id.toLowerCase().includes(searchTerm)
    ).slice(0, 10) // 限制顯示10個結果
  }
}

function selectStudent(student: Student) {
  selectedStudent.value = student
  studentSearch.value = `${student.chinese_name} (${student.student_id})`
  form.student_id = student.student_id
  showStudentSuggestions.value = false

  // 載入該學生的聯絡人
  loadStudentContacts()
}

function hideStudentSuggestions() {
  // 延遲隱藏以允許點擊事件完成
  setTimeout(() => {
    showStudentSuggestions.value = false
  }, 150)
}

function addOrderItem() {
  form.items.push({
    item_type: '',
    item_id: '',
    item_name: '',
    quantity: 1,
    unit_price: 0,
    total_price: 0,
    discount_amount: 0,
    final_price: 0,
    notes: '',
    package_id: null,
    validity_days: undefined
  })
}

function removeOrderItem(index: number) {
  form.items.splice(index, 1)
}

function loadItemOptions(index: number) {
  const item = form.items[index]
  // 重置項目資料
  item.item_id = ''
  item.item_name = ''
  item.unit_price = 0
  calculateItemTotal(index)
}

function updateItemDetails(index: number) {
  const item = form.items[index]
  if (item.item_type === 'enrollment' && item.item_id) {
    const course = courses.value.find(c => c.course_id === item.item_id)
    if (course) {
      // 重置方案相關資訊
      item.package_id = null
      item.validity_days = undefined

      // 如果是主題課或不支援方案，直接設定價格
      if (course.course_category === 'theme' || !course.allow_package_purchase) {
        item.item_name = `${course.course_name} (${course.total_sessions}堂)`
        item.unit_price = course.price_per_session * course.total_sessions
        calculateItemTotal(index)
      } else {
        // 常態課支援方案，等待選擇方案
        item.item_name = course.course_name
        item.unit_price = 0
        calculateItemTotal(index)
      }
    }
  }
}

function calculateItemTotal(index: number) {
  const item = form.items[index]
  const result = calculateTotal(item.quantity, item.unit_price, item.discount_amount)
  item.total_price = result.totalPrice
  item.final_price = result.finalPrice
}

function shouldShowPackageSelector(item: OrderItem): boolean {
  if (item.item_type !== 'enrollment' || !item.item_id) return false

  const course = courses.value.find(c => c.course_id === item.item_id)
  return !!(course && course.allow_package_purchase && course.course_category === 'regular')
}

function onPackageSelected(index: number, pkg: CoursePackage | null) {
  const item = form.items[index]

  if (pkg) {
    item.package_id = pkg.package_id
    item.validity_days = pkg.validity_days
    item.item_name = `${item.item_name} - ${pkg.package_name} (${pkg.session_count}堂)`
    item.unit_price = pkg.price
    calculateItemTotal(index)
  } else {
    // 清除方案選擇
    item.package_id = null
    item.validity_days = undefined
    updateItemDetails(index)
  }
}

// 計算函數 - 使用 reduce 保持簡潔
function getTotalAmount(): number {
  return form.items.reduce((sum, item) => sum + item.total_price, 0)
}

function getItemDiscountTotal(): number {
  return form.items.reduce((sum, item) => sum + (item.discount_amount || 0), 0)
}

function getFinalAmount(): number {
  const itemsTotal = form.items.reduce((sum, item) => sum + item.final_price, 0)
  return Math.max(0, itemsTotal - (form.extra_discount || 0))
}

async function createOrder() {
  creating.value = true
  try {
    const formData = {
      student_id: form.student_id,
      contact_id: form.contact_id,
      items: form.items,
      extra_discount: form.extra_discount,
      discount_reason: form.discount_reason
    }

    const result = await createOrderService(formData)

    if (result.success) {
      alert('訂單建立成功')
      router.push('/orders')
    } else {
      alert(result.error)
    }
  } catch (error) {
    console.error('建立訂單失敗:', error)
    alert(`建立訂單失敗: ${error.message}`)
  } finally {
    creating.value = false
  }
}

onMounted(() => {
  loadStudents()
  loadCourses()
  // 預設添加一個項目
  addOrderItem()
})
</script>
