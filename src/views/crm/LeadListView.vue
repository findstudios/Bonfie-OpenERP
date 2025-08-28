<template>
  <MainLayout>
    <div class="mx-auto max-w-6xl space-y-6">
      <!-- 頁面標題 -->
      <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            潛在客戶管理
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            管理所有潛在客戶資料和追蹤狀態
          </p>
        </div>
        <div class="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          <button
            @click="showImportModal = true"
            class="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <DocumentArrowUpIcon class="mr-2 size-4" />
            批量匯入
          </button>
          <button
            @click="showCreateModal = true"
            class="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <UserPlusIcon class="mr-2 size-4" />
            新增潛在客戶
          </button>
        </div>
      </div>

      <!-- 進階搜尋面板 -->
      <AdvancedSearchPanel
        v-model="searchParams"
        @search="loadLeads"
      />

      <!-- 客戶列表 -->
      <div class="overflow-hidden bg-white shadow sm:rounded-md">
        <div class="divide-y divide-gray-200">
          <div
            v-for="lead in leads"
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
                    v-if="lead.parent_name"
                    class="ml-2 text-sm text-gray-500"
                  >
                    ({{ lead.parent_name }})
                  </span>
                  <span
                    :class="[
                      'ml-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      getStatusColor(lead.status)
                    ]"
                  >
                    {{ getStatusText(lead.status) }}
                  </span>
                </div>
                <div class="mt-2 flex items-center text-sm text-gray-500">
                  <PhoneIcon class="mr-1.5 size-4 shrink-0 text-gray-400" />
                  <p class="mr-4">{{ lead.phone }}</p>
                  <TagIcon class="mr-1.5 size-4 shrink-0 text-gray-400" />
                  <p class="mr-4">{{ getSourceText(lead.source) }}</p>
                  <CalendarIcon class="mr-1.5 size-4 shrink-0 text-gray-400" />
                  <p>{{ formatDate(lead.created_at) }}</p>
                </div>
                <div v-if="lead.tags && lead.tags.length > 0" class="mt-1">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="tag in lead.tags"
                      :key="tag.tag_id"
                      class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
                      :style="{ backgroundColor: tag.color + '20', color: tag.color }"
                    >
                      {{ tag.name }}
                    </span>
                  </div>
                </div>
                <div v-if="lead.interest_subjects && lead.interest_subjects.length > 0" class="mt-1">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="subject in lead.interest_subjects"
                      :key="subject"
                      class="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                    >
                      {{ getSubjectText(subject) }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <button
                  @click.stop="createFollowUp(lead)"
                  class="inline-flex items-center rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <ChatBubbleLeftIcon class="mr-1 size-4" />
                  追蹤
                </button>
                <ChevronRightIcon class="size-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div v-if="leads.length === 0" class="px-6 py-8 text-center text-gray-500">
            {{ loading ? '載入中...' : '暫無潛在客戶資料' }}
          </div>
        </div>
      </div>
    </div>

    <!-- 新增客戶 Modal -->
    <CreateLeadModal
      :show="showCreateModal"
      @close="showCreateModal = false"
      @created="handleLeadCreated"
    />

    <!-- 批量匯入 Modal -->
    <LeadImportModal
      :show="showImportModal"
      @close="showImportModal = false"
      @imported="handleImportCompleted"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import CreateLeadModal from '@/components/crm/CreateLeadModal.vue'
import LeadImportModal from '@/components/crm/LeadImportModal.vue'
import AdvancedSearchPanel from '@/components/crm/AdvancedSearchPanel.vue'
import { crmService } from '@/services/crmService'
import { formatDate } from '@/utils/formatters'
import type { Lead, LeadStatus, LeadSource, InterestType, LeadSearchParams } from '@/types/crm'
import {
  UserPlusIcon,
  PhoneIcon,
  DocumentArrowUpIcon,
  TagIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()

// 狀態定義
const loading = ref(false)
const showCreateModal = ref(false)
const showImportModal = ref(false)
const leads = ref<Lead[]>([])
const searchParams = ref<LeadSearchParams>({
  search: '',
  status: '',
  source: '',
  sort_by: 'created_at',
  sort_order: 'desc',
  limit: 50
})

// 載入數據
const loadLeads = async () => {
  loading.value = true
  try {
    leads.value = await crmService.getLeads(searchParams.value)
  } catch (error) {
    console.error('載入潛在客戶失敗:', error)
  } finally {
    loading.value = false
  }
}

// 查看客戶詳情
const viewLeadDetail = (lead: Lead) => {
  router.push(`/crm/leads/${lead.lead_id}`)
}

// 創建追蹤記錄
const createFollowUp = (lead: Lead) => {
  // TODO: 實現追蹤記錄創建
  console.log('創建追蹤記錄:', lead.lead_id)
}

// 處理新客戶創建
const handleLeadCreated = () => {
  showCreateModal.value = false
  loadLeads()
}

// 處理批量匯入完成
const handleImportCompleted = (count: number) => {
  showImportModal.value = false
  loadLeads()
  alert(`成功匯入 ${count} 筆潛在客戶資料`)
}

// 輔助函數
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

const getSourceText = (source: LeadSource) => {
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
  return texts[source] || '其他'
}

const getSubjectText = (subject: InterestType) => {
  const texts = {
    english: '英語',
    math: '數學',
    chinese: '國語',
    science: '自然',
    social: '社會',
    art: '藝術',
    music: '音樂',
    other: '其他'
  }
  return texts[subject] || '其他'
}

// 初始化
onMounted(() => {
  loadLeads()
})
</script>
