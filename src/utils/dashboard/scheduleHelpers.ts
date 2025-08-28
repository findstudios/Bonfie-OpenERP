/**
 * 課程相關的輔助函數
 */

import type { Schedule } from '@/types/dashboard'

/**
 * 獲取課程卡片的 CSS 類別
 */
export function getScheduleCardClass(schedule: Schedule): string {
  const now = new Date()
  const classTime = new Date(schedule.class_datetime)
  const endTime = new Date(schedule.end_datetime)

  // 基礎類別
  let baseClass = 'border-l-4 transition-all duration-200 '

  if (now >= classTime && now <= endTime) {
    baseClass += 'shadow-md' // 當前進行中的課程有陰影
  } else if (now > endTime) {
    baseClass += 'opacity-75' // 已結束的課程淡化
  }

  return baseClass
}

/**
 * 獲取時間標籤的 CSS 類別
 */
export function getTimeClass(schedule: Schedule): string {
  const now = new Date()
  const classTime = new Date(schedule.class_datetime)
  const endTime = new Date(schedule.end_datetime)

  if (now >= classTime && now <= endTime) {
    return 'bg-green-100 text-green-700 border border-green-200'
  } else if (now < classTime) {
    return 'bg-gray-100 text-gray-700 border border-gray-200'
  } else {
    return 'bg-gray-100 text-gray-500 border border-gray-200'
  }
}

/**
 * 獲取課程邊框的 CSS 類別
 */
export function getScheduleBorderClass(schedule: Schedule): string {
  const now = new Date()
  const classTime = new Date(schedule.class_datetime)
  const endTime = new Date(schedule.end_datetime)

  if (now >= classTime && now <= endTime) {
    return 'border-green-200'
  } else if (now < classTime) {
    return 'border-gray-200'
  } else {
    return 'border-gray-300'
  }
}

/**
 * 檢查課程是否在當前時間
 */
export function isCurrentTime(schedule: Schedule): boolean {
  const now = new Date()
  const classTime = new Date(schedule.class_datetime)
  const endTime = new Date(schedule.end_datetime)
  return now >= classTime && now <= endTime
}

/**
 * 獲取學生人數文字
 */
export function getStudentCountText(schedule: Schedule): string {
  const total = schedule.enrollments?.length || 0
  const attended = schedule.attendance_count || 0
  return `${attended}/${total} 人`
}
