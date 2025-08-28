<template>
  <div class="search-input-container" :class="containerClasses">
    <div class="relative">
      <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <MagnifyingGlassIcon class="size-5 text-gray-400" />
      </div>
      <input
        ref="inputRef"
        v-model="localValue"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="inputClasses"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown.enter="handleEnter"
        @keydown.escape="handleEscape"
      />
      <div v-if="showClearButton" class="absolute inset-y-0 right-0 flex items-center pr-3">
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 focus:text-gray-600 focus:outline-none"
          @click="handleClear"
        >
          <XMarkIcon class="size-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/24/outline'

export interface SearchInputProps {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  debounce?: number
  clearable?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'bordered' | 'filled'
}

const props = withDefaults(defineProps<SearchInputProps>(), {
  modelValue: '',
  placeholder: '搜尋...',
  disabled: false,
  debounce: 300,
  clearable: true,
  size: 'md',
  variant: 'default'
})

export interface SearchInputEmits {
  'update:modelValue': [value: string]
  'search': [value: string]
  'focus': [event: FocusEvent]
  'blur': [event: FocusEvent]
  'clear': []
}

const emit = defineEmits<SearchInputEmits>()

const inputRef = ref<HTMLInputElement>()
const localValue = ref(props.modelValue)
const isFocused = ref(false)
let debounceTimer: NodeJS.Timeout | null = null

// 防抖搜尋
const debouncedSearch = (value: string) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    emit('search', value)
  }, props.debounce)
}

// 計算屬性
const containerClasses = computed(() => [
  'search-input-container',
  `size-${props.size}`,
  `variant-${props.variant}`,
  {
    'focused': isFocused.value,
    'disabled': props.disabled
  }
])

const inputClasses = computed(() => [
  'block w-full pl-10',
  'border border-gray-300 dark:border-gray-600',
  'rounded-md',
  'bg-white dark:bg-gray-800',
  'text-gray-900 dark:text-gray-100',
  'placeholder-gray-500 dark:placeholder-gray-400',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  'disabled:bg-gray-50 dark:disabled:bg-gray-700',
  'disabled:text-gray-500 dark:disabled:text-gray-400',
  'disabled:cursor-not-allowed',
  'transition-colors duration-200',
  // 尺寸樣式
  {
    'py-1.5 text-sm pr-10': props.size === 'sm',
    'py-2 text-base pr-10': props.size === 'md',
    'py-3 text-lg pr-10': props.size === 'lg'
  },
  // 變體樣式
  {
    'border-gray-300 dark:border-gray-600': props.variant === 'default',
    'border-2 border-gray-400 dark:border-gray-500': props.variant === 'bordered',
    'bg-gray-50 dark:bg-gray-700 border-transparent': props.variant === 'filled'
  }
])

const showClearButton = computed(() => {
  return props.clearable && localValue.value.length > 0 && !props.disabled
})

// 事件處理
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  localValue.value = target.value
  emit('update:modelValue', target.value)
  debouncedSearch(target.value)
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

const handleEnter = () => {
  emit('search', localValue.value)
}

const handleEscape = () => {
  if (localValue.value) {
    handleClear()
  } else {
    inputRef.value?.blur()
  }
}

const handleClear = () => {
  localValue.value = ''
  emit('update:modelValue', '')
  emit('search', '')
  emit('clear')
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// 監聽外部值變化
watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue
})

// 公開方法
const focus = () => {
  inputRef.value?.focus()
}

const blur = () => {
  inputRef.value?.blur()
}

const clear = () => {
  handleClear()
}

defineExpose({
  focus,
  blur,
  clear
})
</script>

<style scoped>
.search-input-container.focused input {
  @apply ring-2 ring-blue-500 border-transparent;
}

.search-input-container.disabled {
  @apply opacity-60;
}

/* 高對比度模式 */
@media (prefers-contrast: high) {
  .search-input-container input {
    @apply border-2 border-black dark:border-white;
  }

  .search-input-container.focused input {
    @apply ring-4 ring-blue-600;
  }
}

/* 減少動畫模式 */
@media (prefers-reduced-motion: reduce) {
  .search-input-container input {
    transition: none;
  }
}
</style>
