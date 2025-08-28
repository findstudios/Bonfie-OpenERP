/**
 * 列印服務 - 統一管理各種列印功能
 */

import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { getStatusText } from '@/services/orderStatus'
import type { Order, Payment } from '@/utils/paymentCalculator'
import { getTotalPaid, getUnpaidAmount } from '@/utils/paymentCalculator'
import { logPaymentValidationError, errorMonitor, ErrorCategory, ErrorSeverity } from '@/services/errorMonitoringService'
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
        logPaymentValidationError(payment, index, 'printService', 'Payment object is null/undefined')
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
        logPaymentValidationError(payment, index, 'printService',
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
      logPaymentValidationError(payment, index, 'printService',
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
  address: string
  phone: string
  email: string
  website: string
  logo_url?: string
  tax_id?: string
  director?: string
  business_hours?: string
}

// 列印選項
export interface PrintOptions {
  showPaymentHistory: boolean
  showItemDetails: boolean
  autoClose: boolean
  format: 'receipt' | 'invoice' | 'detailed'
}

// 預設配置
const DEFAULT_STUDIO_CONFIG: StudioConfig = {
  name: 'OpenERP管理系統',
  address: '台北市中正區中山南路1號',
  phone: '(02) 2388-1234',
  email: 'info@tutoring.com',
  website: 'www.tutoring.com',
  logo_url: '',
  tax_id: '',
  director: '',
  business_hours: ''
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
        address: basicInfo.address || DEFAULT_STUDIO_CONFIG.address,
        phone: basicInfo.phone || DEFAULT_STUDIO_CONFIG.phone,
        email: basicInfo.email || DEFAULT_STUDIO_CONFIG.email,
        website: DEFAULT_STUDIO_CONFIG.website,
        logo_url: basicInfo.logo_url || '',
        tax_id: basicInfo.tax_id || '',
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

const DEFAULT_PRINT_OPTIONS: PrintOptions = {
  showPaymentHistory: true,
  showItemDetails: true,
  autoClose: true,
  format: 'invoice'
}

// 載入 HTML 模板
async function loadTemplate(): Promise<string> {
  try {
    const response = await fetch('/src/templates/invoice-template.html')
    if (!response.ok) {
      throw new Error('模板載入失敗')
    }
    return await response.text()
  } catch (error) {
    console.warn('無法載入外部模板，使用內建模板')
    return getBuiltInTemplate()
  }
}

// 內建模板 (備用)
function getBuiltInTemplate(): string {
  return `
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <title>訂單收據</title>
    <style>
        body { font-family: 'Microsoft JhengHei', sans-serif; padding: 20px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .logo { width: 80px; height: 80px; margin: 0 auto 15px; }
        .logo img { width: 100%; height: 100%; object-fit: contain; }
        .company-info { margin-bottom: 10px; }
        .order-info { margin-bottom: 20px; }
        .items { margin: 20px 0; }
        .items table { width: 100%; border-collapse: collapse; }
        .items th, .items td { padding: 8px; border: 1px solid #ddd; text-align: left; }
        .items th { background-color: #f5f5f5; }
        .summary { margin-top: 20px; text-align: right; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        @media print { body { padding: 0; } }
    </style>
</head>
<body>
    <div class="header">
        {{logoSection}}
        <div class="company-info">
            <h1>{{studioName}}</h1>
            <p>{{studioAddress}} | {{studioContact}}</p>
            {{taxIdSection}}
            {{directorSection}}
            {{businessHoursSection}}
        </div>
    </div>
    
    <div class="order-info">
        <h2>訂單收據</h2>
        <p><strong>訂單編號：</strong>{{orderId}}</p>
        <p><strong>客戶姓名：</strong>{{customerName}}</p>
        <p><strong>建立時間：</strong>{{orderDate}}</p>
        <p><strong>訂單狀態：</strong>{{orderStatus}}</p>
    </div>
    
    <div class="items">
        <h3>訂單項目</h3>
        {{items}}
    </div>
    
    <div class="summary">
        <p><strong>原價金額：</strong>{{subtotal}}</p>
        <p><strong>折扣金額：</strong>-{{discount}}</p>
        <p><strong>最終金額：</strong>{{total}}</p>
        <p><strong>已付金額：</strong>{{paidAmount}}</p>
        <p><strong>未付金額：</strong>{{unpaidAmount}}</p>
    </div>
    
    {{paymentHistory}}
    
    <div class="footer">
        <p>感謝您的支持！</p>
        <p>{{studioWebsite}}</p>
    </div>
    
    <script>
        window.onload = function() {
            try {
                window.print();
                {{autoCloseScript}}
            } catch (e) {
                // Ignore errors during print
            }
        }
    </script>
</body>
</html>`
}

// 生成訂單項目 HTML
function generateItemsHTML(items: any[]): string {
  if (!items || items.length === 0) {
    return '<p>無項目</p>'
  }

  return `
    <table>
      <thead>
        <tr>
          <th>項目名稱</th>
          <th>數量</th>
          <th>單價</th>
          <th>小計</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>
              <strong>${item.item_name}</strong>
              ${item.notes ? `<br><small>${item.notes}</small>` : ''}
            </td>
            <td>${item.quantity}</td>
            <td>NT$ ${formatCurrency(item.unit_price)}</td>
            <td>NT$ ${formatCurrency(item.final_price)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

// 生成付款歷史 HTML
function generatePaymentHistoryHTML(payments: Payment[]): string {
  if (!payments || payments.length === 0) {
    return ''
  }

  // Validate payment data before processing
  const validatedPayments = validatePaymentData(payments)

  return `
    <div class="payment-history" style="margin-top: 30px;">
      <h3>付款記錄</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 8px; border: 1px solid #ddd;">付款日期</th>
            <th style="padding: 8px; border: 1px solid #ddd;">付款方式</th>
            <th style="padding: 8px; border: 1px solid #ddd;">金額</th>
            <th style="padding: 8px; border: 1px solid #ddd;">收據號碼</th>
          </tr>
        </thead>
        <tbody>
          ${validatedPayments.map((payment, index) => {
    try {
      return `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">${formatDateTime(payment.payment_date)}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${payment.method || 'Unknown'}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">NT$ ${formatCurrency(payment.amount)}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${payment.receipt_number || '-'}</td>
                </tr>
              `
    } catch (error) {
      errorMonitor.logError(
        `Error formatting payment row ${index}`,
        {
          category: ErrorCategory.FORMATTING,
          severity: ErrorSeverity.WARNING,
          service: 'printService',
          function: 'generatePaymentHistoryHTML',
          metadata: { paymentIndex: index }
        },
                error as Error
      )
      return `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">Error</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">Unknown</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">$0</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">-</td>
                </tr>
              `
    }
  }).join('')}
        </tbody>
      </table>
    </div>
  `
}

// 主要列印函數
export async function printOrder(
  order: Order,
  studioConfig: Partial<StudioConfig> = {},
  printOptions: Partial<PrintOptions> = {}
): Promise<void> {
  // 載入系統設定並與傳入的配置合併
  const systemConfig = await loadSystemConfig()
  const config = { ...systemConfig, ...studioConfig }
  const options = { ...DEFAULT_PRINT_OPTIONS, ...printOptions }

  try {
    // 載入模板
    let template = await loadTemplate()

    // 準備數據 - with payment validation
    const validatedPayments = validatePaymentData(order.payments || [])
    const totalPaid = getTotalPaid(validatedPayments)
    const unpaidAmount = getUnpaidAmount({ ...order, payments: validatedPayments })

    // 準備模板替換變數
    const logoSection = config.logo_url ?
      `<div class="logo"><img src="${config.logo_url}" alt="${config.name} LOGO" /></div>` : ''

    const taxIdSection = config.tax_id ?
      `<p><small>統一編號: ${config.tax_id}</small></p>` : ''

    const directorSection = config.director ?
      `<p><small>負責人: ${config.director}</small></p>` : ''

    const businessHoursSection = config.business_hours ?
      `<p><small>營業時間: ${config.business_hours}</small></p>` : ''

    // 替換模板變數
    const replacements = {
      logoSection,
      taxIdSection,
      directorSection,
      businessHoursSection,
      studioName: config.name,
      studioAddress: config.address,
      studioContact: `電話: ${config.phone} | Email: ${config.email}`,
      studioWebsite: config.website,
      orderId: order.order_id,
      orderDate: formatDateTime(order.created_at || ''),
      orderStatus: getStatusText(order.status as any),
      customerName: (order as any).student?.chinese_name || '未知客戶',
      customerPhone: (order as any).contact?.phone || '',
      customerEmail: (order as any).contact?.email || '',
      customerAddress: (order as any).contact?.address || '',
      subtotal: `NT$ ${formatCurrency(order.original_amount)}`,
      discount: `NT$ ${formatCurrency(order.discount_amount)}`,
      total: `NT$ ${formatCurrency(order.final_amount)}`,
      paidAmount: `NT$ ${formatCurrency(totalPaid)}`,
      unpaidAmount: `NT$ ${formatCurrency(unpaidAmount)}`,
      items: options.showItemDetails ? generateItemsHTML(order.items || []) : '<p>項目明細已隱藏</p>',
      paymentHistory: options.showPaymentHistory ? generatePaymentHistoryHTML(validatedPayments) : '',
      autoCloseScript: options.autoClose ? 'setTimeout(() => window.close(), 1000);' : ''
    }

    // 執行替換
    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      template = template.replace(regex, value)
    })

    // 開啟列印視窗
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) {
      throw new Error('無法開啟列印視窗，請檢查瀏覽器彈出視窗設定')
    }

    printWindow.document.write(template)
    printWindow.document.close()

  } catch (error) {
    const err = error as Error
    errorMonitor.logError(
      'Print operation failed',
      {
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.ERROR,
        service: 'printService',
        function: 'printOrder',
        metadata: { orderId: order.order_id }
      },
      err
    )
    alert(`列印失敗: ${err.message}`)
  }
}

// 快速列印收據
export async function printReceipt(order: Order, studioConfig?: Partial<StudioConfig>): Promise<void> {
  return printOrder(order, studioConfig, {
    format: 'receipt',
    showPaymentHistory: false,
    showItemDetails: true,
    autoClose: true
  })
}

// 列印詳細發票
export async function printDetailedInvoice(order: Order, studioConfig?: Partial<StudioConfig>): Promise<void> {
  return printOrder(order, studioConfig, {
    format: 'detailed',
    showPaymentHistory: true,
    showItemDetails: true,
    autoClose: false
  })
}

// 列印簡化版本
export async function printSimple(order: Order, studioConfig?: Partial<StudioConfig>): Promise<void> {
  return printOrder(order, studioConfig, {
    format: 'invoice',
    showPaymentHistory: false,
    showItemDetails: false,
    autoClose: true
  })
}
