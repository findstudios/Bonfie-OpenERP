<template>
  <div class="adaptive-data-table" :class="containerClasses">
    <!-- 表格工具欄 -->
    <div v-if="showToolbar" class="table-toolbar" :class="toolbarClasses">
      <!-- 搜尋框 -->
      <div v-if="searchable" class="search-container">
        <SearchInput
          v-model="searchQuery"
          :placeholder="searchPlaceholder"
          :debounce="searchDebounce"
          @search="handleSearch"
        />
      </div>

      <!-- 篩選器 -->
      <div v-if="filterable && filters.length > 0" class="filter-container">
        <FilterDropdown
          v-for="filter in filters"
          :key="filter.key"
          :filter="filter"
          :value="activeFilters[filter.key]"
          @change="handleFilterChange"
        />
      </div>

      <!-- 欄位選擇器 -->
      <div v-if="columnSelectable && !isMobile" class="column-selector-container">
        <ColumnSelector
          :columns="columns"
          :visible-columns="visibleColumnKeys"
          @change="handleColumnVisibilityChange"
        />
      </div>

      <!-- 其他工具按鈕 -->
      <div class="toolbar-actions">
        <slot name="toolbar-actions" :selected-rows="selectedRows" />
      </div>
    </div>

    <!-- 桌面版表格 -->
    <div v-if="!isMobile" class="desktop-table-container" :class="desktopTableClasses">
      <VirtualizedTable
        :data="finalData"
        :columns="visibleColumns"
        :loading="loading"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :row-height="rowHeight"
        :virtual-scrolling="virtualScrolling"
        :selectable="selectable"
        :selected-rows="selectedRows"
        :row-key="rowKey"
        :empty-text="emptyText"
        :sticky-header="stickyHeader"
        @sort="handleSort"
        @row-click="handleRowClick"
        @row-select="handleRowSelect"
        @select-all="handleSelectAll"
      />
    </div>

    <!-- 移動版卡片列表 -->
    <div v-else class="mobile-cards-container" :class="mobileCardsClasses">
      <VirtualizedCardList
        :data="finalData"
        :loading="loading"
        :card-template="mobileCardTemplate"
        :card-height="cardHeight"
        :virtual-scrolling="virtualScrolling"
        :selectable="selectable"
        :selected-items="selectedRows"
        :item-key="rowKey"
        :empty-text="emptyText"
        @item-click="handleRowClick"
        @item-select="handleRowSelect"
      />
    </div>

    <!-- 分頁控制 -->
    <div v-if="paginated" class="pagination-container" :class="paginationClasses">
      <SmartPagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="totalItems"
        :show-size-changer="showSizeChanger"
        :page-size-options="pageSizeOptions"
        :show-quick-jumper="showQuickJumper"
        :show-total="showTotal"
        @page-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </div>

    <!-- 載入遮罩 -->
    <div v-if="loading" class="loading-overlay" :class="loadingClasses">
      <div class="loading-content">
        <LoadingSpinner :size="loadingSpinnerSize" />
        <p v-if="loadingText" class="loading-text">{{ loadingText }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { useResponsive } from '@/composables/useResponsive'
import type {
  TableColumn,
  TableFilter,
  TablePagination,
  PerformanceConfig
} from './types'

// 組件導入
import SearchInput from './SearchInput.vue'
import FilterDropdown from './FilterDropdown.vue'
import ColumnSelector from './ColumnSelector.vue'
import VirtualizedTable from './VirtualizedTable.vue'
import VirtualizedCardList from './VirtualizedCardList.vue'
import SmartPagination from './SmartPagination.vue'
import LoadingSpinner from './LoadingSpinner.vue'

// Props 定義
export interface AdaptiveDataTableProps {
  // 數據相關
  data: any[]
  columns: TableColumn[]
  rowKey: string
  loading?: boolean

  // 搜尋相關
  searchable?: boolean
  searchPlaceholder?: string
  searchDebounce?: number

  // 篩選相關
  filterable?: boolean
  filters?: TableFilter[]

  // 排序相關
  sortable?: boolean
  defaultSortBy?: string
  defaultSortOrder?: 'asc' | 'desc'

  // 分頁相關
  paginated?: boolean
  pageSize?: number
  pageSizeOptions?: number[]
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  showTotal?: boolean

  // 選擇相關
  selectable?: boolean
  multiSelect?: boolean

  // 欄位控制
  columnSelectable?: boolean

  // 虛擬滾動
  virtualScrolling?: PerformanceConfig['virtualScrolling']
  rowHeight?: number
  cardHeight?: number

  // 移動版配置
  mobileCardTemplate?: any

  // 樣式相關
  stickyHeader?: boolean
  showToolbar?: boolean

  // 文字配置
  emptyText?: string
  loadingText?: string

  // 性能配置
  debounce?: {
    search?: number
    filter?: number
    sort?: number
  }
}

const props = withDefaults(defineProps<AdaptiveDataTableProps>(), {
  data: () => [],
  columns: () => [],
  rowKey: 'id',
  loading: false,
  searchable: true,
  searchPlaceholder: '搜尋...',
  searchDebounce: 300,
  filterable: true,
  filters: () => [],
  sortable: true,
  defaultSortOrder: 'asc',
  paginated: true,
  pageSize: 20,
  pageSizeOptions: () => [10, 20, 50, 100],
  showSizeChanger: true,
  showQuickJumper: false,
  showTotal: true,
  selectable: false,
  multiSelect: true,
  columnSelectable: true,
  virtualScrolling: () => ({
    enabled: true,
    itemHeight: 60,
    bufferSize: 10,
    threshold: 100
  }),
  rowHeight: 60,
  cardHeight: 120,
  stickyHeader: true,
  showToolbar: true,
  emptyText: '暫無資料',
  loadingText: '載入中...',
  debounce: () => ({
    search: 300,
    filter: 200,
    sort: 100
  })
})

// Emits 定義
export interface AdaptiveDataTableEmits {
  'row-click': [row: any, index: number]
  'row-select': [selectedRows: any[]]
  'sort-change': [sortBy: string, sortOrder: 'asc' | 'desc']
  'filter-change': [filters: Record<string, any>]
  'search': [query: string]
  'page-change': [page: number, pageSize: number]
}

const emit = defineEmits<AdaptiveDataTableEmits>()

// 響應式狀態
const { isMobile, isTablet, isDesktop } = useResponsive()

// 內部狀態
const searchQuery = ref('')
const activeFilters = ref<Record<string, any>>({})
const sortBy = ref(props.defaultSortBy || '')
const sortOrder = ref<'asc' | 'desc'>(props.defaultSortOrder)
const currentPage = ref(1)
const pageSize = ref(props.pageSize)
const selectedRows = ref<any[]>([])
const visibleColumnKeys = ref<string[]>([])

// 計算屬性
const containerClasses = computed(() => [
  'w-full',
  'bg-white dark:bg-gray-800',
  'rounded-lg',
  'shadow-sm',
  'border border-gray-200 dark:border-gray-700',
  {
    'mobile-layout': isMobile.value,
    'tablet-layout': isTablet.value,
    'desktop-layout': isDesktop.value
  }
])

const toolbarClasses = computed(() => [
  'flex flex-col sm:flex-row',
  'gap-4 p-4',
  'border-b border-gray-200 dark:border-gray-700',
  'bg-gray-50 dark:bg-gray-750',
  'rounded-t-lg'
])

const desktopTableClasses = computed(() => [
  'overflow-hidden',
  {
    'border-b border-gray-200 dark:border-gray-700': props.paginated
  }
])

const mobileCardsClasses = computed(() => [
  'p-4',
  {
    'border-b border-gray-200 dark:border-gray-700': props.paginated
  }
])

const paginationClasses = computed(() => [
  'p-4',
  'bg-gray-50 dark:bg-gray-750',
  'rounded-b-lg'
])

const loadingClasses = computed(() => [
  'absolute inset-0',
  'bg-white/80 dark:bg-gray-800/80',
  'backdrop-blur-sm',
  'flex items-center justify-center',
  'z-10'
])

const loadingSpinnerSize = computed(() => isMobile.value ? 'md' : 'lg')

// 可見欄位
const visibleColumns = computed(() => {
  if (visibleColumnKeys.value.length === 0) {
    return props.columns
  }
  return props.columns.filter(col => visibleColumnKeys.value.includes(col.key))
})

// 處理後的數據
const processedData = computed(() => {
  let result = [...props.data]

  // 搜尋過濾
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(row => {
      return visibleColumns.value.some(col => {
        const value = row[col.key]
        return String(value).toLowerCase().includes(query)
      })
    })
  }

  // 篩選器過濾
  Object.entries(activeFilters.value).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      result = result.filter(row => {
        const rowValue = row[key]
        if (Array.isArray(value)) {
          return value.includes(rowValue)
        }
        return rowValue === value
      })
    }
  })

  // 排序
  if (sortBy.value) {
    result.sort((a, b) => {
      const aValue = a[sortBy.value]
      const bValue = b[sortBy.value]

      let comparison = 0
      if (aValue < bValue) comparison = -1
      else if (aValue > bValue) comparison = 1

      return sortOrder.value === 'desc' ? -comparison : comparison
    })
  }

  return result
})

// 總項目數
const totalItems = computed(() => processedData.value.length)

// 分頁數據
const finalData = computed(() => {
  if (!props.paginated) return processedData.value

  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return processedData.value.slice(start, end)
})

// 事件處理
const handleSearch = (query: string) => {
  searchQuery.value = query
  currentPage.value = 1
  emit('search', query)
}

const handleFilterChange = (filterKey: string, value: any) => {
  activeFilters.value[filterKey] = value
  currentPage.value = 1
  emit('filter-change', { ...activeFilters.value })
}

const handleSort = (column: string, order: 'asc' | 'desc') => {
  sortBy.value = column
  sortOrder.value = order
  emit('sort-change', column, order)
}

const handleRowClick = (row: any, index: number) => {
  emit('row-click', row, index)
}

const handleRowSelect = (rows: any[]) => {
  selectedRows.value = rows
  emit('row-select', rows)
}

const handleSelectAll = (selected: boolean) => {
  if (selected) {
    selectedRows.value = [...finalData.value]
  } else {
    selectedRows.value = []
  }
  emit('row-select', selectedRows.value)
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  emit('page-change', page, pageSize.value)
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  emit('page-change', 1, size)
}

const handleColumnVisibilityChange = (visibleKeys: string[]) => {
  visibleColumnKeys.value = visibleKeys
}

// 初始化
onMounted(() => {
  // 初始化可見欄位
  if (visibleColumnKeys.value.length === 0) {
    visibleColumnKeys.value = props.columns.map(col => col.key)
  }
})

// 監聽響應式變化
watch(isMobile, (newValue) => {
  if (newValue) {
    // 切換到移動版時清除選中狀態
    selectedRows.value = []
  }
})
</script>

<style scoped>
.adaptive-data-table {
  position: relative;
}

.search-container {
  flex: 1;
  min-width: 200px;
}

.filter-container {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.column-selector-container {
  flex-shrink: 0;
}

.toolbar-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.loading-overlay {
  border-radius: inherit;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-text {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

/* 響應式樣式 */
@media (max-width: 767px) {
  .toolbar-actions {
    justify-content: stretch;
  }

  .filter-container {
    justify-content: stretch;
  }
}

/* 深色模式支援 */
.dark .adaptive-data-table {
  @apply bg-gray-800 border-gray-700;
}

.dark .table-toolbar {
  @apply bg-gray-750 border-gray-700;
}

.dark .pagination-container {
  @apply bg-gray-750;
}

/* 高對比度模式 */
@media (prefers-contrast: high) {
  .adaptive-data-table {
    @apply border-2 border-black;
  }

  .table-toolbar {
    @apply border-b-2 border-black;
  }
}

/* 減少動畫模式 */
@media (prefers-reduced-motion: reduce) {
  .loading-overlay {
    transition: none;
  }
}
</style>
