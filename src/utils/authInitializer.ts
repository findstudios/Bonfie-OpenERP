/**
 * 認證初始化器 - 簡單的全局狀態管理
 * 避免 Vue 依賴注入問題
 */

import { useAuthStore } from '@/stores/authSupabase'
import type { Pinia } from 'pinia'

// 全局狀態
let isInitialized = false
let isInitializing = false
let initError: string | null = null
let initPromise: Promise<boolean> | null = null

/**
 * 初始化認證系統
 */
export async function initializeAuth(pinia?: Pinia): Promise<boolean> {
  console.log('[AuthInitializer] 開始初始化認證系統')

  // 如果已經初始化，直接返回
  if (isInitialized) {
    console.log('[AuthInitializer] 認證系統已初始化')
    return true
  }

  // 如果正在初始化，返回現有的 Promise
  if (isInitializing && initPromise) {
    console.log('[AuthInitializer] 認證系統正在初始化，等待完成')
    return initPromise
  }

  // 開始新的初始化
  isInitializing = true
  initError = null

  initPromise = new Promise<boolean>(async (resolve) => {
    try {
      // 獲取 authStore - 如果提供了 pinia 實例則使用它
      const authStore = pinia ? useAuthStore(pinia) : useAuthStore()

      // 初始化認證
      await authStore.initializeAuth()

      isInitialized = true
      console.log('[AuthInitializer] 認證系統初始化成功')
      resolve(true)
    } catch (error) {
      console.error('[AuthInitializer] 認證系統初始化失敗:', error)
      initError = error instanceof Error ? error.message : '認證初始化失敗'
      resolve(false)
    } finally {
      isInitializing = false
    }
  })

  return initPromise
}

/**
 * 等待認證初始化完成
 */
export async function waitForAuth(): Promise<boolean> {
  // 如果已經初始化完成，直接返回
  if (isInitialized) {
    return true
  }

  // 如果正在初始化，等待完成
  if (isInitializing && initPromise) {
    return initPromise
  }

  // 否則開始初始化
  return initializeAuth()
}

/**
 * 獲取認證初始化狀態
 */
export function getAuthInitState() {
  return {
    isInitialized,
    isInitializing,
    error: initError
  }
}

/**
 * 重置認證初始化狀態（用於測試）
 */
export function resetAuthInit() {
  isInitialized = false
  isInitializing = false
  initError = null
  initPromise = null
}
