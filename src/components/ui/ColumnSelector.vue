<template>
  <div class="column-selector" :class="containerClasses">
    <div class="relative">
      <button
        ref="triggerRef"
        type="button"
        :class="triggerClasses"
        @click="toggleDropdown"
        @keydown.enter="toggleDropdown"
        @keydown.space.prevent="toggleDropdown"
        @keydown.escape="closeDropdown"
      >
        <AdjustmentsHorizontalIcon class="mr-2 size-4" />
        <span>欄位設定</span>
        <ChevronDownIcon
          :class="[
            'ml-2 size-4 transition-transform duration-200',
            { 'rotate-180': isOpen }
          ]"
        />
      </button>

      <Transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="isOpen"
          ref="dropdownRef"
          :class="dropdownClasses"
        >
          <div class="p-3">
            <div class="mb-3 flex items-center justify-between">
              <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">
                顯示欄位
              </h3>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  @click="selectAll"
                >
                  全選
                </button>
                <button
                  type="button"
                  class="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  @click="selectNone"
                >
                  全不選
                </button>
              </div>
            </div>

            <div class="max-h-64 space-y-2 overflow-y-auto">
              <label
                v-for="column in columns"
                :key="column.key"
                :class="checkboxLabelClasses"
              >
                <input
                  type="checkbox"
                  :checked="isColumnVisible(column.key)"
                  :class="checkboxClasses"
                  @change="toggleColumn(column.key, $event)"
                />
                <span class="ml-2 text-sm text-gray-900 dark:text-gray-100">
                  {{ column.label }}
                </span>
              </label>
            </div>

            <div class="mt-3 border-t border-gray-200 pt-3 dark:border-gray-600">
              <div class="flex justify-between">
                <button
                  type="button"
                  class="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  @click="resetToDefault"
                >
                  重設預設
                </button>
                <button
                  type="button"
                  class="rounded bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700"
                  @click="closeDropdown"
                >
                  完成
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { AdjustmentsHorizontalIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import type { TableColumn } from './types'

export interface ColumnSelectorProps {
  columns: TableColumn[]
  visibleColumns: string[]
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'bordered' | 'filled'
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
}

const props = withDefaults(defineProps<ColumnSelectorProps>(), {
  size: 'md',
  variant: 'default',
  placement: 'bottom-end'
})

export interface ColumnSelectorEmits {
  'change': [visibleColumns: string[]]
}

const emit = defineEmits<ColumnSelectorEmits>()

const triggerRef = ref<HTMLButtonElement>()
const dropdownRef = ref<HTMLDivElement>()
const isOpen = ref(false)

// 計算屬性
const containerClasses = computed(() => [
  'column-selector',
  `size-${props.size}`,
  `variant-${props.variant}`,
  {
    'open': isOpen.value
  }
])

const triggerClasses = computed(() => [
  'inline-flex items-center',
  'px-3 border border-gray-300 dark:border-gray-600',
  'rounded-md shadow-sm',
  'bg-white dark:bg-gray-800',
  'text-gray-900 dark:text-gray-100',
  'hover:bg-gray-50 dark:hover:bg-gray-700',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  'transition-colors duration-200',
  // 尺寸樣式
  {
    'py-1.5 text-sm': props.size === 'sm',
    'py-2 text-base': props.size === 'md',
    'py-3 text-lg': props.size === 'lg'
  },
  // 變體樣式
  {
    'border-gray-300 dark:border-gray-600': props.variant === 'default',
    'border-2 border-gray-400 dark:border-gray-500': props.variant === 'bordered',
    'bg-gray-50 dark:bg-gray-700 border-transparent': props.variant === 'filled'
  }
])

const dropdownClasses = computed(() => [
  'absolute z-50 mt-1',
  'w-64',
  'bg-white dark:bg-gray-800',
  'border border-gray-200 dark:border-gray-600',
  'rounded-md shadow-lg',
  'ring-1 ring-black ring-opacity-5',
  // 位置樣式
  {
    'left-0': props.placement.includes('start'),
    'right-0': props.placement.includes('end'),
    'bottom-full mb-1': props.placement.includes('top')
  }
])

const checkboxLabelClasses = computed(() => [
  'flex items-center',
  'cursor-pointer',
  'hover:bg-gray-50 dark:hover:bg-gray-700',
  'px-2 py-1 rounded',
  'transition-colors duration-150'
])

const checkboxClasses = computed(() => [
  'h-4 w-4',
  'text-blue-600',
  'border-gray-300 dark:border-gray-600',
  'rounded',
  'focus:ring-blue-500',
  'bg-white dark:bg-gray-800'
])

// 方法
const toggleDropdown = () => {
  if (isOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

const openDropdown = () => {
  isOpen.value = true
}

const closeDropdown = () => {
  isOpen.value = false
  triggerRef.value?.focus()
}

const isColumnVisible = (columnKey: string) => {
  return props.visibleColumns.includes(columnKey)
}

const toggleColumn = (columnKey: string, event: Event) => {
  const target = event.target as HTMLInputElement
  const newVisibleColumns = [...props.visibleColumns]

  if (target.checked) {
    if (!newVisibleColumns.includes(columnKey)) {
      newVisibleColumns.push(columnKey)
    }
  } else {
    const index = newVisibleColumns.indexOf(columnKey)
    if (index > -1) {
      newVisibleColumns.splice(index, 1)
    }
  }

  emit('change', newVisibleColumns)
}

const selectAll = () => {
  const allColumnKeys = props.columns.map(col => col.key)
  emit('change', allColumnKeys)
}

const selectNone = () => {
  emit('change', [])
}

const resetToDefault = () => {
  const defaultColumns = props.columns.map(col => col.key)
  emit('change', defaultColumns)
}

// 點擊外部關閉
const handleClickOutside = (event: MouseEvent) => {
  if (isOpen.value &&
      !triggerRef.value?.contains(event.target as Node) &&
      !dropdownRef.value?.contains(event.target as Node)) {
    closeDropdown()
  }
}

// 鍵盤事件處理
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isOpen.value) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.column-selector.open .trigger {
  @apply ring-2 ring-blue-500 border-transparent;
}

/* 自定義 checkbox 樣式 */
input[type="checkbox"] {
  @apply appearance-none;
  background-image: none;
}

input[type="checkbox"]:checked {
  @apply bg-blue-600 border-blue-600;
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='m13.854 3.646-7.5 7.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6 10.293l7.146-7.147a.5.5 0 0 1 .708.708z'/%3e%3c/svg%3e");
}

input[type="checkbox"]:indeterminate {
  @apply bg-blue-600 border-blue-600;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 16 16'%3e%3cpath stroke='white' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 8h8'/%3e%3c/svg%3e");
}

/* 高對比度模式 */
@media (prefers-contrast: high) {
  .column-selector button {
    @apply border-2 border-black dark:border-white;
  }

  .column-selector.open button {
    @apply ring-4 ring-blue-600;
  }
}

/* 減少動畫模式 */
@media (prefers-reduced-motion: reduce) {
  .column-selector * {
    transition: none !important;
  }
}
</style>
