<template>
  <div
    :class="[
      'mobile-card rounded-lg border border-gray-200 bg-white p-4 shadow-sm',
      'transition-all duration-200 hover:shadow-md',
      clickable ? 'cursor-pointer hover:border-gray-300 active:bg-gray-50' : '',
      selected ? 'border-primary-300 ring-2 ring-primary-500' : '',
      disabled ? 'cursor-not-allowed opacity-50' : '',
      size === 'sm' ? 'p-3' : size === 'lg' ? 'p-6' : 'p-4'
    ]"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
    :tabindex="clickable ? 0 : -1"
    :role="clickable ? 'button' : undefined"
    :aria-pressed="clickable && selected ? 'true' : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
  >
    <!-- 卡片標題區域 -->
    <div v-if="$slots.header || title" class="card-header mb-3">
      <slot name="header">
        <div class="flex items-center justify-between">
          <h3 :class="getTitleClass()">{{ title }}</h3>
          <div v-if="$slots.headerActions" class="flex items-center space-x-2">
            <slot name="headerActions" />
          </div>
        </div>
      </slot>
    </div>

    <!-- 主要內容區域 -->
    <div class="card-content">
      <slot>
        <!-- 預設內容佈局 -->
        <div v-if="fields && fields.length > 0" class="space-y-3">
          <!-- 主要欄位 (突出顯示) -->
          <div v-for="field in primaryFields" :key="field.key" class="primary-field">
            <div class="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
              {{ field.label }}
            </div>
            <div :class="getFieldValueClass(field, true)">
              <slot :name="`field-${field.key}`" :field="field" :value="field.value">
                {{ formatFieldValue(field.value, field.type) }}
              </slot>
            </div>
          </div>

          <!-- 次要欄位 (較小字體) -->
          <div v-if="secondaryFields.length > 0" class="secondary-fields border-t border-gray-100 pt-2">
            <div class="grid grid-cols-1 gap-2">
              <div
                v-for="field in secondaryFields"
                :key="field.key"
                class="flex items-center justify-between text-sm"
              >
                <span class="font-medium text-gray-500">{{ field.label }}:</span>
                <span :class="getFieldValueClass(field)">
                  <slot :name="`field-${field.key}`" :field="field" :value="field.value">
                    {{ formatFieldValue(field.value, field.type) }}
                  </slot>
                </span>
              </div>
            </div>
          </div>
        </div>
      </slot>
    </div>

    <!-- 操作按鈕區域 -->
    <div v-if="$slots.actions || actions.length > 0" class="card-actions mt-4 border-t border-gray-100 pt-3">
      <slot name="actions">
        <div class="flex items-center justify-end space-x-2">
          <button
            v-for="action in actions"
            :key="action.key"
            :class="getActionButtonClass(action)"
            :disabled="action.disabled || disabled"
            @click.stop="handleActionClick(action)"
          >
            <component v-if="action.icon" :is="action.icon" class="mr-1 size-4" />
            {{ action.label }}
          </button>
        </div>
      </slot>
    </div>

    <!-- 狀態指示器 -->
    <div v-if="status" class="card-status absolute right-2 top-2">
      <span :class="getStatusClass()">
        {{ status.label }}
      </span>
    </div>

    <!-- 載入狀態覆蓋 -->
    <div v-if="loading" class="card-loading absolute inset-0 flex items-center justify-center rounded-lg bg-white bg-opacity-75">
      <div class="size-6 animate-spin rounded-full border-b-2 border-primary-600"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 定義介面
export interface CardField {
  key: string
  label: string
  value: any
  type?: 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'status'
  primary?: boolean
  format?: string
}

export interface CardAction {
  key: string
  label: string
  type?: 'primary' | 'secondary' | 'danger' | 'success'
  icon?: any
  disabled?: boolean
  handler?: () => void
}

export interface CardStatus {
  label: string
  type?: 'success' | 'warning' | 'error' | 'info'
}

export interface MobileCardProps {
  title?: string
  fields?: CardField[]
  actions?: CardAction[]
  status?: CardStatus
  clickable?: boolean
  selected?: boolean
  disabled?: boolean
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
}

// Props
const props = withDefaults(defineProps<MobileCardProps>(), {
  fields: () => [],
  actions: () => [],
  clickable: false,
  selected: false,
  disabled: false,
  loading: false,
  size: 'md'
})

// Emits
const emit = defineEmits<{
  click: [event: Event]
  action: [action: CardAction, event: Event]
}>()

// 計算主要欄位和次要欄位
const primaryFields = computed(() => {
  return props.fields.filter(field => field.primary)
})

const secondaryFields = computed(() => {
  return props.fields.filter(field => !field.primary)
})

// 獲取標題樣式
const getTitleClass = () => {
  const baseClass = 'font-semibold text-gray-900'
  switch (props.size) {
    case 'sm':
      return `${baseClass} text-sm`
    case 'lg':
      return `${baseClass} text-lg`
    default:
      return `${baseClass} text-base`
  }
}

// 獲取欄位值樣式
const getFieldValueClass = (field: CardField, isPrimary = false) => {
  const baseClass = isPrimary ? 'text-base font-medium' : 'text-sm'

  switch (field.type) {
    case 'number':
    case 'currency':
      return `${baseClass} text-gray-900 font-semibold`
    case 'date':
      return `${baseClass} text-gray-600`
    case 'boolean':
      return `${baseClass} font-medium`
    case 'status':
      return `${baseClass} font-medium`
    default:
      return `${baseClass} text-gray-900`
  }
}

// 獲取操作按鈕樣式
const getActionButtonClass = (action: CardAction) => {
  const baseClass = 'inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 min-h-[2.75rem] min-w-[2.75rem]'

  switch (action.type) {
    case 'primary':
      return `${baseClass} text-white bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`
    case 'danger':
      return `${baseClass} text-white bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2`
    case 'success':
      return `${baseClass} text-white bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2`
    default:
      return `${baseClass} text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`
  }
}

// 獲取狀態樣式
const getStatusClass = () => {
  const baseClass = 'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full'

  switch (props.status?.type) {
    case 'success':
      return `${baseClass} bg-green-100 text-green-800`
    case 'warning':
      return `${baseClass} bg-yellow-100 text-yellow-800`
    case 'error':
      return `${baseClass} bg-red-100 text-red-800`
    case 'info':
      return `${baseClass} bg-blue-100 text-blue-800`
    default:
      return `${baseClass} bg-gray-100 text-gray-800`
  }
}

// 格式化欄位值
const formatFieldValue = (value: any, type?: string): string => {
  if (value === null || value === undefined) return '-'

  switch (type) {
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

// 處理卡片點擊
const handleClick = (event: Event) => {
  if (props.disabled || props.loading) return
  if (props.clickable) {
    emit('click', event)
  }
}

// 處理操作按鈕點擊
const handleActionClick = (action: CardAction, event?: Event) => {
  if (props.disabled || action.disabled) return

  // 執行操作處理器
  if (action.handler) {
    action.handler()
  }

  // 發出事件
  emit('action', action, event || new Event('click'))
}
</script>

<style scoped>
/* 卡片基本樣式 */
.mobile-card {
  position: relative;
  /* 確保觸控目標足夠大 */
  min-height: 2.75rem; /* 44px */
}

/* 觸控回饋效果 */
@media (hover: none) and (pointer: coarse) {
  .mobile-card.cursor-pointer:active {
    transform: scale(0.98);
    background-color: rgb(249 250 251); /* gray-50 */
  }
}

/* 焦點樣式 */
.mobile-card:focus {
  outline: 2px solid #3b82f6; /* blue-500 */
  outline-offset: 2px;
}

/* 載入動畫 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 高對比度支援 */
@media (prefers-contrast: high) {
  .mobile-card {
    border: 2px solid currentColor;
  }

  .card-actions button {
    border: 2px solid currentColor;
  }
}

/* 減少動畫偏好 */
@media (prefers-reduced-motion: reduce) {
  .mobile-card,
  .card-actions button {
    transition: none;
  }

  .mobile-card.cursor-pointer:active {
    transform: none;
  }
}

/* 確保按鈕有足夠的觸控區域 */
.card-actions button {
  min-height: 2.75rem; /* 44px */
  min-width: 2.75rem; /* 44px */
}

/* 狀態指示器定位 */
.card-status {
  z-index: 10;
}

/* 載入覆蓋層 */
.card-loading {
  z-index: 20;
}
</style>
