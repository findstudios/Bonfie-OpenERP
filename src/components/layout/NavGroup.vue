<template>
  <div class="nav-group">
    <!-- 群組標題按鈕 -->
    <button
      :class="groupButtonClasses"
      @click="handleToggle"
      :title="isCollapsed && !isMobile ? titleText : undefined"
    >
      <!-- 圖標 -->
      <component
        v-if="icon"
        :is="icon"
        :class="iconClasses"
      />

      <!-- 標題文字 -->
      <div v-if="showTitle" class="flex flex-1 items-center justify-between">
        <span class="truncate">
          <slot name="title" />
        </span>

        <!-- 展開/收合箭頭 -->
        <svg
          :class="arrowClasses"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
    </button>

    <!-- 子項目列表 -->
    <div
      v-if="showItems"
      :class="itemsContainerClasses"
    >
      <slot name="items" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'

interface Props {
  icon?: Component
  isCollapsed: boolean
  isMobile: boolean
  isExpanded: boolean
  isActive: boolean
}

interface Emits {
  (e: 'toggle'): void
  (e: 'click'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 標題文字（用於 tooltip）
const titleText = computed(() => {
  // 這裡應該從 slot 中獲取文字，暫時使用固定值
  return '展開選單'
})

// 是否顯示標題
const showTitle = computed(() => {
  return !props.isCollapsed || props.isMobile
})

// 是否顯示子項目
const showItems = computed(() => {
  return props.isExpanded && (!props.isCollapsed || props.isMobile)
})

// 群組按鈕樣式
const groupButtonClasses = computed(() => {
  const baseClasses = 'nav-group-btn w-full flex items-center text-sm font-medium rounded-md transition-colors duration-200 relative'
  const spacingClasses = props.isCollapsed && !props.isMobile
    ? 'justify-center px-2 py-3'
    : 'justify-between px-3 py-2'

  const stateClasses = props.isActive
    ? 'text-white bg-gray-700 nav-group-active'
    : 'text-gray-300 hover:bg-gray-700 hover:text-white'

  return `${baseClasses} ${spacingClasses} ${stateClasses}`
})

// 圖標樣式
const iconClasses = computed(() => {
  const baseClasses = 'flex-shrink-0'
  const sizeClasses = props.isCollapsed && !props.isMobile ? 'w-6 h-6' : 'w-5 h-5 mr-3'

  return `${baseClasses} ${sizeClasses}`
})

// 箭頭樣式
const arrowClasses = computed(() => {
  const baseClasses = 'w-4 h-4 transition-transform duration-200'
  const rotationClasses = props.isExpanded ? 'rotate-90' : ''

  return `${baseClasses} ${rotationClasses}`
})

// 子項目容器樣式
const itemsContainerClasses = computed(() => {
  return 'nav-group-items mt-1 space-y-1'
})

// 處理點擊事件
function handleToggle() {
  // 如果是收合狀態且不是行動版，直接導航到第一個子項目
  if (props.isCollapsed && !props.isMobile) {
    emit('click')
    return
  }

  // 否則切換展開狀態
  emit('toggle')
}
</script>

<style scoped>
.nav-group-btn {
  /* 確保群組按鈕有足夠的觸控區域 */
  min-height: 44px;
  position: relative;
}

.nav-group-btn:focus {
  /* 改善鍵盤導航的焦點指示 */
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

.nav-group-btn:focus-visible {
  /* 只在鍵盤導航時顯示焦點指示 */
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

.nav-group-btn:focus:not(:focus-visible) {
  /* 滑鼠點擊時不顯示焦點指示 */
  outline: none;
}

/* 活躍狀態指示器 */
.nav-group-btn::before {
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

/* 當群組處於活躍狀態時顯示指示器 */
.nav-group-active::before {
  background-color: #3B82F6;
}

/* 懸停效果 */
.nav-group-btn:hover {
  transform: translateX(2px);
}

/* 收合狀態下的懸停提示 */
.nav-group-btn[title]:hover::after {
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

/* 子項目動畫 */
.nav-group-items {
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
}

/* 高對比度模式支援 */
@media (prefers-contrast: high) {
  .nav-group-btn {
    border: 1px solid transparent;
  }

  .nav-group-btn:hover,
  .nav-group-btn:focus {
    border-color: currentColor;
  }
}

/* 減少動畫偏好設定 */
@media (prefers-reduced-motion: reduce) {
  .nav-group-btn {
    transition: none;
    transform: none;
  }

  .nav-group-btn:hover {
    transform: none;
  }

  .nav-group-items {
    transition: none;
  }

  .rotate-90 {
    transform: none;
  }
}
</style>
