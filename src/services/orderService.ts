/**
 * 訂單服務 - 統一管理訂單相關 API 操作
 */

import { db } from '@/services/supabase'
import { useAuthStore } from '@/stores/authSupabase'
import { generatePaymentId } from '@/utils/paymentCalculator'
import type { OrderStatus, PaymentMethod } from '@/services/orderStatus'
import { orderEnrollmentService } from '@/services/orderEnrollmentService'

export interface PaymentData {
  amount: number
  method: PaymentMethod
  date: string
  receiptNumber: string
  notes?: string
}

export interface OrderUpdateData {
  status?: OrderStatus
  discount_amount?: number
  discount_reason?: string
}

// 確認訂單
export async function confirmOrder(orderNumber: string): Promise<void> {
  const authStore = useAuthStore()

  if (!authStore.user?.user_id) {
    throw new Error('用戶未登入')
  }

  try {
    await db.update('orders',
      { order_id: orderNumber },
      {
        status: 'confirmed',
        updated_at: new Date().toISOString()
      }
    )

    console.log('OrderService - 訂單確認成功:', orderNumber)

    // 自動建立註冊記錄
    try {
      const result = await orderEnrollmentService.processOrderCompletion(orderNumber)
      if (result.success) {
        console.log('OrderService - 自動建立註冊成功:', result.message)
      } else {
        console.error('OrderService - 自動建立註冊失敗:', result.message)
      }
    } catch (enrollmentError) {
      console.error('OrderService - 自動建立註冊發生錯誤:', enrollmentError)
      // 不中斷訂單確認流程
    }
  } catch (error) {
    console.error('OrderService - 訂單確認失敗:', error)
    throw new Error(`確認訂單失敗: ${error.message}`)
  }
}

// 取消訂單
export async function cancelOrder(orderNumber: string, reason?: string): Promise<void> {
  const authStore = useAuthStore()

  if (!authStore.user?.user_id) {
    throw new Error('用戶未登入')
  }

  try {
    const updateData: any = {
      status: 'cancelled',
      updated_at: new Date().toISOString()
    }

    if (reason) {
      // Store cancellation reason in discount_reason field as a workaround
      updateData.discount_reason = updateData.discount_reason
        ? `${updateData.discount_reason} | 取消原因: ${reason}`
        : `取消原因: ${reason}`
    }

    await db.update('orders',
      { order_id: orderNumber },
      updateData
    )

    console.log('OrderService - 訂單取消成功:', orderNumber)
  } catch (error) {
    console.error('OrderService - 訂單取消失敗:', error)
    throw new Error(`取消訂單失敗: ${error.message}`)
  }
}

// 記錄付款
export async function recordPayment(orderNumber: string, paymentData: PaymentData): Promise<void> {
  const authStore = useAuthStore()

  if (!authStore.user?.user_id) {
    throw new Error('用戶未登入')
  }

  try {
    // 生成付款編號
    const paymentId = generatePaymentId()

    // 建立付款記錄
    const paymentRecord = {
      payment_id: paymentId,
      order_id: orderNumber,
      amount_paid: paymentData.amount,
      payment_method: paymentData.method,
      payment_date: paymentData.date,
      receipt_number: paymentData.receiptNumber,
      notes: paymentData.notes || null,
      created_by: authStore.user.user_id
    }

    await db.create('payments', paymentRecord)

    console.log('OrderService - 付款記錄成功:', paymentId)
  } catch (error) {
    console.error('OrderService - 付款記錄失敗:', error)
    throw new Error(`記錄付款失敗: ${error.message}`)
  }
}

// 更新訂單資訊
export async function updateOrder(orderNumber: string, updateData: OrderUpdateData): Promise<void> {
  const authStore = useAuthStore()

  if (!authStore.user?.user_id) {
    throw new Error('用戶未登入')
  }

  try {
    const data = {
      ...updateData,
      updated_at: new Date().toISOString()
    }

    await db.update('orders',
      { order_id: orderNumber },
      data
    )

    console.log('OrderService - 訂單更新成功:', orderNumber)
  } catch (error) {
    console.error('OrderService - 訂單更新失敗:', error)
    throw new Error(`更新訂單失敗: ${error.message}`)
  }
}

// 載入訂單詳情 (包含關聯資料) - 暫時停用此函數
export async function loadOrderDetails(orderNumber: string): Promise<any> {
  try {
    // 注意：此函數暫時停用，請直接使用 db.findOne
    throw new Error('此函數暫時停用，請使用直接的 db 調用')

    if (!order) {
      throw new Error('找不到指定的訂單')
    }

    // 載入訂單項目
    const items = await db.findMany('order_items', {
      columns: '*',
      filters: { order_id: orderNumber },
      orderBy: 'id',
      ascending: true
    })

    // 載入付款記錄
    const payments = await db.findMany('payments', {
      columns: '*',
      filters: { order_id: orderNumber },
      orderBy: 'payment_date',
      ascending: false
    })

    return {
      ...order,
      items,
      payments
    }
  } catch (error) {
    console.error('OrderService - 載入訂單詳情失敗:', error)
    throw new Error(`載入訂單失敗: ${error.message}`)
  }
}

// 載入訂單列表 (包含統計資訊)
export async function loadOrdersList(filters?: {
  status?: OrderStatus
  student_id?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}): Promise<any[]> {
  try {
    const queryFilters: any = {}

    if (filters?.status) {
      queryFilters.status = filters.status
    }
    if (filters?.student_id) {
      queryFilters.student_id = filters.student_id
    }
    if (filters?.date_from && filters?.date_to) {
      queryFilters.created_at = `gte.${filters.date_from},lte.${filters.date_to}`
    } else if (filters?.date_from) {
      queryFilters.created_at = `gte.${filters.date_from}`
    } else if (filters?.date_to) {
      queryFilters.created_at = `lte.${filters.date_to}`
    }

    const orders = await db.findMany('orders', {
      columns: `
        *,
        student:students(
          student_id,
          chinese_name,
          english_name
        ),
        contact:contacts(
          contact_id,
          full_name,
          phone
        )
      `,
      filters: queryFilters,
      orderBy: 'created_at',
      ascending: false,
      limit: filters?.limit || 50
    })

    // 為每個訂單載入項目和付款資訊
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const [items, payments] = await Promise.all([
          db.findMany('order_items', {
            columns: '*',
            filters: { order_id: order.order_id },
            orderBy: 'id'
          }),
          db.findMany('payments', {
            columns: '*',
            filters: { order_id: order.order_id },
            orderBy: 'payment_date'
          })
        ])

        return {
          ...order,
          items,
          payments
        }
      })
    )

    return ordersWithDetails
  } catch (error) {
    console.error('OrderService - 載入訂單列表失敗:', error)
    throw new Error(`載入訂單列表失敗: ${error.message}`)
  }
}

// 刪除訂單 (軟刪除 - 使用狀態標記)
export async function deleteOrder(orderNumber: string): Promise<void> {
  const authStore = useAuthStore()

  if (!authStore.user?.user_id) {
    throw new Error('用戶未登入')
  }

  try {
    // Since there's no is_deleted column, we'll use status 'cancelled' to mark as deleted
    await db.update('orders',
      { order_id: orderNumber },
      {
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        discount_reason: `訂單已刪除 - ${new Date().toISOString()} by ${authStore.user.username || authStore.user.user_id}`
      }
    )

    console.log('OrderService - 訂單刪除成功:', orderNumber)
  } catch (error) {
    console.error('OrderService - 訂單刪除失敗:', error)
    throw new Error(`刪除訂單失敗: ${error.message}`)
  }
}

// 取得今日營收統計
export async function getTodayRevenue(): Promise<{
  totalRevenue: number
  confirmedOrders: number
  pendingOrders: number
}> {
  try {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

    const [confirmedOrders, pendingOrders] = await Promise.all([
      db.findMany('orders', {
        columns: 'final_amount',
        filters: {
          status: 'confirmed',
          created_at: `gte.${todayStart},lt.${todayEnd}`
        }
      }),
      db.findMany('orders', {
        columns: 'id',
        filters: {
          status: 'pending',
          created_at: `gte.${todayStart},lt.${todayEnd}`
        }
      })
    ])

    const totalRevenue = confirmedOrders.reduce((sum, order) => sum + order.final_amount, 0)

    return {
      totalRevenue,
      confirmedOrders: confirmedOrders.length,
      pendingOrders: pendingOrders.length
    }
  } catch (error) {
    console.error('OrderService - 載入今日營收失敗:', error)
    return {
      totalRevenue: 0,
      confirmedOrders: 0,
      pendingOrders: 0
    }
  }
}
