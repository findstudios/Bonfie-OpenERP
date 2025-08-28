/**
 * 模板預覽服務 - 生成模板預覽HTML
 */

import type { PDFTemplate } from './templateService'
import { formatCurrency, formatDateTime } from '@/utils/formatters'

// 示例訂單數據用於預覽
const SAMPLE_ORDER = {
  order_id: 'R20250101000',
  created_at: new Date().toISOString(),
  status: 'confirmed',
  original_amount: 5000,
  discount_amount: 500,
  final_amount: 4500,
  student: { chinese_name: '聯絡人' },
  contact: {
    phone: '0912-345-678',
    email: 'example@email.com',
    address: '台北市中正區中山南路1號'
  },
  items: [
    {
      item_name: '數學課程 (月費)',
      quantity: 1,
      unit_price: 3000,
      final_price: 3000,
      notes: '每週二堂課'
    },
    {
      item_name: '英文課程 (月費)',
      quantity: 1,
      unit_price: 2500,
      final_price: 1500,
      notes: '每週一堂課 (早鳥優惠)'
    }
  ],
  payments: [
    {
      payment_date: new Date().toISOString(),
      method: '現金',
      amount: 2000,
      receipt_number: 'R001'
    },
    {
      payment_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      method: '轉帳',
      amount: 2500,
      receipt_number: 'R002'
    }
  ]
}

// 示例系統設定
const SAMPLE_STUDIO_CONFIG = {
  name: 'ABC 補習班',
  address: '台北市大安區復興南路一段123號2樓',
  phone: '(02) 2700-1234',
  email: 'info@abc-tutoring.com',
  website: 'www.abc-tutoring.com',
  taxId: '12345678',
  director: '張主任',
  business_hours: '週一至週六 09:00-21:00',
  logo_url: '/sample-logo.png' // 示例LOGO
}

/**
 * 生成模板預覽HTML
 */
export function generateTemplatePreview(template: PDFTemplate, studioConfig?: any): string {
  console.log('generateTemplatePreview 被呼叫，模板:', {
    name: template.name,
    type: template.type,
    layout_type: template.template_data.layout_type,
    has_custom_html: !!template.template_data.custom_html
  })

  // 使用傳入的設定或預設值
  const config = studioConfig || SAMPLE_STUDIO_CONFIG

  const totalPaid = SAMPLE_ORDER.payments.reduce((sum, p) => sum + p.amount, 0)
  const unpaidAmount = SAMPLE_ORDER.final_amount - totalPaid

  // 如果是自定義類型且有custom_html，直接使用自定義預覽
  if (template.type === 'custom' && template.template_data.custom_html) {
    console.log('檢測到自定義模板，使用generateCustomPreview')
    return generateCustomPreview(template, totalPaid, unpaidAmount, config)
  }

  // 根據模板風格生成不同的預覽
  switch (template.template_data.layout_type) {
    case 'modern':
      return generateModernPreview(template, totalPaid, unpaidAmount, config)
    case 'classic':
      // 經典風格已移除，使用現代風格代替
      return generateModernPreview(template, totalPaid, unpaidAmount, config)
    case 'minimal':
      return generateMinimalPreview(template, totalPaid, unpaidAmount, config)
    case 'custom':
      // 檢查是否為瀏覽器列印版
      if (template.template_data.custom_html === 'browser_print') {
        return generateBrowserPrintPreview(template, totalPaid, unpaidAmount, config)
      }
      return generateCustomPreview(template, totalPaid, unpaidAmount, config)
    default:
      return generateModernPreview(template, totalPaid, unpaidAmount, config)
  }
}

/**
 * 現代風格預覽
 */
function generateModernPreview(template: PDFTemplate, totalPaid: number, unpaidAmount: number, config: any): string {
  const logoSection = template.template_data.show_logo && config.logo_url
    ? `<div class="logo-section"><img src="${config.logo_url}" alt="LOGO" style="max-width: 40px; max-height: 40px; object-fit: contain;" /></div>`
    : ''

  const itemsSection = template.template_data.show_item_details
    ? generateItemsHTML()
    : '<p class="no-items">項目明細已隱藏</p>'

  const paymentSection = template.template_data.show_payment_history
    ? generatePaymentHistoryHTML()
    : ''

  // 使用固定的藍色主題
  const primaryColor = '#2563eb'
  const secondaryColor = '#3b82f6'
  const accentColor = '#60a5fa'

  return `
    <div class="template-preview modern-style" style="font-family: 'Microsoft JhengHei', sans-serif; width: 380px; height: 520px; margin: 0 auto; background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <style>
        .modern-style { --primary: ${primaryColor}; --secondary: ${secondaryColor}; --accent: ${accentColor}; }
        .header { background: var(--primary); color: white; padding: 20px; text-align: center; }
        .logo-section { margin-bottom: 12px; }
        .logo-placeholder { width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; font-size: 12px; }
        .company-name { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
        .company-info { font-size: 13px; opacity: 0.9; line-height: 1.5; }
        .content { padding: 18px; }
        .document-title { text-align: center; font-size: 16px; font-weight: bold; color: var(--primary); margin-bottom: 18px; }
        .order-info { background: #f8f9fa; padding: 14px; border-radius: 8px; margin-bottom: 18px; font-size: 14px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 13px; }
        .items-table th { background: var(--accent); color: white; padding: 10px 8px; text-align: left; font-size: 13px; }
        .items-table td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        .summary { background: var(--accent); color: white; padding: 14px; border-radius: 8px; margin-bottom: 14px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
        .summary-row.total { font-weight: bold; font-size: 14px; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 8px; margin-top: 8px; }
        .payment-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .payment-table th { background: #f3f4f6; padding: 8px 6px; text-align: left; font-size: 12px; }
        .payment-table td { padding: 6px; border-bottom: 1px solid #e5e7eb; }
        .no-items { text-align: center; color: #6b7280; padding: 24px; font-size: 13px; }
        .footer { text-align: center; padding: 14px; background: #f8f9fa; color: #6b7280; font-size: 12px; line-height: 1.5; }
      </style>
      
      <div class="header">
        ${logoSection}
        <div class="company-name">${config.name || ''}</div>
        <div class="company-info">
          ${config.address || ''}<br>
          ${config.phone || ''} | ${config.email || ''}
        </div>
      </div>
      
      <div class="content">
        <div class="document-title">${template.category === 'receipt' ? '收據' : '發票'}</div>
        
        <div class="order-info">
          <div class="info-row">
            <span><strong>訂單編號:</strong></span>
            <span>${SAMPLE_ORDER.order_id}</span>
          </div>
          <div class="info-row">
            <span><strong>客戶姓名:</strong></span>
            <span>${SAMPLE_ORDER.student.chinese_name}</span>
          </div>
          <div class="info-row">
            <span><strong>建立時間:</strong></span>
            <span>${formatDateTime(SAMPLE_ORDER.created_at).split(' ')[0]}</span>
          </div>
        </div>
        
        ${itemsSection}
        
        <div class="summary">
          <div class="summary-row">
            <span>小計:</span>
            <span>NT$ ${formatCurrency(SAMPLE_ORDER.original_amount)}</span>
          </div>
          <div class="summary-row">
            <span>折扣:</span>
            <span>- NT$ ${formatCurrency(SAMPLE_ORDER.discount_amount)}</span>
          </div>
          <div class="summary-row total">
            <span>總金額:</span>
            <span>NT$ ${formatCurrency(SAMPLE_ORDER.final_amount)}</span>
          </div>
        </div>
        
        ${paymentSection}
      </div>
      
      <div class="footer">
        感謝您的支持！<br>
        此為模板預覽，實際收據以系統產生為準
      </div>
    </div>
  `
}

// 經典風格預覽已移除

/**
 * 簡約風格預覽
 */
function generateMinimalPreview(template: PDFTemplate, totalPaid: number, unpaidAmount: number, config: any): string {
  const logoSection = template.template_data.show_logo && config.logo_url
    ? `<div class="logo-minimal"><img src="${config.logo_url}" alt="LOGO" style="max-width: 32px; max-height: 32px; object-fit: contain;" /></div>`
    : ''

  const itemsSection = template.template_data.show_item_details
    ? generateSimpleItemsHTML()
    : '<p class="no-items">項目明細已隱藏</p>'

  const paymentSection = template.template_data.show_payment_history
    ? generateSimplePaymentHTML()
    : ''

  return `
    <div class="template-preview minimal-style" style="font-family: 'Helvetica', sans-serif; width: 320px; height: 450px; margin: 0 auto; background: white; border: 1px solid #e5e7eb; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <style>
        .minimal-style .header { margin-bottom: 24px; }
        .minimal-style .logo-minimal { width: 32px; height: 32px; background: #f3f4f6; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; font-size: 10px; color: #6b7280; }
        .minimal-style .company-name { font-size: 16px; font-weight: 500; margin-bottom: 6px; color: #111827; }
        .minimal-style .company-info { font-size: 12px; color: #6b7280; line-height: 1.5; }
        .minimal-style .document-title { font-size: 15px; font-weight: 500; margin-bottom: 18px; color: #374151; }
        .minimal-style .order-info { margin-bottom: 18px; }
        .minimal-style .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
        .minimal-style .info-label { color: #6b7280; }
        .minimal-style .info-value { color: #111827; }
        .minimal-style .items-simple { margin-bottom: 18px; }
        .minimal-style .item-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px; padding-bottom: 6px; border-bottom: 1px solid #f3f4f6; }
        .minimal-style .item-name { color: #111827; font-weight: 500; }
        .minimal-style .item-price { color: #6b7280; }
        .minimal-style .summary-minimal { border-top: 1px solid #e5e7eb; padding-top: 12px; margin-bottom: 18px; }
        .minimal-style .summary-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
        .minimal-style .summary-row.total { font-weight: 600; font-size: 13px; color: #111827; }
        .minimal-style .payment-simple { font-size: 11px; }
        .minimal-style .payment-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .minimal-style .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #9ca3af; line-height: 1.5; }
        .minimal-style .no-items { text-align: center; color: #9ca3af; padding: 20px; font-size: 12px; }
      </style>
      
      <div class="header">
        ${logoSection}
        <div class="company-name">${config.name || ''}</div>
        <div class="company-info">
          ${config.address || ''}<br>
          ${config.phone || ''}
        </div>
      </div>
      
      <div class="document-title">${template.category === 'receipt' ? '收據' : '發票'}</div>
      
      <div class="order-info">
        <div class="info-row">
          <span class="info-label">訂單編號</span>
          <span class="info-value">${SAMPLE_ORDER.order_id}</span>
        </div>
        <div class="info-row">
          <span class="info-label">客戶</span>
          <span class="info-value">${SAMPLE_ORDER.student.chinese_name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">日期</span>
          <span class="info-value">${formatDateTime(SAMPLE_ORDER.created_at).split(' ')[0]}</span>
        </div>
      </div>
      
      ${itemsSection}
      
      <div class="summary-minimal">
        <div class="summary-row">
          <span>小計</span>
          <span>NT$ ${formatCurrency(SAMPLE_ORDER.original_amount)}</span>
        </div>
        <div class="summary-row">
          <span>折扣</span>
          <span>- NT$ ${formatCurrency(SAMPLE_ORDER.discount_amount)}</span>
        </div>
        <div class="summary-row total">
          <span>總計</span>
          <span>NT$ ${formatCurrency(SAMPLE_ORDER.final_amount)}</span>
        </div>
      </div>
      
      ${paymentSection}
      
      <div class="footer">
        模板預覽 · ${config.name || ''}
      </div>
    </div>
  `
}

/**
 * 生成項目HTML（表格形式）
 */
function generateItemsHTML(): string {
  return `
    <table class="items-table">
      <thead>
        <tr>
          <th>項目</th>
          <th>數量</th>
          <th>金額</th>
        </tr>
      </thead>
      <tbody>
        ${SAMPLE_ORDER.items.map(item => `
          <tr>
            <td>
              <strong>${item.item_name}</strong>
              ${item.notes ? `<br><small style="color: #6b7280;">${item.notes}</small>` : ''}
            </td>
            <td>${item.quantity}</td>
            <td>NT$ ${formatCurrency(item.final_price)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

/**
 * 生成簡單項目HTML
 */
function generateSimpleItemsHTML(): string {
  return `
    <div class="items-simple">
      ${SAMPLE_ORDER.items.map(item => `
        <div class="item-row">
          <div>
            <div class="item-name">${item.item_name}</div>
            ${item.notes ? `<div style="font-size: 9px; color: #9ca3af;">${item.notes}</div>` : ''}
          </div>
          <div class="item-price">NT$ ${formatCurrency(item.final_price)}</div>
        </div>
      `).join('')}
    </div>
  `
}

/**
 * 生成付款記錄HTML（表格形式）
 */
function generatePaymentHistoryHTML(): string {
  return `
    <div style="margin-top: 15px;">
      <h4 style="font-size: 12px; margin-bottom: 8px; color: #374151;">付款記錄</h4>
      <table class="payment-table">
        <thead>
          <tr>
            <th>日期</th>
            <th>方式</th>
            <th>金額</th>
          </tr>
        </thead>
        <tbody>
          ${SAMPLE_ORDER.payments.map(payment => `
            <tr>
              <td>${formatDateTime(payment.payment_date).split(' ')[0]}</td>
              <td>${payment.method}</td>
              <td>NT$ ${formatCurrency(payment.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}

/**
 * 生成簡單付款記錄HTML
 */
function generateSimplePaymentHTML(): string {
  return `
    <div class="payment-simple">
      <div style="font-size: 10px; color: #6b7280; margin-bottom: 6px;">付款記錄</div>
      ${SAMPLE_ORDER.payments.map(payment => `
        <div class="payment-row">
          <span>${formatDateTime(payment.payment_date).split(' ')[0]} ${payment.method}</span>
          <span>NT$ ${formatCurrency(payment.amount)}</span>
        </div>
      `).join('')}
    </div>
  `
}

/**
 * 瀏覽器列印版預覽
 */
function generateBrowserPrintPreview(template: PDFTemplate, totalPaid: number, unpaidAmount: number, config: any): string {
  const itemsSection = template.template_data.show_item_details
    ? generateSimpleItemsHTML()
    : '<p class="no-items">項目明細已隱藏</p>'

  const paymentSection = template.template_data.show_payment_history
    ? generateSimplePaymentHTML()
    : ''

  return `
    <div class="template-preview browser-print-style" style="font-family: 'Arial', sans-serif; width: 297px; height: 420px; margin: 0 auto; background: white; border: 1px solid #d1d5db; padding: 16px;">
      <style>
        .browser-print-style .header { text-align: center; margin-bottom: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 14px; }
        .browser-print-style .logo-section { margin-bottom: 10px; }
        .browser-print-style .logo-placeholder { width: 40px; height: 40px; background: #f3f4f6; border: 1px solid #d1d5db; display: flex; align-items: center; justify-content: center; margin: 0 auto; font-size: 10px; color: #6b7280; }
        .browser-print-style .company-name { font-size: 16px; font-weight: bold; margin: 10px 0; color: #111827; }
        .browser-print-style .company-info { font-size: 11px; color: #6b7280; line-height: 1.5; }
        .browser-print-style .document-title { text-align: center; font-size: 14px; font-weight: bold; margin: 18px 0; color: #374151; background: #f9fafb; padding: 10px; border-radius: 8px; }
        .browser-print-style .order-info { margin-bottom: 18px; background: #f8fafc; padding: 14px; border-radius: 8px; }
        .browser-print-style .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px; }
        .browser-print-style .info-label { color: #6b7280; font-weight: 500; }
        .browser-print-style .info-value { color: #111827; font-weight: 600; }
        .browser-print-style .items-simple { margin-bottom: 18px; }
        .browser-print-style .item-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px; background: #f8fafc; border-radius: 6px; font-size: 10px; }
        .browser-print-style .item-name { color: #111827; font-weight: 500; }
        .browser-print-style .item-price { color: #059669; font-weight: 600; }
        .browser-print-style .summary { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 18px; background: #fafafa; }
        .browser-print-style .summary-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; }
        .browser-print-style .summary-row.total { font-weight: bold; font-size: 12px; color: #059669; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px; }
        .browser-print-style .payment-simple { font-size: 10px; background: #f0f9ff; padding: 10px; border-radius: 6px; }
        .browser-print-style .payment-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .browser-print-style .footer { text-align: center; margin-top: 18px; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 14px; line-height: 1.4; }
        .browser-print-style .no-items { text-align: center; color: #9ca3af; padding: 20px; font-size: 11px; font-style: italic; }
        .browser-print-style .badge { display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 3px 8px; border-radius: 10px; font-size: 9px; font-weight: 500; }
      </style>
      
      <div class="header">
        <div class="logo-section">
          ${template.template_data.show_logo && config.logo_url
    ? `<img src="${config.logo_url}" alt="LOGO" style="max-width: 60px; max-height: 60px; object-fit: contain;" />`
    : '<div class="logo-placeholder">LOGO</div>'
}
        </div>
        <div class="company-name">${config.name || ''}</div>
        <div class="company-info">
          ${config.address || ''}<br>
          ${config.phone || ''} | ${config.email || ''}
        </div>
      </div>
      
      <div class="document-title">
        ${template.category === 'receipt' ? '收據' : '發票'} 
        <span class="badge">HTML列印版</span>
      </div>
      
      <div class="order-info">
        <div class="info-row">
          <span class="info-label">訂單編號:</span>
          <span class="info-value">${SAMPLE_ORDER.order_id}</span>
        </div>
        <div class="info-row">
          <span class="info-label">客戶姓名:</span>
          <span class="info-value">${SAMPLE_ORDER.student.chinese_name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">建立時間:</span>
          <span class="info-value">${formatDateTime(SAMPLE_ORDER.created_at).split(' ')[0]}</span>
        </div>
      </div>
      
      ${itemsSection}
      
      <div class="summary">
        <div class="summary-row">
          <span>小計:</span>
          <span>NT$ ${formatCurrency(SAMPLE_ORDER.original_amount)}</span>
        </div>
        <div class="summary-row">
          <span>折扣:</span>
          <span>- NT$ ${formatCurrency(SAMPLE_ORDER.discount_amount)}</span>
        </div>
        <div class="summary-row total">
          <span>總金額:</span>
          <span>NT$ ${formatCurrency(SAMPLE_ORDER.final_amount)}</span>
        </div>
      </div>
      
      ${paymentSection}
      
      <div class="footer">
        使用瀏覽器原生列印功能 · 最佳相容性<br>
        ${config.name || ''}
      </div>
    </div>
  `
}

/**
 * 自定義HTML預覽
 */
function generateCustomPreview(template: PDFTemplate, totalPaid: number, unpaidAmount: number, config: any): string {
  console.log('生成自定義模板預覽，模板名稱:', template.name)
  console.log('是否有custom_html:', !!template.template_data.custom_html)

  // 如果有自定義HTML，則渲染實際內容
  if (template.template_data.custom_html) {
    console.log('開始渲染自定義HTML，長度:', template.template_data.custom_html.length)
    try {
      // 準備模板變數
      const variables = {
        // 公司資訊
        studioName: config.name || '',
        studioAddress: config.address || '',
        studioPhone: config.phone || '',
        studioEmail: config.email || '',
        taxId: config.tax_id || config.taxId || '',
        businessHours: config.business_hours || '',
        logoUrl: template.template_data.show_logo ? (config.logo_url || '') : '',

        // 收據資訊
        receiptNumber: 'R20250101000',
        issueDate: formatDateTime(new Date().toISOString()),
        studentName: '聯絡人',
        contactName: '聯絡人',
        contactPhone: SAMPLE_ORDER.contact.phone,
        paymentMethod: '現金',

        // 金額資訊
        originalAmount: SAMPLE_ORDER.original_amount.toLocaleString('zh-TW'),
        discountAmount: SAMPLE_ORDER.discount_amount.toLocaleString('zh-TW'),
        finalAmount: SAMPLE_ORDER.final_amount.toLocaleString('zh-TW'),
        paidAmount: totalPaid.toLocaleString('zh-TW'),
        remainingAmount: unpaidAmount.toLocaleString('zh-TW'),

        // 條件顯示
        showItemDetails: template.template_data.show_item_details,
        showPaymentHistory: template.template_data.show_payment_history,

        // 項目明細陣列
        orderItems: SAMPLE_ORDER.items.map(item => ({
          itemName: item.item_name,
          quantity: item.quantity,
          unitPrice: item.unit_price.toLocaleString('zh-TW'),
          totalPrice: item.final_price.toLocaleString('zh-TW')
        })),

        // 付款記錄陣列
        paymentHistory: SAMPLE_ORDER.payments.map(payment => ({
          paymentDate: formatDateTime(payment.payment_date),
          paymentMethod: payment.method,
          amount: payment.amount.toLocaleString('zh-TW')
        }))
      }

      // 簡單的模板引擎：替換變數
      let html = template.template_data.custom_html

      // 處理條件顯示 {{#if}} {{/if}}
      html = html.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
        return variables[condition] ? content : ''
      })

      // 處理迴圈 {{#each}} {{/each}}
      html = html.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, content) => {
        const array = variables[arrayName]
        if (!Array.isArray(array)) return ''

        return array.map(item => {
          let itemContent = content
          // 替換 this. 變數
          Object.keys(item).forEach(key => {
            const regex = new RegExp(`\\{\\{this\\.${key}\\}\\}`, 'g')
            itemContent = itemContent.replace(regex, item[key])
          })
          return itemContent
        }).join('')
      })

      // 替換一般變數 {{variableName}}
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
        html = html.replace(regex, variables[key] || '')
      })

      console.log('模板變數替換完成，準備返回HTML')

      // 使用iframe完全隔離自定義模板，防止樣式洩漏
      const iframeContent = createIframeContent(html)

      const result = `
        <div class="template-preview custom-style" style="width: 100%; height: 450px; overflow: hidden; position: relative;">
          <iframe 
            srcdoc="${iframeContent.replace(/"/g, '&quot;')}" 
            style="width: 100%; height: 100%; border: none; transform: scale(0.8); transform-origin: top left; overflow: hidden;"
            sandbox="allow-same-origin"
          ></iframe>
        </div>
      `

      console.log('最終生成的HTML長度:', result.length)
      return result
    } catch (error) {
      console.error('渲染自定義模板失敗:', error)
      return generateCustomPreviewPlaceholder(template)
    }
  }

  // 如果沒有自定義HTML，顯示佔位符
  console.log('沒有custom_html，顯示佔位符')
  return generateCustomPreviewPlaceholder(template)
}

function generateCustomPreviewPlaceholder(template: PDFTemplate): string {
  return `
    <div class="template-preview custom-style" style="font-family: 'Arial', sans-serif; max-width: 400px; margin: 0 auto; background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px;">
      <div style="text-align: center; padding: 40px 20px; color: #6b7280;">
        <div style="font-size: 48px; margin-bottom: 16px;">📄</div>
        <h3 style="font-size: 16px; margin-bottom: 8px; color: #374151;">${template.name}</h3>
        <p style="font-size: 12px; margin-bottom: 16px;">${template.description}</p>
        <div style="background: #f3f4f6; padding: 12px; border-radius: 6px; font-size: 11px; color: #6b7280;">
          自定義HTML模板<br>
          將使用您上傳的HTML內容
        </div>
      </div>
    </div>
  `
}

// 配色方案功能已移除，統一使用藍色主題

/**
 * 創建iframe內容，完全隔離自定義模板
 */
function createIframeContent(html: string): string {
  // 檢查是否已經是完整的HTML文檔
  const isFullHtml = html.includes('<!DOCTYPE') || html.includes('<html')

  if (isFullHtml) {
    // 如果是完整HTML，直接使用但加入適當的縮放
    return html.replace(
      /<style([^>]*)>/gi,
      '<style$1>\nbody { transform: scale(0.7); transform-origin: top left; width: 142.86%; }\n'
    )
  } else {
    // 如果不是完整HTML，包裝在HTML結構中
    return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 16px;
            font-family: 'Microsoft JhengHei', Arial, sans-serif;
            transform: scale(0.7);
            transform-origin: top left;
            width: 142.86%;
            background: white;
        }
        * {
            box-sizing: border-box;
        }
    </style>
</head>
<body>
    ${html}
</body>
</html>`
  }
}

/**
 * 清理自定義模板HTML以防止樣式洩漏和佈局破壞
 */
function sanitizeCustomTemplateHtml(html: string): string {
  try {
    // 移除可能破壞佈局的危險CSS屬性
    const dangerousStyles = [
      'position:\\s*fixed',
      'position:\\s*absolute',
      'position:\\s*sticky',
      'z-index:\\s*\\d+',
      'transform:\\s*[^;]+',
      'margin:\\s*[^;]*auto[^;]*',
      'width:\\s*100vw',
      'height:\\s*100vh',
      'overflow:\\s*visible',
      'float:\\s*(left|right)',
      'clear:\\s*(both|left|right)'
    ]

    let sanitized = html

    // 移除危險的CSS屬性
    dangerousStyles.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi')
      sanitized = sanitized.replace(regex, '')
    })

    // 確保所有的style屬性都包含position: relative作為安全措施
    sanitized = sanitized.replace(
      /style\s*=\s*["']([^"']*)["']/gi,
      (match, styles) => {
        if (!styles.includes('position:')) {
          return `style="${styles}; position: relative; max-width: 100%; max-height: 100%;"`
        }
        return `style="${styles}; max-width: 100%; max-height: 100%;"`
      }
    )

    // 在style標籤中添加CSS隔離規則
    sanitized = sanitized.replace(
      /<style[^>]*>([\s\S]*?)<\/style>/gi,
      (match, cssContent) => {
        // 為所有CSS選擇器添加範圍限制
        const scopedCss = cssContent.replace(
          /([^{}]+)\{([^{}]*)\}/g,
          (match, selector, rules) => {
            // 過濾掉可能破壞佈局的規則
            const safeCssRules = rules
              .split(';')
              .filter(rule => {
                const ruleLower = rule.toLowerCase()
                return !ruleLower.includes('position: fixed') &&
                       !ruleLower.includes('position: absolute') &&
                       !ruleLower.includes('position: sticky') &&
                       !ruleLower.includes('z-index:') &&
                       !ruleLower.includes('overflow: visible')
              })
              .join(';')

            return `${selector.trim()} { ${safeCssRules}; max-width: 100%; box-sizing: border-box; }`
          }
        )

        return `<style>${scopedCss}</style>`
      }
    )

    console.log('HTML清理完成')
    return sanitized
  } catch (error) {
    console.error('HTML清理失敗:', error)
    return html // 如果清理失敗，返回原始HTML
  }
}
