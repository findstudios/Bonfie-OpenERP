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
            <ArrowLeftIcon class="size-5" />
          </button>
          <div>
            <h2 class="text-2xl font-bold leading-7 text-gray-900">
              試聽課程詳情
            </h2>
            <p class="mt-1 text-sm text-gray-500">
              檢視和管理試聽課程資訊
            </p>
          </div>
        </div>
        <div class="flex items-center space-x-3">
          <button
            v-if="trial && trial.status === 'scheduled'"
            @click="markCompleted"
            class="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            標記為完成
          </button>
          <button
            @click="showEditModal = true"
            class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <PencilIcon class="mr-2 size-4" />
            編輯
          </button>
        </div>
      </div>

      <!-- 載入狀態 -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>

      <!-- 試聽課程資訊 -->
      <div v-else-if="trial" class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- 基本資訊 -->
        <div class="space-y-6 lg:col-span-2">
          <!-- 學生資訊 -->
          <div class="rounded-lg bg-white p-6 shadow">
            <h3 class="mb-4 text-lg font-medium text-gray-900">學生資訊</h3>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-gray-700">學生姓名</label>
                <p class="mt-1 text-sm text-gray-900">{{ trial.lead?.full_name || '未知學生' }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">聯絡電話</label>
                <p class="mt-1 text-sm text-gray-900">{{ trial.lead?.phone || '無電話' }}</p>
              </div>
            </div>
          </div>

          <!-- 課程資訊 -->
          <div class="rounded-lg bg-white p-6 shadow">
            <h3 class="mb-4 text-lg font-medium text-gray-900">課程資訊</h3>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-gray-700">試聽課程</label>
                <p class="mt-1 text-sm text-gray-900">{{ trial.course?.course_name || '未指定課程' }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">授課老師</label>
                <p class="mt-1 text-sm text-gray-900">{{ trial.teacher?.full_name || '未指定老師' }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">教室</label>
                <p class="mt-1 text-sm text-gray-900">{{ trial.classroom || '未指定教室' }}</p>
              </div>
            </div>
          </div>

          <!-- 試聽資訊 -->
          <div class="rounded-lg bg-white p-6 shadow">
            <h3 class="mb-4 text-lg font-medium text-gray-900">試聽安排</h3>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-gray-700">試聽日期</label>
                <p class="mt-1 text-sm text-gray-900">{{ formatDate(trial.scheduled_date) }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">試聽時間</label>
                <p class="mt-1 text-sm text-gray-900">{{ trial.scheduled_time }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">狀態</label>
                <span
                  :class="[
                    'mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    getStatusColor(trial.status)
                  ]"
                >
                  {{ getStatusText(trial.status) }}
                </span>
              </div>
              <div v-if="trial.attendance !== undefined">
                <label class="block text-sm font-medium text-gray-700">出席狀況</label>
                <p class="mt-1 text-sm text-gray-900">
                  {{ trial.attendance ? '已出席' : '未出席' }}
                </p>
              </div>
            </div>
          </div>

          <!-- 回饋資訊 -->
          <div v-if="trial.feedback || trial.rating" class="rounded-lg bg-white p-6 shadow">
            <h3 class="mb-4 text-lg font-medium text-gray-900">試聽回饋</h3>
            <div class="space-y-4">
              <div v-if="trial.rating">
                <label class="block text-sm font-medium text-gray-700">滿意度評分</label>
                <div class="mt-1 flex items-center">
                  <div class="flex items-center">
                    <StarIcon
                      v-for="n in 5"
                      :key="n"
                      :class="[
                        'size-5',
                        n <= (trial.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                      ]"
                      fill="currentColor"
                    />
                  </div>
                  <span class="ml-2 text-sm text-gray-600">{{ trial.rating }}/5</span>
                </div>
              </div>
              <div v-if="trial.feedback">
                <label class="block text-sm font-medium text-gray-700">試聽回饋</label>
                <p class="mt-1 whitespace-pre-wrap text-sm text-gray-900">{{ trial.feedback }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 側邊欄 -->
        <div class="space-y-6">
          <!-- 建立資訊 -->
          <div class="rounded-lg bg-white p-6 shadow">
            <h3 class="mb-4 text-lg font-medium text-gray-900">建立資訊</h3>
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700">建立人員</label>
                <p class="mt-1 text-sm text-gray-900">{{ trial.created_by_user?.full_name || '未知' }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">建立時間</label>
                <p class="mt-1 text-sm text-gray-900">{{ formatDateTime(trial.created_at) }}</p>
              </div>
              <div v-if="trial.updated_at !== trial.created_at">
                <label class="block text-sm font-medium text-gray-700">最後更新</label>
                <p class="mt-1 text-sm text-gray-900">{{ formatDateTime(trial.updated_at) }}</p>
              </div>
            </div>
          </div>

          <!-- 備註 -->
          <div v-if="trial.follow_up_notes" class="rounded-lg bg-white p-6 shadow">
            <h3 class="mb-4 text-lg font-medium text-gray-900">備註</h3>
            <p class="whitespace-pre-wrap text-sm text-gray-900">{{ trial.follow_up_notes }}</p>
          </div>
        </div>
      </div>

      <!-- 錯誤狀態 -->
      <div v-else-if="error" class="py-12 text-center">
        <ExclamationTriangleIcon class="mx-auto size-12 text-red-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">載入失敗</h3>
        <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
        <div class="mt-6">
          <button
            @click="loadTrial"
            class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            重新載入
          </button>
        </div>
      </div>
    </div>

    <!-- 編輯 Modal -->
    <EditTrialClassModal
      :show="showEditModal"
      :trial="trial"
      @close="showEditModal = false"
      @updated="handleTrialUpdated"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import EditTrialClassModal from '@/components/crm/EditTrialClassModal.vue'
import {
  ArrowLeftIcon,
  PencilIcon,
  StarIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { crmService } from '@/services/crmService'
import type { TrialClass } from '@/types/crm'
import { formatDateTime } from '@/utils/formatters'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref('')
const trial = ref<TrialClass | null>(null)
const showEditModal = ref(false)

const trialId = route.params.id as string

// 載入試聽課程詳情
const loadTrial = async () => {
  loading.value = true
  error.value = ''
  try {
    const trials = await crmService.getTrialClasses()
    const foundTrial = trials.find(t => t.trial_id === trialId)

    if (!foundTrial) {
      error.value = '找不到該試聽課程'
      return
    }

    trial.value = foundTrial
  } catch (err) {
    console.error('載入試聽課程失敗:', err)
    error.value = err instanceof Error ? err.message : '載入失敗'
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 獲取狀態顏色
const getStatusColor = (status: string) => {
  const colors = {
    scheduled: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    no_show: 'bg-red-100 text-red-800'
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

// 獲取狀態文字
const getStatusText = (status: string) => {
  const texts = {
    scheduled: '已安排',
    completed: '已完成',
    cancelled: '已取消',
    no_show: '未出席'
  }
  return texts[status as keyof typeof texts] || status
}

// 標記為完成
const markCompleted = async () => {
  if (!trial.value) return

  try {
    await crmService.updateTrialClass(trial.value.trial_id, {
      status: 'completed',
      attendance: true
    })
    await loadTrial()
  } catch (error) {
    console.error('更新試聽狀態失敗:', error)
    alert('更新失敗，請稍後再試')
  }
}

// 處理試聽更新
const handleTrialUpdated = () => {
  loadTrial()
}

// 返回上一頁
const goBack = () => {
  router.back()
}

onMounted(() => {
  loadTrial()
})
</script>
