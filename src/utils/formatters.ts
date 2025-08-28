/**
 * 通用格式化工具函數
 */

import { logFormattingError } from '@/services/errorMonitoringService'

// 貨幣格式化
export function formatCurrency(amount: number | null | undefined): string {
  try {
    const numericAmount = validateAndConvertAmount(amount)
    return numericAmount.toLocaleString('zh-TW')
  } catch (error) {
    // Log error for debugging but never throw
    logFormattingError(amount, 'formatCurrency', error)
    return '0'
  }
}

// Helper function for input validation and type conversion
function validateAndConvertAmount(amount: any): number {
  // Handle null/undefined
  if (amount == null) {
    return 0
  }

  // Handle already numeric values
  if (typeof amount === 'number') {
    // Check for NaN and Infinity
    if (isNaN(amount) || !isFinite(amount)) {
      return 0
    }
    return amount
  }

  // Handle string conversion
  if (typeof amount === 'string') {
    // Handle empty string
    if (amount.trim() === '') {
      return 0
    }

    const parsed = parseFloat(amount)
    return isNaN(parsed) ? 0 : parsed
  }

  // Handle boolean (edge case)
  if (typeof amount === 'boolean') {
    return amount ? 1 : 0
  }

  // Default fallback for objects, arrays, etc.
  return 0
}


// 日期時間格式化
export function formatDateTime(dateString: string): string {
  // 直接字串解析，避免 JavaScript Date 的時區問題
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
  if (!match) {
    // 如果格式不匹配，返回原字串
    return dateString
  }

  const [, year, month, day, hour, minute] = match

  // UTC 時間加 8 小時 = 台北時間
  let taipeiHour = parseInt(hour) + 8
  let taipeiDay = parseInt(day)
  let taipeiMonth = parseInt(month)
  let taipeiYear = parseInt(year)

  // 處理跨日
  if (taipeiHour >= 24) {
    taipeiHour -= 24
    taipeiDay += 1

    // 處理跨月（簡化處理）
    const daysInMonth = new Date(taipeiYear, taipeiMonth, 0).getDate()
    if (taipeiDay > daysInMonth) {
      taipeiDay = 1
      taipeiMonth += 1
      if (taipeiMonth > 12) {
        taipeiMonth = 1
        taipeiYear += 1
      }
    }
  }

  const period = taipeiHour < 12 ? '上午' : '下午'
  const displayHour = taipeiHour === 0 ? 12 : taipeiHour > 12 ? taipeiHour - 12 : taipeiHour

  return `${taipeiYear}/${String(taipeiMonth).padStart(2, '0')}/${String(taipeiDay).padStart(2, '0')} ${period}${String(displayHour).padStart(2, '0')}:${minute}`
}

// 日期格式化 (不含時間)
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Taipei' // 明確指定台北時區
  })
}

// 時間格式化
export function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Taipei' // 明確指定台北時區
  })
}

// 本地日期時間字串 (用於 datetime-local input)
export function getLocalDateTimeString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// 數字轉換為百分比
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

// 檔案大小格式化
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// 相對時間格式化 (例如：2小時前、昨天、3天前)
export function formatRelativeTime(dateString: string): string {
  // 直接顯示本地時間格式，不使用相對時間
  return formatDateTime(dateString)
}

// 詳細的日期時間格式化 (包含星期)
export function formatDetailedDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Taipei'
  })
}

// 智能時間格式化 (結合相對時間和絕對時間)
export function formatSmartDateTime(dateString: string): string {
  // 直接顯示完整的日期時間格式，不使用相對時間
  return formatDateTime(dateString)
}

// 調試用的時間格式化函數
export function debugDateTime(dateString: string): string {
  let date: Date

  if (dateString.includes('Z') || dateString.includes('+') || dateString.includes('-')) {
    date = new Date(dateString)
  } else {
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?$/)
    if (match) {
      const [, year, month, day, hour, minute, second, milliseconds = '.0'] = match
      date = new Date(Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second),
        parseInt(parseFloat(milliseconds) * 1000)
      ))
    } else {
      date = new Date(dateString)
    }
  }

  const now = new Date()

  return `
    原始: ${dateString}
    UTC解析: ${date.toString()}
    解析為ISO: ${date.toISOString()}
    台北時間: ${date.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
    現在本地: ${now.toString()}
    時差(小時): ${(now.getTime() - date.getTime()) / (1000 * 60 * 60)}
  `.trim()
}// Force reload 西元2025年07月23日 (星期三) 00時09分49秒
