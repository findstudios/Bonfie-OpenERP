<template>
  <MainLayout>
    <div class="mx-auto max-w-6xl space-y-6">
      <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            追蹤記錄
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            管理客戶追蹤記錄
          </p>
        </div>
        <div class="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          <button
            @click="showCreateModal = true"
            class="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <PlusIcon class="-ml-1 mr-2 size-5" />
            新增跟進
          </button>
        </div>
      </div>

      <!-- 搜尋篩選區 -->
      <div class="rounded-lg bg-white p-4 shadow">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div>
            <label class="block text-sm font-medium text-gray-700">跟進類型</label>
            <select
              v-model="filters.type"
              class="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
            >
              <option value="">全部類型</option>
              <option value="phone_call">電話聯絡</option>
              <option value="message">簡訊/Line</option>
              <option value="email">電子郵件</option>
              <option value="visit">到場參觀</option>
              <option value="trial_class">試聽課程</option>
              <option value="meeting">面談</option>
              <option value="other">其他</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">跟進結果</label>
            <select
              v-model="filters.result"
              class="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
            >
              <option value="">全部結果</option>
              <option value="positive">正面回應</option>
              <option value="neutral">中性回應</option>
              <option value="negative">負面回應</option>
              <option value="no_response">未回應</option>
              <option value="converted">已轉換</option>
              <option value="lost">已流失</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">時間範圍</label>
            <select
              v-model="dateRangePreset"
              @change="applyDateRangePreset"
              class="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
            >
              <option value="custom">自訂日期</option>
              <option value="all">全部時間</option>
              <option value="30">過去30天</option>
              <option value="90">過去90天</option>
              <option value="180">過去半年</option>
              <option value="365">過去一年</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">開始日期</label>
            <input
              type="date"
              v-model="filters.dateFrom"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">結束日期</label>
            <input
              type="date"
              v-model="filters.dateTo"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
            >
          </div>
        </div>
      </div>

      <!-- 跟進記錄列表 -->
      <div class="overflow-hidden bg-white shadow sm:rounded-md">
        <div v-if="loading" class="p-4 text-center">
          <div class="inline-flex items-center">
            <svg class="-ml-1 mr-3 size-5 animate-spin text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            載入中...
          </div>
        </div>

        <ul v-else-if="followUps.length > 0" class="divide-y divide-gray-200">
          <li v-for="followUp in followUps" :key="followUp.follow_up_id">
            <div class="p-4 hover:bg-gray-50 sm:px-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="shrink-0">
                    <div :class="[
                      'flex size-10 items-center justify-center rounded-full',
                      getTypeColor(followUp.type)
                    ]">
                      <component :is="getTypeIcon(followUp.type)" class="size-5 text-white" />
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ followUp.subject }}
                    </div>
                    <div class="text-sm text-gray-500">
                      <router-link
                        :to="`/crm/leads/${followUp.lead_id}`"
                        class="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        {{ (followUp as any).leads?.full_name }}
                      </router-link>
                      <span v-if="(followUp as any).leads?.parent_name" class="ml-2">
                        ({{ (followUp as any).leads?.parent_name }})
                      </span>
                    </div>
                    <div class="mt-1 text-sm text-gray-500">
                      {{ followUp.content }}
                    </div>
                  </div>
                </div>
                <div class="flex flex-col items-end">
                  <span :class="[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    getResultColor(followUp.result)
                  ]">
                    {{ getResultText(followUp.result) }}
                  </span>
                  <p class="mt-2 text-sm text-gray-500">
                    {{ formatDate(followUp.created_at) }}
                  </p>
                  <p v-if="followUp.next_follow_up" class="mt-1 text-xs text-orange-600">
                    下次跟進: {{ formatDate(followUp.next_follow_up) }}
                  </p>
                </div>
              </div>
            </div>
          </li>
        </ul>

        <div v-else class="p-4 text-center text-gray-500">
          <ClipboardDocumentListIcon class="mx-auto mb-3 size-12 text-gray-400" />
          <p>尚無跟進記錄</p>
        </div>
      </div>

      <!-- 分頁控制 -->
      <div v-if="followUps.length > 0 && totalPages > 1" class="flex items-center justify-between">
        <div class="flex flex-1 justify-between sm:hidden">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            上一頁
          </button>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            下一頁
          </button>
        </div>
        <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center">
          <nav class="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white p-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeftIcon class="size-5" />
            </button>
            <button
              v-for="page in displayPages"
              :key="page"
              @click="currentPage = page"
              :class="[
                'relative inline-flex items-center border px-4 py-2 text-sm font-medium',
                currentPage === page
                  ? 'z-10 border-primary-500 bg-primary-50 text-primary-600'
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

    <!-- 新增跟進 Modal -->
    <TransitionRoot :show="showCreateModal" as="template">
      <Dialog as="div" class="relative z-10" @close="showCreateModal = false">
        <TransitionChild
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </TransitionChild>

        <div class="fixed inset-0 z-10 overflow-y-auto">
          <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              enter="ease-out duration-300"
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel class="relative overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <!-- Modal Header -->
                <div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
                  <h3 class="text-xl font-semibold text-gray-900">
                    新增跟進記錄
                  </h3>
                </div>

                <!-- Modal Body -->
                <div class="px-6 py-4">
                  <form @submit.prevent="createFollowUp" class="space-y-5">
                    <!-- 第一行：客戶選擇和跟進類型 -->
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label class="mb-1 block text-sm font-medium text-gray-700">選擇潛在客戶 <span class="text-red-500">*</span></label>
                        <select
                          v-model="newFollowUp.lead_id"
                          required
                          class="block w-full rounded-md border-gray-300 py-2.5 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                        >
                          <option value="">請選擇客戶</option>
                          <option v-for="lead in availableLeads" :key="lead.lead_id" :value="lead.lead_id">
                            {{ lead.full_name }} ({{ lead.parent_name }})
                          </option>
                        </select>
                      </div>

                      <div>
                        <label class="mb-1 block text-sm font-medium text-gray-700">跟進類型 <span class="text-red-500">*</span></label>
                        <select
                          v-model="newFollowUp.type"
                          required
                          class="block w-full rounded-md border-gray-300 py-2.5 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                        >
                          <option value="">請選擇類型</option>
                          <option value="phone_call">電話聯絡</option>
                          <option value="message">簡訊/Line</option>
                          <option value="email">電子郵件</option>
                          <option value="visit">到場參觀</option>
                          <option value="trial_class">試聽課程</option>
                          <option value="meeting">面談</option>
                          <option value="other">其他</option>
                        </select>
                      </div>
                    </div>

                    <!-- 第二行：主題 -->
                    <div>
                      <label class="mb-1 block text-sm font-medium text-gray-700">主題 <span class="text-red-500">*</span></label>
                      <input
                        v-model="newFollowUp.subject"
                        type="text"
                        required
                        placeholder="請輸入跟進主題"
                        class="block w-full rounded-md border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                      >
                    </div>

                    <!-- 第三行：內容記錄 -->
                    <div>
                      <label class="mb-1 block text-sm font-medium text-gray-700">內容記錄 <span class="text-red-500">*</span></label>
                      <textarea
                        v-model="newFollowUp.content"
                        rows="6"
                        required
                        placeholder="請詳細記錄跟進內容..."
                        class="block w-full resize-none rounded-md border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                      ></textarea>
                    </div>

                    <!-- 第四行：跟進結果和下次跟進日期 -->
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label class="mb-1 block text-sm font-medium text-gray-700">跟進結果 <span class="text-red-500">*</span></label>
                        <select
                          v-model="newFollowUp.result"
                          required
                          class="block w-full rounded-md border-gray-300 py-2.5 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                        >
                          <option value="">請選擇結果</option>
                          <option value="positive">正面回應</option>
                          <option value="neutral">中性回應</option>
                          <option value="negative">負面回應</option>
                          <option value="no_response">未回應</option>
                          <option value="converted">已轉換</option>
                          <option value="lost">已流失</option>
                        </select>
                      </div>

                      <div>
                        <label class="mb-1 block text-sm font-medium text-gray-700">下次跟進日期</label>
                        <input
                          v-model="newFollowUp.next_follow_up"
                          type="date"
                          class="block w-full rounded-md border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                        >
                      </div>
                    </div>

                  </form>
                </div>

                <!-- Modal Footer -->
                <div class="border-t border-gray-200 bg-gray-50 px-6 py-4">
                  <div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
                    <button
                      type="button"
                      @click="showCreateModal = false"
                      class="mt-3 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:mt-0"
                    >
                      取消
                    </button>
                    <button
                      @click="createFollowUp"
                      :disabled="saving"
                      class="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg v-if="saving" class="-ml-1 mr-2 size-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {{ saving ? '儲存中...' : '儲存' }}
                    </button>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import MainLayout from '@/components/layout/MainLayout.vue'
import { Dialog, DialogPanel, TransitionRoot, TransitionChild } from '@headlessui/vue'
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  UserGroupIcon,
  EllipsisHorizontalIcon
} from '@heroicons/vue/24/outline'
import { crmService } from '@/services/crmService'
import { useAuthStore } from '@/stores/authSupabase'
import type { FollowUp, Lead, FollowUpType, FollowUpResult } from '@/types/crm'

// 狀態
const followUps = ref<FollowUp[]>([])
const availableLeads = ref<Lead[]>([])
const loading = ref(false)
const showCreateModal = ref(false)
const saving = ref(false)
const currentPage = ref(1)
const pageSize = 20
const totalItems = ref(0)
const authStore = useAuthStore()

// 計算預設日期範圍（過去30天）
const getDefaultDateRange = () => {
  const today = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(today.getDate() - 30)

  // 格式化為 YYYY-MM-DD
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return {
    dateFrom: formatDate(thirtyDaysAgo),
    dateTo: formatDate(today)
  }
}

// 篩選條件
const defaultDates = getDefaultDateRange()
const filters = ref({
  type: '',
  result: '',
  dateFrom: defaultDates.dateFrom,
  dateTo: defaultDates.dateTo
})

// 時間範圍預設選項
const dateRangePreset = ref('30') // 預設選擇過去30天

// 新增跟進表單
const newFollowUp = ref({
  lead_id: '',
  type: '' as FollowUpType | '',
  subject: '',
  content: '',
  result: '' as FollowUpResult | '',
  next_follow_up: ''
})

// 計算屬性
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize))
const displayPages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, start + 4)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// 監聽篩選條件變化
watch([filters, currentPage], () => {
  loadFollowUps()
}, { deep: true })

// 方法
async function loadFollowUps() {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize,
      type: filters.value.type || undefined,
      result: filters.value.result || undefined,
      date_from: filters.value.dateFrom || undefined,
      date_to: filters.value.dateTo || undefined
    }

    const data = await crmService.getFollowUps(params)
    followUps.value = data

    // 如果沒有資料，將總數設為 0
    if (data.length === 0) {
      totalItems.value = 0
      currentPage.value = 1  // 重置到第一頁
    } else if (data.length < pageSize) {
      // 如果返回的資料少於一頁，說明這是所有資料
      totalItems.value = data.length
    } else {
      // 如果返回滿頁資料，假設至少還有一頁
      // TODO: 應該從 API 返回實際的總數
      totalItems.value = data.length + 1
    }
  } catch (error) {
    console.error('載入跟進記錄失敗:', error)
    alert('載入跟進記錄失敗')
  } finally {
    loading.value = false
  }
}

async function loadAvailableLeads() {
  try {
    const data = await crmService.getLeads({ limit: 100 })
    availableLeads.value = data.filter(lead =>
      lead.status !== 'converted' && lead.status !== 'lost'
    )
  } catch (error) {
    console.error('載入潛在客戶失敗:', error)
  }
}

async function createFollowUp() {
  saving.value = true
  try {
    await crmService.createFollowUp({
      ...newFollowUp.value,
      type: newFollowUp.value.type as FollowUpType,
      result: newFollowUp.value.result as FollowUpResult,
      created_by: authStore.user?.user_id || ''
    })

    showCreateModal.value = false
    resetForm()
    loadFollowUps()
  } catch (error) {
    console.error('新增跟進失敗:', error)
    alert('新增跟進失敗')
  } finally {
    saving.value = false
  }
}

function resetForm() {
  newFollowUp.value = {
    lead_id: '',
    type: '',
    subject: '',
    content: '',
    result: '',
    next_follow_up: ''
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-TW')
}

function getTypeIcon(type: FollowUpType) {
  const icons = {
    phone_call: PhoneIcon,
    message: ChatBubbleLeftRightIcon,
    email: EnvelopeIcon,
    visit: BuildingOfficeIcon,
    trial_class: AcademicCapIcon,
    meeting: UserGroupIcon,
    other: EllipsisHorizontalIcon
  }
  return icons[type] || EllipsisHorizontalIcon
}

function getTypeColor(type: FollowUpType) {
  const colors = {
    phone_call: 'bg-blue-500',
    message: 'bg-green-500',
    email: 'bg-purple-500',
    visit: 'bg-orange-500',
    trial_class: 'bg-indigo-500',
    meeting: 'bg-pink-500',
    other: 'bg-gray-500'
  }
  return colors[type] || 'bg-gray-500'
}

function getResultText(result: FollowUpResult) {
  const texts = {
    positive: '正面回應',
    neutral: '中性回應',
    negative: '負面回應',
    no_response: '未回應',
    converted: '已轉換',
    lost: '已流失'
  }
  return texts[result] || result
}

function getResultColor(result: FollowUpResult) {
  const colors = {
    positive: 'bg-green-100 text-green-800',
    neutral: 'bg-yellow-100 text-yellow-800',
    negative: 'bg-red-100 text-red-800',
    no_response: 'bg-gray-100 text-gray-800',
    converted: 'bg-blue-100 text-blue-800',
    lost: 'bg-gray-500 text-white'
  }
  return colors[result] || 'bg-gray-100 text-gray-800'
}

// 重置所有篩選條件（回到預設30天）
function resetFilters() {
  const defaultDates = getDefaultDateRange()
  filters.value = {
    type: '',
    result: '',
    dateFrom: defaultDates.dateFrom,
    dateTo: defaultDates.dateTo
  }
  currentPage.value = 1
}

// 清除日期範圍（查看所有記錄）
function clearDateRange() {
  filters.value.dateFrom = ''
  filters.value.dateTo = ''
  currentPage.value = 1
}

// 應用日期範圍預設選項
function applyDateRangePreset() {
  const value = dateRangePreset.value

  if (value === 'all') {
    filters.value.dateFrom = ''
    filters.value.dateTo = ''
  } else if (value === 'custom') {
    // 保持當前的自訂日期
    return
  } else {
    // 計算日期範圍
    const days = parseInt(value)
    const today = new Date()
    const pastDate = new Date()
    pastDate.setDate(today.getDate() - days)

    // 格式化日期
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    filters.value.dateFrom = formatDate(pastDate)
    filters.value.dateTo = formatDate(today)
  }

  currentPage.value = 1
}

// 監聽日期變更，自動更新下拉選單
watch([() => filters.value.dateFrom, () => filters.value.dateTo], () => {
  // 如果手動修改了日期，將下拉選單設為"自訂日期"
  if (filters.value.dateFrom || filters.value.dateTo) {
    const today = new Date()
    const fromDate = filters.value.dateFrom ? new Date(filters.value.dateFrom) : null
    const toDate = filters.value.dateTo ? new Date(filters.value.dateTo) : null

    // 檢查是否符合預設選項
    if (fromDate && toDate) {
      const diffTime = Math.abs(toDate.getTime() - fromDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      // 檢查是否是今天結束
      const isToday = toDate.toDateString() === today.toDateString()

      if (isToday) {
        if (diffDays === 30) dateRangePreset.value = '30'
        else if (diffDays === 90) dateRangePreset.value = '90'
        else if (diffDays === 180) dateRangePreset.value = '180'
        else if (diffDays === 365) dateRangePreset.value = '365'
        else dateRangePreset.value = 'custom'
      } else {
        dateRangePreset.value = 'custom'
      }
    } else if (!fromDate && !toDate) {
      dateRangePreset.value = 'all'
    } else {
      dateRangePreset.value = 'custom'
    }
  }
})

// 生命週期
onMounted(() => {
  loadFollowUps()
  loadAvailableLeads()
})
</script>
