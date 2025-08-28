<template>
  <MainLayout>
    <div class="mx-auto max-w-6xl space-y-6">
      <!-- 頁面標題 -->
      <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            試聽課程管理
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            管理試聽課程安排、追蹤學生試聽狀況
          </p>
        </div>
        <div class="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          <button
            @click="showCreateModal = true"
            class="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <PlusIcon class="mr-2 size-4" />
            安排試聽
          </button>
        </div>
      </div>

      <!-- 搜尋和篩選 -->
      <div class="rounded-lg bg-white p-6 shadow">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              搜尋
            </label>
            <input
              v-model="filters.search"
              type="text"
              placeholder="學生姓名、課程..."
              class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              狀態
            </label>
            <select
              v-model="filters.status"
              class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部狀態</option>
              <option value="scheduled">已安排</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
              <option value="no_show">未出席</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              日期範圍
            </label>
            <input
              v-model="filters.dateFrom"
              type="date"
              class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              至
            </label>
            <input
              v-model="filters.dateTo"
              type="date"
              class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- 試聽課程列表 -->
      <div class="overflow-hidden rounded-lg bg-white shadow">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                學生資料
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                試聽課程
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                日期時間
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                老師/教室
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                狀態
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="trial in filteredTrialClasses" :key="trial.trial_id">
              <td class="whitespace-nowrap px-6 py-4">
                <div class="text-sm font-medium text-gray-900">
                  {{ trial.lead?.full_name || '未知學生' }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ trial.lead?.phone || '無電話' }}
                </div>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <div class="text-sm text-gray-900">
                  {{ trial.course?.course_name || '未指定課程' }}
                </div>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <div class="text-sm text-gray-900">
                  {{ formatDate(trial.scheduled_date) }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ trial.scheduled_time }}
                </div>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <div class="text-sm text-gray-900">
                  {{ trial.teacher?.full_name || '未指定老師' }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ trial.classroom || '未指定教室' }}
                </div>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    getStatusColor(trial.status)
                  ]"
                >
                  {{ getStatusText(trial.status) }}
                </span>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm font-medium">
                <div class="flex items-center space-x-2">
                  <button
                    @click="viewTrial(trial)"
                    class="text-blue-600 hover:text-blue-900"
                  >
                    查看
                  </button>
                  <button
                    @click="editTrial(trial)"
                    class="text-indigo-600 hover:text-indigo-900"
                  >
                    編輯
                  </button>
                  <button
                    v-if="trial.status === 'scheduled'"
                    @click="completeTrial(trial)"
                    class="text-green-600 hover:text-green-900"
                  >
                    完成
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredTrialClasses.length === 0" class="px-6 py-8 text-center text-gray-500">
          {{ loading ? '載入中...' : '暫無試聽課程資料' }}
        </div>
      </div>
    </div>

    <!-- 新增試聽課程 Modal -->
    <CreateTrialClassModal
      :show="showCreateModal"
      @close="showCreateModal = false"
      @created="handleTrialCreated"
    />

    <!-- 編輯試聽課程 Modal -->
    <EditTrialClassModal
      :show="showEditModal"
      :trial="selectedTrial"
      @close="showEditModal = false"
      @updated="handleTrialUpdated"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import CreateTrialClassModal from '@/components/crm/CreateTrialClassModal.vue'
import EditTrialClassModal from '@/components/crm/EditTrialClassModal.vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
import { crmService } from '@/services/crmService'
import type { TrialClass } from '@/types/crm'
import { formatDateTime } from '@/utils/formatters'

const router = useRouter()
const loading = ref(false)
const trialClasses = ref<TrialClass[]>([])
const showCreateModal = ref(false)

// 篩選條件
const filters = ref({
  search: '',
  status: '',
  dateFrom: '',
  dateTo: ''
})

// 載入試聽課程列表
const loadTrialClasses = async () => {
  loading.value = true
  try {
    const data = await crmService.getTrialClasses()
    trialClasses.value = data
  } catch (error) {
    console.error('載入試聽課程失敗:', error)
    trialClasses.value = []
  } finally {
    loading.value = false
  }
}

// 篩選後的試聽課程
const filteredTrialClasses = computed(() => {
  return trialClasses.value.filter(trial => {
    // 搜尋過濾
    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      const leadName = trial.lead?.full_name?.toLowerCase() || ''
      const courseName = trial.course?.course_name?.toLowerCase() || ''
      if (!leadName.includes(search) && !courseName.includes(search)) {
        return false
      }
    }

    // 狀態過濾
    if (filters.value.status && trial.status !== filters.value.status) {
      return false
    }

    // 日期過濾
    if (filters.value.dateFrom && trial.scheduled_date < filters.value.dateFrom) {
      return false
    }
    if (filters.value.dateTo && trial.scheduled_date > filters.value.dateTo) {
      return false
    }

    return true
  })
})

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

// 查看試聽詳情
const viewTrial = (trial: TrialClass) => {
  router.push(`/crm/trials/${trial.trial_id}`)
}

// 編輯試聽
const selectedTrial = ref<TrialClass | null>(null)
const showEditModal = ref(false)

const editTrial = (trial: TrialClass) => {
  selectedTrial.value = trial
  showEditModal.value = true
}

// 完成試聽
const completeTrial = async (trial: TrialClass) => {
  try {
    await crmService.updateTrialClass(trial.trial_id, {
      status: 'completed',
      attendance: true
    })
    await loadTrialClasses()
  } catch (error) {
    console.error('更新試聽狀態失敗:', error)
  }
}

// 處理新增完成
const handleTrialCreated = () => {
  loadTrialClasses()
}

// 處理編輯完成
const handleTrialUpdated = () => {
  loadTrialClasses()
  selectedTrial.value = null
}

// 監聽篩選條件變化
watch(filters, () => {
  // 篩選是在 computed 中自動處理的
}, { deep: true })

onMounted(() => {
  loadTrialClasses()
})
</script>
