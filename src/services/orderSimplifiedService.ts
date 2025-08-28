import { db, supabase } from './supabase'
import { orderEnrollmentService } from './orderEnrollmentService'
import type { Contact } from '@/types'

interface OrderItemData {
  item_type: 'enrollment' | 'material' | 'custom'
  item_id: string
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
  discount_amount: number
  final_price: number
  notes: string
  package_id?: string | null
}

interface OrderData {
  student_id: string
  contact_id: string
  items: OrderItemData[]
  extra_discount: number
  discount_reason: string
}

interface PaymentData {
  payment_method: 'cash' | 'transfer' | 'credit_card'
  amount: number
}

export const orderSimplifiedService = {
  /**
   * 取得學生的聯絡人列表
   */
  async getStudentContacts(studentId: string): Promise<Contact[]> {
    try {
      const { data, error } = await supabase
        .from('student_contacts')
        .select(`
          *,
          contact:contacts(*)
        `)
        .eq('student_id', studentId)
        .order('is_primary', { ascending: false })

      if (error) throw error

      return (data || []).map(sc => ({
        ...sc.contact,
        is_primary: sc.is_primary,
        is_billing: sc.is_billing,
        relationship: sc.relationship
      }))
    } catch (error) {
      console.error('取得學生聯絡人失敗:', error)
      throw error
    }
  },

  /**
   * 建立訂單
   */
  async createOrder(orderData: OrderData) {
    try {
      // 計算總金額
      const itemsTotal = orderData.items.reduce((sum, item) => sum + item.final_price, 0)
      const originalAmount = itemsTotal
      const discountAmount = orderData.extra_discount || 0
      const finalAmount = Math.max(0, originalAmount - discountAmount)

      // 產生訂單編號
      const orderNumber = `ORD${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`

      // 建立訂單
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_id: orderNumber,
          student_id: orderData.student_id,
          contact_id: orderData.contact_id,
          original_amount: originalAmount,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          discount_reason: orderData.discount_reason || '',
          status: 'pending'
        })
        .select()
        .single()

      if (orderError) throw orderError

      // 建立訂單項目
      const orderItems = orderData.items.map(item => ({
        order_id: order.order_id,
        item_type: item.item_type,
        item_id: item.item_id || null,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        discount_amount: item.discount_amount || 0,
        final_price: item.final_price,
        notes: item.notes || '',
        package_id: item.package_id || null
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      return order
    } catch (error) {
      console.error('建立訂單失敗:', error)
      throw error
    }
  },

  /**
   * 標記訂單為已付款
   */
  async markOrderAsPaid(orderId: string, paymentData: PaymentData) {
    try {
      // 更新訂單狀態
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('order_id', orderId)

      if (updateError) throw updateError

      // 建立付款記錄
      const paymentId = `PAY${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`

      const { error } = await supabase
        .from('payments')
        .insert({
          payment_id: paymentId,
          order_id: orderId,
          amount_paid: paymentData.amount,
          payment_method: paymentData.payment_method,
          payment_date: new Date().toISOString().split('T')[0]
        })

      if (error) throw error

      // 自動建立註冊記錄（如果有課程項目）
      await orderEnrollmentService.createEnrollmentFromOrder(orderId)

      return { success: true }
    } catch (error) {
      console.error('標記訂單付款失敗:', error)
      throw error
    }
  },

  /**
   * 列印收據
   */
  async printReceipt(orderId: string) {
    try {
      // 使用新的收據服務
      const { quickGenerateReceipt } = await import('./receiptService')
      await quickGenerateReceipt(orderId)
      return { success: true }
    } catch (error) {
      console.error('列印收據失敗:', error)
      throw error
    }
  }
}
