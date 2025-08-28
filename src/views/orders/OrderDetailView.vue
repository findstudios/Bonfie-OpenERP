<template>
  <MainLayout>
    <div class="mx-auto max-w-6xl space-y-6">
      <!-- 頁面標題與操作 -->
      <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <div class="flex items-center">
            <router-link
              to="/orders"
              class="mr-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon class="mr-1 size-4" />
              返回列表
            </router-link>
            <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              訂單詳情
            </h2>
          </div>
          <p class="mt-1 text-sm text-gray-500">
            查看和管理訂單詳細資訊
          </p>
        </div>
        <div class="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          <button
            v-if="order?.status === 'pending'"
            @click="confirmOrder"
            :disabled="processing"
            class="inline-flex items-center rounded-md border border-transparent bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <CheckIcon class="mr-1 size-4" />
            確認訂單
          </button>
          <button
            v-if="order?.status !== 'cancelled'"
            @click="cancelOrder"
            :disabled="processing"
            class="inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <XMarkIcon class="mr-1 size-4" />
            取消訂單
          </button>
          <button
            v-if="getUnpaidAmount(order) > 0"
            @click="openPaymentModal"
            class="inline-flex items-center rounded-md border border-transparent bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <CreditCardIcon class="mr-1 size-4" />
            記錄付款
          </button>
          <button
            @click="generateReceipt"
            :disabled="processing"
            class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <DocumentTextIcon class="mr-1 size-4" />
            下載收據
          </button>
        </div>
      </div>

      <!-- 載入中狀態 -->
      <div v-if="loading" class="card p-6">
        <div class="animate-pulse space-y-4">
          <div class="h-6 w-1/4 rounded bg-gray-200"></div>
          <div class="h-4 w-1/2 rounded bg-gray-200"></div>
          <div class="h-32 rounded bg-gray-200"></div>
        </div>
      </div>

      <!-- 訂單不存在 -->
      <div v-else-if="!order" class="card p-6 text-center">
        <ExclamationTriangleIcon class="mx-auto size-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">訂單不存在</h3>
        <p class="mt-1 text-sm text-gray-500">
          找不到指定的訂單，請確認訂單編號是否正確
        </p>
        <div class="mt-6">
          <router-link to="/orders" class="btn btn-primary">
            返回訂單列表
          </router-link>
        </div>
      </div>

      <!-- 訂單詳情 -->
      <div v-else class="space-y-6">
        <!-- 基本資訊 -->
        <div class="card">
          <div class="border-b border-gray-200 px-6 py-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900">基本資訊</h3>
              <div class="flex items-center space-x-4">
                <span
                  :class="getStatusClass(order.status)"
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium"
                >
                  {{ getStatusText(order.status) }}
                </span>
                <span
                  :class="getPaymentStatusClass()"
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium"
                >
                  {{ getPaymentStatusText() }}
                </span>
              </div>
            </div>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h4 class="mb-3 text-sm font-medium text-gray-900">訂單資訊</h4>
                <dl class="space-y-2">
                  <div class="flex justify-between">
                    <dt class="text-sm text-gray-500">訂單編號</dt>
                    <dd class="text-sm font-medium text-gray-900">{{ order.order_id }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-sm text-gray-500">建立時間</dt>
                    <dd class="text-sm text-gray-900">{{ formatDateTime(order.created_at) }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-sm text-gray-500">更新時間</dt>
                    <dd class="text-sm text-gray-900">{{ formatDateTime(order.updated_at) }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-sm text-gray-500">建立人員</dt>
                    <dd class="text-sm text-gray-900">{{ order.creator?.full_name || order.created_by || '系統' }}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 class="mb-3 text-sm font-medium text-gray-900">學生資訊</h4>
                <dl class="space-y-2">
                  <div>
                    <dt class="text-sm text-gray-500">姓名</dt>
                    <dd class="text-sm text-gray-900">
                      {{ order.student?.chinese_name }}
                      <span v-if="order.student?.english_name" class="text-gray-500">
                        ({{ order.student.english_name }})
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm text-gray-500">學號</dt>
                    <dd class="text-sm text-gray-900">{{ order.student?.student_id }}</dd>
                  </div>
                </dl>
                <div v-if="order.contact" class="mt-3 border-t border-gray-200 pt-3">
                  <h5 class="mb-1 text-xs font-medium text-gray-700">聯絡人</h5>
                  <div class="text-sm text-gray-900">{{ order.contact.full_name }}</div>
                  <div v-if="order.contact.phone" class="text-sm text-gray-500">
                    {{ order.contact.phone }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 訂單項目 -->
        <div class="card">
          <div class="border-b border-gray-200 px-6 py-4">
            <h3 class="text-lg font-medium text-gray-900">訂單項目</h3>
          </div>
          <div class="overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    項目
                  </th>
                  <th class="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    數量
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    單價
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    小計
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    折扣
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    實付
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="item in order.items" :key="item.id">
                  <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ item.item_name }}
                    </div>
                    <div v-if="item.notes" class="text-sm text-gray-500">
                      {{ item.notes }}
                    </div>
                  </td>
                  <td class="px-6 py-4 text-center text-sm text-gray-900">
                    {{ item.quantity }}
                  </td>
                  <td class="px-6 py-4 text-right text-sm text-gray-900">
                    ${{ formatCurrency(item.unit_price) }}
                  </td>
                  <td class="px-6 py-4 text-right text-sm text-gray-900">
                    ${{ formatCurrency(item.total_price) }}
                  </td>
                  <td class="px-6 py-4 text-right text-sm text-red-600">
                    <span v-if="item.discount_amount > 0">
                      -${{ formatCurrency(item.discount_amount) }}
                    </span>
                    <span v-else>-</span>
                  </td>
                  <td class="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    ${{ formatCurrency(item.final_price) }}
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50">
                <tr>
                  <td colspan="3" class="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    合計
                  </td>
                  <td class="px-6 py-4 text-right text-sm text-gray-900">
                    ${{ formatCurrency(order.original_amount) }}
                  </td>
                  <td class="px-6 py-4 text-right text-sm text-red-600">
                    <span v-if="order.discount_amount > 0">
                      -${{ formatCurrency(order.discount_amount) }}
                    </span>
                    <span v-else>-</span>
                  </td>
                  <td class="px-6 py-4 text-right text-lg font-bold text-gray-900">
                    ${{ formatCurrency(order.final_amount) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div v-if="order.discount_reason" class="border-t border-gray-200 bg-yellow-50 px-6 py-3">
            <div class="flex items-center">
              <InformationCircleIcon class="mr-2 size-5 text-yellow-400" />
              <span class="text-sm text-yellow-800">
                折扣原因：{{ order.discount_reason }}
              </span>
            </div>
          </div>
        </div>

        <!-- 付款記錄 -->
        <div class="card">
          <div class="border-b border-gray-200 px-6 py-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900">付款記錄</h3>
              <div class="text-sm text-gray-500">
                已付款：${{ formatCurrency(getTotalPaid(order?.payments || [])) }} /
                未付款：${{ formatCurrency(getUnpaidAmount(order)) }}
              </div>
            </div>
          </div>
          <div v-if="!order.payments || order.payments.length === 0" class="p-6 text-center">
            <CreditCardIcon class="mx-auto size-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900">尚無付款記錄</h3>
            <p class="mt-1 text-sm text-gray-500">
              點擊上方「記錄付款」按鈕添加付款資訊
            </p>
          </div>
          <div v-else class="overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    付款編號
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    金額
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    付款方式
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    付款時間
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    收據編號
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    建立人員
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    備註
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="payment in order.payments" :key="payment.id">
                  <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {{ payment.payment_id }}
                  </td>
                  <td class="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                    ${{ formatCurrency(payment.amount_paid) }}
                  </td>
                  <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {{ getPaymentMethodText(payment.payment_method) }}
                  </td>
                  <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {{ formatDateTime(payment.payment_date) }}
                  </td>
                  <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {{ payment.receipt_number || '-' }}
                  </td>
                  <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {{ payment.creator?.full_name || payment.created_by || '-' }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900">
                    {{ payment.notes || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- 付款記錄 Modal -->
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
              <label class="mb-1 block text-sm font-medium text-gray-700">付款金額</label>
              <div class="relative">
                <span class="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  v-model.number="paymentForm.amount"
                  type="number"
                  min="1"
                  :max="getUnpaidAmount(order)"
                  step="1"
                  required
                  class="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  :placeholder="`最多 ${getUnpaidAmount(order)}`"
                />
              </div>
              <div class="mt-1 text-xs text-gray-500">
                未付款金額：${{ formatCurrency(getUnpaidAmount(order)) }}
              </div>
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
                <option value="other">其他</option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">付款時間</label>
              <input
                v-model="paymentForm.date"
                type="datetime-local"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
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
                placeholder="付款相關備註"
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
                class="inline-flex items-center rounded-md border border-transparent bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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
import { useRoute, useRouter } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import { db } from '@/services/supabase'
import { useAuthStore } from '@/stores/authSupabase'
import type { Order, Payment } from '@/types'
import {
  ArrowLeftIcon,
  CheckIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

// 導入重構後的服務
import { formatCurrency, formatDateTime, getLocalDateTimeString } from '@/utils/formatters'
import { getStatusClass, getStatusText, getPaymentMethodText } from '@/services/orderStatus'
import { getTotalPaid, getUnpaidAmount } from '@/utils/paymentCalculator'
import { confirmOrder as confirmOrderService, recordPayment as recordPaymentService } from '@/services/orderService'
import { generateReceiptFromTemplate } from '@/services/receiptService'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const processing = ref(false)
const showPaymentModal = ref(false)
const order = ref<Order | null>(null)

// 獲取當地時間的 datetime-local 格式
const paymentForm = reactive({
  amount: 0,
  method: '',
  date: getLocalDateTimeString(),
  receiptNumber: '',
  notes: ''
})

async function loadOrder() {
  loading.value = true
  try {
    const orderId = route.params.id as string
    console.log('OrderDetailView - 載入訂單 ID:', orderId)

    // 暫時直接使用 db 調用，避免服務中的錯誤
    // 使用 findMany 來避免 single() 的限制，然後取第一筆

    // 判斷是數字 ID 還是訂單編號
    const isNumericId = /^\d+$/.test(orderId)
    const filters = isNumericId ? { id: parseInt(orderId) } : { order_id: orderId }

    console.log('OrderDetailView - 使用過濾條件:', filters)

    const orderResults = await db.findMany('orders', {
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
          student_id,
          chinese_name,
          english_name,
          is_active
        ),
        contact:contacts(
          contact_id,
          full_name,
          phone,
          email,
          address
        ),
        created_by_user:users!orders_created_by_fkey(
          user_id,
          full_name
        )
      `,
      filters,
      limit: 1
    })

    if (!orderResults || orderResults.length === 0) {
      throw new Error('找不到指定的訂單')
    }

    const orderData = orderResults[0]

    if (!orderData) {
      throw new Error('找不到指定的訂單')
    }

    // 載入訂單項目 (使用 order_id 字符串)
    const items = await db.findMany('order_items', {
      columns: '*',
      filters: { order_id: orderData.order_id },
      orderBy: 'id',
      ascending: true
    })

    // 載入付款記錄 (使用 order_id 字符串)
    const payments = await db.findMany('payments', {
      columns: '*',
      filters: { order_id: orderData.order_id },
      orderBy: 'payment_date',
      ascending: false
    })

    order.value = {
      ...orderData,
      items,
      payments
    }

    // 設置默認付款金額為剩餘未付金額
    if (order.value) {
      paymentForm.amount = getUnpaidAmount(order.value)
    }
  } catch (error) {
    console.error('OrderDetailView - 載入訂單失敗:', error)
    order.value = null
    alert(`載入訂單失敗: ${error.message}`)
    router.push('/orders')
  } finally {
    loading.value = false
  }
}

// 付款計算函數已移至 @/utils/paymentCalculator

// 狀態函數已移至 @/services/orderStatus

// 付款狀態函數 - 使用共用邏輯
function getPaymentStatusClass(): string {
  const unpaid = getUnpaidAmount(order.value)
  if (unpaid === 0) return 'bg-green-100 text-green-800'
  if (unpaid === order.value?.final_amount) return 'bg-red-100 text-red-800'
  return 'bg-yellow-100 text-yellow-800'
}

function getPaymentStatusText(): string {
  const unpaid = getUnpaidAmount(order.value)
  if (unpaid === 0) return '已付清'
  if (unpaid === order.value?.final_amount) return '未付款'
  return '部分付款'
}

function openPaymentModal() {
  // 重新設定當前時間
  paymentForm.date = getLocalDateTimeString()
  paymentForm.amount = getUnpaidAmount(order.value)
  showPaymentModal.value = true
}

async function confirmOrder() {
  if (!order.value) return

  processing.value = true
  try {
    await confirmOrderService(order.value.order_id)
    order.value.status = 'confirmed'
    order.value.updated_at = new Date().toISOString()
    alert('訂單已確認')
  } catch (error) {
    console.error('確認訂單失敗:', error)
    alert(`確認訂單失敗: ${error.message}`)
  } finally {
    processing.value = false
  }
}

async function cancelOrder() {
  if (!order.value) return

  if (!confirm('確定要取消此訂單嗎？')) return

  processing.value = true
  try {
    await db.update('orders', order.value.id, {
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })

    order.value.status = 'cancelled'
    order.value.updated_at = new Date().toISOString()
    alert('訂單已取消')
  } catch (error) {
    console.error('取消訂單失敗:', error)
    alert(`取消訂單失敗: ${error.message}`)
  } finally {
    processing.value = false
  }
}

async function recordPayment() {
  if (!order.value) return

  processing.value = true
  try {
    const paymentData = {
      amount: paymentForm.amount,
      method: paymentForm.method,
      date: paymentForm.date,
      receiptNumber: paymentForm.receiptNumber,
      notes: paymentForm.notes
    }

    await recordPaymentService(order.value.order_id, paymentData)

    // 重新載入訂單以更新付款記錄
    await loadOrder()

    // 重置表單
    Object.assign(paymentForm, {
      amount: getUnpaidAmount(order.value),
      method: '',
      date: getLocalDateTimeString(),
      receiptNumber: '',
      notes: ''
    })

    showPaymentModal.value = false
    alert('付款記錄已添加')
  } catch (error) {
    console.error('OrderDetailView - 記錄付款失敗:', error)
    alert(`記錄付款失敗: ${error.message}`)
  } finally {
    processing.value = false
  }
}

async function generateReceipt() {
  if (!order.value) return

  processing.value = true
  try {
    // 使用系統設定的收據模板生成收據
    await generateReceiptFromTemplate(order.value)
  } catch (error) {
    console.error('下載收據失敗:', error)
    alert(`下載收據失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
  } finally {
    processing.value = false
  }
}

onMounted(() => {
  loadOrder()
})
</script>
