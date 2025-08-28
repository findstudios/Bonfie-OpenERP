<template>
  <div class="filter-dropdown" :class="containerClasses">
    <div class="relative">
      <button
        ref="triggerRef"
        type="button"
        :class="triggerClasses"
        @click="toggleDropdown"
        @keydown.enter="toggleDropdown"
        @keydown.space.prevent="toggleDropdown"
        @keydown.escape="closeDropdown"
        @keydown.arrow-down.prevent="focusFirstOption"
      >
        <span class="truncate">{{ displayText }}</span>
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
          @keydown.escape="closeDropdown"
          @keydown.arrow-up.prevent="focusPreviousOption"
          @keydown.arrow-down.prevent="focusNextOption"
          @keydown.enter.prevent="selectFocusedOption"
        >
          <div class="py-1">
            <!-- 清除選項 -->
            <button
              v-if="clearable && hasValue"
              type="button"
              class="clear-option"
              :class="optionClasses"
              @click="handleClear"
            >
              <XMarkIcon class="mr-2 size-4" />
              清除篩選
            </button>

            <!-- 搜尋框（用於大量選項） -->
            <div v-if="searchable && filter.options && filter.options.length > 10" class="border-b border-gray-200 px-3 py-2 dark:border-gray-600">
              <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="text"
                placeholder="搜尋選項..."
                class="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                @keydown.stop
              />
            </div>

            <!-- 選項列表 -->
            <div class="max-h-60 overflow-y-auto">
              <button
                v-for="(option, index) in filteredOptions"
                :key="option.value"
                ref="optionRefs"
                type="button"
                :class="[
                  optionClasses,
                  {
                    'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300': isSelected(option.value),
                    'bg-gray-100 dark:bg-gray-700': focusedIndex === index
                  }
                ]"
                @click="handleSelect(option.value)"
                @mouseenter="focusedIndex = index"
              >
                <span class="flex items-center">
                  <CheckIcon
                    v-if="isSelected(option.value)"
                    class="mr-2 size-4 text-blue-600 dark:text-blue-400"
                  />
                  <span :class="{ 'ml-6': !isSelected(option.value) }">
                    {{ option.label }}
                  </span>
                </span>
              </button>

              <!-- 無選項提示 -->
              <div v-if="filteredOptions.length === 0" class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                無匹配選項
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ChevronDownIcon, CheckIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import type { TableFilter } from './types'

export interface FilterDropdownProps {
  filter: TableFilter
  value?: any
  clearable?: boolean
  searchable?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'bordered' | 'filled'
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
}

const props = withDefaults(defineProps<FilterDropdownProps>(), {
  clearable: true,
  searchable: true,
  size: 'md',
  variant: 'default',
  placement: 'bottom-start'
})

export interface FilterDropdownEmits {
  'change': [key: string, value: any]
}

const emit = defineEmits<FilterDropdownEmits>()

const triggerRef = ref<HTMLButtonElement>()
const dropdownRef = ref<HTMLDivElement>()
const searchInputRef = ref<HTMLInputElement>()
const optionRefs = ref<HTMLButtonElement[]>([])

const isOpen = ref(false)
const searchQuery = ref('')
const focusedIndex = ref(-1)

// 計算屬性
const containerClasses = computed(() => [
  'filter-dropdown',
  `size-${props.size}`,
  `variant-${props.variant}`,
  {
    'open': isOpen.value
  }
])

const triggerClasses = computed(() => [
  'inline-flex items-center justify-between',
  'w-full min-w-32',
  'px-3 border border-gray-300 dark:border-gray-600',
  'rounded-md shadow-sm',
  'bg-white dark:bg-gray-800',
  'text-gray-900 dark:text-gray-100',
  'hover:bg-gray-50 dark:hover:bg-gray-700',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  'disabled:bg-gray-50 dark:disabled:bg-gray-700',
  'disabled:text-gray-500 dark:disabled:text-gray-400',
  'disabled:cursor-not-allowed',
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
  'min-w-full',
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

const optionClasses = computed(() => [
  'w-full px-3 py-2',
  'text-left text-sm',
  'text-gray-900 dark:text-gray-100',
  'hover:bg-gray-100 dark:hover:bg-gray-700',
  'focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700',
  'transition-colors duration-150'
])

const displayText = computed(() => {
  if (!hasValue.value) {
    return props.filter.label
  }

  if (props.filter.type === 'select' && props.filter.options) {
    const option = props.filter.options.find(opt => opt.value === props.value)
    return option ? option.label : props.filter.label
  }

  return String(props.value)
})

const hasValue = computed(() => {
  return props.value !== null && props.value !== undefined && props.value !== ''
})

const filteredOptions = computed(() => {
  if (!props.filter.options) return []

  if (!searchQuery.value.trim()) {
    return props.filter.options
  }

  const query = searchQuery.value.toLowerCase().trim()
  return props.filter.options.filter(option =>
    option.label.toLowerCase().includes(query)
  )
})

// 方法
const toggleDropdown = () => {
  if (isOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

const openDropdown = async () => {
  isOpen.value = true
  focusedIndex.value = -1

  await nextTick()

  // 如果有搜尋框且選項很多，自動聚焦搜尋框
  if (props.searchable && props.filter.options && props.filter.options.length > 10) {
    searchInputRef.value?.focus()
  }
}

const closeDropdown = () => {
  isOpen.value = false
  searchQuery.value = ''
  focusedIndex.value = -1
  triggerRef.value?.focus()
}

const handleSelect = (value: any) => {
  emit('change', props.filter.key, value)
  closeDropdown()
}

const handleClear = () => {
  emit('change', props.filter.key, null)
  closeDropdown()
}

const isSelected = (value: any) => {
  return props.value === value
}

const focusFirstOption = () => {
  focusedIndex.value = 0
  focusOption(0)
}

const focusPreviousOption = () => {
  if (focusedIndex.value > 0) {
    focusedIndex.value--
    focusOption(focusedIndex.value)
  }
}

const focusNextOption = () => {
  if (focusedIndex.value < filteredOptions.value.length - 1) {
    focusedIndex.value++
    focusOption(focusedIndex.value)
  }
}

const focusOption = (index: number) => {
  nextTick(() => {
    optionRefs.value[index]?.focus()
  })
}

const selectFocusedOption = () => {
  if (focusedIndex.value >= 0 && focusedIndex.value < filteredOptions.value.length) {
    const option = filteredOptions.value[focusedIndex.value]
    handleSelect(option.value)
  }
}

// 點擊外部關閉
const handleClickOutside = (event: MouseEvent) => {
  if (isOpen.value &&
      !triggerRef.value?.contains(event.target as Node) &&
      !dropdownRef.value?.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.filter-dropdown.open .trigger {
  @apply ring-2 ring-blue-500 border-transparent;
}

/* 高對比度模式 */
@media (prefers-contrast: high) {
  .filter-dropdown button {
    @apply border-2 border-black dark:border-white;
  }

  .filter-dropdown.open button {
    @apply ring-4 ring-blue-600;
  }
}

/* 減少動畫模式 */
@media (prefers-reduced-motion: reduce) {
  .filter-dropdown * {
    transition: none !important;
  }
}
</style>
