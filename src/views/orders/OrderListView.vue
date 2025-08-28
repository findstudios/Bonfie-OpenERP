<template>
  <MainLayout>
    <div class="mx-auto max-w-6xl space-y-6">
      <!-- 頁面標題與操作 -->
      <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            訂單管理
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            管理學生課程訂單和付款記錄
          </p>
        </div>
        <div class="mt-4 flex gap-3 md:ml-4 md:mt-0">
          <router-link
            to="/orders/create-simplified"
            class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-transparent bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <SparklesIcon class="mr-2 size-4" />
            快速建立
          </router-link>
          <!-- 隱藏傳統新增按鈕
          <router-link
            to="/orders/create"
            class="inline-flex items-center justify-center px-6 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 min-h-[2.75rem]"
          >
            <PlusIcon class="h-4 w-4 mr-2" />
            傳統新增
          </router-link>
          -->
        </div>
      </div>

      <!-- 篩選和搜尋 -->
      <div class="card p-6">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label for="search" class="mb-1 block text-sm font-medium text-gray-700">
              搜尋訂單
            </label>
            <input
              id="search"
              v-model="filters.search"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="訂單編號或學生姓名"
              @input="debounceSearch"
            />
          </div>

          <div>
            <label for="status_filter" class="mb-1 block text-sm font-medium text-gray-700">
              訂單狀態
            </label>
            <select
              id="status_filter"
              v-model="filters.status"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              @change="loadOrders"
            >
              <option value="">全部狀態</option>
              <option value="pending">待處理</option>
              <option value="confirmed">已確認</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>

          <div>
            <label for="date_range" class="mb-1 block text-sm font-medium text-gray-700">
              建立日期
            </label>
            <select
              id="date_range"
              v-model="filters.dateRange"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              @change="loadOrders"
            >
              <option value="">全部時間</option>
              <option value="today">今天</option>
              <option value="week">本週</option>
              <option value="month">本月</option>
            </select>
          </div>

          <div class="flex items-end">
            <button
              @click="resetFilters"
              class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <ArrowPathIcon class="mr-1 size-4" />
              重置
            </button>
          </div>
        </div>
      </div>

      <!-- 統計卡片 -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div class="card p-6">
          <div class="flex items-center">
            <div class="shrink-0">
              <ClipboardDocumentListIcon class="size-8 text-blue-600" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="truncate text-sm font-medium text-gray-500">
                  總訂單數
                </dt>
                <dd class="text-2xl font-bold text-gray-900">
                  {{ orderStats.total }}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <div class="flex items-center">
            <div class="shrink-0">
              <ClockIcon class="size-8 text-yellow-600" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="truncate text-sm font-medium text-gray-500">
                  待處理訂單
                </dt>
                <dd class="text-2xl font-bold text-gray-900">
                  {{ orderStats.pending }}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <div class="flex items-center">
            <div class="shrink-0">
              <CurrencyDollarIcon class="size-8 text-green-600" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="truncate text-sm font-medium text-gray-500">
                  今日營收
                </dt>
                <dd class="text-2xl font-bold text-gray-900">
                  NT$ {{ formatCurrency(orderStats.dailyRevenue) }}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- 訂單列表 -->
      <div class="card">
        <div class="border-b border-gray-200 px-6 py-4">
          <h3 class="text-lg font-medium text-gray-900">
            訂單列表 ({{ orders.length }} 筆)
          </h3>
        </div>

        <!-- 載入中狀態 -->
        <div v-if="loading" class="p-6">
          <div class="animate-pulse space-y-4">
            <div v-for="i in 5" :key="i" class="h-20 rounded bg-gray-200"></div>
          </div>
        </div>

        <!-- 空狀態 -->
        <div v-else-if="orders.length === 0" class="p-6 text-center">
          <ShoppingCartIcon class="mx-auto size-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">沒有訂單</h3>
          <p class="mt-1 text-sm text-gray-500">
            開始建立第一個訂單
          </p>
          <div class="mt-6">
            <router-link
              to="/orders/create-simplified"
              class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <PlusIcon class="mr-2 size-4" />
              新增訂單
            </router-link>
          </div>
        </div>

        <!-- 訂單表格 -->
        <div v-else class="overflow-x-auto">
          <div class="inline-block min-w-full py-2 align-middle">
            <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="min-w-48 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  訂單資訊
                </th>
                <th class="min-w-36 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  學生
                </th>
                <th class="min-w-32 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  金額
                </th>
                <th class="min-w-36 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  付款狀態
                </th>
                <th class="min-w-24 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  狀態
                </th>
                <th class="min-w-32 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  建立時間
                </th>
                <th class="sticky right-0 min-w-40 bg-gray-50 px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="order in orders" :key="order.id" class="hover:bg-gray-50">
                <td class="whitespace-nowrap px-6 py-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ order.order_id }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ getOrderItemsText(order) }}
                  </div>
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ order.student?.chinese_name }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ order.student?.student_id }}
                  </div>
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <div class="text-sm text-gray-900">
                    <div v-if="order.discount_amount > 0" class="text-gray-500 line-through">
                      NT$ {{ formatCurrency(order.original_amount) }}
                    </div>
                    <div class="font-medium">
                      NT$ {{ formatCurrency(order.final_amount) }}
                    </div>
                    <div v-if="order.discount_amount > 0" class="text-xs text-red-600">
                      折扣: NT$ {{ formatCurrency(order.discount_amount) }}
                    </div>
                  </div>
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <div class="text-sm">
                    <div class="font-medium text-gray-900">
                      已付: NT$ {{ formatCurrency(getOrderPaidAmount(order)) }}
                    </div>
                    <div v-if="getOrderUnpaidAmount(order) > 0" class="text-red-600">
                      未付: NT$ {{ formatCurrency(getOrderUnpaidAmount(order)) }}
                    </div>
                    <div v-else class="text-green-600">
                      已全額付款
                    </div>
                  </div>
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <span
                    :class="getStatusClass(order.status)"
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  >
                    {{ getStatusText(order.status) }}
                  </span>
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {{ formatDateTime(order.created_at) }}
                </td>
                <td class="sticky right-0 whitespace-nowrap bg-white px-6 py-4 text-right text-sm font-medium">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      @click="viewOrder(order)"
                      class="text-blue-600 hover:text-blue-900"
                    >
                      查看
                    </button>
                    <button
                      v-if="getOrderUnpaidAmount(order) > 0"
                      @click="openPaymentModal(order)"
                      class="text-green-600 hover:text-green-900"
                    >
                      付款
                    </button>
                    <button
                      v-if="order.status === 'pending'"
                      @click="confirmOrder(order)"
                      class="text-purple-600 hover:text-purple-900"
                    >
                      確認
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- 付款 Modal -->
    <div v-if="showPaymentModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-screen items-center justify-center px-4">
        <div class="fixed inset-0 bg-black opacity-50" @click="showPaymentModal = false"></div>

        <div class="relative w-full max-w-md rounded-lg bg-white p-6">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">記錄付款</h3>
            <button @click="showPaymentModal = false" class="text-gray-400 hover:text-gray-600">
              <XMarkIcon class="size-5" />
            </button>
          </div>

          <form @submit.prevent="recordPayment" class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">訂單編號</label>
              <div class="text-sm text-gray-900">{{ selectedOrder?.order_id }}</div>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">未付金額</label>
              <div class="text-sm font-medium text-red-600">
                NT$ {{ formatCurrency(selectedOrder ? getOrderUnpaidAmount(selectedOrder) : 0) }}
              </div>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">付款金額</label>
              <input
                v-model.number="paymentForm.amount"
                type="number"
                step="1"
                min="1"
                :max="selectedOrder ? getOrderUnpaidAmount(selectedOrder) : 0"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">付款方式</label>
              <select
                v-model="paymentForm.method"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">請選擇付款方式</option>
                <option value="cash">現金</option>
                <option value="transfer">轉帳</option>
                <option value="credit_card">信用卡</option>
                <option value="line_pay">LINE Pay</option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">收據編號</label>
              <input
                v-model="paymentForm.receiptNumber"
                type="text"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="選填"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">備註</label>
              <textarea
                v-model="paymentForm.notes"
                rows="3"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="付款備註"
              ></textarea>
            </div>

            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="showPaymentModal = false"
                class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="processing"
                class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <div v-if="processing" class="mr-2 size-4 animate-spin rounded-full border-b-2 border-white"></div>
                記錄付款
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import { db } from '@/services/supabase'
import { useAuthStore } from '@/stores/authSupabase'
import type { Order } from '@/types'
import {
  PlusIcon,
  SparklesIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

// 導入重構後的服務
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { getStatusClass, getStatusText } from '@/services/orderStatus'
import { getTotalPaid, getUnpaidAmount } from '@/utils/paymentCalculator'
import { confirmOrder as confirmOrderService, cancelOrder as cancelOrderService, recordPayment as recordPaymentService, getTodayRevenue } from '@/services/orderService'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const processing = ref(false)
const orders = ref<Order[]>([])
const showPaymentModal = ref(false)
const selectedOrder = ref<Order | null>(null)

const filters = reactive({
  search: '',
  status: '',
  dateRange: ''
})

const paymentForm = reactive({
  amount: 0,
  method: '',
  receiptNumber: '',
  notes: ''
})

const orderStats = computed(() => {
  const total = orders.value.length
  const pending = orders.value.filter(o => o.status === 'pending').length

  // 計算今日營收（已確認的訂單的付款）
  const today = new Date()
  // 使用當地時間的日期字串，避免時區問題
  const todayStr = `${today.getFullYear()}-${
    String(today.getMonth() + 1).padStart(2, '0')}-${
    String(today.getDate()).padStart(2, '0')}`

  console.log('OrderListView - 今日日期 (當地時間):', todayStr)
  console.log('OrderListView - 所有訂單:', orders.value.length, '筆')

  // 計算今日營收（根據付款日期，而非訂單創建日期）
  let dailyRevenue = 0

  // 遍歷所有訂單的付款記錄
  orders.value.forEach(order => {
    if (order.payments && order.payments.length > 0) {
      // 篩選今日的付款記錄
      const todayPayments = order.payments.filter(payment => {
        const paymentDateTime = new Date(payment.payment_date)
        const paymentDateStr = `${paymentDateTime.getFullYear()}-${
          String(paymentDateTime.getMonth() + 1).padStart(2, '0')}-${
          String(paymentDateTime.getDate()).padStart(2, '0')}`

        return paymentDateStr === todayStr
      })

      // 計算今日付款總額
      if (todayPayments.length > 0) {
        const orderDailyRevenue = todayPayments.reduce((sum, payment) => sum + payment.amount_paid, 0)
        console.log('OrderListView - 訂單今日付款:', order.order_id, '金額:', orderDailyRevenue)
        dailyRevenue += orderDailyRevenue
      }
    }
  })

  console.log('OrderListView - 今日營收總計 (根據付款日期):', dailyRevenue)

  return { total, pending, dailyRevenue }
})

async function loadOrders() {
  loading.value = true
  try {
    console.log('OrderListView - 開始載入訂單資料...')

    // 使用統一服務層API載入訂單資料
    const queryFilters: any = {}

    // 添加狀態篩選
    if (filters.status) {
      queryFilters.status = filters.status
    }

    // 載入訂單資料包含關聯資訊
    const data = await db.findMany('orders', {
      columns: `
        id,
        order_id,
        student_id,
        contact_id,
        item_type,
        original_amount,
        discount_amount,
        final_amount,
        status,
        discount_reason,
        created_by,
        created_at,
        updated_at,
        student:students(
          id,
          student_id,
          chinese_name,
          english_name
        ),
        items:order_items(
          id,
          item_type,
          item_id,
          item_name,
          quantity,
          unit_price,
          total_price,
          discount_amount,
          final_price
        ),
        payments:payments(
          id,
          payment_id,
          amount_paid,
          payment_method,
          payment_date
        )
      `,
      filters: queryFilters,
      orderBy: 'created_at',
      ascending: false
    })

    orders.value = data

    // 如果有搜尋條件，進行前端篩選
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      orders.value = orders.value.filter(order =>
        order.order_id.toLowerCase().includes(searchTerm) ||
        order.student?.chinese_name?.toLowerCase().includes(searchTerm) ||
        order.student?.student_id?.toLowerCase().includes(searchTerm)
      )
    }

    console.log('OrderListView - 訂單資料載入成功:', orders.value.length, '筆')
    console.log('OrderListView - 第一筆訂單示例:', orders.value[0])
  } catch (error) {
    console.error('OrderListView - 載入訂單失敗:', error)
    console.error('OrderListView - 錯誤詳情:', error.message, error.code)
    alert(`載入訂單資料失敗: ${error.message || '未知錯誤'}`)
  } finally {
    loading.value = false
  }
}

let searchTimeout: NodeJS.Timeout
function debounceSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadOrders()
  }, 300)
}

function resetFilters() {
  filters.search = ''
  filters.status = ''
  filters.dateRange = ''
  loadOrders()
}

function getOrderItemsText(order: Order): string {
  if (!order.items || order.items.length === 0) return '無項目'

  const firstItem = order.items[0]
  const totalItems = order.items.length

  if (totalItems === 1) {
    return firstItem.item_name
  } else {
    return `${firstItem.item_name} 等 ${totalItems} 項`
  }
}

function getOrderPaidAmount(order: Order): number {
  if (!order.payments) return 0
  return order.payments.reduce((sum, payment) => sum + payment.amount_paid, 0)
}

function getOrderUnpaidAmount(order: Order): number {
  return order.final_amount - getOrderPaidAmount(order)
}

// getStatusClass 和 getStatusText 已移至 @/services/orderStatus

// formatCurrency 已移至 @/utils/formatters

// formatDateTime 已移至 @/utils/formatters

function viewOrder(order: Order) {
  router.push(`/orders/${order.id}`)
}

function openPaymentModal(order: Order) {
  selectedOrder.value = order
  paymentForm.amount = getOrderUnpaidAmount(order)
  paymentForm.method = ''
  paymentForm.receiptNumber = ''
  paymentForm.notes = ''
  showPaymentModal.value = true
}

async function recordPayment() {
  if (!selectedOrder.value) return

  // 檢查用戶認證
  if (!authStore.user?.user_id) {
    alert('請先登入系統')
    return
  }

  processing.value = true
  try {
    // 生成付款編號
    const paymentId = `PAY${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Date.now()).slice(-6)}`

    const paymentData = {
      payment_id: paymentId,
      order_id: selectedOrder.value.order_id,
      amount_paid: paymentForm.amount,
      payment_method: paymentForm.method,
      payment_date: new Date().toISOString(),
      receipt_number: paymentForm.receiptNumber || null,
      notes: paymentForm.notes || null,
      created_by: authStore.user.user_id
    }

    console.log('OrderListView - 付款資料:', paymentData)

    // 使用統一服務層API創建付款記錄
    await db.create('payments', paymentData)

    console.log('OrderListView - 付款記錄創建成功:', paymentId)

    alert('付款記錄成功')
    showPaymentModal.value = false
    selectedOrder.value = null
    loadOrders()
  } catch (error) {
    console.error('OrderListView - 記錄付款失敗:', error)

    let errorMessage = '記錄付款失敗'
    if (error.message) {
      errorMessage += `: ${error.message}`
    }
    if (error.code) {
      errorMessage += ` (錯誤代碼: ${error.code})`
    }

    alert(errorMessage)
  } finally {
    processing.value = false
  }
}

async function confirmOrder(order: Order) {
  if (!confirm('確定要確認此訂單嗎？')) return

  try {
    console.log('OrderListView - 開始確認訂單:', order.order_id, order.id)

    // 使用統一服務層API更新訂單狀態
    await db.update('orders', order.id, {
      status: 'confirmed',
      updated_at: new Date().toISOString()
    })

    console.log('OrderListView - 訂單確認成功:', order.order_id)

    // 立即更新本地狀態
    const orderIndex = orders.value.findIndex(o => o.id === order.id)
    if (orderIndex !== -1) {
      orders.value[orderIndex].status = 'confirmed'
      orders.value[orderIndex].updated_at = new Date().toISOString()
    }

    alert('訂單已確認')
  } catch (error) {
    console.error('OrderListView - 確認訂單失敗:', error)
    console.error('OrderListView - 錯誤詳情:', error.message, error.code)

    let errorMessage = '確認訂單失敗'
    if (error.message) {
      errorMessage += `: ${error.message}`
    }
    if (error.code) {
      errorMessage += ` (錯誤代碼: ${error.code})`
    }

    alert(errorMessage)
  }
}


onMounted(() => {
  loadOrders()
})
</script>
