<template>
  <div id="app" class="min-h-screen" :class="themeClasses">
    <!-- 認證初始化加載中 -->
    <div v-if="authInitState.isInitializing" class="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div class="text-center">
        <div class="mx-auto size-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
        <p class="mt-4 text-gray-600">正在初始化應用程式...</p>
      </div>
    </div>

    <!-- 認證初始化錯誤 -->
    <div v-else-if="authInitState.error" class="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div class="mx-auto max-w-md rounded-lg bg-red-50 p-6">
        <h2 class="mb-2 text-lg font-semibold text-red-800">初始化失敗</h2>
        <p class="mb-4 text-red-600">{{ authInitState.error }}</p>
        <button
          @click="window.location.reload()"
          class="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          重新載入
        </button>
      </div>
    </div>

    <!-- 主要路由視圖 -->
    <RouterView v-else />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authSupabase'
import { useResponsiveStore } from '@/stores/responsive'
import { useThemeStore } from '@/stores/theme'
import { useThemeClasses } from '@/composables/useTheme'
import { initializeAuth, getAuthInitState } from '@/utils/authInitializer'

// 初始化狀態管理
const authStore = useAuthStore()
const responsiveStore = useResponsiveStore()
const themeStore = useThemeStore()

// 認證初始化狀態
const authInitState = ref(getAuthInitState())

// 主題系統
const { themeClasses } = useThemeClasses()

// 清理函數
let themeCleanup: (() => void) | undefined

// 更新狀態的輪詢器
let statePoller: number | undefined

onMounted(async () => {
  console.log('[App] 應用程式啟動，開始初始化...')

  try {
    // 初始化響應式系統
    responsiveStore.initialize()

    // 初始化主題系統
    themeCleanup = themeStore.initialize()

    // 設置狀態輪詢（因為狀態不是響應式的）
    statePoller = window.setInterval(() => {
      authInitState.value = getAuthInitState()
    }, 100)

    // 初始化認證系統
    await initializeAuth()

    // 清除輪詢器
    if (statePoller) {
      clearInterval(statePoller)
      statePoller = undefined
    }

    // 最後更新一次狀態
    authInitState.value = getAuthInitState()

    console.log('[App] 應用程式初始化完成')
  } catch (error) {
    console.error('[App] 初始化錯誤:', error)
    // 確保狀態更新
    authInitState.value = getAuthInitState()
  }
})

onUnmounted(() => {
  // 清理主題系統監聽器
  if (themeCleanup) {
    themeCleanup()
  }

  // 清理輪詢器
  if (statePoller) {
    clearInterval(statePoller)
  }
})
</script>

<style scoped>
/* App 特定樣式 */
</style>
