/**
 * CRM 系統類型定義
 * 專為補習班客戶關係管理設計
 */

// 潛在客戶狀態
export enum LeadStatus {
  NEW = 'new',                    // 新客戶
  CONTACTED = 'contacted',        // 已聯絡
  INTERESTED = 'interested',      // 有興趣
  TRIAL_SCHEDULED = 'trial_scheduled',  // 已安排試聽
  TRIAL_COMPLETED = 'trial_completed',  // 已試聽
  CONVERTED = 'converted',        // 已轉換
  LOST = 'lost'                   // 流失
}

// 客戶來源
export enum LeadSource {
  WALK_IN = 'walk_in',           // 路過詢問
  REFERRAL = 'referral',         // 朋友介紹
  ONLINE = 'online',             // 網路查詢
  PHONE = 'phone',               // 電話詢問
  SOCIAL_MEDIA = 'social_media', // 社群媒體
  FLYER = 'flyer',               // 傳單廣告
  EVENT = 'event',               // 活動推廣
  OTHER = 'other'                // 其他
}

// 興趣課程類型
export enum InterestType {
  ENGLISH = 'english',           // 英語
  MATH = 'math',                 // 數學
  CHINESE = 'chinese',           // 國語
  SCIENCE = 'science',           // 自然
  SOCIAL = 'social',             // 社會
  ART = 'art',                   // 藝術
  MUSIC = 'music',               // 音樂
  OTHER = 'other'                // 其他
}

// 標籤類型
export interface Tag {
  id: number
  tag_id: string
  name: string
  color: string                  // 標籤顏色 (hex)
  description?: string
  created_at: string
  updated_at: string
}

// 潛在客戶基本資料
export interface Lead {
  id: number
  lead_id: string                // 潛在客戶編號
  full_name: string              // 學生姓名
  parent_name: string            // 聯絡人姓名
  phone: string                  // 聯絡電話
  email?: string                 // 電子郵件
  age?: number                   // 學生年齡
  school?: string                // 就讀學校
  grade?: string                 // 年級
  status: LeadStatus             // 客戶狀態
  source: LeadSource             // 客戶來源
  interest_subjects: InterestType[]  // 感興趣的課程
  budget_range?: string          // 預算範圍
  preferred_schedule?: string    // 偏好時段
  notes?: string                 // 備註
  assigned_to?: string           // 負責人員
  tags?: Tag[]                   // 標籤
  created_at: string
  updated_at: string
}

// 追蹤記錄類型
export enum FollowUpType {
  PHONE_CALL = 'phone_call',     // 電話聯絡
  MESSAGE = 'message',           // 簡訊/Line
  EMAIL = 'email',               // 電子郵件
  VISIT = 'visit',               // 到場參觀
  TRIAL_CLASS = 'trial_class',   // 試聽課程
  MEETING = 'meeting',           // 面談
  OTHER = 'other'                // 其他
}

// 追蹤結果
export enum FollowUpResult {
  POSITIVE = 'positive',         // 正面回應
  NEUTRAL = 'neutral',           // 中性回應
  NEGATIVE = 'negative',         // 負面回應
  NO_RESPONSE = 'no_response',   // 未回應
  CONVERTED = 'converted',       // 已轉換
  LOST = 'lost'                  // 已流失
}

// 追蹤記錄
export interface FollowUp {
  id: number
  follow_up_id: string
  lead_id: string                // 關聯的潛在客戶
  type: FollowUpType             // 追蹤方式
  subject: string                // 主題
  content: string                // 內容記錄
  result: FollowUpResult         // 追蹤結果
  next_follow_up?: string        // 下次跟進日期
  created_by: string             // 追蹤人員
  created_at: string
  updated_at: string
}

// 試聽課程記錄
export interface TrialClass {
  id: number
  trial_id: string
  lead_id: string                // 關聯的潛在客戶
  course_id: string              // 試聽課程
  scheduled_date: string         // 安排日期
  scheduled_time: string         // 安排時間
  teacher_id: string             // 授課老師
  classroom?: string             // 教室
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  attendance?: boolean           // 是否出席
  feedback?: string              // 試聽回饋
  rating?: number                // 滿意度評分 (1-5)
  follow_up_notes?: string       // 後續跟進記錄
  created_by: string
  created_at: string
  updated_at: string
  // 關聯對象
  lead?: {
    full_name: string
    phone?: string
  }
  course?: {
    course_name: string
  }
  teacher?: {
    full_name: string
  }
  created_by_user?: {
    full_name: string
  }
  teacher_user?: {
    full_name: string
  }
}

// 轉換記錄
export interface Conversion {
  id: number
  conversion_id: string
  lead_id: string                // 關聯的潛在客戶
  student_id: string             // 轉換後的學生ID
  course_ids: string[]           // 報名的課程
  enrollment_date: string        // 報名日期
  total_amount: number           // 總金額
  conversion_days: number        // 轉換天數（從首次接觸到報名）
  converted_by: string           // 轉換負責人
  notes?: string                 // 轉換備註
  created_at: string
  updated_at: string
}

// 移除行銷活動相關功能，專注於補習班核心業務

// CRM 儀表板統計
export interface CRMStats {
  total_leads: number            // 總潛在客戶數
  new_leads_this_month: number   // 本月新增客戶
  conversion_rate: number        // 轉換率 (%)
  average_conversion_days: number // 平均轉換天數
  trial_booking_rate: number     // 試聽預約率 (%)
  trial_show_rate: number        // 試聽出席率 (%)
  leads_by_source: Record<LeadSource, number>  // 各來源客戶數
  leads_by_status: Record<LeadStatus, number>  // 各狀態客戶數
  monthly_conversions: { month: string; count: number }[] // 月度轉換數據
}

// API 請求參數類型
export interface LeadSearchParams {
  search?: string
  status?: LeadStatus | LeadStatus[]
  source?: LeadSource | LeadSource[]
  assigned_to?: string
  date_from?: string
  date_to?: string
  age_min?: number
  age_max?: number
  school?: string
  grade?: string
  interest_subjects?: InterestType[]
  tag_ids?: string[]
  has_email?: boolean
  has_follow_up?: boolean
  sort_by?: 'created_at' | 'updated_at' | 'full_name' | 'status'
  sort_order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface FollowUpSearchParams {
  lead_id?: string
  type?: FollowUpType
  result?: FollowUpResult
  created_by?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}
