import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'

// 系統設定狀態
const systemSettings = ref({
  basic: {
    name: 'OpenERP管理系統',
    tax_id: '',
    address: '',
    phone: '',
    email: '',
    director: '',
    business_hours: '',
    logo_url: ''
  }
})

const isLoading = ref(false)
const error = ref<string | null>(null)

/**
 * 載入系統基本設定
 */
async function loadBasicSettings() {
  if (isLoading.value) return

  isLoading.value = true
  error.value = null

  try {
    const { data, error: dbError } = await supabase
      .from('tutoring_center_settings')
      .select('setting_value')
      .eq('setting_key', 'basic_info')
      .single()

    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 means no rows found
      throw dbError
    }

    if (data?.setting_value) {
      const basicInfo = data.setting_value as any
      systemSettings.value.basic = {
        name: basicInfo.name || 'OpenERP管理系統',
        tax_id: basicInfo.tax_id || '',
        address: basicInfo.address || '',
        phone: basicInfo.phone || '',
        email: basicInfo.email || '',
        director: basicInfo.director || '',
        business_hours: basicInfo.business_hours || '',
        logo_url: basicInfo.logo_url || ''
      }
    }
  } catch (err) {
    console.error('載入系統設定失敗:', err)
    error.value = err instanceof Error ? err.message : '載入系統設定失敗'
  } finally {
    isLoading.value = false
  }
}

/**
 * 獲取系統LOGO URL
 */
const logoUrl = computed(() => systemSettings.value.basic.logo_url)

/**
 * 獲取系統名稱
 */
const systemName = computed(() => systemSettings.value.basic.name)

/**
 * 獲取完整的基本資訊
 */
const basicInfo = computed(() => systemSettings.value.basic)

export function useSystemSettings() {
  return {
    systemSettings: systemSettings.value,
    isLoading,
    error,
    logoUrl,
    systemName,
    basicInfo,
    loadBasicSettings
  }
}
