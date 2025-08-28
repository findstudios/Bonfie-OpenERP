/**
 * 日期時間格式化 Composable
 */
export function useDateTimeFormatter() {
  /**
   * 時間解析函數 - 確保正確解析本地時間
   */
  function parseAsLocalTime(timeString: string): Date {
    if (!timeString) return new Date()

    // 直接使用 Date 構造函數，但強制為本地時間
    const date = new Date(timeString)

    // 如果是 ISO 格式（包含 T 和時區信息），轉換為本地時間
    if (timeString.includes('T') && !isNaN(date.getTime())) {
      return date
    }

    // 如果是簡單的日期字符串，手動解析
    if (timeString.includes('T')) {
      const [datePart, timePart] = timeString.split('T')
      const [year, month, day] = datePart.split('-').map(Number)
      const [hour, minute, second = 0] = timePart.replace('Z', '').split(':').map(Number)
      return new Date(year, month - 1, day, hour, minute, second)
    }

    return new Date(timeString)
  }

  /**
   * 格式化時間為 HH:mm 格式
   */
  function formatTime(dateString: string): string {
    if (!dateString) return '--:--'

    const date = parseAsLocalTime(dateString)

    if (isNaN(date.getTime())) {
      return '--:--'
    }

    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  /**
   * 格式化日期為 M/D 星期X 格式
   */
  function formatShortDate(dateString: string): string {
    if (!dateString) return ''

    const date = parseAsLocalTime(dateString)

    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString)
      return '日期格式錯誤'
    }

    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const weekday = weekdays[date.getDay()]

    return `${month}/${day} 星期${weekday}`
  }

  /**
   * 格式化完整日期時間
   */
  function formatFullDateTime(dateString: string): string {
    if (!dateString) return ''

    const date = parseAsLocalTime(dateString)

    if (isNaN(date.getTime())) {
      return '日期格式錯誤'
    }

    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return {
    parseAsLocalTime,
    formatTime,
    formatShortDate,
    formatFullDateTime
  }
}
