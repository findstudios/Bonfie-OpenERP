<template>
  <div class="virtualized-table" :class="containerClasses">
    <!-- 表格頭部 -->
    <div
      v-if="stickyHeader"
      class="table-header sticky top-0 z-10"
      :class="headerClasses"
    >
      <div class="flex table-row" :style="{ minWidth: totalWidth + 'px' }">
        <!-- 選擇欄 -->
        <div v-if="selectable" class="select-cell table-cell" :class="cellClasses">
          <input
            type="checkbox"
            :checked="isAllSelected"
            :indeterminate="isIndeterminate"
            class="checkbox"
            @change="handleSelectAll"
          />
        </div>

        <!-- 資料欄位 -->
        <div
          v-for="column in columns"
          :key="column.key"
          class="header-cell table-cell"
          :class="[cellClasses, getColumnClasses(column)]"
          :style="getColumnStyle(column)"
        >
          <button
            v-if="column.sortable !== false && sortable"
            type="button"
            class="sort-button flex w-full items-center text-left"
            @click="handleSort(column.key)"
          >
            <span class="truncate">{{ column.label }}</span>
            <div class="sort-icons ml-2 flex flex-col">
              <ChevronUpIcon
                :class="[
                  '-mb-1 size-3',
                  sortBy === column.key && sortOrder === 'asc'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400'
                ]"
              />
              <ChevronDownIcon
                :class="[
                  'size-3',
                  sortBy === column.key && sortOrder === 'desc'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400'
                ]"
              />
            </div>
          </button>
          <span v-else class="truncate">{{ column.label }}</span>
        </div>
      </div>
    </div>

    <!-- 虛擬滾動容器 -->
    <div
      ref="scrollContainer"
      class="scroll-container"
      :class="scrollContainerClasses"
      :style="scrollContainerStyle"
      @scroll="handleScroll"
    >
      <!-- 虛擬滾動內容 -->
      <div
        class="virtual-content"
        :style="{ height: totalHeight + 'px', position: 'relative' }"
      >
        <!-- 可見行 -->
        <div
          v-for="(item, index) in visibleItems"
          :key="getRowKey(item.data)"
          class="flex table-row"
          :class="[
            rowClasses,
            {
              'selected': isRowSelected(item.data),
              'hover:bg-gray-50 dark:hover:bg-gray-700': !isRowSelected(item.data)
            }
          ]"
          :style="{
            position: 'absolute',
            top: item.top + 'px',
            left: '0',
            right: '0',
            height: rowHeight + 'px',
            minWidth: totalWidth + 'px'
          }"
          @click="handleRowClick(item.data, item.originalIndex)"
        >
          <!-- 選擇欄 -->
          <div v-if="selectable" class="select-cell table-cell" :class="cellClasses">
            <input
              type="checkbox"
              :checked="isRowSelected(item.data)"
              class="checkbox"
              @click.stop
              @change="handleRowSelect(item.data, $event)"
            />
          </div>

          <!-- 資料欄位 -->
          <div
            v-for="column in columns"
            :key="column.key"
            class="data-cell table-cell"
            :class="[cellClasses, getColumnClasses(column)]"
            :style="getColumnStyle(column)"
          >
            <div class="cell-content">
              <slot
                :name="`cell-${column.key}`"
                :value="getCellValue(item.data, column)"
                :row="item.data"
                :column="column"
                :index="item.originalIndex"
              >
                {{ formatCellValue(item.data, column) }}
              </slot>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 載入狀態 -->
    <div v-if="loading" class="loading-overlay" :class="loadingClasses">
      <div class="loading-content">
        <LoadingSpinner size="md" />
        <p class="loading-text">載入中...</p>
      </div>
    </div>

    <!-- 空狀態 -->
    <div v-else-if="data.length === 0" class="empty-state" :class="emptyClasses">
      <div class="empty-content">
        <slot name="empty">
          <p class="empty-text">{{ emptyText }}</p>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import type { TableColumn, PerformanceConfig } from './types'
import LoadingSpinner from './LoadingSpinner.vue'

export interface VirtualizedTableProps {
  data: any[]
  columns: TableColumn[]
  rowKey: string
  loading?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  sortable?: boolean
  rowHeight?: number
  virtualScrolling?: PerformanceConfig['virtualScrolling']
  selectable?: boolean
  selectedRows?: any[]
  stickyHeader?: boolean
  emptyText?: string
}

const props = withDefaults(defineProps<VirtualizedTableProps>(), {
  loading: false,
  sortable: true,
  rowHeight: 60,
  virtualScrolling: () => ({
    enabled: true,
    itemHeight: 60,
    bufferSize: 10,
    threshold: 100
  }),
  selectable: false,
  selectedRows: () => [],
  stickyHeader: true,
  emptyText: '暫無資料'
})

export interface VirtualizedTableEmits {
  'sort': [column: string, order: 'asc' | 'desc']
  'row-click': [row: any, index: number]
  'row-select': [selectedRows: any[]]
  'select-all': [selected: boolean]
}

const emit = defineEmits<VirtualizedTableEmits>()

const scrollContainer = ref<HTMLDivElement>()
const scrollTop = ref(0)
const containerHeight = ref(400)

// 計算屬性
const containerClasses = computed(() => [
  'border border-gray-200 dark:border-gray-700',
  'rounded-lg overflow-hidden',
  'bg-white dark:bg-gray-800'
])

const headerClasses = computed(() => [
  'bg-gray-50 dark:bg-gray-750',
  'border-b border-gray-200 dark:border-gray-700'
])

const cellClasses = computed(() => [
  'px-4 py-3',
  'text-sm',
  'border-r border-gray-200 dark:border-gray-700 last:border-r-0'
])

const rowClasses = computed(() => [
  'border-b border-gray-200 dark:border-gray-700 last:border-b-0',
  'transition-colors duration-150',
  'cursor-pointer'
])

const scrollContainerClasses = computed(() => [
  'overflow-auto',
  'relative'
])

const scrollContainerStyle = computed(() => ({
  height: `${containerHeight.value}px`
}))

const loadingClasses = computed(() => [
  'absolute inset-0',
  'bg-white/80 dark:bg-gray-800/80',
  'backdrop-blur-sm',
  'flex items-center justify-center',
  'z-20'
])

const emptyClasses = computed(() => [
  'flex items-center justify-center',
  'py-12',
  'text-gray-500 dark:text-gray-400'
])

// 虛擬滾動計算
const totalHeight = computed(() => {
  return props.data.length * props.rowHeight
})

const totalWidth = computed(() => {
  let width = 0
  if (props.selectable) width += 60 // 選擇欄寬度

  props.columns.forEach(column => {
    if (column.width) {
      width += parseInt(column.width.replace('px', ''))
    } else {
      width += 150 // 預設欄位寬度
    }
  })

  return Math.max(width, 800) // 最小寬度
})

const visibleRange = computed(() => {
  if (!props.virtualScrolling?.enabled) {
    return { start: 0, end: props.data.length }
  }

  const bufferSize = props.virtualScrolling.bufferSize || 10
  const itemHeight = props.rowHeight

  const start = Math.max(0, Math.floor(scrollTop.value / itemHeight) - bufferSize)
  const visibleCount = Math.ceil(containerHeight.value / itemHeight)
  const end = Math.min(props.data.length, start + visibleCount + bufferSize * 2)

  return { start, end }
})

const visibleItems = computed(() => {
  const { start, end } = visibleRange.value
  const items = []

  for (let i = start; i < end; i++) {
    if (props.data[i]) {
      items.push({
        data: props.data[i],
        originalIndex: i,
        top: i * props.rowHeight
      })
    }
  }

  return items
})

// 選擇相關
const isAllSelected = computed(() => {
  return props.data.length > 0 && props.selectedRows.length === props.data.length
})

const isIndeterminate = computed(() => {
  return props.selectedRows.length > 0 && props.selectedRows.length < props.data.length
})

// 方法
const getRowKey = (row: any) => {
  return row[props.rowKey]
}

const getCellValue = (row: any, column: TableColumn) => {
  return row[column.key]
}

const formatCellValue = (row: any, column: TableColumn) => {
  const value = getCellValue(row, column)

  if (column.render) {
    return column.render(value, row)
  }

  return value
}

const getColumnClasses = (column: TableColumn) => {
  const classes = []

  if (column.align) {
    classes.push(`text-${column.align}`)
  }

  return classes
}

const getColumnStyle = (column: TableColumn) => {
  const style: any = {}

  if (column.width) {
    style.width = column.width
    style.minWidth = column.width
    style.maxWidth = column.width
  } else {
    style.flex = '1'
    style.minWidth = '150px'
  }

  return style
}

const handleSort = (columnKey: string) => {
  let newOrder: 'asc' | 'desc' = 'asc'

  if (props.sortBy === columnKey) {
    newOrder = props.sortOrder === 'asc' ? 'desc' : 'asc'
  }

  emit('sort', columnKey, newOrder)
}

const handleRowClick = (row: any, index: number) => {
  emit('row-click', row, index)
}

const isRowSelected = (row: any) => {
  const rowKey = getRowKey(row)
  return props.selectedRows.some(selectedRow => getRowKey(selectedRow) === rowKey)
}

const handleRowSelect = (row: any, event: Event) => {
  const target = event.target as HTMLInputElement
  const rowKey = getRowKey(row)
  let newSelectedRows = [...props.selectedRows]

  if (target.checked) {
    if (!newSelectedRows.some(selectedRow => getRowKey(selectedRow) === rowKey)) {
      newSelectedRows.push(row)
    }
  } else {
    newSelectedRows = newSelectedRows.filter(selectedRow => getRowKey(selectedRow) !== rowKey)
  }

  emit('row-select', newSelectedRows)
}

const handleSelectAll = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('select-all', target.checked)
}

const handleScroll = (event: Event) => {
  const target = event.target as HTMLDivElement
  scrollTop.value = target.scrollTop
}

const updateContainerHeight = () => {
  if (scrollContainer.value) {
    containerHeight.value = scrollContainer.value.clientHeight
  }
}

// 生命週期
onMounted(() => {
  updateContainerHeight()
  window.addEventListener('resize', updateContainerHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerHeight)
})

// 監聽數據變化，重置滾動位置
watch(() => props.data, () => {
  scrollTop.value = 0
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = 0
  }
})
</script>

<style scoped>
.virtualized-table {
  position: relative;
}

.table-row.selected {
  @apply bg-blue-50 dark:bg-blue-900/20;
}

.sort-button {
  @apply hover:text-gray-700 dark:hover:text-gray-300 transition-colors;
}

.sort-button:hover .sort-icons {
  @apply text-gray-600 dark:text-gray-400;
}

.select-cell {
  width: 60px;
  min-width: 60px;
  max-width: 60px;
  flex-shrink: 0;
}

.checkbox {
  @apply h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500;
}

.cell-content {
  @apply truncate;
}

.loading-content {
  @apply flex flex-col items-center gap-2;
}

.loading-text {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.empty-content {
  @apply text-center;
}

.empty-text {
  @apply text-gray-500 dark:text-gray-400;
}

/* 滾動條樣式 */
.scroll-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.scroll-container::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-700;
}

.scroll-container::-webkit-scrollbar-thumb {
  @apply bg-gray-400 dark:bg-gray-500 rounded;
}

.scroll-container::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-500 dark:bg-gray-400;
}

/* 高對比度模式 */
@media (prefers-contrast: high) {
  .virtualized-table {
    @apply border-2 border-black dark:border-white;
  }

  .table-row.selected {
    @apply bg-yellow-200 dark:bg-yellow-800;
  }
}

/* 減少動畫模式 */
@media (prefers-reduced-motion: reduce) {
  .virtualized-table * {
    transition: none !important;
  }
}
</style>
