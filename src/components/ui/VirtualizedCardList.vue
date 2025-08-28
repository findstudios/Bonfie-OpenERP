<template>
  <div class="virtualized-card-list" :class="containerClasses">
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
        <!-- 可見卡片 -->
        <div
          v-for="(item, index) in visibleItems"
          :key="getItemKey(item.data)"
          class="card-item"
          :class="[
            cardClasses,
            {
              'selected': isItemSelected(item.data)
            }
          ]"
          :style="{
            position: 'absolute',
            top: item.top + 'px',
            left: '0',
            right: '0',
            height: cardHeight + 'px'
          }"
          @click="handleItemClick(item.data, item.originalIndex)"
        >
          <!-- 選擇框 -->
          <div v-if="selectable" class="card-select">
            <input
              type="checkbox"
              :checked="isItemSelected(item.data)"
              class="checkbox"
              @click.stop
              @change="handleItemSelect(item.data, $event)"
            />
          </div>

          <!-- 卡片內容 -->
          <div class="card-content">
            <slot
              :item="item.data"
              :index="item.originalIndex"
              :selected="isItemSelected(item.data)"
            >
              <!-- 預設卡片模板 -->
              <DefaultCardTemplate
                :item="item.data"
                :template="cardTemplate"
              />
            </slot>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { PerformanceConfig } from './types'
import LoadingSpinner from './LoadingSpinner.vue'
import DefaultCardTemplate from './DefaultCardTemplate.vue'

export interface VirtualizedCardListProps {
  data: any[]
  itemKey: string
  loading?: boolean
  cardHeight?: number
  cardTemplate?: any
  virtualScrolling?: PerformanceConfig['virtualScrolling']
  selectable?: boolean
  selectedItems?: any[]
  emptyText?: string
  gap?: number
}

const props = withDefaults(defineProps<VirtualizedCardListProps>(), {
  loading: false,
  cardHeight: 120,
  virtualScrolling: () => ({
    enabled: true,
    itemHeight: 120,
    bufferSize: 5,
    threshold: 50
  }),
  selectable: false,
  selectedItems: () => [],
  emptyText: '暫無資料',
  gap: 12
})

export interface VirtualizedCardListEmits {
  'item-click': [item: any, index: number]
  'item-select': [selectedItems: any[]]
}

const emit = defineEmits<VirtualizedCardListEmits>()

const scrollContainer = ref<HTMLDivElement>()
const scrollTop = ref(0)
const containerHeight = ref(400)

// 計算屬性
const containerClasses = computed(() => [
  'bg-white dark:bg-gray-800',
  'rounded-lg'
])

const cardClasses = computed(() => [
  'bg-white dark:bg-gray-800',
  'border border-gray-200 dark:border-gray-700',
  'rounded-lg shadow-sm',
  'hover:shadow-md',
  'transition-shadow duration-200',
  'cursor-pointer',
  'mx-4 mb-3',
  'flex items-center',
  'p-4'
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
const itemHeightWithGap = computed(() => props.cardHeight + props.gap)

const totalHeight = computed(() => {
  if (props.data.length === 0) return 0
  return props.data.length * itemHeightWithGap.value - props.gap + 32 // 32px for padding
})

const visibleRange = computed(() => {
  if (!props.virtualScrolling?.enabled) {
    return { start: 0, end: props.data.length }
  }

  const bufferSize = props.virtualScrolling.bufferSize || 5
  const itemHeight = itemHeightWithGap.value

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
        top: i * itemHeightWithGap.value + 16 // 16px top padding
      })
    }
  }

  return items
})

// 方法
const getItemKey = (item: any) => {
  return item[props.itemKey]
}

const isItemSelected = (item: any) => {
  const itemKey = getItemKey(item)
  return props.selectedItems.some(selectedItem => getItemKey(selectedItem) === itemKey)
}

const handleItemClick = (item: any, index: number) => {
  emit('item-click', item, index)
}

const handleItemSelect = (item: any, event: Event) => {
  const target = event.target as HTMLInputElement
  const itemKey = getItemKey(item)
  let newSelectedItems = [...props.selectedItems]

  if (target.checked) {
    if (!newSelectedItems.some(selectedItem => getItemKey(selectedItem) === itemKey)) {
      newSelectedItems.push(item)
    }
  } else {
    newSelectedItems = newSelectedItems.filter(selectedItem => getItemKey(selectedItem) !== itemKey)
  }

  emit('item-select', newSelectedItems)
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
.virtualized-card-list {
  position: relative;
}

.card-item.selected {
  @apply bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600;
}

.card-select {
  @apply flex-shrink-0 mr-3;
}

.card-content {
  @apply flex-1 min-w-0;
}

.checkbox {
  @apply h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500;
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

/* 觸控優化 */
@media (hover: none) and (pointer: coarse) {
  .card-item {
    @apply active:bg-gray-100 dark:active:bg-gray-700;
  }

  .card-item.selected {
    @apply active:bg-blue-100 dark:active:bg-blue-800/30;
  }
}

/* 高對比度模式 */
@media (prefers-contrast: high) {
  .card-item {
    @apply border-2 border-black dark:border-white;
  }

  .card-item.selected {
    @apply bg-yellow-200 dark:bg-yellow-800 border-yellow-600;
  }
}

/* 減少動畫模式 */
@media (prefers-reduced-motion: reduce) {
  .virtualized-card-list * {
    transition: none !important;
  }
}
</style>
