/**
 * 自定義驗證器
 * 提供額外的驗證邏輯和業務規則檢查
 */

import { z } from 'zod'

// ============================================================================
// 通用驗證器
// ============================================================================

/**
 * 檢查是否為有效的台灣身分證字號
 */
export function isValidTWID(id: string): boolean {
  const regex = /^[A-Z][12]\d{8}$/
  if (!regex.test(id)) return false

  // 字母對應數字
  const letterMapping: Record<string, number> = {
    A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, I: 34,
    J: 18, K: 19, L: 20, M: 21, N: 22, O: 35, P: 23, Q: 24, R: 25,
    S: 26, T: 27, U: 28, V: 29, W: 32, X: 30, Y: 31, Z: 33
  }

  const firstLetter = id[0]
  const letterValue = letterMapping[firstLetter]
  const n1 = Math.floor(letterValue / 10)
  const n2 = letterValue % 10

  let sum = n1 + n2 * 9

  for (let i = 1; i < 9; i++) {
    sum += parseInt(id[i]) * (9 - i)
  }

  sum += parseInt(id[9])

  return sum % 10 === 0
}

/**
 * 檢查是否為有效的統一編號
 */
export function isValidTaxID(taxId: string): boolean {
  const regex = /^\d{8}$/
  if (!regex.test(taxId)) return false

  const weights = [1, 2, 1, 2, 1, 2, 4, 1]
  let sum = 0

  for (let i = 0; i < 8; i++) {
    const product = parseInt(taxId[i]) * weights[i]
    sum += Math.floor(product / 10) + (product % 10)
  }

  return sum % 10 === 0 || (sum % 10 === 9 && taxId[6] === '7')
}

/**
 * 檢查是否為強密碼
 */
export function isStrongPassword(password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  // 長度檢查
  if (password.length >= 8) score += 1
  else feedback.push('密碼長度至少需要 8 個字元')

  if (password.length >= 12) score += 1

  // 包含大寫字母
  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('密碼應包含至少一個大寫字母')

  // 包含小寫字母
  if (/[a-z]/.test(password)) score += 1
  else feedback.push('密碼應包含至少一個小寫字母')

  // 包含數字
  if (/[0-9]/.test(password)) score += 1
  else feedback.push('密碼應包含至少一個數字')

  // 包含特殊字元
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  else feedback.push('密碼應包含至少一個特殊字元')

  // 檢查常見密碼
  const commonPasswords = [
    'password', '12345678', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890'
  ]

  if (commonPasswords.includes(password.toLowerCase())) {
    score = 0
    feedback.unshift('請勿使用常見密碼')
  }

  return {
    isValid: score >= 4,
    score: Math.min(score, 5),
    feedback
  }
}

/**
 * 檢查信用卡號是否有效（Luhn 算法）
 */
export function isValidCreditCard(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s/g, '')

  if (!/^\d{13,19}$/.test(cleaned)) return false

  let sum = 0
  let isEven = false

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i])

    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

// ============================================================================
// 業務邏輯驗證器
// ============================================================================

/**
 * 檢查日期範圍是否有效
 */
export function isValidDateRange(startDate: string, endDate: string): boolean {
  const start = new Date(startDate)
  const end = new Date(endDate)

  return start <= end
}

/**
 * 檢查時間是否在營業時間內
 */
export function isWithinBusinessHours(time: string): boolean {
  const [hours, minutes] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes

  // 假設營業時間為 8:00 - 22:00
  const openTime = 8 * 60  // 480 分鐘
  const closeTime = 22 * 60 // 1320 分鐘

  return totalMinutes >= openTime && totalMinutes <= closeTime
}

/**
 * 檢查課程時間是否衝突
 */
export function hasScheduleConflict(
  newSchedule: { start: Date; end: Date },
  existingSchedules: Array<{ start: Date; end: Date }>
): boolean {
  return existingSchedules.some(schedule => {
    return (
      (newSchedule.start >= schedule.start && newSchedule.start < schedule.end) ||
      (newSchedule.end > schedule.start && newSchedule.end <= schedule.end) ||
      (newSchedule.start <= schedule.start && newSchedule.end >= schedule.end)
    )
  })
}

/**
 * 檢查折扣是否合理
 */
export function isValidDiscount(
  originalAmount: number,
  discountAmount: number,
  maxDiscountPercentage: number = 50
): boolean {
  if (discountAmount < 0) return false
  if (discountAmount > originalAmount) return false

  const discountPercentage = (discountAmount / originalAmount) * 100
  return discountPercentage <= maxDiscountPercentage
}

/**
 * 檢查學生年齡是否符合課程要求
 */
export function isAgeAppropriate(
  studentAge: number,
  minAge: number,
  maxAge: number
): boolean {
  return studentAge >= minAge && studentAge <= maxAge
}

// ============================================================================
// 檔案驗證器
// ============================================================================

/**
 * 檢查檔案類型
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type)
}

/**
 * 檢查檔案大小
 */
export function isValidFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  return file.size <= maxSizeInBytes
}

/**
 * 檢查圖片尺寸
 */
export async function isValidImageDimensions(
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img.width <= maxWidth && img.height <= maxHeight)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(false)
    }

    img.src = url
  })
}

// ============================================================================
// 資料完整性驗證器
// ============================================================================

/**
 * 檢查必填欄位是否完整
 */
export function hasRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): boolean {
  return requiredFields.every(field => {
    const value = data[field]
    return value !== undefined && value !== null && value !== ''
  })
}

/**
 * 檢查資料是否重複
 */
export function hasDuplicates<T>(
  items: T[],
  keySelector: (item: T) => string
): boolean {
  const keys = items.map(keySelector)
  const uniqueKeys = new Set(keys)
  return keys.length !== uniqueKeys.size
}

/**
 * 檢查參照完整性
 */
export async function hasValidReferences(
  references: Array<{ table: string; id: string }>,
  checkFunction: (table: string, id: string) => Promise<boolean>
): Promise<boolean> {
  const results = await Promise.all(
    references.map(ref => checkFunction(ref.table, ref.id))
  )
  return results.every(result => result)
}

// ============================================================================
// 組合驗證器
// ============================================================================

/**
 * 建立條件驗證器
 */
export function conditionalValidator<T>(
  condition: (data: T) => boolean,
  validator: z.ZodSchema<T>
): z.ZodSchema<T> {
  return z.custom<T>((data) => {
    if (condition(data)) {
      return validator.safeParse(data).success
    }
    return true
  })
}

/**
 * 建立依賴驗證器
 */
export function dependentValidator<T extends Record<string, any>>(
  dependencies: Array<{
    fields: (keyof T)[]
    validate: (values: any[]) => boolean
    message: string
  }>
): z.ZodSchema<T> {
  return z.custom<T>((data) => {
    for (const dep of dependencies) {
      const values = dep.fields.map(field => data[field])
      if (!dep.validate(values)) {
        throw new Error(dep.message)
      }
    }
    return true
  })
}

// ============================================================================
// 導出驗證器集合
// ============================================================================

export const validators = {
  // 通用驗證
  isValidTWID,
  isValidTaxID,
  isStrongPassword,
  isValidCreditCard,

  // 業務邏輯驗證
  isValidDateRange,
  isWithinBusinessHours,
  hasScheduleConflict,
  isValidDiscount,
  isAgeAppropriate,

  // 檔案驗證
  isValidFileType,
  isValidFileSize,
  isValidImageDimensions,

  // 資料完整性驗證
  hasRequiredFields,
  hasDuplicates,
  hasValidReferences,

  // 組合驗證
  conditionalValidator,
  dependentValidator
}
