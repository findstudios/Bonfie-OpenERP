/**
 * PDF 列印服務 - 生成 A4 規格的 PDF 收據
 */

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { getStatusText } from '@/services/orderStatus'
import type { Order, Payment } from '@/utils/paymentCalculator'
import { getTotalPaid, getUnpaidAmount } from '@/utils/paymentCalculator'
import { logPaymentValidationError, logPdfGenerationError, errorMonitor, ErrorCategory, ErrorSeverity } from '@/services/errorMonitoringService'

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
        logPaymentValidationError(payment, index, 'pdfPrintService', 'Payment object is null/undefined')
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
        logPaymentValidationError(payment, index, 'pdfPrintService',
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
      logPaymentValidationError(payment, index, 'pdfPrintService',
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

// 公司/機構資訊配置
export interface StudioConfig {
  name: string
  brandName: string
  address: string
  phone: string
  email: string
  website: string
  taxId?: string
}

// PDF 列印選項
export interface PDFPrintOptions {
  showPaymentHistory: boolean
  showItemDetails: boolean
  format: 'receipt' | 'invoice' | 'detailed'
  autoDownload: boolean
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

const DEFAULT_PDF_OPTIONS: PDFPrintOptions = {
  showPaymentHistory: true,
  showItemDetails: true,
  autoDownload: true,
  format: 'invoice'
}

// 生成文件名
function generateFilename(order: Order, brandName: string, customFilename?: string): string {
  if (customFilename) {
    return customFilename
  }

  return `${brandName}_${order.order_id}.pdf`
}

// 創建 A4 HTML 模板
function createA4Template(
  order: Order,
  studioConfig: StudioConfig,
  options: PDFPrintOptions
): string {
  // Validate payment data before processing
  const validatedPayments = validatePaymentData(order.payments || [])
  const totalPaid = getTotalPaid(validatedPayments)
  const unpaidAmount = getUnpaidAmount({ ...order, payments: validatedPayments })

  const itemsHTML = options.showItemDetails ? generateItemsHTML(order.items || []) : ''
  const paymentHistoryHTML = options.showPaymentHistory ? generatePaymentHistoryHTML(validatedPayments) : ''

  return `
    <!DOCTYPE html>
    <html lang="zh-Hant">
    <head>
        <meta charset="UTF-8">
        <title>訂單收據</title>
        <style>
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            
            body {
                font-family: 'Microsoft JhengHei', 'Arial', sans-serif;
                font-size: 12px;
                line-height: 1.6;
                color: #333;
                padding: 20mm;
                background: white;
                /* A4 尺寸：210mm x 297mm */
                width: 210mm;
                min-height: 297mm;
                margin: 0 auto;
            }
            
            .header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #333;
                padding-bottom: 15px;
            }
            
            .header h1 {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 8px;
                color: #2563eb;
            }
            
            .header .company-info {
                font-size: 11px;
                color: #666;
                line-height: 1.4;
            }
            
            .document-title {
                text-align: center;
                font-size: 18px;
                font-weight: bold;
                margin: 20px 0;
                color: #1f2937;
            }
            
            .order-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 25px;
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 6px;
            }
            
            .info-section h3 {
                font-size: 14px;
                color: #374151;
                margin-bottom: 10px;
                border-bottom: 1px solid #d1d5db;
                padding-bottom: 4px;
            }
            
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 6px;
            }
            
            .info-label {
                font-weight: bold;
                color: #4b5563;
                min-width: 80px;
            }
            
            .info-value {
                color: #111827;
                text-align: right;
            }
            
            .items-section {
                margin: 25px 0;
            }
            
            .items-section h3 {
                font-size: 16px;
                color: #374151;
                margin-bottom: 12px;
                padding-bottom: 6px;
                border-bottom: 2px solid #e5e7eb;
            }
            
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
            }
            
            .items-table th {
                background-color: #f3f4f6;
                color: #374151;
                font-weight: bold;
                padding: 10px 8px;
                text-align: left;
                border: 1px solid #d1d5db;
                font-size: 11px;
            }
            
            .items-table td {
                padding: 10px 8px;
                border: 1px solid #e5e7eb;
                font-size: 11px;
            }
            
            .items-table tr:nth-child(even) {
                background-color: #f9fafb;
            }
            
            .item-name {
                font-weight: bold;
                color: #111827;
            }
            
            .item-notes {
                font-size: 10px;
                color: #6b7280;
                margin-top: 2px;
            }
            
            .text-right {
                text-align: right;
            }
            
            .summary {
                margin-top: 20px;
                padding: 20px;
                background-color: #f8f9fa;
                border-radius: 6px;
            }
            
            .summary-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 13px;
            }
            
            .summary-row.total {
                font-size: 16px;
                font-weight: bold;
                color: #dc2626;
                border-top: 2px solid #e5e7eb;
                padding-top: 10px;
                margin-top: 12px;
            }
            
            .summary-row.paid {
                color: #059669;
                font-weight: bold;
            }
            
            .summary-row.unpaid {
                color: #dc2626;
                font-weight: bold;
            }
            
            .payment-history {
                margin-top: 25px;
            }
            
            .payment-history h3 {
                font-size: 16px;
                color: #374151;
                margin-bottom: 12px;
                padding-bottom: 6px;
                border-bottom: 2px solid #e5e7eb;
            }
            
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                font-size: 11px;
                color: #6b7280;
            }
            
            .status-badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: bold;
                text-transform: uppercase;
            }
            
            .status-pending {
                background-color: #fef3c7;
                color: #92400e;
            }
            
            .status-confirmed {
                background-color: #d1fae5;
                color: #065f46;
            }
            
            .status-cancelled {
                background-color: #fee2e2;
                color: #991b1b;
            }
            
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${studioConfig.name}</h1>
            <div class="company-info">
                ${studioConfig.address}<br>
                電話: ${studioConfig.phone} | Email: ${studioConfig.email}<br>
                ${studioConfig.website}
                ${studioConfig.taxId ? `<br>統一編號: ${studioConfig.taxId}` : ''}
            </div>
        </div>
        
        <div class="document-title">
            ${options.format === 'receipt' ? '收據' : '訂單發票'}
        </div>
        
        <div class="order-info">
            <div class="info-section">
                <h3>訂單資訊</h3>
                <div class="info-row">
                    <span class="info-label">訂單編號:</span>
                    <span class="info-value">${order.order_id}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">建立時間:</span>
                    <span class="info-value">${formatDateTime(order.created_at || '')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">狀態:</span>
                    <span class="info-value">
                        <span class="status-badge status-${order.status}">
                            ${getStatusText(order.status as any)}
                        </span>
                    </span>
                </div>
            </div>
            
            <div class="info-section">
                <h3>客戶資訊</h3>
                <div class="info-row">
                    <span class="info-label">學生姓名:</span>
                    <span class="info-value">${(order as any).student?.chinese_name || '未知'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">聯絡電話:</span>
                    <span class="info-value">${(order as any).contact?.phone || '未提供'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">電子信箱:</span>
                    <span class="info-value">${(order as any).contact?.email || '未提供'}</span>
                </div>
            </div>
        </div>
        
        ${itemsHTML}
        
        <div class="summary">
            <div class="summary-row">
                <span>原價金額:</span>
                <span>NT$ ${formatCurrency(order.original_amount)}</span>
            </div>
            <div class="summary-row">
                <span>折扣金額:</span>
                <span>- NT$ ${formatCurrency(order.discount_amount)}</span>
            </div>
            <div class="summary-row total">
                <span>應付金額:</span>
                <span>NT$ ${formatCurrency(order.final_amount)}</span>
            </div>
            <div class="summary-row paid">
                <span>已付金額:</span>
                <span>NT$ ${formatCurrency(totalPaid)}</span>
            </div>
            <div class="summary-row unpaid">
                <span>未付金額:</span>
                <span>NT$ ${formatCurrency(unpaidAmount)}</span>
            </div>
        </div>
        
        ${paymentHistoryHTML}
        
        <div class="footer">
            <p>感謝您的支持與信任！</p>
            <p>此為系統自動產生之單據，如有疑問請洽客服專線</p>
            <p>列印時間: ${formatDateTime(new Date().toISOString())}</p>
        </div>
    </body>
    </html>
  `
}

// 生成訂單項目 HTML
function generateItemsHTML(items: any[]): string {
  if (!items || items.length === 0) {
    return `
      <div class="items-section">
        <h3>訂單項目</h3>
        <p style="text-align: center; color: #6b7280; padding: 20px;">無項目資料</p>
      </div>
    `
  }

  return `
    <div class="items-section">
      <h3>訂單項目</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 40%;">項目名稱</th>
            <th style="width: 10%; text-align: center;">數量</th>
            <th style="width: 20%; text-align: right;">單價</th>
            <th style="width: 15%; text-align: right;">折扣</th>
            <th style="width: 15%; text-align: right;">小計</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>
                <div class="item-name">${item.item_name}</div>
                ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ''}
              </td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">NT$ ${formatCurrency(item.unit_price)}</td>
              <td class="text-right">${item.discount_amount ? `- NT$ ${formatCurrency(item.discount_amount)}` : '-'}</td>
              <td class="text-right">NT$ ${formatCurrency(item.final_price || item.total_price)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}

// 生成付款歷史 HTML
function generatePaymentHistoryHTML(payments: SafePayment[]): string {
  if (!payments || payments.length === 0) {
    return ''
  }

  return `
    <div class="payment-history">
      <h3>付款記錄</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 25%;">付款日期</th>
            <th style="width: 20%;">付款方式</th>
            <th style="width: 20%; text-align: right;">金額</th>
            <th style="width: 20%;">收據號碼</th>
            <th style="width: 15%;">備註</th>
          </tr>
        </thead>
        <tbody>
          ${payments.map((payment, index) => {
    try {
      return `
                <tr>
                  <td>${formatDateTime(payment.payment_date)}</td>
                  <td>${payment.method || 'Unknown'}</td>
                  <td class="text-right">NT$ ${formatCurrency(payment.amount)}</td>
                  <td>${payment.receipt_number || '-'}</td>
                  <td>${payment.notes || '-'}</td>
                </tr>
              `
    } catch (error) {
      errorMonitor.logError(
        `Error formatting payment row ${index}`,
        {
          category: ErrorCategory.FORMATTING,
          severity: ErrorSeverity.WARNING,
          service: 'pdfPrintService',
          function: 'generatePaymentHistoryHTML',
          metadata: { paymentIndex: index }
        },
                error as Error
      )
      return `
                <tr>
                  <td>Error</td>
                  <td>Unknown</td>
                  <td class="text-right">NT$ 0</td>
                  <td>-</td>
                  <td>Error processing payment data</td>
                </tr>
              `
    }
  }).join('')}
        </tbody>
      </table>
    </div>
  `
}

// 主要 PDF 生成函數
export async function generatePDF(
  order: Order,
  studioConfig: Partial<StudioConfig> = {},
  options: Partial<PDFPrintOptions> = {}
): Promise<void> {
  const config = { ...DEFAULT_STUDIO_CONFIG, ...studioConfig }
  const pdfOptions = { ...DEFAULT_PDF_OPTIONS, ...options }

  try {
    // 創建臨時 HTML 元素
    const htmlContent = createA4Template(order, config, pdfOptions)
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.top = '-9999px'
    document.body.appendChild(tempDiv)

    // 等待字體和樣式載入
    await new Promise(resolve => setTimeout(resolve, 100))

    // 使用 html2canvas 轉換為 canvas
    const canvas = await html2canvas(tempDiv.querySelector('body') as HTMLElement, {
      scale: 2, // 提高解析度
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 寬度 (210mm * 3.78)
      height: 1123 // A4 高度 (297mm * 3.78)
    })

    // 清理臨時元素
    document.body.removeChild(tempDiv)

    // 創建 PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const imgData = canvas.toDataURL('image/png')
    const imgWidth = 210 // A4 寬度
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // 如果內容高度超過 A4，需要分頁
    let position = 0
    const pageHeight = 297 // A4 高度

    if (imgHeight <= pageHeight) {
      // 單頁
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
    } else {
      // 多頁
      while (position < imgHeight) {
        pdf.addImage(imgData, 'PNG', 0, -position, imgWidth, imgHeight)
        position += pageHeight

        if (position < imgHeight) {
          pdf.addPage()
        }
      }
    }

    // 生成文件名並下載
    const filename = generateFilename(order, config.brandName, pdfOptions.filename)

    if (pdfOptions.autoDownload) {
      pdf.save(filename)
    }

    console.log(`PDF 已生成: ${filename}`)

  } catch (error) {
    const err = error as Error
    logPdfGenerationError(order.order_id, 'pdfPrintService', err, 'generatePDF')
    throw new Error(`PDF 生成失敗: ${err.message}`)
  }
}

// 快速生成收據 PDF
export function generateReceiptPDF(order: Order, studioConfig?: Partial<StudioConfig>): Promise<void> {
  return generatePDF(order, studioConfig, {
    format: 'receipt',
    showPaymentHistory: false,
    showItemDetails: true,
    autoDownload: true
  })
}

// 生成詳細發票 PDF
export function generateDetailedInvoicePDF(order: Order, studioConfig?: Partial<StudioConfig>): Promise<void> {
  return generatePDF(order, studioConfig, {
    format: 'detailed',
    showPaymentHistory: true,
    showItemDetails: true,
    autoDownload: true
  })
}

// 自定義文件名生成
export function generateCustomPDF(
  order: Order,
  filename: string,
  studioConfig?: Partial<StudioConfig>
): Promise<void> {
  return generatePDF(order, studioConfig, {
    format: 'invoice',
    showPaymentHistory: true,
    showItemDetails: true,
    autoDownload: true,
    filename
  })
}
