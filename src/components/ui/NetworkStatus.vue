<template>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="transform translate-y-[-100%]"
    enter-to-class="transform translate-y-0"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="transform translate-y-0"
    leave-to-class="transform translate-y-[-100%]"
  >
    <div
      v-if="showStatus"
      :class="[
        'fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium',
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
      ]"
    >
      <div class="flex items-center justify-center gap-2">
        <svg
          v-if="!isOnline"
          class="size-4 animate-pulse"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
          />
        </svg>
        <svg
          v-else
          class="size-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span>
          {{ statusMessage }}
        </span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { networkMonitor } from '@/utils/networkRetry'

// 狀態
const isOnline = ref(navigator.onLine)
const showStatus = ref(false)
const hideTimer = ref<NodeJS.Timeout | null>(null)

// 計算屬性
const statusMessage = computed(() => {
  return isOnline.value
    ? '網路連線已恢復'
    : '網路連線中斷，部分功能可能無法使用'
})

// 顯示狀態訊息
function showStatusMessage() {
  showStatus.value = true
  
  // 如果是恢復連線，3秒後自動隱藏
  if (isOnline.value) {
    if (hideTimer.value) {
      clearTimeout(hideTimer.value)
    }
    
    hideTimer.value = setTimeout(() => {
      showStatus.value = false
      hideTimer.value = null
    }, 3000)
  }
}

// 處理網路狀態變化
function handleNetworkChange(online: boolean) {
  const wasOffline = !isOnline.value
  isOnline.value = online
  
  // 只在狀態真正改變時顯示訊息
  if (wasOffline && online) {
    // 從離線變為在線
    showStatusMessage()
  } else if (!online) {
    // 變為離線
    showStatusMessage()
  }
}

// 生命週期
onMounted(() => {
  // 啟動網路監控
  networkMonitor.start()
  
  // 註冊狀態變化監聽器
  const unsubscribe = networkMonitor.onStatusChange(handleNetworkChange)
  
  // 保存取消訂閱函數
  ;(window as any).__networkStatusUnsubscribe = unsubscribe
  
  // 初始檢查
  if (!navigator.onLine) {
    isOnline.value = false
    showStatusMessage()
  }
})

onUnmounted(() => {
  // 清理計時器
  if (hideTimer.value) {
    clearTimeout(hideTimer.value)
  }
  
  // 取消訂閱
  const unsubscribe = (window as any).__networkStatusUnsubscribe
  if (unsubscribe) {
    unsubscribe()
    delete (window as any).__networkStatusUnsubscribe
  }
})
</script>