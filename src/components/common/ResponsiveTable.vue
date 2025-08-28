<template>
  <div class="responsive-table-container">
    <!-- 桌面版表格 -->
    <div v-if="!isMobile" class="table-wrapper overflow-hidden bg-[var(--color-bg-elevated)] shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table class="min-w-full divide-y divide-[var(--color-border-primary)]">
        <thead class="bg-[var(--color-surface-secondary)]">
          <tr>
            <th
              v-for="column in visibleColumns"
              :key="column.key"
              :class="[
                'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider',
                'text-[var(--color-text-tertiary)]',
                column.sortable ? 'cursor-pointer hover:bg-[var(--color-surface-hover)]' : '',
                column.align === 'center' ? 'text-center' : '',
                column.align === 'right' ? 'text-right' : ''
              ]"
              @click="column.sortable ? handleSort(column.key) : null"
            >
              <div class="flex items-center space-x-1">
                <span>{{ column.label }}</span>
                <template v-if="column.sortable">
                  <ChevronUpIcon
                    v-if="sortBy === column.key && sortOrder === 'asc'"
                    class="size-4"
                  />
                  <ChevronDownIcon
                    v-else-if="sortBy === column.key && sortOrder === 'desc'"
                    class="size-4"
                  />
                  <ChevronUpDownIcon
                    v-else
                    class="size-4 text-[var(--color-text-disabled)]"
                  />
                </template>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--color-border-primary)] bg-[var(--color-bg-elevated)]">
          <tr
            v-for="(item, index) in data"
            :key="getRowKey(item, index)"
            :class="[
              'transition-colors duration-150 hover:bg-[var(--color-surface-hover)]',
              rowClickable ? 'cursor-pointer' : ''
            ]"
            @click="rowClickable ? handleRowClick(item, index) : null"
          >
            <td
              v-for="column in visibleColumns"
              :key="column.key"
              :class="[
                'whitespace-nowrap px-6 py-4 text-sm',
                column.align === 'center' ? 'text-center' : '',
                column.align === 'right' ? 'text-right' : '',
                column.width ? `w-${column.width}` : ''
              ]"
            >
              <slot
                :name="`cell-${column.key}`"
                :item="item"
                :value="getNestedValue(item, column.key)"
                :index="index"
                :column="column"
              >
                <span :class="getCellTextClass(column)">
                  {{ formatCellValue(getNestedValue(item, column.key), column) }}
                </span>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 空狀態 -->
      <div v-if="data.length === 0 && !loading" class="py-12 text-center">
        <slot name="empty">
          <div class="text-[var(--color-text-tertiary)]">
            <component :is="emptyIcon" class="mx-auto mb-4 size-12 text-[var(--color-text-disabled)]" />
            <h3 class="mb-2 text-lg font-medium text-[var(--color-text-primary)]">{{ emptyTitle }}</h3>
            <p class="text-sm text-[var(--color-text-tertiary)]">{{ emptyMessage }}</p>
          </div>
        </slot>
      </div>
    </div>

    <!-- 行動版卡片 -->
    <div v-else class="mobile-cards space-y-4">
      <div
        v-for="(item, index) in data"
        :key="getRowKey(item, index)"
        :class="[
          'mobile-card rounded-lg p-4 shadow',
          'border border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)]',
          'transition-all duration-200 hover:shadow-md',
          rowClickable ? 'cursor-pointer hover:border-[var(--color-border-secondary)]' : ''
        ]"
        @click="rowClickable ? handleRowClick(item, index) : null"
      >
        <slot
          name="mobile-card"
          :item="item"
          :index="index"
          :columns="visibleColumns"
        >
          <!-- 預設卡片佈局 -->
          <div class="space-y-3">
            <!-- 主要資訊 (前兩個欄位) -->
            <div v-for="column in visibleColumns.slice(0, 2)" :key="column.key" class="flex items-start justify-between">
              <div class="flex-1">
                <div class="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  {{ column.label }}
                </div>
                <div :class="getCellTextClass(column, true)">
                  <slot
                    :name="`mobile-cell-${column.key}`"
                    :item="item"
                    :value="getNestedValue(item, column.key)"
                    :index="index"
                    :column="column"
                  >
                    {{ formatCellValue(getNestedValue(item, column.key), column) }}
                  </slot>
                </div>
              </div>
            </div>

            <!-- 次要資訊 (其餘欄位，以較小字體顯示) -->
            <div v-if="visibleColumns.length > 2" class="border-t border-[var(--color-border-primary)] pt-2">
              <div class="grid grid-cols-1 gap-2">
                <div
                  v-for="column in visibleColumns.slice(2)"
                  :key="column.key"
                  class="flex items-center justify-between text-sm"
                >
                  <span class="font-medium text-[var(--color-text-tertiary)]">{{ column.label }}:</span>
                  <span :class="getCellTextClass(column, true)">
                    <slot
                      :name="`mobile-cell-${column.key}`"
                      :item="item"
                      :value="getNestedValue(item, column.key)"
                      :index="index"
                      :column="column"
                    >
                      {{ formatCellValue(getNestedValue(item, column.key), column) }}
                    </slot>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </slot>
      </div>

      <!-- 行動版空狀態 -->
      <div v-if="data.length === 0 && !loading" class="py-12 text-center">
        <slot name="mobile-empty">
          <div class="text-[var(--color-text-tertiary)]">
            <component :is="emptyIcon" class="mx-auto mb-4 size-12 text-[var(--color-text-disabled)]" />
            <h3 class="mb-2 text-lg font-medium text-[var(--color-text-primary)]">{{ emptyTitle }}</h3>
            <p class="text-sm text-[var(--color-text-tertiary)]">{{ emptyMessage }}</p>
          </div>
        </slot>
      </div>
    </div>

    <!-- 載入狀態 -->
    <div v-if="loading" class="loading-state">
      <slot name="loading">
        <div v-if="!isMobile" class="animate-pulse space-y-4 p-6">
          <div v-for="i in loadingRows" :key="i" class="h-16 rounded bg-[var(--color-surface-tertiary)]"></div>
        </div>
        <div v-else class="animate-pulse space-y-4">
          <div v-for="i in loadingRows" :key="i" class="h-24 rounded-lg bg-[var(--color-surface-tertiary)]"></div>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useResponsive } from '@/composables/useResponsive'
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  TableCellsIcon
} from '@heroicons/vue/24/outline'

// 定義介面
export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  type?: 'text' | 'number' | 'date' | 'boolean' | 'currency'
  format?: string
  hideOnMobile?: boolean
  hideOnTablet?: boolean
}

export interface ResponsiveTableProps {
  data: any[]
  columns: TableColumn[]
  loading?: boolean
  rowKey?: string | ((item: any, index: number) => string | number)
  rowClickable?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  emptyTitle?: string
  emptyMessage?: string
  emptyIcon?: any
  loadingRows?: number
}

// Props
const props = withDefaults(defineProps<ResponsiveTableProps>(), {
  loading: false,
  rowKey: 'id',
  rowClickable: false,
  sortBy: '',
  sortOrder: 'asc',
  emptyTitle: '沒有資料',
  emptyMessage: '目前沒有任何資料',
  emptyIcon: TableCellsIcon,
  loadingRows: 5
})

// Emits
const emit = defineEmits<{
  rowClick: [item: any, index: number]
  sort: [column: string, order: 'asc' | 'desc']
}>()

// 響應式狀態
const { isMobile, isTablet } = useResponsive()

// 內部狀態
const sortBy = ref(props.sortBy)
const sortOrder = ref(props.sortOrder)

// 計算可見欄位
const visibleColumns = computed(() => {
  return props.columns.filter(column => {
    if (isMobile.value && column.hideOnMobile) return false
    if (isTablet.value && column.hideOnTablet) return false
    return true
  })
})

// 獲取行鍵值
const getRowKey = (item: any, index: number): string | number => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(item, index)
  }
  return item[props.rowKey] || index
}

// 獲取嵌套屬性值
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// 格式化儲存格值
const formatCellValue = (value: any, column: TableColumn): string => {
  if (value === null || value === undefined) return '-'

  switch (column.type) {
    case 'date':
      if (value instanceof Date) {
        return value.toLocaleDateString('zh-TW')
      }
      if (typeof value === 'string') {
        return new Date(value).toLocaleDateString('zh-TW')
      }
      return value.toString()

    case 'currency':
      if (typeof value === 'number') {
        return new Intl.NumberFormat('zh-TW', {
          style: 'currency',
          currency: 'TWD'
        }).format(value)
      }
      return value.toString()

    case 'number':
      if (typeof value === 'number') {
        return new Intl.NumberFormat('zh-TW').format(value)
      }
      return value.toString()

    case 'boolean':
      return value ? '是' : '否'

    default:
      return value.toString()
  }
}

// 獲取儲存格文字樣式
const getCellTextClass = (column: TableColumn, isMobile = false): string => {
  const baseClass = isMobile ? 'text-sm' : 'text-sm'

  switch (column.type) {
    case 'number':
    case 'currency':
      return `${baseClass} text-[var(--color-text-primary)] font-medium`
    case 'date':
      return `${baseClass} text-[var(--color-text-secondary)]`
    case 'boolean':
      return `${baseClass} font-medium text-[var(--color-text-primary)]`
    default:
      return `${baseClass} text-[var(--color-text-primary)]`
  }
}

// 處理排序
const handleSort = (columnKey: string) => {
  if (sortBy.value === columnKey) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = columnKey
    sortOrder.value = 'asc'
  }

  emit('sort', sortBy.value, sortOrder.value)
}

// 處理行點擊
const handleRowClick = (item: any, index: number) => {
  emit('rowClick', item, index)
}
</script>

<style scoped>
/* 載入動畫 */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 表格響應式優化 */
.table-wrapper {
  @apply overflow-x-auto;
}

/* 行動版卡片優化 */
.mobile-card {
  /* 確保觸控目標足夠大 */
  min-height: 2.75rem; /* 44px */
}

/* 觸控回饋 */
@media (hover: none) and (pointer: coarse) {
  .mobile-card:active {
    background-color: var(--color-surface-hover);
    transform: scale(0.98);
  }

  .cursor-pointer:active {
    background-color: var(--color-surface-hover);
  }
}

/* 高對比度支援 */
@media (prefers-contrast: high) {
  .mobile-card {
    border: 2px solid var(--color-border-primary);
  }

  .table-wrapper table {
    border: 2px solid var(--color-border-primary);
  }
}

/* 減少動畫偏好 */
@media (prefers-reduced-motion: reduce) {
  .mobile-card,
  .cursor-pointer {
    transition: none;
  }
}
</style>
