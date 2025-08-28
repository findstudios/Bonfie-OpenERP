<template>
  <MainLayout>
    <div class="mx-auto max-w-6xl space-y-6">
      <!-- 頁面標題 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <button
            @click="goBack"
            class="text-gray-600 hover:text-gray-800"
          >
            <ChevronLeftIcon class="size-6" />
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">客戶詳情</h1>
            <p class="text-sm text-gray-500">檢視和管理客戶資訊</p>
          </div>
        </div>

        <div class="flex items-center space-x-3">
          <button
            @click="showEditModal = true"
            class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <PencilIcon class="-ml-1 mr-2 size-4" />
            編輯
          </button>
          <button
            v-if="lead?.status !== 'converted'"
            @click="convertToStudent"
            class="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <UserPlusIcon class="-ml-1 mr-2 size-4" />
            轉換為學生
          </button>
        </div>
      </div>

      <!-- 載入狀態 -->
      <div v-if="loading" class="py-12 text-center">
        <div class="inline-flex items-center">
          <svg class="-ml-1 mr-3 size-5 animate-spin text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          載入中...
        </div>
      </div>

      <!-- 主要內容 -->
      <div v-else-if="lead" class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- 左側：基本資訊 -->
        <div class="space-y-6 lg:col-span-1">
          <!-- 基本資訊卡片 - 包含備註 -->
          <div class="rounded-lg bg-white p-6 shadow">
            <h3 class="mb-4 text-lg font-medium text-gray-900">基本資訊</h3>
            <div class="space-y-3">
              <div>
                <label class="text-sm text-gray-500">學生姓名</label>
                <p class="text-sm font-medium text-gray-900">{{ lead.full_name }}</p>
              </div>
              <div>
                <label class="text-sm text-gray-500">聯絡人姓名</label>
                <p class="text-sm font-medium text-gray-900">{{ lead.parent_name }}</p>
              </div>
              <div>
                <label class="text-sm text-gray-500">聯絡電話</label>
                <p class="text-sm font-medium text-gray-900">
                  <a :href="`tel:${lead.phone}`" class="text-primary-600 hover:text-primary-700">
                    {{ lead.phone }}
                  </a>
                </p>
              </div>
              <div v-if="lead.email">
                <label class="text-sm text-gray-500">電子郵件</label>
                <p class="text-sm font-medium text-gray-900">
                  <a :href="`mailto:${lead.email}`" class="text-primary-600 hover:text-primary-700">
                    {{ lead.email }}
                  </a>
                </p>
              </div>
              <div v-if="lead.age">
                <label class="text-sm text-gray-500">年齡</label>
                <p class="text-sm font-medium text-gray-900">{{ lead.age }} 歲</p>
              </div>
              <div v-if="lead.school">
                <label class="text-sm text-gray-500">就讀學校</label>
                <p class="text-sm font-medium text-gray-900">{{ lead.school }}</p>
              </div>
              <div v-if="lead.grade">
                <label class="text-sm text-gray-500">年級</label>
                <p class="text-sm font-medium text-gray-900">{{ lead.grade }}</p>
              </div>
              <!-- 備註移到基本資訊中 -->
              <div v-if="lead.notes" class="border-t border-gray-200 pt-2">
                <label class="text-sm text-gray-500">備註</label>
                <p class="whitespace-pre-wrap text-sm font-medium text-gray-900">{{ lead.notes }}</p>
              </div>
            </div>
          </div>

          <!-- 客戶狀態卡片 -->
          <div class="rounded-lg bg-white p-6 shadow">
            <h3 class="mb-4 text-lg font-medium text-gray-900">客戶狀態</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">狀態</span>
                <span :class="[
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  getStatusColor(lead.status)
                ]">
                  {{ getStatusText(lead.status) }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">來源</span>
                <span class="text-sm font-medium text-gray-900">
                  {{ getSourceText(lead.source) }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">負責人</span>
                <span class="text-sm font-medium text-gray-900">
                  {{ lead.assigned_to || '未分配' }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">建立日期</span>
                <span class="text-sm font-medium text-gray-900">
                  {{ formatDate(lead.created_at) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 標籤 -->
          <div class="rounded-lg bg-white p-6 shadow">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900">標籤</h3>
              <button
                @click="showTagSelector = !showTagSelector"
                class="text-sm text-primary-600 hover:text-primary-700"
              >
                編輯
              </button>
            </div>
            <div v-if="showTagSelector" class="mb-4">
              <TagSelector
                v-model="leadTags"
                :lead-id="leadId"
                @update:model-value="updateLeadTags"
              />
            </div>
            <div v-else-if="leadTags.length > 0" class="flex flex-wrap gap-2">
              <span
                v-for="tag in leadTags"
                :key="tag.tag_id"
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                :style="{ backgroundColor: tag.color + '20', color: tag.color }"
              >
                {{ tag.name }}
              </span>
            </div>
            <p v-else class="text-sm text-gray-500">尚未設定標籤</p>
          </div>

          <!-- 興趣課程 -->
          <div class="rounded-lg bg-white p-6 shadow">
            <h3 class="mb-4 text-lg font-medium text-gray-900">興趣課程</h3>
            <div v-if="lead.interest_subjects && lead.interest_subjects.length > 0" class="flex flex-wrap gap-2">
              <span
                v-for="subject in lead.interest_subjects"
                :key="subject"
                class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
              >
                {{ getInterestText(subject) }}
              </span>
            </div>
            <p v-else class="text-sm text-gray-500">尚未記錄</p>
          </div>

          <!-- 其他資訊 -->
          <div class="rounded-lg bg-white p-6 shadow">
            <h3 class="mb-4 text-lg font-medium text-gray-900">其他資訊</h3>
            <div class="space-y-3">
              <div v-if="lead.budget_range">
                <label class="text-sm text-gray-500">預算範圍</label>
                <p class="text-sm font-medium text-gray-900">{{ lead.budget_range }}</p>
              </div>
              <div v-if="lead.preferred_schedule">
                <label class="text-sm text-gray-500">偏好時段</label>
                <p class="text-sm font-medium text-gray-900">{{ lead.preferred_schedule }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 右側：互動歷史 -->
        <div class="space-y-6 lg:col-span-2">
          <!-- 快速操作 -->
          <div class="rounded-lg bg-white p-6 shadow">
            <h3 class="mb-4 text-lg font-medium text-gray-900">快速操作</h3>
            <div class="flex flex-wrap gap-3">
              <button
                @click="showFollowUpModal = true"
                class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <PhoneIcon class="-ml-1 mr-2 size-4" />
                新增跟進
              </button>
              <button
                @click="showTrialModal = true"
                class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <AcademicCapIcon class="-ml-1 mr-2 size-4" />
                安排試聽
              </button>

            </div>
          </div>

          <!-- 互動時間軸 -->
          <div class="rounded-lg bg-white p-6 shadow">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900">互動歷史</h3>
              <button
                @click="loadInteractionHistory"
                class="text-sm text-primary-600 hover:text-primary-700"
              >
                <ArrowPathIcon class="inline size-4" />
                刷新
              </button>
            </div>

            <div v-if="loadingHistory" class="py-8 text-center">
              <div class="inline-flex items-center text-gray-500">
                <svg class="-ml-1 mr-3 size-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                載入中...
              </div>
            </div>

            <div v-else-if="interactionHistory.length > 0" class="flow-root">
              <ul class="-mb-8">
                <li v-for="(item, idx) in interactionHistory" :key="item.id">
                  <div class="relative pb-8">
                    <span v-if="idx !== interactionHistory.length - 1" class="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"></span>
                    <div class="relative flex space-x-3">
                      <div>
                        <span :class="[
                          'flex size-8 items-center justify-center rounded-full ring-8 ring-white',
                          getActivityColor(item.type)
                        ]">
                          <component :is="getActivityIcon(item.type)" class="size-4 text-white" />
                        </span>
                      </div>
                      <div class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p class="text-sm text-gray-900">
                            {{ item.title }}
                            <span v-if="item.result" :class="[
                              'ml-2 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
                              getResultColor(item.result)
                            ]">
                              {{ getResultText(item.result) }}
                            </span>
                          </p>
                          <p v-if="item.content" class="mt-1 text-sm text-gray-500">
                            {{ item.content }}
                          </p>
                        </div>
                        <div class="whitespace-nowrap text-right text-sm text-gray-500">
                          <time :datetime="item.created_at">{{ formatDateTime(item.created_at) }}</time>
                          <p v-if="item.created_by" class="text-xs">{{ item.created_by }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <div v-else class="py-8 text-center text-gray-500">
              <ClockIcon class="mx-auto mb-2 size-8 text-gray-400" />
              <p class="text-sm">尚無互動記錄</p>
            </div>
          </div>

          <!-- 試聽課程記錄 -->
          <div v-if="trialClasses.length > 0" class="rounded-lg bg-white p-6 shadow">
            <h3 class="mb-4 text-lg font-medium text-gray-900">試聽課程記錄</h3>
            <div class="space-y-3">
              <div
                v-for="trial in trialClasses"
                :key="trial.trial_id"
                class="rounded-lg border p-4"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-900">
                      {{ (trial as any).courses?.course_name || '未知課程' }}
                    </p>
                    <p class="text-sm text-gray-500">
                      {{ formatDate(trial.scheduled_date) }} {{ trial.scheduled_time }}
                    </p>
                  </div>
                  <span :class="[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    getTrialStatusColor(trial.status)
                  ]">
                    {{ getTrialStatusText(trial.status) }}
                  </span>
                </div>
                <div v-if="trial.feedback" class="mt-2">
                  <p class="text-sm text-gray-600">回饋：{{ trial.feedback }}</p>
                  <div v-if="trial.rating" class="mt-1 flex items-center">
                    <StarIcon
                      v-for="i in 5"
                      :key="i"
                      :class="[
                        'size-4',
                        i <= trial.rating ? 'text-yellow-400' : 'text-gray-300'
                      ]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 錯誤狀態 -->
      <div v-else class="py-12 text-center">
        <ExclamationCircleIcon class="mx-auto mb-4 size-12 text-red-400" />
        <p class="text-gray-500">無法載入客戶資料</p>
      </div>
    </div>

    <!-- 編輯客戶 Modal -->
    <LeadEditModal
      v-if="showEditModal"
      :lead="lead"
      @close="showEditModal = false"
      @saved="handleLeadUpdated"
    />

    <!-- 新增跟進 Modal -->
    <FollowUpModal
      v-if="showFollowUpModal"
      :lead-id="leadId"
      @close="showFollowUpModal = false"
      @saved="handleFollowUpCreated"
    />

    <!-- 安排試聽 Modal -->
    <TrialClassModal
      v-if="showTrialModal"
      :lead-id="leadId"
      @close="showTrialModal = false"
      @saved="handleTrialCreated"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authSupabase'
import MainLayout from '@/components/layout/MainLayout.vue'
import LeadEditModal from '@/components/crm/LeadEditModal.vue'
import FollowUpModal from '@/components/crm/FollowUpModal.vue'
import TrialClassModal from '@/components/crm/TrialClassModal.vue'
import TagSelector from '@/components/crm/TagSelector.vue'
import {
  ChevronLeftIcon,
  UserIcon,
  PencilIcon,
  UserPlusIcon,
  PhoneIcon,
  AcademicCapIcon,
  ArrowPathIcon,
  ClockIcon,
  ExclamationCircleIcon,
  StarIcon
} from '@heroicons/vue/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/vue/24/solid'
import { crmService } from '@/services/crmService'
import type { Lead, FollowUp, TrialClass, LeadStatus, LeadSource, Tag } from '@/types/crm'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 狀態
const leadId = computed(() => route.params.id as string)
const lead = ref<Lead | null>(null)
const loading = ref(false)
const loadingHistory = ref(false)
const interactionHistory = ref<any[]>([])
const trialClasses = ref<TrialClass[]>([])
const leadTags = ref<Tag[]>([])
const showEditModal = ref(false)
const showFollowUpModal = ref(false)
const showTrialModal = ref(false)
const showTagSelector = ref(false)

// 方法
const goBack = () => {
  router.back()
}

async function loadLead() {
  loading.value = true
  try {
    lead.value = await crmService.getLead(leadId.value)
    // 同時載入互動歷史、試聽記錄和標籤
    await Promise.all([
      loadInteractionHistory(),
      loadTrialClasses(),
      loadLeadTags()
    ])
  } catch (error) {
    console.error('載入客戶資料失敗:', error)
  } finally {
    loading.value = false
  }
}

async function loadLeadTags() {
  try {
    leadTags.value = await crmService.getLeadTags(leadId.value)
  } catch (error) {
    console.error('載入標籤失敗:', error)
  }
}

async function updateLeadTags(tags: Tag[]) {
  try {
    // 獲取當前標籤ID列表
    const currentTagIds = leadTags.value.map(t => t.tag_id)
    const newTagIds = tags.map(t => t.tag_id)

    // 找出要新增和刪除的標籤
    const toAdd = newTagIds.filter(id => !currentTagIds.includes(id))
    const toRemove = currentTagIds.filter(id => !newTagIds.includes(id))

    // 執行更新
    if (toAdd.length > 0) {
      await crmService.addTagsToLead(leadId.value, toAdd)
    }

    for (const tagId of toRemove) {
      await crmService.removeTagFromLead(leadId.value, tagId)
    }

    leadTags.value = tags
    showTagSelector.value = false
  } catch (error) {
    console.error('更新標籤失敗:', error)
    alert('更新標籤失敗')
  }
}

async function loadInteractionHistory() {
  loadingHistory.value = true
  try {
    // 載入跟進記錄
    const followUps = await crmService.getFollowUps({ lead_id: leadId.value })

    // 轉換為時間軸格式
    const history = followUps.map(fu => ({
      id: fu.follow_up_id,
      type: fu.type,
      title: fu.subject,
      content: fu.content,
      result: fu.result,
      created_at: fu.created_at,
      created_by: fu.created_by
    }))

    // 按時間排序
    interactionHistory.value = history.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  } catch (error) {
    console.error('載入互動歷史失敗:', error)
  } finally {
    loadingHistory.value = false
  }
}

async function loadTrialClasses() {
  try {
    trialClasses.value = await crmService.getTrialClasses(leadId.value)
  } catch (error) {
    console.error('載入試聽記錄失敗:', error)
  }
}

async function convertToStudent() {
  if (!lead.value) return

  if (confirm('確定要將此潛在客戶轉換為學生嗎？轉換後將創建學生和聯絡人記錄，此操作無法撤銷。')) {
    try {
      const currentUserId = authStore.user?.user_id
      if (!currentUserId) {
        alert('請先登入系統')
        return
      }

      const result = await crmService.convertLeadToStudent(leadId.value, currentUserId)

      alert(`轉換成功！\n學生ID：${result.student.student_id}\n聯絡人ID：${result.contact.contact_id}`)

      // 重新載入客戶資料以更新狀態
      await loadLead()

      // 導航到學生詳情頁面
      if (confirm('是否要查看新建的學生記錄？')) {
        router.push(`/students/${result.student.student_id}`)
      }

    } catch (error) {
      console.error('轉換失敗:', error)
      alert(`轉換失敗：${error instanceof Error ? error.message : '未知錯誤'}`)
    }
  }
}



function handleLeadUpdated() {
  showEditModal.value = false
  loadLead()
}

function handleFollowUpCreated() {
  showFollowUpModal.value = false
  loadInteractionHistory()
}

function handleTrialCreated() {
  showTrialModal.value = false
  loadTrialClasses()
}

// 格式化函數
function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-TW')
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 狀態相關函數
function getStatusText(status: LeadStatus) {
  const texts = {
    new: '新客戶',
    contacted: '已聯絡',
    interested: '有興趣',
    trial_scheduled: '已安排試聽',
    trial_completed: '已試聽',
    converted: '已轉換',
    lost: '已流失'
  }
  return texts[status] || status
}

function getStatusColor(status: LeadStatus) {
  const colors = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    interested: 'bg-green-100 text-green-800',
    trial_scheduled: 'bg-purple-100 text-purple-800',
    trial_completed: 'bg-indigo-100 text-indigo-800',
    converted: 'bg-emerald-100 text-emerald-800',
    lost: 'bg-gray-100 text-gray-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function getSourceText(source: LeadSource) {
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
  return texts[source] || source
}

function getInterestText(interest: string) {
  const texts: Record<string, string> = {
    english: '英語',
    math: '數學',
    chinese: '國語',
    science: '自然',
    social: '社會',
    art: '藝術',
    music: '音樂',
    other: '其他'
  }
  return texts[interest] || interest
}

function getActivityIcon(type: string) {
  const icons: Record<string, any> = {
    phone_call: PhoneIcon,
    message: PhoneIcon,
    email: PhoneIcon,
    visit: UserIcon,
    trial_class: AcademicCapIcon,
    meeting: UserIcon,
    other: ClockIcon
  }
  return icons[type] || ClockIcon
}

function getActivityColor(type: string) {
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

function getResultText(result: string) {
  const texts: Record<string, string> = {
    positive: '正面回應',
    neutral: '中性回應',
    negative: '負面回應',
    no_response: '未回應',
    converted: '已轉換',
    lost: '已流失'
  }
  return texts[result] || result
}

function getResultColor(result: string) {
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

function getTrialStatusText(status: string) {
  const texts: Record<string, string> = {
    scheduled: '已安排',
    completed: '已完成',
    cancelled: '已取消',
    no_show: '未出席'
  }
  return texts[status] || status
}

function getTrialStatusColor(status: string) {
  const colors = {
    scheduled: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-100 text-gray-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

// 生命週期
onMounted(() => {
  loadLead()
})
</script>
