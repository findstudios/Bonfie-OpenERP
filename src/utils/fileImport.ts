/**
 * 檔案匯入工具函數
 * 處理 CSV 和 Excel 檔案的讀取和解析
 */

export interface ImportResult<T> {
  success: boolean
  data?: T[]
  errors?: string[]
  totalRows?: number
  successCount?: number
  failedCount?: number
}

/**
 * 讀取 CSV 檔案內容
 */
export async function parseCSV(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const rows = text.split('\n')
          .map(row => row.trim())
          .filter(row => row.length > 0)
          .map(row => {
            // 處理 CSV 中的逗號和引號
            const result = []
            let current = ''
            let inQuotes = false

            for (let i = 0; i < row.length; i++) {
              const char = row[i]

              if (char === '"') {
                inQuotes = !inQuotes
              } else if (char === ',' && !inQuotes) {
                result.push(current.trim())
                current = ''
              } else {
                current += char
              }
            }

            result.push(current.trim())
            return result
          })

        resolve(rows)
      } catch (error) {
        reject(new Error('解析 CSV 檔案失敗'))
      }
    }

    reader.onerror = () => {
      reject(new Error('讀取檔案失敗'))
    }

    reader.readAsText(file, 'UTF-8')
  })
}

/**
 * 驗證必要欄位
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const field of requiredFields) {
    if (!data[field] || data[field].toString().trim() === '') {
      errors.push(`缺少必要欄位: ${field}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 驗證電話號碼格式
 */
export function validatePhoneNumber(phone: string): boolean {
  // 台灣手機號碼格式: 09xxxxxxxx 或 +8869xxxxxxxx
  const phoneRegex = /^(\+886|0)?9\d{8}$/
  return phoneRegex.test(phone.replace(/[\s-]/g, ''))
}

/**
 * 驗證電子郵件格式
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 格式化電話號碼
 */
export function formatPhoneNumber(phone: string): string {
  // 移除空格和破折號
  let formatted = phone.replace(/[\s-]/g, '')

  // 如果是 +886 開頭，轉換為 0
  if (formatted.startsWith('+886')) {
    formatted = `0${formatted.substring(4)}`
  }

  return formatted
}

/**
 * 將 CSV 行對應到物件
 */
export function mapRowToObject(
  headers: string[],
  row: string[],
  mapping: Record<string, string>
): Record<string, any> {
  const result: Record<string, any> = {}

  for (const [csvHeader, fieldName] of Object.entries(mapping)) {
    const index = headers.indexOf(csvHeader)
    if (index !== -1 && row[index]) {
      result[fieldName] = row[index]
    }
  }

  return result
}

/**
 * 下載範本檔案
 */
export function downloadTemplate(
  filename: string,
  headers: string[],
  sampleData?: string[][]
) {
  let content = `${headers.join(',')}\n`

  if (sampleData) {
    content += sampleData.map(row => row.join(',')).join('\n')
  }

  const blob = new Blob([`\ufeff${content}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * 產生匯入報告
 */
export function generateImportReport(result: ImportResult<any>): string {
  let report = '匯入結果摘要\n'
  report += '================\n'
  report += `總資料筆數: ${result.totalRows || 0}\n`
  report += `成功筆數: ${result.successCount || 0}\n`
  report += `失敗筆數: ${result.failedCount || 0}\n`

  if (result.errors && result.errors.length > 0) {
    report += '\n錯誤詳情:\n'
    result.errors.forEach((error, index) => {
      report += `${index + 1}. ${error}\n`
    })
  }

  return report
}
