/**
 * 付款計算工具函數
 */

export interface Payment {
  id?: string
  payment_id: string
  order_id: string
  amount_paid: number
  payment_method: string
  payment_date: string
  receipt_number: string
  notes?: string
  created_at?: string
}

export interface OrderItem {
  id?: string
  item_type: string
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
  discount_amount: number
  final_price: number
  notes?: string
}

export interface Order {
  id?: string
  order_id: string
  student_id: string
  contact_id: string
  original_amount: number
  discount_amount: number
  final_amount: number
  status: string
  payments?: Payment[]
  items?: OrderItem[]
  created_at?: string
  updated_at?: string
}

// 計算總已付金額
export function getTotalPaid(payments: Payment[]): number {
  if (!payments || payments.length === 0) return 0
  return payments.reduce((sum, payment) => sum + payment.amount_paid, 0)
}

// 計算未付金額
export function getUnpaidAmount(order: Order): number {
  if (!order) return 0
  const totalPaid = getTotalPaid(order.payments || [])
  return Math.max(0, order.final_amount - totalPaid)
}

// 檢查訂單是否已完全付清
export function isFullyPaid(order: Order): boolean {
  return getUnpaidAmount(order) === 0
}

// 計算付款完成百分比
export function getPaymentPercentage(order: Order): number {
  if (!order || order.final_amount === 0) return 0
  const totalPaid = getTotalPaid(order.payments || [])
  return Math.min(100, (totalPaid / order.final_amount) * 100)
}

// 生成付款編號
export function generatePaymentId(): string {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `PAY${timestamp.slice(-6)}${random}`
}

// 計算訂單項目總額
export function calculateItemsTotal(items: OrderItem[]): number {
  if (!items || items.length === 0) return 0
  return items.reduce((sum, item) => sum + item.total_price, 0)
}

// 計算訂單項目折扣總額
export function calculateItemsDiscount(items: OrderItem[]): number {
  if (!items || items.length === 0) return 0
  return items.reduce((sum, item) => sum + (item.discount_amount || 0), 0)
}

// 計算訂單項目最終總額
export function calculateItemsFinalTotal(items: OrderItem[]): number {
  if (!items || items.length === 0) return 0
  return items.reduce((sum, item) => sum + item.final_price, 0)
}

// 計算單一項目總價
export function calculateItemTotal(quantity: number, unitPrice: number, discountAmount: number = 0): {
  totalPrice: number
  finalPrice: number
} {
  const totalPrice = quantity * unitPrice
  const finalPrice = Math.max(0, totalPrice - discountAmount)

  return {
    totalPrice,
    finalPrice
  }
}

// 驗證付款金額
export function validatePaymentAmount(amount: number, maxAmount: number): {
  isValid: boolean
  error?: string
} {
  if (amount <= 0) {
    return {
      isValid: false,
      error: '付款金額必須大於 0'
    }
  }

  if (amount > maxAmount) {
    return {
      isValid: false,
      error: `付款金額不能超過未付金額 $${maxAmount.toLocaleString('zh-TW')}`
    }
  }

  return { isValid: true }
}

// 計算剩餘付款期限 (假設 30 天付款期限)
export function getPaymentDaysRemaining(orderDate: string, paymentTermDays: number = 30): number {
  const orderDateObj = new Date(orderDate)
  const dueDate = new Date(orderDateObj.getTime() + (paymentTermDays * 24 * 60 * 60 * 1000))
  const today = new Date()
  const diffTime = dueDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

// 檢查付款是否逾期
export function isPaymentOverdue(order: Order, paymentTermDays: number = 30): boolean {
  if (isFullyPaid(order)) return false
  return getPaymentDaysRemaining(order.created_at || '', paymentTermDays) < 0
}
