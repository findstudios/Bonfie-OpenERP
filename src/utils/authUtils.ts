/**
 * 認證和權限工具函數
 */

import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/authSupabase'

/**
 * 檢查用戶是否有管理員權限
 */
export async function checkAdminPermission(): Promise<{ hasPermission: boolean; error?: string }> {
  try {
    // 檢查Session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return { hasPermission: false, error: '用戶未登入或Session已過期' }
    }

    // 檢查用戶資訊
    const authStore = useAuthStore()
    if (!authStore.user?.user_id) {
      return { hasPermission: false, error: '無法獲取用戶資訊' }
    }

    // 檢查用戶角色
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        user_id,
        role_id,
        roles:role_id (
          role_code,
          role_name
        )
      `)
      .eq('user_id', authStore.user.user_id)
      .single()

    if (userError) {
      console.error('檢查用戶權限失敗:', userError)
      return { hasPermission: false, error: '檢查用戶權限失敗' }
    }

    const isAdmin = userData?.roles?.role_code === 'ADMIN'

    console.log('用戶權限檢查結果:', {
      user_id: userData.user_id,
      role_code: userData?.roles?.role_code,
      role_name: userData?.roles?.role_name,
      isAdmin
    })

    return {
      hasPermission: isAdmin,
      error: isAdmin ? undefined : '權限不足：只有管理員可以修改系統設定'
    }
  } catch (error) {
    console.error('權限檢查異常:', error)
    return { hasPermission: false, error: '權限檢查失敗' }
  }
}

/**
 * 獲取當前用戶的詳細資訊
 */
export async function getCurrentUserInfo() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const authStore = useAuthStore()

    return {
      session,
      auth_uid: session?.user?.id,
      store_user_id: authStore.user?.user_id,
      store_user: authStore.user
    }
  } catch (error) {
    console.error('獲取用戶資訊失敗:', error)
    return null
  }
}

/**
 * 強制重新載入用戶權限
 */
export async function refreshUserPermissions() {
  try {
    const authStore = useAuthStore()
    await authStore.checkAuth()
    return true
  } catch (error) {
    console.error('重新載入權限失敗:', error)
    return false
  }
}
