/**
 * PDF 模板管理服務
 */

import { supabase } from '@/services/supabase'
import type { Order } from '@/utils/paymentCalculator'
import { generateDirectPDF, type StudioConfig, type DirectPDFOptions } from './directPdfService'
import { printOrder, type StudioConfig as PrintStudioConfig, type PrintOptions } from './printService'

// 模板類型
export interface PDFTemplate {
  id: string
  name: string
  description: string
  type: 'built_in' | 'custom'
  category: 'receipt' | 'invoice' | 'detailed'
  template_data: {
    layout_type: 'modern' | 'minimal' | 'custom'
    show_logo: boolean
    show_payment_history: boolean
    show_item_details: boolean
    font_style: string
    header_style: string
    custom_html?: string
  }
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

// 預設模板配置
const BUILT_IN_TEMPLATES: Omit<PDFTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: '現代風格收據',
    description: '簡潔現代的收據模板，適合日常使用',
    type: 'built_in',
    category: 'receipt',
    template_data: {
      layout_type: 'modern',
      show_logo: true,
      show_payment_history: false,
      show_item_details: true,
      font_style: 'helvetica',
      header_style: 'modern'
    },
    is_active: true
  },
  {
    name: '簡約風格收據',
    description: '極簡設計的收據模板，突出重要資訊',
    type: 'built_in',
    category: 'receipt',
    template_data: {
      layout_type: 'minimal',
      show_logo: true,
      show_payment_history: false,
      show_item_details: true,
      font_style: 'helvetica',
      header_style: 'minimal'
    },
    is_active: true
  }
]

// 載入所有模板
export async function loadTemplates(): Promise<PDFTemplate[]> {
  try {
    console.log('開始載入PDF模板...')
    const { data, error } = await supabase
      .from('tutoring_center_settings')
      .select('setting_value')
      .eq('setting_key', 'pdf_templates')
      .single()

    if (error && error.code !== 'PGRST116') {
      // 如果是 RLS 錯誤，嘗試從 localStorage 載入
      if (error.message?.includes('row-level security')) {
        console.warn('RLS 權限錯誤，嘗試從本地儲存載入模板')
        const cachedTemplates = localStorage.getItem('pdf_templates_cache')
        if (cachedTemplates) {
          try {
            const templates = JSON.parse(cachedTemplates) as PDFTemplate[]
            console.log('從本地儲存載入模板數量:', templates.length)
            if (templates.length > 0) {
              return templates
            }
          } catch (parseError) {
            console.error('解析本地儲存的模板失敗:', parseError)
          }
        }
      }
      console.error('載入模板時發生錯誤:', error)
    }

    if (data?.setting_value) {
      const templates = data.setting_value as PDFTemplate[]
      console.log('從資料庫載入模板數量:', templates.length)

      // 同步到 localStorage 以便備用
      localStorage.setItem('pdf_templates_cache', JSON.stringify(templates))

      // 檢查是否有重複的模板 ID
      const uniqueTemplates = templates.filter((template, index, self) =>
        index === self.findIndex(t => t.id === template.id)
      )

      if (uniqueTemplates.length !== templates.length) {
        console.warn('發現重複模板，已去除重複項:', templates.length - uniqueTemplates.length)
        // 保存去重後的模板
        await saveTemplates(uniqueTemplates)
        return uniqueTemplates
      }

      return templates
    }

    // 如果沒有找到，初始化預設模板
    return await initializeDefaultTemplates()
  } catch (error) {
    console.error('載入模板失敗:', error)

    // 最後的備用方案：從 localStorage 載入
    const cachedTemplates = localStorage.getItem('pdf_templates_cache')
    if (cachedTemplates) {
      try {
        const templates = JSON.parse(cachedTemplates) as PDFTemplate[]
        console.log('從本地儲存載入模板（備用）:', templates.length)
        return templates
      } catch (parseError) {
        console.error('解析本地儲存的模板失敗:', parseError)
      }
    }

    // 如果連 localStorage 都沒有，返回預設模板
    console.log('使用內建預設模板')
    return BUILT_IN_TEMPLATES.map((template, index) => ({
      ...template,
      id: `built_in_${index + 1}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
  }
}

// 初始化預設模板
async function initializeDefaultTemplates(): Promise<PDFTemplate[]> {
  try {
    console.log('初始化預設模板...')
    const templates: PDFTemplate[] = BUILT_IN_TEMPLATES.map((template, index) => ({
      ...template,
      id: `built_in_${index + 1}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    console.log('創建的預設模板數量:', templates.length)

    try {
      await saveTemplates(templates)
    } catch (saveError) {
      console.warn('儲存到資料庫失敗，但已暫存到本地:', saveError)
      // saveTemplates 已經處理了 localStorage 備用方案
    }

    return templates
  } catch (error) {
    console.error('初始化預設模板失敗:', error)
    // 返回預設模板而不是空陣列
    return BUILT_IN_TEMPLATES.map((template, index) => ({
      ...template,
      id: `built_in_${index + 1}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
  }
}

// 強制重新初始化預設模板（清除現有並重新創建）
export async function resetBuiltInTemplates(): Promise<PDFTemplate[]> {
  try {
    console.log('重置內建模板...')

    // 清除 localStorage 中的舊資料
    localStorage.removeItem('pdf_templates_cache')
    localStorage.removeItem('current_receipt_template_cache')

    // 直接重新初始化模板，這會覆蓋現有的設定
    const templates: PDFTemplate[] = BUILT_IN_TEMPLATES.map((template, index) => ({
      ...template,
      id: `built_in_${index + 1}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    // 先儲存到 localStorage
    localStorage.setItem('pdf_templates_cache', JSON.stringify(templates))

    // 嘗試儲存到資料庫（如果失敗也沒關係）
    try {
      await saveTemplates(templates)
    } catch (saveError) {
      console.warn('儲存到資料庫失敗，但已儲存到本地:', saveError)
    }

    console.log('內建模板重置完成，新順序已套用')
    return templates
  } catch (error) {
    console.error('重置內建模板失敗:', error)
    // 即使失敗也返回預設模板
    return BUILT_IN_TEMPLATES.map((template, index) => ({
      ...template,
      id: `built_in_${index + 1}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
  }
}

// 儲存模板
export async function saveTemplates(templates: PDFTemplate[]): Promise<void> {
  try {
    console.log('準備儲存模板到資料庫，模板數量:', templates.length)

    // 先檢查記錄是否存在
    const { data: existing, error: checkError } = await supabase
      .from('tutoring_center_settings')
      .select('id')
      .eq('setting_key', 'pdf_templates')
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('檢查現有設定失敗:', checkError)
      throw checkError
    }

    let result
    if (existing) {
      // 記錄存在，使用 update
      result = await supabase
        .from('tutoring_center_settings')
        .update({
          setting_value: templates,
          description: 'PDF模板設定',
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'pdf_templates')
    } else {
      // 記錄不存在，使用 insert
      result = await supabase
        .from('tutoring_center_settings')
        .insert({
          setting_key: 'pdf_templates',
          setting_value: templates,
          description: 'PDF模板設定',
          updated_at: new Date().toISOString()
        })
    }

    if (result.error) {
      // 如果是 RLS 錯誤，提供更清晰的錯誤訊息
      if (result.error.message?.includes('row-level security')) {
        console.error('RLS 權限錯誤:', result.error)
        console.warn('請執行 fix-tutoring-center-settings-rls.sql 來修復權限問題')
        // 嘗試將模板儲存到 localStorage 作為臨時方案
        localStorage.setItem('pdf_templates_cache', JSON.stringify(templates))
        console.log('已將模板暫存到本地儲存')
        return
      }
      throw result.error
    }

    console.log('模板儲存成功')
  } catch (error) {
    console.error('儲存模板失敗:', error)
    // 作為備用方案，儲存到 localStorage
    try {
      localStorage.setItem('pdf_templates_cache', JSON.stringify(templates))
      console.log('已將模板暫存到本地儲存（備用方案）')
    } catch (localError) {
      console.error('本地儲存也失敗:', localError)
    }
    throw error
  }
}

// 根據模板ID獲取模板
export async function getTemplate(templateId: string): Promise<PDFTemplate | null> {
  try {
    const templates = await loadTemplates()
    return templates.find(t => t.id === templateId) || null
  } catch (error) {
    console.error('獲取模板失敗:', error)
    return null
  }
}

// 新增自定義模板
export async function addCustomTemplate(template: Omit<PDFTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  try {
    console.log('開始新增自定義模板:', template.name)
    const templates = await loadTemplates()
    console.log('現有模板數量:', templates.length)

    const newTemplate: PDFTemplate = {
      ...template,
      id: `custom_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    templates.push(newTemplate)
    console.log('新增後模板數量:', templates.length)

    await saveTemplates(templates)
    console.log('自定義模板新增成功，ID:', newTemplate.id)

    return newTemplate.id
  } catch (error) {
    console.error('新增自定義模板失敗:', error)
    throw error
  }
}

// 更新模板
export async function updateTemplate(templateId: string, updates: Partial<PDFTemplate>): Promise<void> {
  try {
    const templates = await loadTemplates()
    const index = templates.findIndex(t => t.id === templateId)

    if (index === -1) {
      throw new Error('模板不存在')
    }

    templates[index] = {
      ...templates[index],
      ...updates,
      updated_at: new Date().toISOString()
    }

    await saveTemplates(templates)
  } catch (error) {
    console.error('更新模板失敗:', error)
    throw error
  }
}

// 刪除模板（只能刪除自定義模板）
export async function deleteTemplate(templateId: string): Promise<void> {
  try {
    const templates = await loadTemplates()
    const template = templates.find(t => t.id === templateId)

    if (!template) {
      throw new Error('模板不存在')
    }

    if (template.type === 'built_in') {
      throw new Error('無法刪除內建模板')
    }

    const filteredTemplates = templates.filter(t => t.id !== templateId)
    await saveTemplates(filteredTemplates)
  } catch (error) {
    console.error('刪除模板失敗:', error)
    throw error
  }
}

// 使用模板生成PDF
export async function generatePDFWithTemplate(
  order: Order,
  templateId: string,
  customConfig?: Partial<StudioConfig>
): Promise<void> {
  try {
    const template = await getTemplate(templateId)
    if (!template) {
      throw new Error('模板不存在')
    }

    const options: DirectPDFOptions = {
      showPaymentHistory: template.template_data.show_payment_history,
      showItemDetails: template.template_data.show_item_details
    }

    // 根據模板類型選擇不同的生成方式
    if (template.template_data.layout_type === 'custom' && template.template_data.custom_html) {
      // 檢查是否為特殊的瀏覽器列印標識
      if (template.template_data.custom_html === 'browser_print') {
        // 使用瀏覽器列印服務（HTML版本）
        const printOptions: PrintOptions = {
          showPaymentHistory: template.template_data.show_payment_history,
          showItemDetails: template.template_data.show_item_details,
          autoClose: false,
          format: template.category as any
        }

        await printOrder(order, customConfig as PrintStudioConfig, printOptions)
      } else {
        // 如果是真正的自定義HTML模板，也使用printService
        const printOptions: PrintOptions = {
          showPaymentHistory: template.template_data.show_payment_history,
          showItemDetails: template.template_data.show_item_details,
          autoClose: false,
          format: template.category as any
        }

        await printOrder(order, customConfig as PrintStudioConfig, printOptions)
      }
    } else {
      // 使用直接PDF生成（現代、經典、簡約風格）
      await generateDirectPDF(order, customConfig, options)
    }
  } catch (error) {
    console.error('使用模板生成PDF失敗:', error)
    throw error
  }
}

// 上傳自定義模板文件
export async function uploadCustomTemplate(
  templateName: string,
  description: string,
  htmlContent: string,
  category: 'receipt' | 'invoice' | 'detailed'
): Promise<string> {
  try {
    const templateData = {
      layout_type: 'custom' as const,
      show_logo: true,
      show_payment_history: category !== 'receipt',
      show_item_details: true,
      color_scheme: 'custom',
      font_style: 'custom',
      header_style: 'custom',
      custom_html: htmlContent
    }

    return await addCustomTemplate({
      name: templateName,
      description,
      type: 'custom',
      category,
      template_data: templateData,
      is_active: true
    })
  } catch (error) {
    console.error('上傳自定義模板失敗:', error)
    throw error
  }
}
