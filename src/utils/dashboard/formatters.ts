/**
 * Dashboard 格式化工具函數
 */

/**
 * 格式化時間為 HH:MM 格式
 */
export function formatTime(datetime: string): string {
  const date = new Date(datetime)
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

/**
 * 獲取完整的時間範圍
 */
export function getFullTimeRange(schedule: { class_datetime: string; end_datetime: string }): string {
  const start = new Date(schedule.class_datetime)
  const end = new Date(schedule.end_datetime)
  const formatOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }
  return `${start.toLocaleTimeString('zh-TW', formatOptions)} - ${end.toLocaleTimeString('zh-TW', formatOptions)}`
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * 獲取今日日期字串
 */
export function getTodayDateString(): string {
  const today = new Date()
  return today.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

/**
 * 生成 CSV 內容
 */
export function generateCSVContent(data: any[], headers: string[]): string {
  let csvContent = '\ufeff' // BOM for UTF-8

  // 添加標題行
  csvContent += `${headers.join(',')}\n`

  // 添加資料行
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || ''
      // 如果值包含逗號或換行，需要用引號包圍
      if (value.toString().includes(',') || value.toString().includes('\n')) {
        return `"${value.toString().replace(/"/g, '""')}"`
      }
      return value
    })
    csvContent += `${values.join(',')}\n`
  })

  return csvContent
}

/**
 * 下載檔案
 */
export function downloadFile(content: string, filename: string, type = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // 釋放 URL 物件
  URL.revokeObjectURL(url)
}
