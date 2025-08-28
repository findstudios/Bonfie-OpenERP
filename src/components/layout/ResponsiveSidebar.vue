<template>
  <aside :class="sidebarClasses">
    <!-- 側邊欄標題區域 -->
    <div class="sidebar-header">
      <div class="flex h-16 items-center justify-between bg-gray-900 px-4">
        <!-- 標題（展開時顯示） -->
        <h1 v-if="showTitle" class="truncate text-xl font-bold text-white">
          {{ systemName }}
        </h1>

        <!-- Logo（收合時顯示） -->
        <div v-else class="flex w-full items-center justify-center">
          <div class="flex size-8 items-center justify-center overflow-hidden rounded-full bg-white">
            <img
              v-if="logoUrl"
              :src="logoUrl"
              :alt="systemName"
              class="size-full object-contain"
            />
            <svg v-else class="size-6 text-gray-600" viewBox="0 0 24 24">
              <!-- 預設圓形背景 -->
              <circle cx="12" cy="12" r="10" fill="#4F46E5" />
              <!-- 預設LOGO文字 -->
              <text x="12" y="13.5" font-size="5" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial, sans-serif">
                LOGO
              </text>
            </svg>
          </div>
        </div>

        <!-- 關閉按鈕（行動版） -->
        <button
          v-if="isMobile"
          @click="$emit('close')"
          class="close-btn rounded-md p-2 text-gray-300 touch-target hover:bg-gray-700 hover:text-white"
          aria-label="關閉選單"
        >
          <svg class="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 導航選單 -->
    <nav class="sidebar-nav mt-8 flex-1 overflow-y-auto">
      <NavigationMenu
        :is-collapsed="isCollapsed && !isMobile"
        :is-mobile="isMobile"
        @item-click="handleNavItemClick"
        @expand-sidebar="handleExpandSidebar"
      />
    </nav>

    <!-- 底部區域（可選） -->
    <div v-if="showFooter" class="sidebar-footer border-t border-gray-700 p-4">
      <div class="text-center text-xs text-gray-400">
        版本 1.0.0
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import NavigationMenu from './NavigationMenu.vue'
import { useSystemSettings } from '@/composables/useSystemSettings'

interface Props {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isOpen: boolean
  isCollapsed: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'toggle-collapse'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 系統設定
const { logoUrl, systemName, loadBasicSettings } = useSystemSettings()

// 側邊欄樣式計算
const sidebarClasses = computed(() => {
  const baseClasses = 'sidebar bg-gray-800 overflow-hidden transition-all duration-300 ease-in-out flex flex-col'

  if (props.isMobile) {
    // 行動版：全螢幕覆蓋式側邊欄
    return `${baseClasses} fixed inset-y-0 left-0 z-40 w-64 ${
      props.isOpen ? 'translate-x-0' : '-translate-x-full'
    }`
  } else {
    // 桌面版和平板版：固定側邊欄
    const width = props.isCollapsed ? 'w-16' : 'w-64'
    return `${baseClasses} fixed inset-y-0 left-0 z-40 ${width}`
  }
})

// 是否顯示標題
const showTitle = computed(() => {
  return props.isMobile || !props.isCollapsed
})

// 是否顯示底部資訊
const showFooter = computed(() => {
  return !props.isCollapsed || props.isMobile
})

// 處理導航項目點擊
function handleNavItemClick() {
  // 在行動版點擊導航項目後關閉側邊欄
  if (props.isMobile) {
    emit('close')
  }
}

// 處理展開側邊欄
function handleExpandSidebar() {
  if (props.isCollapsed && !props.isMobile) {
    emit('toggle-collapse')
  }
}

// 初始化載入系統設定
onMounted(() => {
  loadBasicSettings()
})
</script>

<style scoped>
.sidebar {
  /* 確保側邊欄在所有瀏覽器中都能正確顯示 */
  min-height: 100vh;
  max-height: 100vh;
}

.sidebar-nav {
  /* 確保導航區域可以滾動 */
  scrollbar-width: thin;
  scrollbar-color: #4B5563 #374151;
}

.sidebar-nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: #374151;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: #4B5563;
  border-radius: 3px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: #6B7280;
}

.close-btn {
  /* 確保關閉按鈕有足夠的觸控區域 */
  min-width: 44px;
  min-height: 44px;
}

.touch-target {
  /* 確保觸控目標符合可訪問性標準 */
  min-width: 44px;
  min-height: 44px;
}

/* 動畫優化 */
.transition-all {
  transition-property: transform, width, margin;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* 減少動畫偏好設定 */
@media (prefers-reduced-motion: reduce) {
  .transition-all {
    transition: none;
  }
}

/* 高對比度模式支援 */
@media (prefers-contrast: high) {
  .sidebar {
    border-right: 2px solid currentColor;
  }
}
</style>
