<template>
  <div class="rounded-lg bg-white p-6 shadow">
    <!-- 簡化搜尋 -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div class="md:col-span-2">
        <label class="mb-2 block text-sm font-medium text-gray-700">
          搜尋關鍵字
        </label>
        <div class="relative">
          <input
            v-model="localFilters.search"
            type="text"
            placeholder="輸入姓名、電話或Email搜尋..."
            class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            @input="handleSearch"
          >
          <MagnifyingGlassIcon class="absolute left-3 top-2.5 size-5 text-gray-400" />
        </div>
      </div>

      <div>
        <label class="mb-2 block text-sm font-medium text-gray-700">
          狀態
        </label>
        <select
          v-model="localFilters.status"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          @change="applyFilters"
        >
          <option value="">全部狀態</option>
          <option value="new">新客戶</option>
          <option value="contacted">已聯絡</option>
          <option value="interested">有興趣</option>
          <option value="trial_scheduled">已安排試聽</option>
          <option value="trial_completed">已試聽</option>
          <option value="converted">已轉換</option>
          <option value="lost">已流失</option>
        </select>
      </div>

      <div>
        <label class="mb-2 block text-sm font-medium text-gray-700">
          來源
        </label>
        <select
          v-model="localFilters.source"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          @change="applyFilters"
        >
          <option value="">全部來源</option>
          <option value="walk_in">路過詢問</option>
          <option value="referral">朋友介紹</option>
          <option value="online">網路查詢</option>
          <option value="phone">電話詢問</option>
          <option value="social_media">社群媒體</option>
          <option value="flyer">傳單廣告</option>
          <option value="event">活動推廣</option>
          <option value="other">其他</option>
        </select>
      </div>
    </div>

    <!-- 操作按鈕 -->
    <div class="mt-4 flex items-center justify-end space-x-3">
      <button
        @click="resetFilters"
        class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        清除篩選
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import type { LeadSearchParams } from '@/types/crm'

interface Props {
  modelValue: LeadSearchParams
}

interface Emits {
  (e: 'update:modelValue', value: LeadSearchParams): void
  (e: 'search'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 簡化的篩選條件
const localFilters = ref<LeadSearchParams>({
  search: '',
  status: '',
  source: '',
  sort_by: 'created_at',
  sort_order: 'desc'
})

// 搜尋防抖
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// 監聽外部值變化
watch(() => props.modelValue, (newValue) => {
  localFilters.value = { ...newValue }
}, { deep: true, immediate: true })

// 處理搜尋輸入（防抖）
function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    applyFilters()
  }, 300)
}

// 應用篩選條件
function applyFilters() {
  // 清理空值
  const cleanedFilters: LeadSearchParams = {}

  Object.entries(localFilters.value).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      cleanedFilters[key as keyof LeadSearchParams] = value as any
    }
  })

  emit('update:modelValue', cleanedFilters)
  emit('search')
}

// 重設篩選條件
function resetFilters() {
  localFilters.value = {
    search: '',
    status: '',
    source: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  }
  applyFilters()
}
</script>
