/**
 * Supabase Auth 權限檢查服務
 * 使用 Supabase Auth 替代舊的 localStorage 權限檢查
 */

import { supabase } from './supabase'
import { useAuthStore } from '@/stores/authSupabase'

// 權限檢查助手（使用 Supabase Auth）
export const authPermissions = {
  /**
   * 檢查是否有特定角色權限
   */
  async checkPermission(requiredRoles: string[]): Promise<void> {
    // 優先使用 auth store 中的用戶資料
    const authStore = useAuthStore()

    if (authStore.isAuthenticated && authStore.user) {
      const userRole = authStore.user.role?.role_code
      if (!userRole || !requiredRoles.includes(userRole)) {
        throw new Error(`需要以下角色之一: ${requiredRoles.join(', ')}`)
      }
      return
    }

    // 如果 store 中沒有資料，檢查 session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('用戶未登入')
    }

    // 由於 RLS 會在資料庫層級處理權限，這裡只做基本檢查
  },

  /**
   * 檢查是否有讀取權限
   * 注意：由於 RLS 已經在資料庫層級控制權限，這裡的檢查主要是為了提供更好的錯誤訊息
   */
  async checkReadPermission(table: string): Promise<void> {
    // 優先使用 auth store
    const authStore = useAuthStore()

    if (authStore.isAuthenticated) {
      // 已登入，RLS 會處理具體權限
      return
    }

    // 檢查 session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('用戶未登入')
    }

    // 特定表格的額外檢查（可選）
    // 由於 RLS 會處理權限，這裡只做基本檢查
  },

  /**
   * 檢查是否有寫入權限
   */
  async checkWritePermission(table: string, operation: 'create' | 'update' | 'delete'): Promise<void> {
    // 優先使用 auth store
    const authStore = useAuthStore()

    if (authStore.isAuthenticated) {
      // 已登入，RLS 會處理具體權限
      return
    }

    // 檢查 session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('用戶未登入')
    }
  }
}
