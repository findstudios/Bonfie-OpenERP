/**
 * 訂單表單服務 - 處理訂單建立的複雜邏輯
 */

import { db } from '@/services/supabase'
import { useAuthStore } from '@/stores/authSupabase'

export interface OrderFormData {
  student_id: string
  contact_id: string
  items: OrderItemData[]
  extra_discount?: number
  discount_reason?: string
}

export interface OrderItemData {
  item_type: 'enrollment' | 'material' | 'activity' | ''
  item_id: string
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
  discount_amount: number
  final_price: number
  notes: string
}

// 生成訂單編號
function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const timestamp = Date.now().toString().slice(-6)
  return `ORD${date}${timestamp}`
}

// 生成項目 ID
function generateItemId(itemType: string): string {
  const timestamp = Date.now().toString().slice(-6)
  const prefixMap = {
    'material': 'MAT',
    'activity': 'ACT',
    'enrollment': 'ENR'
  }
  const prefix = prefixMap[itemType as keyof typeof prefixMap] || 'ITEM'
  return `${prefix}${timestamp}`
}

// 計算訂單金額
function calculateOrderAmounts(items: OrderItemData[], extraDiscount: number = 0) {
  const originalAmount = items.reduce((sum, item) => sum + item.total_price, 0)
  const itemDiscountAmount = items.reduce((sum, item) => sum + (item.discount_amount || 0), 0)
  const totalDiscountAmount = itemDiscountAmount + extraDiscount
  const finalAmount = Math.max(0, originalAmount - totalDiscountAmount)

  return {
    originalAmount,
    itemDiscountAmount,
    extraDiscountAmount: extraDiscount,
    totalDiscountAmount,
    finalAmount
  }
}

// 驗證表單資料
function validateOrderForm(formData: OrderFormData): { isValid: boolean; error?: string } {
  if (formData.items.length === 0) {
    return { isValid: false, error: '請至少添加一個訂單項目' }
  }

  if (!formData.student_id) {
    return { isValid: false, error: '請選擇學生' }
  }

  if (!formData.contact_id) {
    return { isValid: false, error: '請選擇聯絡人' }
  }

  // 檢查項目資料完整性
  for (const item of formData.items) {
    if (!item.item_type) {
      return { isValid: false, error: '請為所有項目選擇類型' }
    }
    if (!item.item_name) {
      return { isValid: false, error: '請為所有項目輸入名稱' }
    }
    if (item.quantity <= 0) {
      return { isValid: false, error: '項目數量必須大於 0' }
    }
    if (item.unit_price < 0) {
      return { isValid: false, error: '項目單價不能為負數' }
    }
  }

  return { isValid: true }
}

// 建立訂單
export async function createOrder(formData: OrderFormData): Promise<{ success: boolean; orderId?: string; error?: string }> {
  const authStore = useAuthStore()

  // 檢查用戶認證
  if (!authStore.user?.user_id) {
    return { success: false, error: '請先登入系統' }
  }

  // 驗證表單資料
  const validation = validateOrderForm(formData)
  if (!validation.isValid) {
    return { success: false, error: validation.error }
  }

  try {
    // 生成訂單編號
    const orderNumber = generateOrderNumber()

    // 計算金額
    const amounts = calculateOrderAmounts(formData.items, formData.extra_discount || 0)

    // 建立訂單
    const orderData = {
      order_id: orderNumber,
      student_id: formData.student_id,
      contact_id: formData.contact_id,
      item_type: 'enrollment', // 主要類型
      original_amount: amounts.originalAmount,
      discount_amount: amounts.totalDiscountAmount,
      final_amount: amounts.finalAmount,
      status: 'pending',
      discount_reason: formData.discount_reason || null,
      created_by: authStore.user.user_id
    }

    const newOrder = await db.create('orders', orderData)

    // 建立訂單項目
    for (const item of formData.items) {
      // 確保有 item_id
      let itemId = item.item_id
      if (!itemId) {
        itemId = generateItemId(item.item_type)
      }

      const itemData = {
        order_id: orderNumber,
        item_type: item.item_type,
        item_id: itemId,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        discount_amount: item.discount_amount || 0,
        final_price: item.final_price,
        notes: item.notes || null
      }

      await db.create('order_items', itemData)
    }

    return { success: true, orderId: orderNumber }
  } catch (error) {
    console.error('建立訂單失敗:', error)
    return { success: false, error: `建立訂單失敗: ${error.message}` }
  }
}

// 載入基礎資料的輔助函數
export async function loadStudents() {
  try {
    const students = await db.findMany('students', {
      columns: 'id, student_id, chinese_name, english_name, is_active',
      filters: { is_active: true },
      orderBy: 'chinese_name',
      ascending: true
    })
    return { success: true, data: students }
  } catch (error) {
    console.error('載入學生資料失敗:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export async function loadCourses() {
  try {
    const courses = await db.findMany('courses', {
      columns: 'id, course_id, course_name, price_per_session, total_sessions, status',
      filters: { status: 'active' },
      orderBy: 'course_name',
      ascending: true
    })
    return { success: true, data: courses }
  } catch (error) {
    console.error('載入課程資料失敗:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export async function loadStudentContacts(studentId: string) {
  try {
    const relationships = await db.findMany('student_contacts', {
      columns: `
        id, student_id, contact_id, relationship, is_primary,
        contact:contacts(id, contact_id, full_name, phone, email, address, notes, is_active)
      `,
      filters: { student_id: studentId },
      ascending: true
    })

    const contacts = relationships
      .map(rel => ({ ...rel.contact, is_primary: rel.is_primary, relationship: rel.relationship }))
      .filter(contact => contact)
      .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))

    return { success: true, data: contacts }
  } catch (error) {
    console.error('載入學生聯絡人失敗:', error)
    return { success: false, error: error.message, data: [] }
  }
}
