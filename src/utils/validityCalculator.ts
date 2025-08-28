export interface ValidityCalculationOptions {
  courseType: 'regular' | 'theme' | 'trial'
  startDate: Date
  sessionCount: number
  courseEndDate?: Date
  defaultValidityDays?: number
  packageValidityDays?: number
  sessionsPerWeek?: number
  bufferWeeks?: number
  minimumValidityDays?: number
}

export interface ValidityPeriod {
  validFrom: string
  validUntil: string
  totalDays: number
}

export function calculateValidityPeriod(options: ValidityCalculationOptions): ValidityPeriod {
  const {
    courseType,
    startDate,
    sessionCount,
    courseEndDate,
    defaultValidityDays = 180,
    packageValidityDays,
    sessionsPerWeek,
    bufferWeeks = 4,
    minimumValidityDays = 30
  } = options

  let validityDays = defaultValidityDays

  // 1. 如果有套餐特定的有效天數，優先使用
  if (packageValidityDays) {
    validityDays = packageValidityDays
  }
  // 2. 如果是主題課程且有結束日期
  else if (courseType === 'theme' && courseEndDate) {
    const courseDays = Math.ceil((courseEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    validityDays = courseDays + 60 // 加 2 個月緩衝期
  }
  // 3. 如果有每週上課次數，根據堂數計算
  else if (sessionsPerWeek && sessionsPerWeek > 0) {
    const weeks = Math.ceil(sessionCount / sessionsPerWeek) + bufferWeeks
    validityDays = weeks * 7
  }

  // 確保不低於最小天數
  validityDays = Math.max(validityDays, minimumValidityDays)

  // 計算到期日
  const validFrom = formatDate(startDate)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + validityDays)
  const validUntil = formatDate(endDate)

  return {
    validFrom,
    validUntil,
    totalDays: validityDays
  }
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
