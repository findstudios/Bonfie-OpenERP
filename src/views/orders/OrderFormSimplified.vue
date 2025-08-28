<template>
  <MainLayout>
    <div class="mx-auto max-w-4xl">
      <!-- 頁面標題 -->
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-900">快速建立訂單</h1>
          <router-link
            to="/orders"
            class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <ArrowLeftIcon class="size-4" />
            返回
          </router-link>
        </div>
      </div>

      <!-- 步驟1：選擇學生 -->
      <div class="card mb-6">
        <div class="p-6">
          <h2 class="mb-4 text-lg font-medium">選擇學生</h2>
          <StudentQuickSelector
            v-model="form.student_id"
            @change="onStudentSelected"
          />
        </div>
      </div>

      <!-- 步驟2：快速選擇購買類型 -->
      <div v-if="form.student_id" class="card mb-6">
        <div class="p-6">
          <h2 class="mb-4 text-lg font-medium">選擇購買項目</h2>

          <!-- 快速類型選擇 -->
          <div class="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <button
              @click="quickAddType('regular_course')"
              class="group rounded-lg border-2 p-4 text-center transition-colors hover:border-blue-500 hover:bg-blue-50"
            >
              <AcademicCapIcon class="mx-auto mb-2 size-8 text-blue-600 transition-transform group-hover:scale-110" />
              <div class="font-medium">常態課程</div>
              <div class="text-sm text-gray-600">購買堂數</div>
            </button>

            <button
              @click="quickAddType('theme_course')"
              class="group rounded-lg border-2 p-4 text-center transition-colors hover:border-green-500 hover:bg-green-50"
            >
              <CalendarIcon class="mx-auto mb-2 size-8 text-green-600 transition-transform group-hover:scale-110" />
              <div class="font-medium">主題課程</div>
              <div class="text-sm text-gray-600">整期報名</div>
            </button>

            <button
              @click="quickAddType('material')"
              class="group rounded-lg border-2 p-4 text-center transition-colors hover:border-purple-500 hover:bg-purple-50"
            >
              <BookOpenIcon class="mx-auto mb-2 size-8 text-purple-600 transition-transform group-hover:scale-110" />
              <div class="font-medium">教材費用</div>
              <div class="text-sm text-gray-600">書籍教具</div>
            </button>

            <button
              @click="quickAddType('custom')"
              class="group rounded-lg border-2 p-4 text-center transition-colors hover:border-orange-500 hover:bg-orange-50"
            >
              <PencilSquareIcon class="mx-auto mb-2 size-8 text-orange-600 transition-transform group-hover:scale-110" />
              <div class="font-medium">自定義</div>
              <div class="text-sm text-gray-600">其他項目</div>
            </button>
          </div>

          <!-- 已選擇的項目列表 -->
          <div v-if="form.items.length > 0" class="space-y-3">
            <h3 class="mb-2 text-sm font-medium text-gray-700">已新增項目</h3>
            <TransitionGroup name="list" tag="div" class="space-y-3">
              <div
                v-for="(item, index) in form.items"
                :key="item.temp_id"
                class="rounded-lg border bg-gray-50 p-4"
              >
                <!-- 常態課程項目 -->
                <div v-if="item.item_type === 'enrollment' && isRegularCourse(item)">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="font-medium text-gray-900">{{ item.course_name }}</div>
                      <PackageQuickSelector
                        v-if="item.item_id"
                        :course-id="item.item_id"
                        :value="item.package_id"
                        @change="updatePackage(index, $event)"
                        class="mt-2"
                      />
                      <div v-if="!item.package_id && item.item_id" class="mt-2">
                        <input
                          v-model.number="item.sessions"
                          type="number"
                          min="1"
                          placeholder="輸入堂數"
                          class="w-32 rounded-md border border-gray-300 px-3 py-1 text-sm"
                          @input="updateRegularCoursePrice(index)"
                        />
                        <span class="ml-2 text-sm text-gray-600">堂</span>
                      </div>
                    </div>
                    <button @click="removeItem(index)" class="ml-4 text-red-500 hover:text-red-700">
                      <XMarkIcon class="size-5" />
                    </button>
                  </div>
                </div>

                <!-- 主題課程項目 -->
                <div v-else-if="item.item_type === 'enrollment' && isThemeCourse(item)">
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="font-medium text-gray-900">{{ item.course_name }}</div>
                      <div class="mt-1 text-sm text-gray-600">
                        {{ item.sessions }}堂 / ${{ formatCurrency(item.unit_price) }}
                      </div>
                    </div>
                    <button @click="removeItem(index)" class="ml-4 text-red-500 hover:text-red-700">
                      <XMarkIcon class="size-5" />
                    </button>
                  </div>
                </div>

                <!-- 教材項目 -->
                <div v-else-if="item.item_type === 'material'">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <input
                        v-model="item.item_name"
                        placeholder="教材名稱"
                        class="w-full rounded-md border px-3 py-2"
                        required
                      />
                      <div class="mt-2 flex gap-2">
                        <input
                          v-model.number="item.quantity"
                          type="number"
                          min="1"
                          placeholder="數量"
                          class="w-24 rounded-md border px-3 py-2"
                          @input="calculateItemTotal(index)"
                        />
                        <input
                          v-model.number="item.unit_price"
                          type="number"
                          placeholder="單價"
                          class="w-32 rounded-md border px-3 py-2"
                          @input="calculateItemTotal(index)"
                        />
                      </div>
                    </div>
                    <button @click="removeItem(index)" class="ml-4 text-red-500 hover:text-red-700">
                      <XMarkIcon class="size-5" />
                    </button>
                  </div>
                </div>

                <!-- 自定義項目 -->
                <div v-else-if="item.item_type === 'custom'">
                  <div class="space-y-2">
                    <div class="flex gap-2">
                      <input
                        v-model="item.item_name"
                        placeholder="項目名稱"
                        class="flex-1 rounded-md border px-3 py-2"
                        required
                      />
                      <input
                        v-model.number="item.unit_price"
                        type="number"
                        placeholder="金額"
                        class="w-32 rounded-md border px-3 py-2"
                        @input="calculateItemTotal(index)"
                        required
                      />
                      <button @click="removeItem(index)" class="text-red-500 hover:text-red-700">
                        <XMarkIcon class="size-5" />
                      </button>
                    </div>
                    <textarea
                      v-model="item.notes"
                      placeholder="備註說明（選填）"
                      class="h-20 w-full resize-none rounded-md border px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            </TransitionGroup>
          </div>

          <div v-else class="py-8 text-center text-gray-500">
            <ShoppingCartIcon class="mx-auto size-12 text-gray-300" />
            <p class="mt-2">請選擇購買項目</p>
          </div>
        </div>
      </div>

      <!-- 步驟3：結帳資訊 -->
      <div v-if="form.items.length > 0" class="card mb-6">
        <div class="p-6">
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-lg font-medium">結帳資訊</h2>
            <div class="text-right">
              <div class="text-sm text-gray-600">總計</div>
              <div class="text-2xl font-bold text-blue-600">
                ${{ formatCurrency(calculateTotal()) }}
              </div>
            </div>
          </div>

          <!-- 聯絡人選擇 -->
          <div class="mb-4">
            <label class="mb-1 block text-sm font-medium text-gray-700">
              付款聯絡人
            </label>
            <select
              v-model="form.contact_id"
              required
              class="w-full rounded-md border px-3 py-2"
            >
              <option value="">請選擇聯絡人</option>
              <option v-for="contact in studentContacts" :key="contact.id" :value="contact.contact_id">
                {{ contact.full_name }} {{ contact.is_primary ? '(主要)' : '' }}
              </option>
            </select>
          </div>

          <!-- 快速折扣選項 -->
          <div v-if="canApplyDiscount" class="mb-6">
            <label class="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                v-model="applyMemberDiscount"
                @change="calculateDiscount"
                class="rounded"
              />
              <span class="text-sm">會員折扣 (-10%)</span>
            </label>
            <div v-if="form.discount_amount > 0" class="mt-2 text-sm text-green-600">
              折扣金額: -${{ formatCurrency(form.discount_amount) }}
            </div>
          </div>

          <!-- 建立訂單按鈕 -->
          <button
            @click="createOrder"
            class="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            :disabled="!canCheckout || processing"
          >
            <ShoppingCartIcon class="size-5" />
            建立訂單
          </button>
        </div>
      </div>
    </div>

    <!-- 課程選擇對話框 -->
    <CourseSelectionModal
      v-if="showCourseModal"
      :category-filter="courseModalCategory"
      @select="onCourseSelected"
      @close="showCourseModal = false"
    />

    <!-- 載入中遮罩 -->
    <div v-if="processing" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="rounded-lg bg-white p-6">
        <div class="mx-auto size-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-700">處理中...</p>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import StudentQuickSelector from '@/components/orders/StudentQuickSelector.vue'
import PackageQuickSelector from '@/components/orders/PackageQuickSelector.vue'
import CourseSelectionModal from '@/components/orders/CourseSelectionModal.vue'
import { orderSimplifiedService } from '@/services/orderSimplifiedService'
import { formatCurrency } from '@/utils/formatters'
import { useAuthStore } from '@/stores/authSupabase'
import type { Contact, Course } from '@/types'
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  CalendarIcon,
  BookOpenIcon,
  PencilSquareIcon,
  ShoppingCartIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

interface OrderItem {
  temp_id: number
  item_type: 'enrollment' | 'material' | 'custom'
  item_id: string
  item_name: string
  course_name?: string
  course_category?: string
  quantity: number
  unit_price: number
  total_price: number
  discount_amount: number
  final_price: number
  notes: string
  package_id?: string | null
  sessions?: number
}

const router = useRouter()
const authStore = useAuthStore()

// 狀態
const processing = ref(false)
const studentContacts = ref<Contact[]>([])
const showCourseModal = ref(false)
const courseModalCategory = ref<'regular' | 'theme'>('regular')
const applyMemberDiscount = ref(false)

// 表單資料
const form = reactive({
  student_id: '',
  contact_id: '',
  items: [] as OrderItem[],
  discount_amount: 0,
  discount_reason: ''
})

// 監聽學生變更
watch(() => form.student_id, async (newStudentId) => {
  if (newStudentId) {
    await loadStudentContacts(newStudentId)
    // 自動選擇主要聯絡人
    const primaryContact = studentContacts.value.find(c => c.is_primary)
    if (primaryContact) {
      form.contact_id = primaryContact.contact_id
    }
  } else {
    studentContacts.value = []
    form.contact_id = ''
  }
})

// 載入學生聯絡人
async function loadStudentContacts(studentId: string) {
  try {
    const contacts = await orderSimplifiedService.getStudentContacts(studentId)
    studentContacts.value = contacts
  } catch (error) {
    console.error('載入聯絡人失敗:', error)
    studentContacts.value = []
  }
}

// 學生選擇事件
function onStudentSelected(studentId: string) {
  form.student_id = studentId
}

// 快速新增項目類型
function quickAddType(type: string) {
  switch(type) {
    case 'regular_course':
      courseModalCategory.value = 'regular'
      showCourseModal.value = true
      break
    case 'theme_course':
      courseModalCategory.value = 'theme'
      showCourseModal.value = true
      break
    case 'material':
      addMaterialItem()
      break
    case 'custom':
      addCustomItem()
      break
  }
}

// 新增教材項目
function addMaterialItem() {
  form.items.push({
    temp_id: Date.now(),
    item_type: 'material',
    item_id: '',
    item_name: '',
    quantity: 1,
    unit_price: 0,
    total_price: 0,
    discount_amount: 0,
    final_price: 0,
    notes: ''
  })
}

// 新增自定義項目
function addCustomItem() {
  form.items.push({
    temp_id: Date.now(),
    item_type: 'custom',
    item_id: '',
    item_name: '',
    quantity: 1,
    unit_price: 0,
    total_price: 0,
    discount_amount: 0,
    final_price: 0,
    notes: ''
  })
}

// 課程選擇事件
async function onCourseSelected(course: Course) {
  showCourseModal.value = false

  if (course.course_category === 'theme') {
    // 主題課程：直接計算總價
    form.items.push({
      temp_id: Date.now(),
      item_type: 'enrollment',
      item_id: course.course_id,
      item_name: `${course.course_name} (${course.total_sessions}堂)`,
      course_name: course.course_name,
      course_category: 'theme',
      quantity: 1,
      unit_price: course.price_per_session * course.total_sessions,
      total_price: course.price_per_session * course.total_sessions,
      discount_amount: 0,
      final_price: course.price_per_session * course.total_sessions,
      notes: '',
      sessions: course.total_sessions
    })
  } else {
    // 常態課程：等待選擇套餐
    form.items.push({
      temp_id: Date.now(),
      item_type: 'enrollment',
      item_id: course.course_id,
      item_name: course.course_name,
      course_name: course.course_name,
      course_category: 'regular',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      discount_amount: 0,
      final_price: 0,
      notes: '',
      package_id: null
    })
  }
}

// 更新套餐
function updatePackage(index: number, packageData: any) {
  const item = form.items[index]
  if (packageData) {
    item.package_id = packageData.package_id
    item.item_name = `${item.course_name} - ${packageData.package_name} (${packageData.session_count}堂)`
    item.unit_price = packageData.price
    item.sessions = packageData.session_count
    calculateItemTotal(index)
  }
}

// 更新常態課程價格（當沒有套餐時）
async function updateRegularCoursePrice(index: number) {
  const item = form.items[index]
  if (!item.sessions || item.sessions < 1) return

  try {
    // 獲取課程單價
    const { data: course } = await supabase
      .from('courses')
      .select('price_per_session')
      .eq('course_id', item.item_id)
      .single()

    if (course?.price_per_session) {
      item.unit_price = course.price_per_session * item.sessions
      item.item_name = `${item.course_name} (${item.sessions}堂)`
      calculateItemTotal(index)
    }
  } catch (error) {
    console.error('獲取課程價格失敗:', error)
  }
}

// 計算項目總價
function calculateItemTotal(index: number) {
  const item = form.items[index]
  item.total_price = item.quantity * item.unit_price
  item.final_price = item.total_price - item.discount_amount
}

// 計算折扣
function calculateDiscount() {
  if (applyMemberDiscount.value) {
    const total = calculateSubtotal()
    form.discount_amount = Math.floor(total * 0.1)
    form.discount_reason = '會員折扣10%'
  } else {
    form.discount_amount = 0
    form.discount_reason = ''
  }
}

// 移除項目
function removeItem(index: number) {
  form.items.splice(index, 1)
}

// 判斷是否為常態課程
function isRegularCourse(item: OrderItem): boolean {
  return item.course_category === 'regular'
}

// 判斷是否為主題課程
function isThemeCourse(item: OrderItem): boolean {
  return item.course_category === 'theme'
}

// 計算小計
function calculateSubtotal(): number {
  return form.items.reduce((sum, item) => sum + item.final_price, 0)
}

// 計算總計
function calculateTotal(): number {
  return Math.max(0, calculateSubtotal() - form.discount_amount)
}

// 是否可以申請折扣
const canApplyDiscount = computed(() => {
  return authStore.hasPermission('orders:discount')
})

// 是否可以結帳
const canCheckout = computed(() => {
  return form.student_id && form.contact_id && form.items.length > 0 && form.items.every(item => {
    if (item.item_type === 'enrollment' && item.course_category === 'regular') {
      return item.package_id
    }
    return item.item_name && item.unit_price > 0
  })
})

// 建立訂單
async function createOrder() {
  if (!canCheckout.value) return

  processing.value = true
  try {
    // 建立訂單
    const orderData = {
      student_id: form.student_id,
      contact_id: form.contact_id,
      items: form.items.map(item => ({
        item_type: item.item_type,
        item_id: item.item_id || '',
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        discount_amount: item.discount_amount,
        final_price: item.final_price,
        notes: item.notes,
        package_id: item.package_id
      })),
      extra_discount: form.discount_amount,
      discount_reason: form.discount_reason
    }

    const order = await orderSimplifiedService.createOrder(orderData)

    // 訂單建立成功
    alert('訂單建立成功！')

    // 返回訂單列表
    router.push('/orders')
  } catch (error) {
    console.error('建立訂單失敗:', error)
    alert(`建立訂單失敗: ${error.message}`)
  } finally {
    processing.value = false
  }
}
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
