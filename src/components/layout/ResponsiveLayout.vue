<template>
  <div class="responsive-layout min-h-screen" style="background-color: var(--color-bg-secondary)">
    <!-- 行動版頂部導航 -->
    <MobileTopBar
      v-if="isMobile"
      @toggle-sidebar="toggleMobileSidebar"
      :title="pageTitle"
      :user="user"
      @logout="handleLogout"
    />

    <!-- 側邊欄 -->
    <ResponsiveSidebar
      :is-mobile="isMobile"
      :is-tablet="isTablet"
      :is-desktop="isDesktop"
      :is-open="sidebarOpen"
      :is-collapsed="sidebarCollapsed"
      @close="closeSidebar"
      @toggle-collapse="toggleSidebarCollapse"
    />

    <!-- 主要內容 -->
    <main :class="mainContentClasses">
      <!-- 桌面版頂部導航 -->
      <DesktopTopBar
        v-if="!isMobile"
        :is-collapsed="sidebarCollapsed"
        :page-title="pageTitle"
        :user="user"
        @toggle-sidebar="toggleSidebarCollapse"
        @logout="handleLogout"
      />

      <!-- 頁面內容 -->
      <div :class="contentPaddingClasses">
        <slot />
      </div>
    </main>

    <!-- 行動版遮罩 -->
    <div
      v-if="isMobile && sidebarOpen"
      class="fixed inset-0 z-30 bg-black bg-opacity-50"
      @click="closeSidebar"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authSupabase'
import { useResponsive } from '@/composables/useResponsive'
import MobileTopBar from './MobileTopBar.vue'
import ResponsiveSidebar from './ResponsiveSidebar.vue'
import DesktopTopBar from './DesktopTopBar.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 響應式系統
const {
  isMobile,
  isTablet,
  isDesktop,
  sidebarOpen,
  sidebarCollapsed,
  toggleSidebar,
  closeSidebar,
  toggleSidebarCollapse
} = useResponsive()

const user = computed(() => authStore.user)

const pageTitle = computed(() => {
  try {
    return route.meta?.title || 'OpenERP管理系統'
  } catch (error) {
    console.warn('Error accessing route.meta.title:', error)
    return 'OpenERP管理系統'
  }
})

// 主要內容區域樣式
const mainContentClasses = computed(() => {
  const baseClasses = 'min-h-screen transition-all duration-300 ease-in-out'

  if (isMobile.value) {
    return `${baseClasses} ml-0`
  } else if (isTablet.value) {
    return `${baseClasses} ${sidebarCollapsed.value ? 'ml-16' : 'ml-64'}`
  } else {
    return `${baseClasses} ${sidebarCollapsed.value ? 'ml-16' : 'ml-64'}`
  }
})

// 內容區域內邊距
const contentPaddingClasses = computed(() => {
  if (isMobile.value) {
    return 'p-4'
  } else if (isTablet.value) {
    return 'p-6'
  } else {
    return 'p-8'
  }
})

// 行動版側邊欄切換
function toggleMobileSidebar() {
  toggleSidebar()
}

// 登出處理
async function handleLogout() {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('登出失敗:', error)
  }
}
</script>

<style scoped>
.responsive-layout {
  /* 確保佈局容器佔滿整個視窗 */
  min-height: 100vh;
}

/* 過渡動畫優化 */
.transition-all {
  transition-property: margin-left, width, transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* 確保在低端裝置上也有流暢的動畫 */
@media (prefers-reduced-motion: reduce) {
  .transition-all {
    transition: none;
  }
}
</style>
