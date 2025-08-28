<template>
  <MainLayout>
    <div class="mx-auto max-w-6xl space-y-6">
      <!-- 頁面標題 -->
      <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            客戶關係管理
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            管理潛在客戶、追蹤記錄和轉換分析
          </p>
        </div>
        <div class="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          <button
            @click="showCreateLeadModal = true"
            class="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <UserPlusIcon class="mr-2 size-4" />
            新增潛在客戶
          </button>
        </div>
      </div>

      <!-- CRM 統計卡片 -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <!-- 總潛在客戶數 -->
        <div class="overflow-hidden rounded-lg bg-white shadow">
          <div class="p-5">
            <div class="flex items-center">
              <div class="shrink-0">
                <UserGroupIcon class="size-6 text-gray-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="truncate text-sm font-medium text-gray-500">
                    總潛在客戶
                  </dt>
                  <dd class="flex items-baseline">
                    <div class="text-2xl font-semibold text-gray-900">
                      {{ stats.total_leads }}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- 本月新增 -->
        <div class="overflow-hidden rounded-lg bg-white shadow">
          <div class="p-5">
            <div class="flex items-center">
              <div class="shrink-0">
                <PlusIcon class="size-6 text-green-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="truncate text-sm font-medium text-gray-500">
                    本月新增
                  </dt>
                  <dd class="flex items-baseline">
                    <div class="text-2xl font-semibold text-gray-900">
                      {{ stats.new_leads_this_month }}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- 轉換率 -->
        <div class="overflow-hidden rounded-lg bg-white shadow">
          <div class="p-5">
            <div class="flex items-center">
              <div class="shrink-0">
                <ChartBarIcon class="size-6 text-blue-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="truncate text-sm font-medium text-gray-500">
                    轉換率
                  </dt>
                  <dd class="flex items-baseline">
                    <div class="text-2xl font-semibold text-gray-900">
                      {{ stats.conversion_rate }}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- 平均轉換天數 -->
        <div class="overflow-hidden rounded-lg bg-white shadow">
          <div class="p-5">
            <div class="flex items-center">
              <div class="shrink-0">
                <ClockIcon class="size-6 text-orange-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="truncate text-sm font-medium text-gray-500">
                    平均轉換天數
                  </dt>
                  <dd class="flex items-baseline">
                    <div class="text-2xl font-semibold text-gray-900">
                      {{ stats.average_conversion_days }}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 主要內容區域 -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- 潛在客戶列表 -->
        <div class="rounded-lg bg-white shadow">
          <div class="border-b border-gray-200 px-6 py-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900">最新潛在客戶</h3>
              <router-link
                to="/crm/leads"
                class="text-sm text-blue-600 hover:text-blue-500"
              >
                查看全部
              </router-link>
            </div>
          </div>
          <div class="divide-y divide-gray-200">
            <div
              v-for="lead in recentLeads"
              :key="lead.lead_id"
              class="cursor-pointer px-6 py-4 hover:bg-gray-50"
              @click="viewLeadDetail(lead)"
            >
              <div class="flex items-center justify-between">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center">
                    <p class="truncate text-sm font-medium text-gray-900">
                      {{ lead.full_name }}
                    </p>
                    <span
                      :class="[
                        'ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        getStatusColor(lead.status)
                      ]"
                    >
                      {{ getStatusText(lead.status) }}
                    </span>
                  </div>
                  <div class="mt-1 flex items-center">
                    <PhoneIcon class="mr-1 size-4 text-gray-400" />
                    <p class="text-sm text-gray-500">{{ lead.phone }}</p>
                  </div>
                  <p class="mt-1 text-xs text-gray-400">
                    {{ formatDate(lead.created_at) }}
                  </p>
                </div>
                <div class="text-sm text-gray-500">
                  {{ getSourceText(lead.source) }}
                </div>
              </div>
            </div>

            <div v-if="recentLeads.length === 0" class="px-6 py-8 text-center text-gray-500">
              暫無潛在客戶資料
            </div>
          </div>
        </div>

        <!-- 近期追蹤記錄 -->
        <div class="rounded-lg bg-white shadow">
          <div class="border-b border-gray-200 px-6 py-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900">近期追蹤記錄</h3>
              <router-link
                to="/crm/follow-ups"
                class="text-sm text-blue-600 hover:text-blue-500"
              >
                查看全部
              </router-link>
            </div>
          </div>
          <div class="divide-y divide-gray-200">
            <div
              v-for="followUp in recentFollowUps"
              :key="followUp.follow_up_id"
              class="px-6 py-4"
            >
              <div class="flex items-start">
                <div class="shrink-0">
                  <component
                    :is="getFollowUpIcon(followUp.type)"
                    class="size-5 text-gray-400"
                  />
                </div>
                <div class="ml-3 min-w-0 flex-1">
                  <div class="text-sm text-gray-900">
                    <strong>{{ followUp.subject }}</strong>
                  </div>
                  <div class="mt-1 text-sm text-gray-500">
                    {{ followUp.content }}
                  </div>
                  <div class="mt-2 flex items-center text-xs text-gray-400">
                    <span>{{ formatDate(followUp.created_at) }}</span>
                    <span class="mx-2">•</span>
                    <span
                      :class="[
                        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
                        getFollowUpResultColor(followUp.result)
                      ]"
                    >
                      {{ getFollowUpResultText(followUp.result) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="recentFollowUps.length === 0" class="px-6 py-8 text-center text-gray-500">
              暫無追蹤記錄
            </div>
          </div>
        </div>
      </div>

      <!-- 來源分析圖表 -->
      <div class="rounded-lg bg-white p-6 shadow">
        <h3 class="mb-4 text-lg font-medium text-gray-900">客戶來源分析</h3>
        <div class="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          <div
            v-for="(count, source) in stats.leads_by_source"
            :key="source"
            class="text-center"
          >
            <div class="text-2xl font-semibold text-gray-900">{{ count }}</div>
            <div class="mt-1 text-sm text-gray-500">{{ getSourceText(source) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增潛在客戶 Modal -->
    <CreateLeadModal
      :show="showCreateLeadModal"
      @close="showCreateLeadModal = false"
      @created="handleLeadCreated"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import CreateLeadModal from '@/components/crm/CreateLeadModal.vue'
import { crmService } from '@/services/crmService'
import { formatDate } from '@/utils/formatters'
import type { Lead, FollowUp, CRMStats, LeadStatus, LeadSource, FollowUpType, FollowUpResult } from '@/types/crm'
import {
  UserGroupIcon,
  UserPlusIcon,
  PlusIcon,
  ChartBarIcon,
  ClockIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  EnvelopeIcon,
  EyeIcon,
  AcademicCapIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()

// 狀態定義
const loading = ref(false)
const showCreateLeadModal = ref(false)
const recentLeads = ref<Lead[]>([])
const recentFollowUps = ref<FollowUp[]>([])
const stats = ref<CRMStats>({
  total_leads: 0,
  new_leads_this_month: 0,
  conversion_rate: 0,
  average_conversion_days: 0,
  trial_booking_rate: 0,
  trial_show_rate: 0,
  leads_by_source: {},
  leads_by_status: {},
  monthly_conversions: []
})

// 方法定義
const loadDashboardData = async () => {
  loading.value = true
  try {
    console.log('開始載入 CRM 儀表板數據...')

    // 先嘗試載入潛在客戶數據
    try {
      const leadsData = await crmService.getLeads({ limit: 10 })
      recentLeads.value = leadsData || []
      console.log('載入潛在客戶數據成功:', leadsData?.length || 0, '筆')
    } catch (error) {
      console.error('載入潛在客戶失敗:', error)
      recentLeads.value = []
    }

    // 嘗試載入追蹤記錄
    try {
      const followUpsData = await crmService.getFollowUps({ limit: 10 })
      recentFollowUps.value = followUpsData || []
      console.log('載入追蹤記錄成功:', followUpsData?.length || 0, '筆')
    } catch (error) {
      console.error('載入追蹤記錄失敗:', error)
      recentFollowUps.value = []
    }

    // 嘗試載入統計數據
    try {
      const statsData = await crmService.getCRMStats()
      stats.value = statsData || {
        total_leads: 0,
        new_leads_this_month: 0,
        conversion_rate: 0,
        average_conversion_days: 0,
        trial_booking_rate: 0,
        trial_show_rate: 0,
        leads_by_source: {},
        leads_by_status: {},
        monthly_conversions: []
      }
      console.log('載入統計數據成功:', statsData)
    } catch (error) {
      console.error('載入統計數據失敗:', error)
      // 保持預設統計數據
    }

    console.log('CRM 儀表板數據載入完成')
  } catch (error) {
    console.error('載入 CRM 儀表板數據失敗:', error)
  } finally {
    loading.value = false
  }
}

const viewLeadDetail = (lead: Lead) => {
  router.push(`/crm/leads/${lead.lead_id}`)
}

const handleLeadCreated = () => {
  showCreateLeadModal.value = false
  loadDashboardData() // 重新載入數據
}

// 狀態相關輔助函數
const getStatusColor = (status: LeadStatus) => {
  const colors = {
    new: 'bg-gray-100 text-gray-800',
    contacted: 'bg-blue-100 text-blue-800',
    interested: 'bg-yellow-100 text-yellow-800',
    trial_scheduled: 'bg-purple-100 text-purple-800',
    trial_completed: 'bg-indigo-100 text-indigo-800',
    converted: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800'
  }
  return colors[status] || colors.new
}

const getStatusText = (status: LeadStatus) => {
  const texts = {
    new: '新客戶',
    contacted: '已聯絡',
    interested: '有興趣',
    trial_scheduled: '已安排試聽',
    trial_completed: '已試聽',
    converted: '已轉換',
    lost: '流失'
  }
  return texts[status] || '未知'
}

const getSourceText = (source: LeadSource | string) => {
  const texts = {
    walk_in: '路過詢問',
    referral: '朋友介紹',
    online: '網路查詢',
    phone: '電話詢問',
    social_media: '社群媒體',
    flyer: '傳單廣告',
    event: '活動推廣',
    other: '其他'
  }
  return texts[source as LeadSource] || '其他'
}

const getFollowUpIcon = (type: FollowUpType) => {
  const icons = {
    phone_call: PhoneIcon,
    message: ChatBubbleLeftIcon,
    email: EnvelopeIcon,
    visit: EyeIcon,
    trial_class: AcademicCapIcon,
    meeting: UserGroupIcon,
    other: ChatBubbleLeftIcon
  }
  return icons[type] || ChatBubbleLeftIcon
}

const getFollowUpResultColor = (result: FollowUpResult) => {
  const colors = {
    positive: 'bg-green-100 text-green-800',
    neutral: 'bg-yellow-100 text-yellow-800',
    negative: 'bg-red-100 text-red-800',
    no_response: 'bg-gray-100 text-gray-800',
    converted: 'bg-blue-100 text-blue-800',
    lost: 'bg-red-100 text-red-800'
  }
  return colors[result] || colors.neutral
}

const getFollowUpResultText = (result: FollowUpResult) => {
  const texts = {
    positive: '正面回應',
    neutral: '中性回應',
    negative: '負面回應',
    no_response: '未回應',
    converted: '已轉換',
    lost: '已流失'
  }
  return texts[result] || '未知'
}

// 初始化
onMounted(() => {
  loadDashboardData()
})
</script>
