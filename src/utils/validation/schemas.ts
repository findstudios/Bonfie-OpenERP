/**
 * 輸入驗證 Schema 定義
 * 使用 Zod 進行類型安全的驗證
 */

import { z } from 'zod'

// ============================================================================
// 基礎驗證規則
// ============================================================================

// 電話號碼驗證（台灣格式）
export const phoneSchema = z.string()
  .regex(/^(\+886-?|0)?9\d{2}-?\d{3}-?\d{3}$/, '請輸入有效的台灣手機號碼')
  .transform(val => val.replace(/[^\d+]/g, ''))

// Email 驗證
export const emailSchema = z.string()
  .email('請輸入有效的電子郵件地址')
  .max(255, 'Email 不能超過 255 個字元')

// 姓名驗證
export const nameSchema = z.string()
  .min(1, '姓名不能為空')
  .max(50, '姓名不能超過 50 個字元')
  .regex(/^[\u4e00-\u9fa5a-zA-Z\s]+$/, '姓名只能包含中文、英文和空格')

// 英文姓名驗證
export const englishNameSchema = z.string()
  .regex(/^[a-zA-Z\s]+$/, '英文姓名只能包含英文字母和空格')
  .max(50, '英文姓名不能超過 50 個字元')
  .optional()

// 地址驗證
export const addressSchema = z.string()
  .max(200, '地址不能超過 200 個字元')
  .optional()

// 備註驗證
export const notesSchema = z.string()
  .max(1000, '備註不能超過 1000 個字元')
  .optional()

// 金額驗證
export const amountSchema = z.number()
  .min(0, '金額不能為負數')
  .max(9999999, '金額不能超過 9,999,999')
  .multipleOf(0.01, '金額最多兩位小數')

// 整數驗證
export const positiveIntSchema = z.number()
  .int('必須是整數')
  .positive('必須是正數')

// 日期驗證
export const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必須是 YYYY-MM-DD')
  .refine(val => {
    const date = new Date(val)
    return !isNaN(date.getTime())
  }, '請輸入有效的日期')

// 時間驗證
export const timeSchema = z.string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, '時間格式必須是 HH:MM')

// 密碼驗證
export const passwordSchema = z.string()
  .min(8, '密碼至少需要 8 個字元')
  .max(72, '密碼不能超過 72 個字元')
  .regex(/[A-Z]/, '密碼必須包含至少一個大寫字母')
  .regex(/[a-z]/, '密碼必須包含至少一個小寫字母')
  .regex(/[0-9]/, '密碼必須包含至少一個數字')
  .regex(/[^A-Za-z0-9]/, '密碼必須包含至少一個特殊字元')

// ID 驗證（防止 SQL 注入）
export const idSchema = z.string()
  .regex(/^[A-Z0-9_-]+$/i, 'ID 格式無效')
  .max(50, 'ID 不能超過 50 個字元')

// 搜尋關鍵字驗證
export const searchQuerySchema = z.string()
  .max(100, '搜尋關鍵字不能超過 100 個字元')
  .transform(val => val.trim())

// ============================================================================
// 業務實體 Schema
// ============================================================================

// 聯絡人 Schema
export const contactSchema = z.object({
  contact_id: idSchema.optional(),
  full_name: nameSchema,
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  address: addressSchema,
  notes: notesSchema,
  is_active: z.boolean().default(true)
})

// 學生 Schema
export const studentSchema = z.object({
  student_id: idSchema.optional(),
  chinese_name: nameSchema,
  english_name: englishNameSchema,
  birth_date: dateSchema.optional(),
  notes: notesSchema,
  is_active: z.boolean().default(true)
})

// 課程 Schema
export const courseSchema = z.object({
  course_id: idSchema.optional(),
  course_name: z.string()
    .min(1, '課程名稱不能為空')
    .max(100, '課程名稱不能超過 100 個字元'),
  instructor_id: idSchema,
  course_type: z.enum(['regular', 'theme']).default('regular'),
  category: z.string().max(50).optional(),
  total_sessions: positiveIntSchema,
  price_per_session: amountSchema.optional(),
  max_students: positiveIntSchema.default(10),
  status: z.enum(['planning', 'active', 'completed', 'cancelled']).default('planning'),
  description: z.string().max(500).optional(),
  duration_weeks: positiveIntSchema.optional(),
  start_date: dateSchema.optional(),
  end_date: dateSchema.optional(),
  allow_package_purchase: z.boolean().default(false),
  default_validity_days: positiveIntSchema.default(180)
})

// 訂單 Schema
export const orderSchema = z.object({
  order_id: idSchema.optional(),
  student_id: idSchema,
  contact_id: idSchema,
  item_type: z.enum(['enrollment', 'package', 'other']).default('enrollment'),
  original_amount: amountSchema,
  discount_amount: amountSchema.default(0),
  final_amount: amountSchema,
  status: z.enum(['pending', 'paid', 'cancelled']).default('pending'),
  discount_reason: z.string().max(200).optional(),
  created_by: idSchema.optional()
})

// 付款 Schema
export const paymentSchema = z.object({
  payment_id: idSchema.optional(),
  order_id: idSchema,
  amount_paid: amountSchema,
  payment_method: z.enum(['cash', 'card', 'transfer', 'other']).default('cash'),
  payment_date: dateSchema,
  receipt_number: z.string().max(50).optional(),
  notes: notesSchema,
  created_by: idSchema.optional()
})

// 使用者 Schema
export const userSchema = z.object({
  user_id: idSchema.optional(),
  username: z.string()
    .min(3, '使用者名稱至少需要 3 個字元')
    .max(30, '使用者名稱不能超過 30 個字元')
    .regex(/^[a-zA-Z0-9_]+$/, '使用者名稱只能包含字母、數字和底線'),
  password: passwordSchema.optional(),
  full_name: nameSchema,
  role_id: positiveIntSchema,
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  avatar_url: z.string().url().optional().nullable()
})

// Lead（潛在客戶）Schema
export const leadSchema = z.object({
  lead_id: idSchema.optional(),
  full_name: nameSchema,
  parent_name: nameSchema.optional(),
  phone: phoneSchema,
  email: emailSchema.optional(),
  age: z.number().min(3).max(100).optional(),
  school: z.string().max(100).optional(),
  grade: z.string().max(50).optional(),
  status: z.enum(['new', 'contacted', 'interested', 'trial_scheduled', 'trial_completed', 'converted', 'lost']).default('new'),
  source: z.enum(['walk_in', 'referral', 'online', 'phone', 'social_media', 'flyer', 'event', 'other']),
  interest_subjects: z.array(z.string()).optional(),
  budget_range: z.string().max(50).optional(),
  preferred_schedule: z.string().max(200).optional(),
  notes: notesSchema,
  assigned_to: idSchema.optional()
})

// 追蹤記錄 Schema
export const followUpSchema = z.object({
  follow_up_id: idSchema.optional(),
  lead_id: idSchema,
  type: z.enum(['phone_call', 'message', 'email', 'visit', 'trial_class', 'meeting', 'other']),
  subject: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
  result: z.enum(['positive', 'neutral', 'negative', 'no_response', 'converted', 'lost']),
  next_follow_up: dateSchema.optional(),
  created_by: idSchema
})

// 試聽課程 Schema
export const trialClassSchema = z.object({
  trial_id: idSchema.optional(),
  lead_id: idSchema,
  course_id: idSchema.optional(),
  scheduled_date: dateSchema,
  scheduled_time: timeSchema,
  teacher_id: idSchema.optional(),
  classroom: z.string().max(50).optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).default('scheduled'),
  attendance: z.boolean().optional(),
  feedback: z.string().max(1000).optional(),
  rating: z.number().min(1).max(5).optional(),
  follow_up_notes: z.string().max(500).optional(),
  created_by: idSchema
})

// 標籤 Schema
export const tagSchema = z.object({
  tag_id: idSchema.optional(),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, '顏色必須是有效的十六進制格式'),
  description: z.string().max(200).optional()
})

// ============================================================================
// 批次操作 Schema
// ============================================================================

// 批次 ID Schema
export const batchIdsSchema = z.object({
  ids: z.array(idSchema).min(1, '請至少選擇一項')
})

// 分頁參數 Schema
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

// 過濾條件 Schema
export const filterSchema = z.object({
  search: searchQuerySchema.optional(),
  status: z.string().optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  minAmount: amountSchema.optional(),
  maxAmount: amountSchema.optional()
})

// ============================================================================
// API 請求 Schema
// ============================================================================

// 登入請求 Schema
export const loginRequestSchema = z.object({
  username: z.string().min(1, '請輸入使用者名稱'),
  password: z.string().min(1, '請輸入密碼')
})

// 重設密碼請求 Schema
export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
  token: z.string().optional(),
  newPassword: passwordSchema.optional()
})

// 匯入資料 Schema
export const importDataSchema = z.object({
  type: z.enum(['contacts', 'students', 'courses', 'leads']),
  data: z.array(z.record(z.unknown())),
  skipDuplicates: z.boolean().default(true),
  validateOnly: z.boolean().default(false)
})

// ============================================================================
// 檔案上傳 Schema
// ============================================================================

export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().default(10 * 1024 * 1024), // 10MB
  allowedTypes: z.array(z.string()).default([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ])
}).refine(
  (data) => data.file.size <= data.maxSize,
  (data) => ({ message: `檔案大小不能超過 ${data.maxSize / 1024 / 1024}MB` })
).refine(
  (data) => data.allowedTypes.includes(data.file.type),
  '不支援的檔案類型'
)

// ============================================================================
// 輔助函數
// ============================================================================

/**
 * 驗證並回傳錯誤訊息
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors: Record<string, string[]> = {}
  result.error.issues.forEach(issue => {
    const path = issue.path.join('.')
    if (!errors[path]) {
      errors[path] = []
    }
    errors[path].push(issue.message)
  })

  return { success: false, errors }
}

/**
 * 取得 Schema 的預設值
 */
export function getSchemaDefaults<T>(schema: z.ZodSchema<T>): Partial<T> {
  try {
    return schema.parse({})
  } catch {
    return {}
  }
}
