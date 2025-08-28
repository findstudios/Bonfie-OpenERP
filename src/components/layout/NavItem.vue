<template>
  <router-link
    :to="to"
    :class="navItemClasses"
    @click="$emit('click')"
  >
    <!-- 圖標 -->
    <component
      v-if="icon && !isSubItem"
      :is="icon"
      :class="iconClasses"
    />

    <!-- 文字標籤 -->
    <span v-if="showLabel" :class="labelClasses">
      <slot />
    </span>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { Component } from 'vue'

interface Props {
  to: string
  icon?: Component
  isCollapsed?: boolean
  isActive?: boolean
  isSubItem?: boolean
}

interface Emits {
  (e: 'click'): void
}

const props = withDefaults(defineProps<Props>(), {
  isCollapsed: false,
  isActive: false,
  isSubItem: false
})

defineEmits<Emits>()

const route = useRoute()

// 檢查是否為當前精確路由
const isCurrentRoute = computed(() => {
  if (props.isSubItem) {
    // 對於子項目，使用精確匹配
    return route.path === props.to
  } else {
    // 對於主項目，使用 startsWith 匹配
    return route.path.startsWith(props.to)
  }
})

// 是否顯示文字標籤
const showLabel = computed(() => {
  return !props.isCollapsed || props.isSubItem
})

// 導航項目樣式
const navItemClasses = computed(() => {
  const baseClasses = 'nav-item flex items-center text-sm font-medium rounded-md transition-colors duration-200'
  const spacingClasses = props.isCollapsed && !props.isSubItem
    ? 'justify-center px-2 py-3'
    : 'px-3 py-2'

  // 使用我們自己的路由匹配邏輯而不是 props.isActive
  const stateClasses = isCurrentRoute.value
    ? 'text-white bg-gray-700'
    : 'text-gray-300 hover:bg-gray-700 hover:text-white'

  const subItemClasses = props.isSubItem
    ? 'ml-6 text-xs'
    : ''

  return `${baseClasses} ${spacingClasses} ${stateClasses} ${subItemClasses}`
})

// 圖標樣式
const iconClasses = computed(() => {
  const baseClasses = 'flex-shrink-0'
  const sizeClasses = props.isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'

  return `${baseClasses} ${sizeClasses}`
})

// 標籤樣式
const labelClasses = computed(() => {
  const baseClasses = 'truncate'

  if (props.isSubItem) {
    return `${baseClasses}`
  }

  return baseClasses
})
</script>

<style scoped>
.nav-item {
  /* 確保導航項目有足夠的觸控區域 */
  min-height: 44px;
  position: relative;
}

.nav-item:focus {
  /* 改善鍵盤導航的焦點指示 */
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

.nav-item:focus-visible {
  /* 只在鍵盤導航時顯示焦點指示 */
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

.nav-item:focus:not(:focus-visible) {
  /* 滑鼠點擊時不顯示焦點指示 */
  outline: none;
}

/* 活躍狀態指示器 */
.nav-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: transparent;
  border-radius: 0 2px 2px 0;
  transition: background-color 0.2s ease;
}

/* 當項目處於活躍狀態時顯示指示器 */
.text-white.bg-gray-700::before {
  background-color: #3B82F6;
}

/* 懸停效果優化 */
.nav-item:hover {
  transform: translateX(2px);
}

/* 收合狀態下的懸停提示 */
.nav-item[title]:hover::after {
  content: attr(title);
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: #1F2937;
  color: white;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  white-space: nowrap;
  z-index: 1000;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* 高對比度模式支援 */
@media (prefers-contrast: high) {
  .nav-item {
    border: 1px solid transparent;
  }

  .nav-item:hover,
  .nav-item:focus {
    border-color: currentColor;
  }
}

/* 減少動畫偏好設定 */
@media (prefers-reduced-motion: reduce) {
  .nav-item {
    transition: none;
    transform: none;
  }

  .nav-item:hover {
    transform: none;
  }
}
</style>
