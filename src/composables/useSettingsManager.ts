import { ref, Ref } from 'vue'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/authSupabase'
import { checkAdminPermission, getCurrentUserInfo } from '@/utils/authUtils'

export interface SettingConfig<T> {
  key: string
  defaultValue: T
  description?: string
  transform?: (value: any) => T
}

export function useSettingsManager<T extends Record<string, any>>() {
  const authStore = useAuthStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  const loadSetting = async <K extends keyof T>(
    config: SettingConfig<T[K]>
  ): Promise<T[K]> => {
    try {
      const { data, error: dbError } = await supabase
        .from('tutoring_center_settings')
        .select('setting_value')
        .eq('setting_key', config.key)
        .single()

      if (dbError && dbError.code !== 'PGRST116') {
        throw dbError
      }

      if (data?.setting_value) {
        return config.transform
          ? config.transform(data.setting_value)
          : data.setting_value as T[K]
      }

      return config.defaultValue
    } catch (err) {
      console.error(`載入設定失敗 [${config.key}]:`, err)
      error.value = `載入設定失敗: ${config.key}`
      return config.defaultValue
    }
  }

  const saveSetting = async <K extends keyof T>(
    config: SettingConfig<T[K]>,
    value: T[K]
  ): Promise<void> => {
    try {
      // 檢查用戶認證狀態
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('用戶未登入或Session已過期，請重新登入')
      }

      // 檢查用戶權限
      if (!authStore.user?.user_id) {
        throw new Error('無法獲取用戶資訊，請重新登入')
      }

      // 獲取詳細的用戶資訊用於診斷
      const userInfo = await getCurrentUserInfo()
      console.log('正在儲存設定:', {
        key: config.key,
        user_id: authStore.user.user_id,
        session_valid: !!session,
        auth_uid: userInfo?.auth_uid,
        user_info: userInfo
      })

      const { error: dbError } = await supabase
        .from('tutoring_center_settings')
        .upsert({
          setting_key: config.key,
          setting_value: value,
          description: config.description || '',
          updated_by: authStore.user?.user_id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key',
          ignoreDuplicates: false
        })

      if (dbError) {
        console.error('數據庫錯誤詳情:', {
          code: dbError.code,
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint
        })
        throw dbError
      }

      console.log(`設定 [${config.key}] 儲存成功`)
    } catch (err: any) {
      console.error(`儲存設定失敗 [${config.key}]:`, err)

      // 提供更友善的錯誤訊息
      if (err.code === '42501' || err.message?.includes('policy')) {
        error.value = '權限不足：只有管理員可以修改系統設定'
      } else if (err.code === 'PGRST301' || err.message?.includes('401')) {
        error.value = '登入已過期，請重新登入'
      } else {
        error.value = `儲存設定失敗: ${err.message || config.key}`
      }

      throw err
    }
  }

  const loadAllSettings = async (
    configs: Record<keyof T, SettingConfig<T[keyof T]>>
  ): Promise<T> => {
    loading.value = true
    error.value = null

    try {
      const results = {} as T

      for (const [key, config] of Object.entries(configs)) {
        results[key as keyof T] = await loadSetting(config as SettingConfig<T[keyof T]>)
      }

      return results
    } finally {
      loading.value = false
    }
  }

  const saveAllSettings = async (
    configs: Record<keyof T, SettingConfig<T[keyof T]>>,
    values: T
  ): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      for (const [key, config] of Object.entries(configs)) {
        await saveSetting(
          config as SettingConfig<T[keyof T]>,
          values[key as keyof T]
        )
      }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    loadSetting,
    saveSetting,
    loadAllSettings,
    saveAllSettings
  }
}
