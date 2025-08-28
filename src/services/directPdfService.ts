/**
 * 直接 PDF 生成服務 - 不依賴 HTML 渲染
 */

import jsPDF from 'jspdf'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { getStatusText } from '@/services/orderStatus'
import type { Order, Payment } from '@/utils/paymentCalculator'
import { getTotalPaid, getUnpaidAmount } from '@/utils/paymentCalculator'
import { logPaymentValidationError, logPdfGenerationError } from '@/services/errorMonitoringService'
import { supabase } from '@/services/supabase'

// Safe payment interface for validated payment data
interface SafePayment extends Omit<Payment, 'amount'> {
  amount: number  // Always guaranteed to be a valid number
}

// Payment data validation function
function validatePaymentData(payments: Payment[]): SafePayment[] {
  // Handle null/undefined payments array
  if (!payments) {
    console.warn('validatePaymentData: payments is null/undefined, returning empty array')
    return []
  }

  if (!Array.isArray(payments)) {
    console.warn('validatePaymentData: payments is not an array, returning empty array')
    return []
  }

  return payments.map((payment, index) => {
    try {
      // Handle null/undefined payment object
      if (!payment) {
        logPaymentValidationError(payment, index, 'directPdfService', 'Payment object is null/undefined')
        return {
          payment_date: new Date().toISOString(),
          method: 'Unknown',
          amount: 0,
          receipt_number: '',
          notes: ''
        }
      }

      // Validate and convert amount using the same logic as formatCurrency
      let validAmount = 0

      if (payment.amount != null) {
        if (typeof payment.amount === 'number') {
          // Check for NaN and Infinity
          if (isNaN(payment.amount) || !isFinite(payment.amount)) {
            validAmount = 0
          } else {
            validAmount = payment.amount
          }
        } else if (typeof payment.amount === 'string') {
          // Handle empty string
          if (payment.amount.trim() === '') {
            validAmount = 0
          } else {
            const parsed = parseFloat(payment.amount)
            validAmount = isNaN(parsed) ? 0 : parsed
          }
        } else if (typeof payment.amount === 'boolean') {
          // Handle boolean edge case
          validAmount = payment.amount ? 1 : 0
        } else {
          // Handle objects, arrays, etc.
          validAmount = 0
        }
      }

      // Log validation issues for debugging
      if (payment.amount !== validAmount) {
        logPaymentValidationError(payment, index, 'directPdfService',
          `Converted amount from ${payment.amount} (${typeof payment.amount}) to ${validAmount}`)
      }

      // Ensure all required fields have safe defaults
      return {
        payment_date: payment.payment_date || new Date().toISOString(),
        method: payment.method || 'Unknown',
        amount: validAmount,
        receipt_number: payment.receipt_number || '',
        notes: payment.notes || ''
      }
    } catch (error) {
      logPaymentValidationError(payment, index, 'directPdfService',
        `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      // Return safe default payment object
      return {
        payment_date: new Date().toISOString(),
        method: 'Unknown',
        amount: 0,
        receipt_number: '',
        notes: 'Error processing payment data'
      }
    }
  })
}

// 公司資訊配置
export interface StudioConfig {
  name: string
  brandName: string
  address: string
  phone: string
  email: string
  website: string
  taxId?: string
  logo_url?: string
  director?: string
  business_hours?: string
}

// PDF 選項
export interface DirectPDFOptions {
  showPaymentHistory: boolean
  showItemDetails: boolean
  filename?: string
}

// 預設配置
const DEFAULT_STUDIO_CONFIG: StudioConfig = {
  name: '中小型補教業OpenERP',
  brandName: 'OpenERP',
  address: '台北市中正區中山南路1號',
  phone: '(02) 2388-1234',
  email: 'info@tutoring.com',
  website: 'www.tutoring.com',
  taxId: '12345678'
}

const DEFAULT_OPTIONS: DirectPDFOptions = {
  showPaymentHistory: true,
  showItemDetails: true
}

// 載入系統設定
async function loadSystemConfig(): Promise<StudioConfig> {
  try {
    const { data, error } = await supabase
      .from('tutoring_center_settings')
      .select('setting_value')
      .eq('setting_key', 'basic_info')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      throw error
    }

    if (data?.setting_value) {
      const basicInfo = data.setting_value as any
      return {
        name: basicInfo.name || DEFAULT_STUDIO_CONFIG.name,
        brandName: basicInfo.name || DEFAULT_STUDIO_CONFIG.brandName,
        address: basicInfo.address || DEFAULT_STUDIO_CONFIG.address,
        phone: basicInfo.phone || DEFAULT_STUDIO_CONFIG.phone,
        email: basicInfo.email || DEFAULT_STUDIO_CONFIG.email,
        website: DEFAULT_STUDIO_CONFIG.website,
        taxId: basicInfo.tax_id || DEFAULT_STUDIO_CONFIG.taxId,
        logo_url: basicInfo.logo_url || '',
        director: basicInfo.director || '',
        business_hours: basicInfo.business_hours || ''
      }
    }

    return DEFAULT_STUDIO_CONFIG
  } catch (error) {
    console.error('載入系統設定失敗，使用預設配置:', error)
    return DEFAULT_STUDIO_CONFIG
  }
}

// PDF 字體和樣式配置 - 參考 HTML 模板風格
const PDF_CONFIG = {
  pageWidth: 210, // A4 寬度 (mm)
  pageHeight: 297, // A4 高度 (mm)
  margin: {
    top: 25,
    bottom: 25,
    left: 20,
    right: 20
  },
  fonts: {
    title: 20,        // 公司標題
    subtitle: 16,     // ORDER 標題
    heading: 14,      // 區塊標題
    normal: 11,       // 一般文字
    small: 9,         // 小字
    tiny: 8          // 最小字
  },
  colors: {
    // 參考 HTML 模板的優雅色調
    primary: '#5D5C61',      // 主文字色 - 暖炭灰
    secondary: '#B4A6A5',    // 次要文字色 - 淺灰褐
    accent: '#D8A7B1',       // 點綴色 - 乾燥玫瑰粉
    accentDark: '#C38390',   // 強調色 - 深粉
    background: '#FFF8F6',   // 背景色 - 淺膚粉
    line: '#EAE2E1',         // 線條色
    white: '#FFFFFF'
  },
  spacing: {
    sectionGap: 12,
    itemGap: 8,
    lineHeight: 5
  }
}

// 生成文件名
function generateFilename(order: Order, brandName: string, customFilename?: string): string {
  if (customFilename) {
    return customFilename
  }
  return `${brandName}_${order.order_id}.pdf`
}

// 添加中文字體支持 (使用內建字體)
function setupFonts(pdf: jsPDF) {
  // jsPDF 內建支持的字體
  pdf.setFont('helvetica', 'normal')
}

// 繪製分隔線
function drawLine(pdf: jsPDF, startX: number, startY: number, endX: number, endY: number, color = '#EAE2E1', thickness = 0.5) {
  pdf.setDrawColor(color)
  pdf.setLineWidth(thickness)
  pdf.line(startX, startY, endX, endY)
}

// 繪製矩形框
function drawRect(pdf: jsPDF, x: number, y: number, width: number, height: number, fillColor?: string, strokeColor?: string) {
  if (fillColor) {
    pdf.setFillColor(fillColor)
    pdf.rect(x, y, width, height, 'F')
  }
  if (strokeColor) {
    pdf.setDrawColor(strokeColor)
    pdf.setLineWidth(0.3)
    pdf.rect(x, y, width, height, 'S')
  }
}

// 繪製圓角矩形效果（用多個小矩形模擬）
function drawRoundedRect(pdf: jsPDF, x: number, y: number, width: number, height: number, fillColor?: string) {
  if (fillColor) {
    pdf.setFillColor(fillColor)
    pdf.rect(x, y, width, height, 'F')
  }
}

// 繪製裝飾性水彩效果背景
function drawWatercolorBackground(pdf: jsPDF) {
  // 在右上角繪製淺色橢圓背景
  pdf.setFillColor(PDF_CONFIG.colors.accent)
  pdf.setGState(pdf.GState({ opacity: 0.1 })) // 設定透明度

  const centerX = PDF_CONFIG.pageWidth - 60
  const centerY = 40
  const radiusX = 50
  const radiusY = 35

  // 使用多個圓形來模擬橢圓
  for (let i = 0; i < 20; i++) {
    const angle = (i * 18) * Math.PI / 180
    const x = centerX + Math.cos(angle) * radiusX * 0.8
    const y = centerY + Math.sin(angle) * radiusY * 0.8
    pdf.circle(x, y, 3, 'F')
  }

  // 重置透明度
  pdf.setGState(pdf.GState({ opacity: 1 }))
}

// 自動換行文字
function addMultilineText(pdf: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight = 5): number {
  const lines = pdf.splitTextToSize(text, maxWidth)
  let currentY = y

  lines.forEach((line: string) => {
    pdf.text(line, x, currentY)
    currentY += lineHeight
  })

  return currentY
}

// 繪製LOGO（如果有的話）
async function drawLogo(pdf: jsPDF, logoUrl: string, x: number, y: number, width: number, height: number): Promise<number> {
  if (!logoUrl) return y

  try {
    // 創建一個Image對象來載入圖片
    const img = new Image()
    img.crossOrigin = 'anonymous'

    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          // 創建canvas來處理圖片
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            resolve(y)
            return
          }

          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)

          // 轉換為base64
          const imgData = canvas.toDataURL('image/png')

          // 添加到PDF
          pdf.addImage(imgData, 'PNG', x, y, width, height)
          resolve(y + height + 5)
        } catch (error) {
          console.warn('添加LOGO到PDF失敗:', error)
          resolve(y)
        }
      }

      img.onerror = () => {
        console.warn('載入LOGO圖片失敗:', logoUrl)
        resolve(y)
      }

      img.src = logoUrl
    })
  } catch (error) {
    console.warn('處理LOGO時發生錯誤:', error)
    return y
  }
}

// 繪製優雅的表格（參考 HTML 模板風格）
function drawElegantTable(
  pdf: jsPDF,
  headers: string[],
  rows: string[][],
  startX: number,
  startY: number,
  columnWidths: number[],
  rowHeight = 12
): number {
  let currentY = startY
  const totalWidth = columnWidths.reduce((a, b) => a + b, 0)

  // 繪製表頭 - 使用底線而非邊框
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(PDF_CONFIG.fonts.tiny)
  pdf.setTextColor(PDF_CONFIG.colors.secondary)

  let currentX = startX
  headers.forEach((header, index) => {
    // 表頭文字大寫並增加字距
    const upperHeader = header.toUpperCase()
    pdf.text(upperHeader, currentX, currentY)
    currentX += columnWidths[index]
  })

  // 表頭下方分隔線
  currentY += 6
  drawLine(pdf, startX, currentY, startX + totalWidth, currentY, PDF_CONFIG.colors.line, 0.8)
  currentY += 8

  // 繪製數據行 - 使用更優雅的間距
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(PDF_CONFIG.fonts.normal)
  pdf.setTextColor(PDF_CONFIG.colors.primary)

  rows.forEach((row, rowIndex) => {
    currentX = startX
    const itemRowHeight = Math.max(rowHeight, 15) // 確保足夠高度

    row.forEach((cell, cellIndex) => {
      if (cellIndex === 0) {
        // 第一列（項目名稱）- 粗體顯示
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(PDF_CONFIG.fonts.normal)

        // 處理長文本
        if (cell.length > 25) {
          const lines = pdf.splitTextToSize(cell, columnWidths[cellIndex] - 5)
          lines.slice(0, 2).forEach((line: string, lineIndex: number) => {
            pdf.text(line, currentX, currentY + (lineIndex * 4))
          })
        } else {
          pdf.text(cell, currentX, currentY)
        }
      } else {
        // 其他列 - 一般字體
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(PDF_CONFIG.fonts.small)

        // 數字列右對齊
        const isNumeric = cellIndex > 0 && !isNaN(parseFloat(cell.replace(/[^0-9.-]/g, '')))
        if (isNumeric) {
          const textWidth = pdf.getTextWidth(cell)
          pdf.text(cell, currentX + columnWidths[cellIndex] - textWidth, currentY)
        } else {
          pdf.text(cell, currentX, currentY)
        }
      }
      currentX += columnWidths[cellIndex]
    })

    currentY += itemRowHeight

    // 在每行之間繪製淡淡的分隔線
    if (rowIndex < rows.length - 1) {
      drawLine(pdf, startX, currentY + 2, startX + totalWidth, currentY + 2, PDF_CONFIG.colors.line, 0.3)
      currentY += 5
    }
  })

  return currentY + 10
}

// 主要 PDF 生成函數 - 優雅風格
export async function generateDirectPDF(
  order: Order,
  studioConfig: Partial<StudioConfig> = {},
  options: Partial<DirectPDFOptions> = {}
): Promise<void> {
  // 載入系統設定並與傳入的配置合併
  const systemConfig = await loadSystemConfig()
  const config = { ...systemConfig, ...studioConfig }
  const pdfOptions = { ...DEFAULT_OPTIONS, ...options }

  try {
    // 創建 PDF 實例
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // 設定字體
    setupFonts(pdf)

    // 添加背景色
    pdf.setFillColor(PDF_CONFIG.colors.background)
    pdf.rect(0, 0, PDF_CONFIG.pageWidth, PDF_CONFIG.pageHeight, 'F')

    // 繪製裝飾性背景
    drawWatercolorBackground(pdf)

    let currentY = PDF_CONFIG.margin.top
    const contentWidth = PDF_CONFIG.pageWidth - PDF_CONFIG.margin.left - PDF_CONFIG.margin.right

    // === 1. 優雅的標頭區域 ===
    // 先繪製LOGO（如果有的話）
    if (config.logo_url) {
      try {
        currentY = await drawLogo(pdf, config.logo_url, PDF_CONFIG.margin.left, currentY, 25, 25)
      } catch (error) {
        console.warn('繪製LOGO失敗:', error)
      }
    }

    // 左側：公司資訊
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(PDF_CONFIG.fonts.title)
    pdf.setTextColor(PDF_CONFIG.colors.primary)
    const logoOffset = config.logo_url ? 30 : 0 // 如果有LOGO，文字向右偏移
    pdf.text(config.name, PDF_CONFIG.margin.left + logoOffset, currentY)

    currentY += 8

    // 公司詳細資訊
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(PDF_CONFIG.fonts.small)
    pdf.setTextColor(PDF_CONFIG.colors.secondary)

    const companyDetails = [
      config.address,
      `電話: ${config.phone}`,
      `Email: ${config.email}`,
      config.website
    ]

    // 如果有統一編號、負責人或營業時間，也添加到詳細資訊中
    if (config.taxId) companyDetails.push(`統一編號: ${config.taxId}`)
    if (config.director) companyDetails.push(`負責人: ${config.director}`)
    if (config.business_hours) companyDetails.push(`營業時間: ${config.business_hours}`)

    companyDetails.forEach(detail => {
      if (detail) { // 確保不顯示空值
        pdf.text(detail, PDF_CONFIG.margin.left + logoOffset, currentY)
        currentY += 4
      }
    })

    // 右側：訂單資訊
    const rightX = PDF_CONFIG.margin.left + contentWidth - 60
    let rightY = PDF_CONFIG.margin.top

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(PDF_CONFIG.fonts.subtitle)
    pdf.setTextColor(PDF_CONFIG.colors.accentDark)
    pdf.text('ORDER', rightX, rightY)

    rightY += 8

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(PDF_CONFIG.fonts.small)
    pdf.setTextColor(PDF_CONFIG.colors.primary)

    const orderMeta = [
      `訂單 #: ${order.order_id}`,
      `日期: ${formatDateTime(order.created_at || '').split(' ')[0]}`,
      `狀態: ${getStatusText(order.status as any)}`
    ]

    orderMeta.forEach(meta => {
      pdf.text(meta, rightX, rightY)
      rightY += 4
    })

    currentY = Math.max(currentY, rightY) + PDF_CONFIG.spacing.sectionGap

    // === 2. 客戶資訊區塊 ===
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(PDF_CONFIG.fonts.tiny)
    pdf.setTextColor(PDF_CONFIG.colors.secondary)

    const sectionTitle = 'BILL TO'
    pdf.text(sectionTitle, PDF_CONFIG.margin.left, currentY)

    // 標題下方分隔線
    currentY += 4
    drawLine(pdf, PDF_CONFIG.margin.left, currentY, PDF_CONFIG.margin.left + 40, currentY, PDF_CONFIG.colors.line, 0.8)
    currentY += 8

    // 客戶資訊
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(PDF_CONFIG.fonts.normal)
    pdf.setTextColor(PDF_CONFIG.colors.primary)

    const customerName = (order as any).student?.chinese_name || '未知客戶'
    pdf.text(customerName, PDF_CONFIG.margin.left, currentY)
    currentY += 6

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(PDF_CONFIG.fonts.small)
    pdf.setTextColor(PDF_CONFIG.colors.secondary)

    const customerDetails = [
      (order as any).contact?.phone || '',
      (order as any).contact?.email || '',
      (order as any).contact?.address || ''
    ].filter(Boolean)

    customerDetails.forEach(detail => {
      if (detail) {
        pdf.text(detail, PDF_CONFIG.margin.left, currentY)
        currentY += 4
      }
    })

    currentY += PDF_CONFIG.spacing.sectionGap

    // === 3. 訂單項目表格 ===
    // Validate payment data before processing
    const validatedPayments = validatePaymentData(order.payments || [])
    const totalPaid = getTotalPaid(validatedPayments)
    const unpaidAmount = getUnpaidAmount({ ...order, payments: validatedPayments })

    if (pdfOptions.showItemDetails && order.items && order.items.length > 0) {
      const headers = ['項目說明', '數量', '單價', '小計']
      const columnWidths = [90, 20, 30, 30] // 總寬度: 170mm

      const rows = order.items.map(item => [
        item.item_name,
        item.quantity.toString(),
        `NT$ ${formatCurrency(item.unit_price)}`,
        `NT$ ${formatCurrency(item.final_price || item.total_price)}`
      ])

      currentY = drawElegantTable(pdf, headers, rows, PDF_CONFIG.margin.left, currentY, columnWidths)
    }

    // === 4. 金額摘要區塊 ===
    currentY += 5
    const summaryX = PDF_CONFIG.margin.left + contentWidth - 80
    const summaryWidth = 75

    // 摘要區塊背景
    drawRoundedRect(pdf, summaryX - 5, currentY - 5, summaryWidth + 10, 45, PDF_CONFIG.colors.background)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(PDF_CONFIG.fonts.small)
    pdf.setTextColor(PDF_CONFIG.colors.secondary)

    const summaryItems = [
      { label: '小計', value: `NT$ ${formatCurrency(order.original_amount)}`, isTotal: false },
      { label: '折扣', value: `- NT$ ${formatCurrency(order.discount_amount)}`, isDiscount: true },
      { label: '總金額', value: `NT$ ${formatCurrency(order.final_amount)}`, isTotal: true }
    ]

    summaryItems.forEach((item, index) => {
      if (item.isTotal) {
        // 總金額行 - 特殊樣式
        drawLine(pdf, summaryX, currentY - 2, summaryX + summaryWidth, currentY - 2, PDF_CONFIG.colors.accent, 1.5)
        currentY += 6

        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(PDF_CONFIG.fonts.normal)
        pdf.setTextColor(PDF_CONFIG.colors.primary)
      } else if (item.isDiscount) {
        // 折扣行 - 強調色
        pdf.setTextColor(PDF_CONFIG.colors.accentDark)
      } else {
        // 一般行
        pdf.setTextColor(PDF_CONFIG.colors.secondary)
      }

      pdf.text(item.label, summaryX, currentY)
      const valueWidth = pdf.getTextWidth(item.value)

      if (item.isTotal) {
        pdf.setTextColor(PDF_CONFIG.colors.accentDark)
      }

      pdf.text(item.value, summaryX + summaryWidth - valueWidth, currentY)
      currentY += 6

      // 重置字體
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(PDF_CONFIG.fonts.small)
    })

    currentY += PDF_CONFIG.spacing.sectionGap

    // === 5. 付款資訊區塊 ===
    drawLine(pdf, PDF_CONFIG.margin.left, currentY, PDF_CONFIG.margin.left + contentWidth, currentY, PDF_CONFIG.colors.line, 0.8)
    currentY += 12

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(PDF_CONFIG.fonts.tiny)
    pdf.setTextColor(PDF_CONFIG.colors.secondary)
    pdf.text('PAYMENT INFORMATION', PDF_CONFIG.margin.left, currentY)
    currentY += 8

    // 付款狀態 - with error handling
    try {
      const paymentInfos = [
        { label: '已付金額', value: `NT$ ${formatCurrency(totalPaid)}`, highlight: true },
        { label: '未付金額', value: `NT$ ${formatCurrency(unpaidAmount)}`, highlight: true }
      ]

      paymentInfos.forEach(info => {
        try {
          pdf.setFont('helvetica', info.highlight ? 'bold' : 'normal')
          pdf.setFontSize(PDF_CONFIG.fonts.small)
          pdf.setTextColor(info.highlight ? PDF_CONFIG.colors.primary : PDF_CONFIG.colors.secondary)

          pdf.text(info.label, PDF_CONFIG.margin.left, currentY)
          const valueWidth = pdf.getTextWidth(info.value)
          pdf.text(info.value, PDF_CONFIG.margin.left + 60 - valueWidth, currentY)
          currentY += 6
        } catch (error) {
          console.warn(`Error rendering payment info: ${info.label}`, error)
          // Continue with next payment info
        }
      })
    } catch (error) {
      console.warn('Error processing payment information:', error)
      // Show fallback payment info
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(PDF_CONFIG.fonts.small)
      pdf.setTextColor(PDF_CONFIG.colors.secondary)
      pdf.text('付款資訊暫時無法顯示', PDF_CONFIG.margin.left, currentY)
      currentY += 6
    }

    currentY += 5

    // === 6. 付款記錄表格 ===
    if (pdfOptions.showPaymentHistory && validatedPayments && validatedPayments.length > 0) {
      try {
        currentY += PDF_CONFIG.spacing.sectionGap

        // 付款記錄標題
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(PDF_CONFIG.fonts.tiny)
        pdf.setTextColor(PDF_CONFIG.colors.secondary)
        pdf.text('PAYMENT HISTORY', PDF_CONFIG.margin.left, currentY)
        currentY += 8

        const paymentHeaders = ['付款日期', '付款方式', '金額', '收據號碼', '備註']
        const paymentColumnWidths = [40, 25, 25, 30, 50]

        // Generate payment rows with error handling for each payment
        const paymentRows = validatedPayments.map((payment, index) => {
          try {
            return [
              formatDateTime(payment.payment_date).split(' ')[0], // 只顯示日期
              payment.method || 'Unknown',
              `NT$ ${formatCurrency(payment.amount)}`,
              payment.receipt_number || '-',
              payment.notes || '-'
            ]
          } catch (error) {
            console.warn(`Error formatting payment row ${index}:`, error)
            return [
              'Error',
              'Unknown',
              'NT$ 0',
              '-',
              'Error processing payment data'
            ]
          }
        })

        currentY = drawElegantTable(pdf, paymentHeaders, paymentRows, PDF_CONFIG.margin.left, currentY, paymentColumnWidths)
      } catch (error) {
        console.warn('Error generating payment history table:', error)
        // Continue PDF generation even if payment table fails
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(PDF_CONFIG.fonts.small)
        pdf.setTextColor(PDF_CONFIG.colors.secondary)
        pdf.text('付款記錄暫時無法顯示', PDF_CONFIG.margin.left, currentY)
        currentY += 10
      }
    }

    // === 7. 優雅的頁尾 ===
    currentY += 25

    // 感謝語 - 使用優雅的字體
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(PDF_CONFIG.fonts.normal)
    pdf.setTextColor(PDF_CONFIG.colors.primary)

    const thankYou = '感謝您選擇我們的服務'
    const thankYouWidth = pdf.getTextWidth(thankYou)
    pdf.text(thankYou, (PDF_CONFIG.pageWidth - thankYouWidth) / 2, currentY)

    currentY += 10

    // 頁尾資訊
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(PDF_CONFIG.fonts.small)
    pdf.setTextColor(PDF_CONFIG.colors.secondary)

    const footerTexts = [
      '若有任何疑問，歡迎隨時與我們聯繫',
      '本收據為電腦產生，無需簽章',
      `列印時間: ${formatDateTime(new Date().toISOString())}`
    ]

    footerTexts.forEach(text => {
      const textWidth = pdf.getTextWidth(text)
      pdf.text(text, (PDF_CONFIG.pageWidth - textWidth) / 2, currentY)
      currentY += 4
    })

    // 生成文件名並下載
    const filename = generateFilename(order, config.brandName, pdfOptions.filename)
    pdf.save(filename)

    console.log(`優雅 PDF 已生成並下載: ${filename}`)

  } catch (error) {
    const err = error as Error
    logPdfGenerationError(order.order_id, 'directPdfService', err, 'generateDirectPDF')
    throw new Error(`PDF 生成失敗: ${err.message}`)
  }
}

// 快速生成收據 PDF
export function generateReceiptPDF(order: Order, studioConfig?: Partial<StudioConfig>): Promise<void> {
  return generateDirectPDF(order, studioConfig, {
    showPaymentHistory: false,
    showItemDetails: true
  })
}

// 生成詳細發票 PDF
export function generateDetailedInvoicePDF(order: Order, studioConfig?: Partial<StudioConfig>): Promise<void> {
  return generateDirectPDF(order, studioConfig, {
    showPaymentHistory: true,
    showItemDetails: true
  })
}
