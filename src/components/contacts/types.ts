/**
 * 聯絡人管理組件相關類型定義
 */

/**
 * 聯絡人表單資料
 */
export interface ContactFormData {
  contact_id?: string
  full_name: string
  phone: string
  email?: string
  address?: string
  relationship: '父親' | '母親' | '監護人' | '本人'
  is_primary: boolean
  is_emergency: boolean
  is_billing: boolean
  notes?: string
  student_contact_id?: number
}

/**
 * 聯絡人更新結果
 */
export interface ContactUpdateResult {
  added: number
  updated: number
  deleted: number
  errors: string[]
}

// 組件特定的類型定義

/**
 * 聯絡人表單驗證結果
 */
export interface ContactValidationResult {
  isValid: boolean
  errors: Record<string, string[]>  // 以欄位名稱為 key 的錯誤訊息
  globalErrors: string[]            // 全域錯誤訊息
}

/**
 * 聯絡人操作類型
 */
export type ContactOperation = 'add' | 'update' | 'delete' | 'view'

/**
 * 聯絡人表單狀態
 */
export interface ContactFormState {
  loading: boolean
  saving: boolean
  errors: Record<string, string[]>
  isDirty: boolean
}

/**
 * 聯絡人管理器設定
 */
export interface ContactManagerConfig {
  maxContacts: number
  allowDuplicatePhones: boolean
  requiredFields: Array<keyof ContactFormData>
  defaultRelationship: ContactFormData['relationship']
  autoSave: boolean
  autoSaveDelay: number  // 毫秒
}

/**
 * 聯絡人顯示模式
 */
export type ContactDisplayMode = 'form' | 'card' | 'list' | 'table'

/**
 * 聯絡人排序選項
 */
export interface ContactSortOption {
  field: keyof ContactFormData
  direction: 'asc' | 'desc'
  label: string
}

/**
 * 聯絡人篩選選項
 */
export interface ContactFilterOption {
  relationship?: ContactFormData['relationship'][]
  isPrimary?: boolean
  isEmergency?: boolean
  isBilling?: boolean
  hasEmail?: boolean
  hasAddress?: boolean
}

/**
 * 聯絡人匯出選項
 */
export interface ContactExportOption {
  format: 'csv' | 'excel' | 'json'
  fields: Array<keyof ContactFormData>
  includeStudentInfo: boolean
}

/**
 * 聯絡人 UI 事件
 */
export interface ContactUIEvents {
  'contact-add': ContactFormData
  'contact-update': { index: number; contact: ContactFormData }
  'contact-delete': { index: number; contact: ContactFormData }
  'contact-select': { index: number; contact: ContactFormData }
  'contacts-reorder': ContactFormData[]
  'validation-change': ContactValidationResult
  'dirty-change': boolean
}

/**
 * 預設設定
 */
export const DEFAULT_CONTACT_CONFIG: ContactManagerConfig = {
  maxContacts: 10,
  allowDuplicatePhones: false,
  requiredFields: ['full_name', 'phone'],
  defaultRelationship: '父親',
  autoSave: false,
  autoSaveDelay: 2000
}

/**
 * 關係選項
 */
export const RELATIONSHIP_OPTIONS: Array<{
  value: ContactFormData['relationship']
  label: string
  icon?: string
}> = [
  { value: '父親', label: '父親', icon: '👨‍💼' },
  { value: '母親', label: '母親', icon: '👩‍💼' },
  { value: '監護人', label: '監護人', icon: '👥' },
  { value: '本人', label: '本人', icon: '👤' }
]

/**
 * 聯絡人類型標籤
 */
export const CONTACT_TYPE_LABELS = {
  is_primary: '主要聯絡人',
  is_emergency: '緊急聯絡人',
  is_billing: '帳務聯絡人'
} as const

/**
 * 聯絡人欄位標籤
 */
export const CONTACT_FIELD_LABELS = {
  full_name: '姓名',
  phone: '電話',
  email: '電子郵件',
  address: '地址',
  relationship: '關係',
  notes: '備註'
} as const
