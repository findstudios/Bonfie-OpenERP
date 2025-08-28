<template>
  <div class="tracking-list">
    <!-- 分類區塊 -->
    <div v-for="(group, type) in groupedItems" :key="type" :data-testid="`type-section-${type}`" class="mb-6">
      <h3 data-testid="type-header" class="mb-3 flex items-center text-sm font-medium text-gray-700">
        <component :is="getTypeIcon(type)" class="mr-2 size-4" :class="getTypeIconClass(type)" />
        {{ getTypeLabel(type) }}
        <span class="ml-2 text-xs text-gray-500">({{ group.length }})</span>
      </h3>

      <div class="space-y-2">
        <div
          v-for="item in group"
          :key="item.id"
          :data-testid="`tracking-item-${item.id}`"
          class="rounded-lg border bg-white p-3 transition-shadow hover:shadow-sm"
          :class="{ 'opacity-60': item.completed }"
        >
          <div class="flex items-start space-x-3">
            <!-- 勾選框 -->
            <input
              :data-testid="`checkbox-${item.id}`"
              type="checkbox"
              :checked="item.completed"
              @change="handleComplete(item.id, $event)"
              class="mt-1 size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />

            <!-- 內容 -->
            <div class="min-w-0 flex-1">
              <!-- 學生資訊和優先級 -->
              <div class="mb-1 flex items-center justify-between">
                <h4 class="text-sm font-medium text-gray-900">
                  {{ item.student.chinese_name }}
                  <span v-if="item.student.english_name" class="ml-1 text-xs text-gray-500">
                    {{ item.student.english_name }}
                  </span>
                </h4>
                <span
                  :data-testid="`priority-badge`"
                  class="rounded-full px-2 py-0.5 text-xs"
                  :class="getPriorityClass(item.priority)"
                >
                  {{ getPriorityLabel(item.priority) }}
                </span>
              </div>

              <!-- 課程和時間 -->
              <div class="mb-1 text-xs text-gray-600">
                {{ item.course_name }} | {{ item.class_time }}
              </div>

              <!-- 聯絡人資訊 -->
              <div class="flex items-center justify-between">
                <div class="text-xs text-gray-600">
                  <span class="font-medium">{{ item.contact.name }}</span>
                  <span class="mx-1 text-gray-400">({{ item.contact.relationship }})</span>
                </div>
                <button
                  :data-testid="`phone-button-${item.id}`"
                  @click="handleCall(item)"
                  class="flex items-center text-xs text-blue-600 hover:text-blue-800"
                >
                  <PhoneIcon class="mr-1 size-3" />
                  {{ item.contact.phone }}
                </button>
              </div>

              <!-- 備註 -->
              <div v-if="item.notes" class="mt-1 text-xs text-gray-500">
                {{ item.notes }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ExclamationCircleIcon,
  AcademicCapIcon,
  InformationCircleIcon,
  PhoneIcon
} from '@heroicons/vue/24/outline'

interface TrackingItem {
  id: string
  type: 'absent' | 'trial' | 'special'
  priority: 'high' | 'medium' | 'low'
  student: {
    student_id: string
    chinese_name: string
    english_name?: string
  }
  course_name: string
  class_time: string
  contact: {
    name: string
    phone: string
    relationship: string
  }
  completed: boolean
  notes?: string
}

const props = withDefaults(defineProps<{
  items: TrackingItem[]
  hideCompleted?: boolean
  sortBy?: 'priority' | 'time' | 'type'
}>(), {
  hideCompleted: false,
  sortBy: 'priority'
})

const emit = defineEmits<{
  'item-complete': [id: string, completed: boolean]
  'call': [item: TrackingItem]
}>()

// 過濾和排序後的項目
const filteredItems = computed(() => {
  let items = [...props.items]

  // 過濾已完成項目
  if (props.hideCompleted) {
    items = items.filter(item => !item.completed)
  }

  // 排序
  if (props.sortBy === 'priority') {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  }

  return items
})

// 按類型分組
const groupedItems = computed(() => {
  const groups: Record<string, TrackingItem[]> = {}

  filteredItems.value.forEach(item => {
    if (!groups[item.type]) {
      groups[item.type] = []
    }
    groups[item.type].push(item)
  })

  // 確保順序
  const orderedGroups: Record<string, TrackingItem[]> = {}
  const typeOrder = ['absent', 'trial', 'special']

  typeOrder.forEach(type => {
    if (groups[type]) {
      orderedGroups[type] = groups[type]
    }
  })

  return orderedGroups
})

// 類型標籤
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    absent: '缺席待聯絡',
    trial: '試聽跟進',
    special: '特殊狀況'
  }
  return labels[type] || type
}

// 類型圖標
function getTypeIcon(type: string) {
  const icons: Record<string, any> = {
    absent: ExclamationCircleIcon,
    trial: AcademicCapIcon,
    special: InformationCircleIcon
  }
  return icons[type] || InformationCircleIcon
}

// 類型圖標樣式
function getTypeIconClass(type: string): string {
  const classes: Record<string, string> = {
    absent: 'text-red-500',
    trial: 'text-blue-500',
    special: 'text-yellow-500'
  }
  return classes[type] || 'text-gray-500'
}

// 優先級樣式
function getPriorityClass(priority: string): string {
  const classes: Record<string, string> = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-800'
  }
  return classes[priority] || 'bg-gray-100 text-gray-800'
}

// 優先級標籤
function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return labels[priority] || priority
}

// 處理完成狀態切換
function handleComplete(id: string, event: Event) {
  const checkbox = event.target as HTMLInputElement
  emit('item-complete', id, checkbox.checked)
}

// 處理撥號
function handleCall(item: TrackingItem) {
  emit('call', item)
  // 實際應用中可以加入：
  // window.location.href = `tel:${item.contact.phone}`
}
</script>

<style scoped>
.tracking-list {
  max-height: 500px;
  overflow-y: auto;
}
</style>
