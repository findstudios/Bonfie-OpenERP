/**
 * 收據生成服務 - 整合系統設定的模板來生成收據
 */

import { supabase } from '@/services/supabase'
import type { Order } from '@/utils/paymentCalculator'
import { generateDirectPDF, type StudioConfig, type DirectPDFOptions } from './directPdfService'
import { printOrder, type StudioConfig as PrintStudioConfig, type PrintOptions } from './printService'
import type { PDFTemplate } from './templateService'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { getTotalPaid, getUnpaidAmount } from '@/utils/paymentCalculator'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * 載入系統設定的當前收據模板
 */
async function loadCurrentReceiptTemplate(): Promise<PDFTemplate | null> {
  try {
    console.log('開始載入當前收據模板...')

    // 先從資料庫載入
    const { data: settingsData, error: settingsError } = await supabase
      .from('tutoring_center_settings')
      .select('setting_value')
      .eq('setting_key', 'current_receipt_template')
      .single()

    if (settingsError) {
      // 如果是 RLS 錯誤，嘗試從 localStorage 載入
      if (settingsError.message?.includes('row-level security')) {
        console.warn('RLS 權限錯誤，嘗試從本地儲存載入當前收據模板')
        const cachedTemplate = localStorage.getItem('current_receipt_template_cache')
        if (cachedTemplate) {
          try {
            return JSON.parse(cachedTemplate) as PDFTemplate
          } catch (parseError) {
            console.error('解析本地儲存的模板失敗:', parseError)
          }
        }
      } else if (settingsError.code !== 'PGRST116') {
        throw settingsError
      }
    }

    if (settingsData?.setting_value) {
      const template = settingsData.setting_value as PDFTemplate
      console.log('從資料庫載入模板:', template.name, template.type)
      // 同步到 localStorage
      localStorage.setItem('current_receipt_template_cache', JSON.stringify(template))
      return template
    }

    // 如果沒有設定當前模板，嘗試獲取第一個啟用的收據模板
    const { data: templatesData, error: templatesError } = await supabase
      .from('tutoring_center_settings')
      .select('setting_value')
      .eq('setting_key', 'pdf_templates')
      .single()

    if (templatesError && templatesError.code !== 'PGRST116') {
      // RLS 錯誤處理
      if (templatesError.message?.includes('row-level security')) {
        const cachedTemplates = localStorage.getItem('pdf_templates_cache')
        if (cachedTemplates) {
          try {
            const templates = JSON.parse(cachedTemplates) as PDFTemplate[]
            const receiptTemplate = templates.find(t => t.category === 'receipt' && t.is_active)
            if (receiptTemplate) {
              localStorage.setItem('current_receipt_template_cache', JSON.stringify(receiptTemplate))
              return receiptTemplate
            }
          } catch (parseError) {
            console.error('解析本地儲存的模板列表失敗:', parseError)
          }
        }
      }
    }

    if (templatesData?.setting_value) {
      const templates = templatesData.setting_value as PDFTemplate[]
      const receiptTemplate = templates.find(t => t.category === 'receipt' && t.is_active)
      if (receiptTemplate) {
        // 同步到 localStorage
        localStorage.setItem('current_receipt_template_cache', JSON.stringify(receiptTemplate))
        return receiptTemplate
      }
    }

    return null
  } catch (error) {
    console.error('載入收據模板失敗:', error)
    // 嘗試從 localStorage 載入
    const cachedTemplate = localStorage.getItem('current_receipt_template_cache')
    if (cachedTemplate) {
      try {
        return JSON.parse(cachedTemplate) as PDFTemplate
      } catch (parseError) {
        console.error('解析本地儲存的模板失敗:', parseError)
      }
    }
    return null
  }
}

/**
 * 載入系統基本資訊
 */
async function loadStudioConfig(): Promise<StudioConfig> {
  try {
    const { data, error } = await supabase
      .from('tutoring_center_settings')
      .select('setting_value')
      .eq('setting_key', 'basic_info')
      .single()

    if (error && error.code !== 'PGRST116') {
      // RLS 錯誤處理
      if (error.message?.includes('row-level security')) {
        const cachedConfig = localStorage.getItem('studio_config_cache')
        if (cachedConfig) {
          try {
            return JSON.parse(cachedConfig) as StudioConfig
          } catch (parseError) {
            console.error('解析本地儲存的配置失敗:', parseError)
          }
        }
      }
      throw error
    }

    if (data?.setting_value) {
      const basicInfo = data.setting_value as any
      const config: StudioConfig = {
        name: basicInfo.name || 'OpenERP管理系統',
        brandName: basicInfo.brand_name || 'OpenERP',
        address: basicInfo.address || '',
        phone: basicInfo.phone || '',
        email: basicInfo.email || '',
        website: basicInfo.website || '',
        taxId: basicInfo.tax_id || '',
        logo_url: basicInfo.logo_url || '',
        director: basicInfo.director || '',
        business_hours: basicInfo.business_hours || ''
      }
      // 同步到 localStorage
      localStorage.setItem('studio_config_cache', JSON.stringify(config))
      return config
    }

    // 返回預設配置
    const defaultConfig: StudioConfig = {
      name: 'OpenERP管理系統',
      brandName: 'OpenERP',
      address: '',
      phone: '',
      email: '',
      website: '',
      taxId: '',
      logo_url: '',
      director: '',
      business_hours: ''
    }
    return defaultConfig
  } catch (error) {
    console.error('載入系統配置失敗:', error)
    // 嘗試從 localStorage 載入
    const cachedConfig = localStorage.getItem('studio_config_cache')
    if (cachedConfig) {
      try {
        return JSON.parse(cachedConfig) as StudioConfig
      } catch (parseError) {
        console.error('解析本地儲存的配置失敗:', parseError)
      }
    }
    // 返回預設配置
    return {
      name: 'OpenERP管理系統',
      brandName: 'OpenERP',
      address: '',
      phone: '',
      email: '',
      website: '',
      taxId: '',
      logo_url: '',
      director: '',
      business_hours: ''
    }
  }
}

/**
 * 根據模板生成收據
 * @param order 訂單資料
 * @param template 模板配置（可選，不提供則使用系統設定的模板）
 */
export async function generateReceiptFromTemplate(order: Order, template?: PDFTemplate): Promise<void> {
  try {
    // 載入訂單的完整資料（如果需要）
    if (!order.student || !order.contact || !order.items) {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          student:students(*),
          contact:contacts(*),
          items:order_items(*),
          payments(*)
        `)
        .eq('order_id', order.order_id)
        .single()

      if (error) throw error
      if (data) {
        order = { ...order, ...data }
      }
    }

    // 如果沒有提供模板，載入系統設定的模板
    const receiptTemplate = template || await loadCurrentReceiptTemplate()

    if (!receiptTemplate) {
      console.warn('沒有找到收據模板，使用預設 PDF 生成')
      // 使用預設的 PDF 生成
      await generateDirectPDF(order)
      return
    }

    console.log('使用模板生成收據:', {
      name: receiptTemplate.name,
      type: receiptTemplate.type,
      layout: receiptTemplate.template_data.layout_type,
      hasCustomHtml: !!receiptTemplate.template_data.custom_html
    })

    // 載入系統配置
    const studioConfig = await loadStudioConfig()

    // 根據模板類型生成收據
    if (receiptTemplate.type === 'custom' && receiptTemplate.template_data.custom_html) {
      // 使用自定義 HTML 模板
      await generateHTMLReceipt(order, receiptTemplate, studioConfig)
    } else {
      // 使用內建模板 - 通過 HTML 方式呈現
      await generateBuiltInTemplateReceipt(order, receiptTemplate, studioConfig)
    }
  } catch (error) {
    console.error('生成收據失敗:', error)
    throw error
  }
}

/**
 * 使用 HTML 模板生成收據
 */
async function generateHTMLReceipt(order: Order, template: PDFTemplate, studioConfig: StudioConfig): Promise<void> {
  // 顯示載入提示
  const loadingEl = document.createElement('div')
  loadingEl.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: white; padding: 20px 40px; border-radius: 8px; z-index: 9999; font-size: 16px;'
  loadingEl.textContent = '正在生成收據...'
  document.body.appendChild(loadingEl)

  try {
    const totalPaid = getTotalPaid(order.payments || [])
    const unpaidAmount = getUnpaidAmount(order)

    // 準備模板變數
    const variables = {
      // 公司資訊
      studioName: studioConfig.name || '',
      studioAddress: studioConfig.address || '',
      studioPhone: studioConfig.phone || '',
      studioEmail: studioConfig.email || '',
      taxId: studioConfig.taxId || '',
      businessHours: studioConfig.business_hours || '',
      logoUrl: template.template_data.show_logo ? (studioConfig.logo_url || '') : '',

      // 收據資訊
      receiptNumber: order.order_id,
      issueDate: formatDateTime(order.created_at || new Date().toISOString()),
      studentName: order.student?.chinese_name || '',
      contactName: order.contact?.full_name || '',
      contactPhone: order.contact?.phone || '',
      paymentMethod: order.payments?.[0]?.method || '現金',

      // 金額資訊
      originalAmount: formatCurrency(order.original_amount || 0),
      discountAmount: formatCurrency(order.discount_amount || 0),
      finalAmount: formatCurrency(order.final_amount || 0),
      paidAmount: formatCurrency(totalPaid),
      remainingAmount: formatCurrency(unpaidAmount),

      // 條件顯示
      showItemDetails: template.template_data.show_item_details,
      showPaymentHistory: template.template_data.show_payment_history,

      // 項目明細陣列
      orderItems: (order.items || []).map(item => ({
        itemName: item.item_name,
        quantity: item.quantity,
        unitPrice: formatCurrency(item.unit_price || 0),
        totalPrice: formatCurrency(item.final_price || 0)
      })),

      // 付款記錄陣列
      paymentHistory: (order.payments || []).map(payment => ({
        paymentDate: formatDateTime(payment.payment_date),
        paymentMethod: payment.method || 'Unknown',
        amount: formatCurrency(payment.amount || 0)
      }))
    }

    // 處理 HTML 模板
    let html = template.template_data.custom_html || ''

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

    // 確保 HTML 有正確的結構
    if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
      html = `<div style="font-family: 'Microsoft JhengHei', Arial, sans-serif; padding: 20px; background: white;">${html}</div>`
    }

    // 創建一個臨時容器來渲染 HTML
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.width = '210mm'
    container.style.background = 'white'
    container.innerHTML = html
    document.body.appendChild(container)

    try {
      // 使用 html2canvas 將 HTML 轉換為圖片
      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      })

      // 移除臨時容器
      document.body.removeChild(container)

      // 創建 PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // 計算圖片在 PDF 中的尺寸
      const imgWidth = 210 // A4 寬度
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // 將圖片添加到 PDF
      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

      // 下載 PDF
      pdf.save(`receipt_${order.order_id}.pdf`)

    } catch (error) {
      // 清理臨時容器
      if (document.body.contains(container)) {
        document.body.removeChild(container)
      }
      throw error
    }
  } catch (error) {
    console.error('生成 HTML 收據失敗:', error)
    throw error
  } finally {
    // 移除載入提示
    if (document.body.contains(loadingEl)) {
      document.body.removeChild(loadingEl)
    }
  }
}

/**
 * 使用內建模板生成收據
 */
async function generateBuiltInTemplateReceipt(order: Order, template: PDFTemplate, studioConfig: StudioConfig): Promise<void> {
  // 顯示載入提示
  const loadingEl = document.createElement('div')
  loadingEl.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: white; padding: 20px 40px; border-radius: 8px; z-index: 9999; font-size: 16px;'
  loadingEl.textContent = '正在生成收據...'
  document.body.appendChild(loadingEl)

  try {
    // 引入模板預覽服務來生成 HTML
    const { generateTemplatePreview } = await import('./templatePreviewService')

    // 生成預覽 HTML（這會根據 template.template_data.layout_type 生成不同風格）
    const previewHtml = generateTemplatePreview(template, studioConfig)

    // 準備完整的收據數據
    const orderWithDetails = {
      ...order,
      payments: order.payments || [],
      items: order.items || [],
      student: order.student || { chinese_name: '' },
      contact: order.contact || { full_name: '', phone: '', email: '' }
    }

    // 計算金額
    const totalPaid = getTotalPaid(orderWithDetails.payments)
    const unpaidAmount = getUnpaidAmount(orderWithDetails)

    // 準備變數替換
    const variables = {
      // 訂單資訊
      order_id: orderWithDetails.order_id,
      created_at: orderWithDetails.created_at || new Date().toISOString(),
      status: orderWithDetails.status,
      original_amount: orderWithDetails.original_amount || 0,
      discount_amount: orderWithDetails.discount_amount || 0,
      final_amount: orderWithDetails.final_amount || 0,

      // 學生和聯絡人資訊
      student: orderWithDetails.student,
      contact: orderWithDetails.contact,

      // 項目和付款
      items: orderWithDetails.items,
      payments: orderWithDetails.payments,

      // 計算值
      totalPaid,
      unpaidAmount
    }

    // 建立收據內容 HTML
    const receiptContent = generateActualReceiptHTML(orderWithDetails, template, studioConfig, variables)

    // 創建一個臨時容器來渲染 HTML
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.width = '210mm'
    container.style.background = 'white'
    container.innerHTML = receiptContent
    document.body.appendChild(container)

    try {
      // 使用 html2canvas 將 HTML 轉換為圖片
      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      })

      // 移除臨時容器
      document.body.removeChild(container)

      // 創建 PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // 計算圖片在 PDF 中的尺寸
      const imgWidth = 210 // A4 寬度
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // 將圖片添加到 PDF
      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

      // 下載 PDF
      pdf.save(`receipt_${orderWithDetails.order_id}.pdf`)

    } catch (error) {
      // 清理臨時容器
      if (document.body.contains(container)) {
        document.body.removeChild(container)
      }
      throw error
    }
  } catch (error) {
    console.error('生成內建模板收據失敗:', error)
    throw error
  } finally {
    // 移除載入提示
    if (document.body.contains(loadingEl)) {
      document.body.removeChild(loadingEl)
    }
  }
}

/**
 * 生成實際的收據 HTML 內容
 */
function generateActualReceiptHTML(order: any, template: PDFTemplate, studioConfig: StudioConfig, variables: any): string {
  // 使用已經導入的 formatters
  const formatCurrency = (amount: number) => {
    if (amount == null || isNaN(amount)) return '0'
    return amount.toLocaleString('zh-TW')
  }

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.toLocaleDateString('zh-TW')} ${date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`
  }

  // 根據模板風格生成不同的 HTML
  switch (template.template_data.layout_type) {
    case 'modern':
      return generateModernReceiptHTML(order, template, studioConfig, formatCurrency, formatDateTime)
    case 'minimal':
      return generateMinimalReceiptHTML(order, template, studioConfig, formatCurrency, formatDateTime)
    default:
      return generateModernReceiptHTML(order, template, studioConfig, formatCurrency, formatDateTime)
  }
}

/**
 * 生成現代風格收據 HTML
 */
function generateModernReceiptHTML(order: any, template: PDFTemplate, config: StudioConfig, formatCurrency: any, formatDateTime: any): string {
  const logoSection = template.template_data.show_logo && config.logo_url
    ? `<div class="logo-section"><img src="${config.logo_url}" alt="LOGO" style="max-width: 80px; max-height: 80px; object-fit: contain;" /></div>`
    : ''

  const itemsSection = template.template_data.show_item_details
    ? generateItemsTableHTML(order.items || [], formatCurrency)
    : ''

  const paymentSection = template.template_data.show_payment_history
    ? generatePaymentTableHTML(order.payments || [], formatCurrency, formatDateTime)
    : ''

  return `
    <div style="font-family: 'Microsoft JhengHei', sans-serif; max-width: 800px; margin: 0 auto; background: white; padding: 40px;">
      <style>
        .header { background: #2563eb; color: white; padding: 30px; text-align: center; margin: -40px -40px 30px; }
        .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .company-info { font-size: 14px; opacity: 0.9; line-height: 1.6; }
        .document-title { text-align: center; font-size: 20px; font-weight: bold; color: #2563eb; margin: 30px 0; }
        .order-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th { background: #60a5fa; color: white; padding: 12px; text-align: left; }
        .items-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        .summary { background: #60a5fa; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .summary-row.total { font-weight: bold; font-size: 16px; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 10px; margin-top: 10px; }
        .payment-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .payment-table th { background: #f3f4f6; padding: 10px; text-align: left; }
        .payment-table td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        .footer { text-align: center; margin-top: 40px; color: #6b7280; font-size: 12px; }
      </style>
      
      <div class="header">
        ${logoSection}
        <div class="company-name">${config.name || ''}</div>
        <div class="company-info">
          ${config.address || ''}<br>
          ${config.phone || ''} | ${config.email || ''}
        </div>
      </div>
      
      <div class="document-title">收據 Receipt</div>
      
      <div class="order-info">
        <div class="info-row">
          <span><strong>訂單編號：</strong></span>
          <span>${order.order_id}</span>
        </div>
        <div class="info-row">
          <span><strong>客戶姓名：</strong></span>
          <span>${order.student?.chinese_name || ''}</span>
        </div>
        <div class="info-row">
          <span><strong>聯絡人：</strong></span>
          <span>${order.contact?.full_name || ''} ${order.contact?.phone || ''}</span>
        </div>
        <div class="info-row">
          <span><strong>開立日期：</strong></span>
          <span>${formatDateTime(order.created_at || new Date().toISOString())}</span>
        </div>
      </div>
      
      ${itemsSection}
      
      <div class="summary">
        <div class="summary-row">
          <span>小計 Subtotal:</span>
          <span>NT$ ${formatCurrency(order.original_amount || 0)}</span>
        </div>
        <div class="summary-row">
          <span>折扣 Discount:</span>
          <span>- NT$ ${formatCurrency(order.discount_amount || 0)}</span>
        </div>
        <div class="summary-row total">
          <span>總計 Total:</span>
          <span>NT$ ${formatCurrency(order.final_amount || 0)}</span>
        </div>
      </div>
      
      ${paymentSection}
      
      <div class="footer">
        <p>感謝您的支持！Thank you for your support!</p>
        <p>${config.website || ''}</p>
        <p style="margin-top: 20px; font-size: 10px;">此為電腦列印收據，無需蓋章</p>
      </div>
    </div>
  `
}

/**
 * 生成簡約風格收據 HTML
 */
function generateMinimalReceiptHTML(order: any, template: PDFTemplate, config: StudioConfig, formatCurrency: any, formatDateTime: any): string {
  const logoSection = template.template_data.show_logo && config.logo_url
    ? `<img src="${config.logo_url}" alt="LOGO" style="max-width: 60px; max-height: 60px; object-fit: contain; margin-bottom: 15px;" />`
    : ''

  const itemsSection = template.template_data.show_item_details
    ? generateSimpleItemsListHTML(order.items || [], formatCurrency)
    : ''

  const paymentSection = template.template_data.show_payment_history
    ? generateSimplePaymentListHTML(order.payments || [], formatCurrency, formatDateTime)
    : ''

  return `
    <div style="font-family: 'Helvetica', 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; line-height: 1.6;">
      <div style="margin-bottom: 30px;">
        ${logoSection}
        <h1 style="font-size: 18px; font-weight: 500; margin: 0 0 5px 0; color: #111827;">${config.name || ''}</h1>
        <p style="font-size: 12px; color: #6b7280; margin: 0;">
          ${config.address || ''}<br>
          ${config.phone || ''}
        </p>
      </div>
      
      <h2 style="font-size: 16px; font-weight: 500; margin: 30px 0 20px; color: #374151;">收據 Receipt</h2>
      
      <div style="margin-bottom: 30px; font-size: 13px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #6b7280;">訂單編號</span>
          <span style="color: #111827;">${order.order_id}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #6b7280;">客戶</span>
          <span style="color: #111827;">${order.student?.chinese_name || ''}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #6b7280;">日期</span>
          <span style="color: #111827;">${formatDateTime(order.created_at || new Date().toISOString()).split(' ')[0]}</span>
        </div>
      </div>
      
      ${itemsSection}
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
          <span>小計</span>
          <span>NT$ ${formatCurrency(order.original_amount || 0)}</span>
        </div>
        ${order.discount_amount > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
          <span>折扣</span>
          <span>- NT$ ${formatCurrency(order.discount_amount || 0)}</span>
        </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 14px; color: #111827;">
          <span>總計</span>
          <span>NT$ ${formatCurrency(order.final_amount || 0)}</span>
        </div>
      </div>
      
      ${paymentSection}
      
      <div style="text-align: center; margin-top: 40px; font-size: 11px; color: #9ca3af;">
        <p>${config.name || ''}</p>
        <p>此為電腦列印收據</p>
      </div>
    </div>
  `
}

/**
 * 生成項目表格 HTML
 */
function generateItemsTableHTML(items: any[], formatCurrency: any): string {
  if (!items || items.length === 0) return ''

  return `
    <h3 style="font-size: 16px; margin-bottom: 15px;">項目明細 Items</h3>
    <table class="items-table">
      <thead>
        <tr>
          <th>項目 Item</th>
          <th style="text-align: center;">數量 Qty</th>
          <th style="text-align: right;">單價 Price</th>
          <th style="text-align: right;">小計 Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>
              <strong>${item.item_name}</strong>
              ${item.notes ? `<br><small style="color: #6b7280;">${item.notes}</small>` : ''}
            </td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right;">NT$ ${formatCurrency(item.unit_price)}</td>
            <td style="text-align: right;">NT$ ${formatCurrency(item.final_price)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

/**
 * 生成簡單項目列表 HTML
 */
function generateSimpleItemsListHTML(items: any[], formatCurrency: any): string {
  if (!items || items.length === 0) return ''

  return `
    <div style="margin-bottom: 20px;">
      ${items.map(item => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #f3f4f6; font-size: 12px;">
          <div>
            <div style="color: #111827; font-weight: 500;">${item.item_name}</div>
            ${item.notes ? `<div style="font-size: 10px; color: #9ca3af; margin-top: 2px;">${item.notes}</div>` : ''}
          </div>
          <div style="color: #6b7280;">NT$ ${formatCurrency(item.final_price)}</div>
        </div>
      `).join('')}
    </div>
  `
}

/**
 * 生成付款記錄表格 HTML
 */
function generatePaymentTableHTML(payments: any[], formatCurrency: any, formatDateTime: any): string {
  if (!payments || payments.length === 0) return ''

  return `
    <h3 style="font-size: 16px; margin: 30px 0 15px;">付款記錄 Payment History</h3>
    <table class="payment-table">
      <thead>
        <tr>
          <th>付款日期 Date</th>
          <th>付款方式 Method</th>
          <th style="text-align: right;">金額 Amount</th>
        </tr>
      </thead>
      <tbody>
        ${payments.map(payment => `
          <tr>
            <td>${formatDateTime(payment.payment_date).split(' ')[0]}</td>
            <td>${payment.method || 'Unknown'}</td>
            <td style="text-align: right;">NT$ ${formatCurrency(payment.amount || 0)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

/**
 * 生成簡單付款列表 HTML
 */
function generateSimplePaymentListHTML(payments: any[], formatCurrency: any, formatDateTime: any): string {
  if (!payments || payments.length === 0) return ''

  return `
    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
      <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">付款記錄</div>
      ${payments.map(payment => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px;">
          <span>${formatDateTime(payment.payment_date).split(' ')[0]} ${payment.method}</span>
          <span>NT$ ${formatCurrency(payment.amount || 0)}</span>
        </div>
      `).join('')}
    </div>
  `
}

/**
 * 快速生成收據（使用系統預設模板）
 */
export async function quickGenerateReceipt(orderId: string): Promise<void> {
  try {
    // 載入訂單資料
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        student:students(*),
        contact:contacts(*),
        items:order_items(*),
        payments(*)
      `)
      .eq('order_id', orderId)
      .single()

    if (error) throw error
    if (!order) throw new Error('找不到訂單')

    // 使用系統設定的模板生成收據
    await generateReceiptFromTemplate(order)
  } catch (error) {
    console.error('快速生成收據失敗:', error)
    throw error
  }
}
