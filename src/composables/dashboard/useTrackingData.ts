import { ref } from 'vue'
import { trackingService } from '@/services/trackingService'
import type { TrackingItem } from '@/types/dashboard'

// localStorage 的 key
const STORAGE_KEY = 'dashboard_tracking_completed'
const STORAGE_DATE_KEY = 'dashboard_tracking_date'

// 全域定時器
let checkInterval: NodeJS.Timeout | null = null

export function useTrackingData() {
  // 資料狀態
  const trackingItems = ref<TrackingItem[]>([])
  const trackingLoading = ref(false)
  const error = ref<string | null>(null)

  // 完成狀態暫存（使用 localStorage 持久化）
  const completedItems = ref<Set<string>>(new Set())

  // 初始化載入暫存狀態
  function initializeStorage() {
    loadCompletedItems()

    // 設置定時檢查（每小時檢查一次是否需要清除）
    if (!checkInterval) {
      checkInterval = setInterval(() => {
        checkAndClearExpiredData()
      }, 60 * 60 * 1000) // 每小時檢查一次
    }
  }

  // 載入追蹤名單
  async function loadTrackingItems() {
    trackingLoading.value = true
    error.value = null

    // 確保暫存狀態已載入（第一次載入時初始化）
    if (!checkInterval) {
      initializeStorage()
    }

    try {
      // 載入今日追蹤項目（已包含今天缺席和今明兩天試聽）
      const items = await trackingService.getTodayTrackingItems()

      // 根據記憶體中的完成狀態更新項目
      trackingItems.value = items.map(item => ({
        ...item,
        completed: completedItems.value.has(item.id)
      }))
    } catch (err) {
      console.error('載入追蹤項目失敗:', err)
      error.value = err instanceof Error ? err.message : '載入失敗'
      trackingItems.value = []
    } finally {
      trackingLoading.value = false
    }
  }

  // 重新整理追蹤項目
  async function refreshTrackingItems() {
    await loadTrackingItems()
  }

  // 檢查並清除過期的暫存資料
  function checkAndClearExpiredData() {
    const savedDate = localStorage.getItem(STORAGE_DATE_KEY)
    const now = new Date()

    if (savedDate) {
      const saved = new Date(savedDate)

      // 建立今天早上 5 點的時間
      const todayAt5AM = new Date(now)
      todayAt5AM.setHours(5, 0, 0, 0)

      // 如果保存時間在今天早上 5 點之前，而現在已經過了早上 5 點，則清除
      const shouldClear = saved < todayAt5AM && now >= todayAt5AM

      if (shouldClear) {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(STORAGE_DATE_KEY)
        completedItems.value.clear()

        // 更新保存日期為現在
        localStorage.setItem(STORAGE_DATE_KEY, now.toISOString())
      }
    } else {
      // 如果沒有保存日期，設置為現在
      localStorage.setItem(STORAGE_DATE_KEY, now.toISOString())
    }
  }

  // 從 localStorage 載入已完成項目
  function loadCompletedItems() {
    checkAndClearExpiredData()

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const items = JSON.parse(saved) as string[]
        completedItems.value = new Set(items)
      } catch (err) {
        console.error('載入暫存狀態失敗:', err)
        completedItems.value = new Set()
      }
    }
  }

  // 保存已完成項目到 localStorage
  function saveCompletedItems() {
    const items = Array.from(completedItems.value)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }

  // 處理項目完成狀態（保存到 localStorage）
  async function handleItemComplete(id: string, completed: boolean) {
    // 更新記憶體中的完成狀態
    if (completed) {
      completedItems.value.add(id)
    } else {
      completedItems.value.delete(id)
    }

    // 保存到 localStorage
    saveCompletedItems()

    // 更新本地狀態
    const index = trackingItems.value.findIndex(item => item.id === id)
    if (index !== -1) {
      trackingItems.value[index].completed = completed
    }
  }

  // 清理函數（可以在組件卸載時調用）
  function cleanup() {
    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
    }
  }

  return {
    // 狀態
    trackingItems,
    trackingLoading,
    error,
    // 方法
    loadTrackingItems,
    refreshTrackingItems,
    handleItemComplete
  }
}
