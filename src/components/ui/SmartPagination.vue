<template>
  <div class="smart-pagination" :class="containerClasses">
    <!-- 總數顯示 -->
    <div v-if="showTotal" class="pagination-total">
      <span class="text-sm text-gray-700 dark:text-gray-300">
        顯示 {{ startItem }}-{{ endItem }} 項，共 {{ total }} 項
      </span>
    </div>

    <!-- 分頁控制 -->
    <div class="pagination-controls">
      <!-- 上一頁 -->
      <button
        type="button"
        :disabled="currentPage <= 1"
        :class="buttonClasses"
        @click="handlePageChange(currentPage - 1)"
      >
        <ChevronLeftIcon class="size-4" />
        <span class="ml-1 hidden sm:inline">上一頁</span>
      </button>

      <!-- 頁碼 -->
      <div class="page-numbers">
        <!-- 第一頁 -->
        <button
          v-if="showFirstPage"
          type="button"
          :class="getPageButtonClasses(1)"
          @click="handlePageChange(1)"
        >
          1
        </button>

        <!-- 前省略號 -->
        <span v-if="showStartEllipsis" class="pagination-ellipsis">...</span>

        <!-- 中間頁碼 -->
        <button
          v-for="page in visiblePages"
          :key="page"
          type="button"
          :class="getPageButtonClasses(page)"
          @click="handlePageChange(page)"
        >
          {{ page }}
        </button>

        <!-- 後省略號 -->
        <span v-if="showEndEllipsis" class="pagination-ellipsis">...</span>

        <!-- 最後一頁 -->
        <button
          v-if="showLastPage"
          type="button"
          :class="getPageButtonClasses(totalPages)"
          @click="handlePageChange(totalPages)"
        >
          {{ totalPages }}
        </button>
      </div>

      <!-- 下一頁 -->
      <button
        type="button"
        :disabled="currentPage >= totalPages"
        :class="buttonClasses"
        @click="handlePageChange(currentPage + 1)"
      >
        <span class="mr-1 hidden sm:inline">下一頁</span>
        <ChevronRightIcon class="size-4" />
      </button>
    </div>

    <!-- 頁面大小選擇器 -->
    <div v-if="showSizeChanger" class="page-size-changer">
      <label class="text-sm text-gray-700 dark:text-gray-300">
        每頁顯示
        <select
          :value="pageSize"
          :class="selectClasses"
          @change="handleSizeChange"
        >
          <option
            v-for="size in pageSizeOptions"
            :key="size"
            :value="size"
          >
            {{ size }}
          </option>
        </select>
        項
      </label>
    </div>

    <!-- 快速跳轉 -->
    <div v-if="showQuickJumper" class="quick-jumper">
      <label class="text-sm text-gray-700 dark:text-gray-300">
        跳至
        <input
          ref="jumpInput"
          v-model="jumpPage"
          type="number"
          :min="1"
          :max="totalPages"
          :class="inputClasses"
          @keydown.enter="handleJump"
          @blur="handleJump"
        />
        頁
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { useResponsive } from '@/composables/useResponsive'

export interface SmartPaginationProps {
  currentPage: number
  pageSize: number
  total: number
  pageSizeOptions?: number[]
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  showTotal?: boolean
  maxVisiblePages?: number
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<SmartPaginationProps>(), {
  pageSizeOptions: () => [10, 20, 50, 100],
  showSizeChanger: true,
  showQuickJumper: false,
  showTotal: true,
  maxVisiblePages: 7,
  size: 'md'
})

export interface SmartPaginationEmits {
  'page-change': [page: number]
  'size-change': [size: number]
}

const emit = defineEmits<SmartPaginationEmits>()

const { isMobile } = useResponsive()
const jumpInput = ref<HTMLInputElement>()
const jumpPage = ref('')

// 計算屬性
const totalPages = computed(() => Math.ceil(props.total / props.pageSize))

const startItem = computed(() => {
  if (props.total === 0) return 0
  return (props.currentPage - 1) * props.pageSize + 1
})

const endItem = computed(() => {
  const end = props.currentPage * props.pageSize
  return Math.min(end, props.total)
})

const containerClasses = computed(() => [
  'flex flex-col sm:flex-row items-center justify-between gap-4',
  'p-4',
  {
    'text-sm': props.size === 'sm',
    'text-base': props.size === 'md',
    'text-lg': props.size === 'lg'
  }
])

const buttonClasses = computed(() => [
  'inline-flex items-center px-3 py-2',
  'text-sm font-medium',
  'text-gray-500 dark:text-gray-400',
  'bg-white dark:bg-gray-800',
  'border border-gray-300 dark:border-gray-600',
  'rounded-md',
  'hover:bg-gray-50 dark:hover:bg-gray-700',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800',
  'transition-colors duration-200'
])

const selectClasses = computed(() => [
  'mx-2 px-2 py-1',
  'text-sm',
  'border border-gray-300 dark:border-gray-600',
  'rounded',
  'bg-white dark:bg-gray-800',
  'text-gray-900 dark:text-gray-100',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
])

const inputClasses = computed(() => [
  'mx-2 w-16 px-2 py-1',
  'text-sm text-center',
  'border border-gray-300 dark:border-gray-600',
  'rounded',
  'bg-white dark:bg-gray-800',
  'text-gray-900 dark:text-gray-100',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
])

// 可見頁碼計算
const visiblePages = computed(() => {
  const maxVisible = isMobile.value ? 3 : props.maxVisiblePages
  const pages = []

  if (totalPages.value <= maxVisible) {
    // 總頁數少於最大顯示數，顯示所有頁碼
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i)
    }
  } else {
    // 計算顯示範圍
    const half = Math.floor(maxVisible / 2)
    let start = Math.max(1, props.currentPage - half)
    let end = Math.min(totalPages.value, start + maxVisible - 1)

    // 調整範圍確保顯示足夠的頁碼
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    // 避免與第一頁和最後一頁重複
    if (start <= 2) start = 2
    if (end >= totalPages.value - 1) end = totalPages.value - 1

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
  }

  return pages
})

const showFirstPage = computed(() => {
  return totalPages.value > 1 && !visiblePages.value.includes(1)
})

const showLastPage = computed(() => {
  return totalPages.value > 1 && !visiblePages.value.includes(totalPages.value)
})

const showStartEllipsis = computed(() => {
  return showFirstPage.value && visiblePages.value[0] > 2
})

const showEndEllipsis = computed(() => {
  return showLastPage.value && visiblePages.value[visiblePages.value.length - 1] < totalPages.value - 1
})

// 方法
const getPageButtonClasses = (page: number) => {
  const baseClasses = [
    'inline-flex items-center justify-center',
    'min-w-[2.5rem] px-3 py-2',
    'text-sm font-medium',
    'border',
    'rounded-md',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    'transition-colors duration-200'
  ]

  if (page === props.currentPage) {
    return [
      ...baseClasses,
      'text-white',
      'bg-blue-600 border-blue-600',
      'hover:bg-blue-700'
    ]
  } else {
    return [
      ...baseClasses,
      'text-gray-500 dark:text-gray-400',
      'bg-white dark:bg-gray-800',
      'border-gray-300 dark:border-gray-600',
      'hover:bg-gray-50 dark:hover:bg-gray-700'
    ]
  }
}

const handlePageChange = (page: number) => {
  if (page >= 1 && page <= totalPages.value && page !== props.currentPage) {
    emit('page-change', page)
  }
}

const handleSizeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const newSize = parseInt(target.value)
  emit('size-change', newSize)
}

const handleJump = () => {
  const page = parseInt(jumpPage.value)
  if (page >= 1 && page <= totalPages.value) {
    handlePageChange(page)
  }
  jumpPage.value = ''
  jumpInput.value?.blur()
}
</script>

<style scoped>
.pagination-controls {
  @apply flex items-center gap-1;
}

.page-numbers {
  @apply flex items-center gap-1;
}

.pagination-ellipsis {
  @apply inline-flex items-center justify-center min-w-[2.5rem] px-3 py-2 text-sm text-gray-400 dark:text-gray-500;
}

.page-size-changer {
  @apply flex items-center;
}

.quick-jumper {
  @apply flex items-center;
}

/* 移動版樣式調整 */
@media (max-width: 640px) {
  .smart-pagination {
    @apply flex-col gap-3;
  }

  .pagination-controls {
    @apply order-2;
  }

  .pagination-total {
    @apply order-1 text-center;
  }

  .page-size-changer,
  .quick-jumper {
    @apply order-3;
  }
}

/* 高對比度模式 */
@media (prefers-contrast: high) {
  .smart-pagination button {
    @apply border-2 border-black dark:border-white;
  }

  .smart-pagination button[aria-current="page"] {
    @apply bg-black dark:bg-white text-white dark:text-black;
  }
}

/* 減少動畫模式 */
@media (prefers-reduced-motion: reduce) {
  .smart-pagination * {
    transition: none !important;
  }
}
</style>
