<template>
  <div class="default-card-template">
    <!-- 主要內容 -->
    <div class="card-main">
      <div class="card-header">
        <h3 class="card-title">{{ getTitle() }}</h3>
        <p v-if="getSubtitle()" class="card-subtitle">{{ getSubtitle() }}</p>
      </div>

      <div v-if="getDescription()" class="card-description">
        <p>{{ getDescription() }}</p>
      </div>
    </div>

    <!-- 側邊資訊 -->
    <div class="card-side">
      <div v-if="getStatus()" class="card-status">
        <span :class="getStatusClasses()">{{ getStatus() }}</span>
      </div>

      <div v-if="getDate()" class="card-date">
        <span class="text-xs text-gray-500 dark:text-gray-400">{{ getDate() }}</span>
      </div>

      <div v-if="getActions().length > 0" class="card-actions">
        <button
          v-for="action in getActions()"
          :key="action.key"
          type="button"
          :class="getActionClasses(action)"
          @click.stop="handleAction(action)"
        >
          <component v-if="action.icon" :is="action.icon" class="size-4" />
          <span v-if="action.label">{{ action.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface CardAction {
  key: string
  label?: string
  icon?: any
  variant?: 'primary' | 'secondary' | 'danger'
  handler: (item: any) => void
}

export interface CardTemplate {
  title?: string | ((item: any) => string)
  subtitle?: string | ((item: any) => string)
  description?: string | ((item: any) => string)
  status?: string | ((item: any) => string)
  date?: string | ((item: any) => string)
  actions?: CardAction[]
  statusColors?: {
    [key: string]: string
  }
}

export interface DefaultCardTemplateProps {
  item: any
  template?: CardTemplate
}

const props = withDefaults(defineProps<DefaultCardTemplateProps>(), {
  template: () => ({})
})

// 預設模板配置
const defaultTemplate: CardTemplate = {
  title: (item) => item.name || item.title || item.id || '未命名',
  subtitle: (item) => item.subtitle || item.category || '',
  description: (item) => item.description || item.content || '',
  status: (item) => item.status || '',
  date: (item) => {
    const date = item.date || item.createdAt || item.updatedAt
    if (date) {
      return new Date(date).toLocaleDateString('zh-TW')
    }
    return ''
  },
  actions: [],
  statusColors: {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
  }
}

// 合併模板配置
const mergedTemplate = computed(() => ({
  ...defaultTemplate,
  ...props.template,
  statusColors: {
    ...defaultTemplate.statusColors,
    ...props.template?.statusColors
  }
}))

// 方法
const getTitle = () => {
  const titleConfig = mergedTemplate.value.title
  if (typeof titleConfig === 'function') {
    return titleConfig(props.item)
  }
  return titleConfig || props.item.name || props.item.title || props.item.id || '未命名'
}

const getSubtitle = () => {
  const subtitleConfig = mergedTemplate.value.subtitle
  if (typeof subtitleConfig === 'function') {
    return subtitleConfig(props.item)
  }
  return subtitleConfig || props.item.subtitle || props.item.category || ''
}

const getDescription = () => {
  const descriptionConfig = mergedTemplate.value.description
  if (typeof descriptionConfig === 'function') {
    return descriptionConfig(props.item)
  }
  return descriptionConfig || props.item.description || props.item.content || ''
}

const getStatus = () => {
  const statusConfig = mergedTemplate.value.status
  if (typeof statusConfig === 'function') {
    return statusConfig(props.item)
  }
  return statusConfig || props.item.status || ''
}

const getDate = () => {
  const dateConfig = mergedTemplate.value.date
  if (typeof dateConfig === 'function') {
    return dateConfig(props.item)
  }

  if (dateConfig) return dateConfig

  const date = props.item.date || props.item.createdAt || props.item.updatedAt
  if (date) {
    return new Date(date).toLocaleDateString('zh-TW')
  }
  return ''
}

const getActions = (): CardAction[] => {
  return mergedTemplate.value.actions || []
}

const getStatusClasses = () => {
  const status = getStatus()
  const statusColors = mergedTemplate.value.statusColors || {}

  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  const colorClasses = statusColors[status] || statusColors.info || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'

  return `${baseClasses} ${colorClasses}`
}

const getActionClasses = (action: CardAction) => {
  const baseClasses = 'inline-flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'

  switch (action.variant) {
    case 'primary':
      return `${baseClasses} text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20`
    case 'danger':
      return `${baseClasses} text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20`
    case 'secondary':
    default:
      return `${baseClasses} text-gray-600 dark:text-gray-400`
  }
}

const handleAction = (action: CardAction) => {
  action.handler(props.item)
}
</script>

<style scoped>
.default-card-template {
  @apply flex items-center w-full gap-4;
}

.card-main {
  @apply flex-1 min-w-0;
}

.card-header {
  @apply mb-1;
}

.card-title {
  @apply text-sm font-medium text-gray-900 dark:text-gray-100 truncate;
}

.card-subtitle {
  @apply text-xs text-gray-500 dark:text-gray-400 truncate;
}

.card-description {
  @apply text-xs text-gray-600 dark:text-gray-300;
}

.card-description p {
  @apply line-clamp-2;
}

.card-side {
  @apply flex-shrink-0 flex flex-col items-end gap-2;
}

.card-status {
  @apply flex;
}

.card-date {
  @apply flex;
}

.card-actions {
  @apply flex gap-1;
}

/* 行數限制工具類 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 響應式調整 */
@media (max-width: 480px) {
  .default-card-template {
    @apply flex-col items-start gap-2;
  }

  .card-side {
    @apply flex-row items-center justify-between w-full;
  }

  .card-actions {
    @apply flex-wrap;
  }
}

/* 高對比度模式 */
@media (prefers-contrast: high) {
  .card-title {
    @apply font-bold;
  }

  .card-subtitle,
  .card-description {
    @apply font-medium;
  }
}
</style>
