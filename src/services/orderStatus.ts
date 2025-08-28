/**
 * 訂單狀態管理服務
 */

// 訂單狀態類型
export type OrderStatus = 'pending' | 'confirmed' | 'cancelled'

// 付款方式類型
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other'

// 獲取訂單狀態的樣式類別
export function getStatusClass(status: OrderStatus): string {
  const statusClasses = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'confirmed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800'
  }
  return statusClasses[status] || 'bg-gray-100 text-gray-800'
}

// 獲取訂單狀態的顯示文字
export function getStatusText(status: OrderStatus): string {
  const statusTexts = {
    'pending': '待處理',
    'confirmed': '已確認',
    'cancelled': '已取消'
  }
  return statusTexts[status] || status
}

// 獲取付款方式的顯示文字
export function getPaymentMethodText(method: PaymentMethod): string {
  const methodTexts = {
    'cash': '現金',
    'card': '信用卡',
    'transfer': '銀行轉帳',
    'other': '其他'
  }
  return methodTexts[method] || method
}

// 獲取付款方式的樣式類別
export function getPaymentMethodClass(method: PaymentMethod): string {
  const methodClasses = {
    'cash': 'bg-green-100 text-green-800',
    'card': 'bg-blue-100 text-blue-800',
    'transfer': 'bg-purple-100 text-purple-800',
    'other': 'bg-gray-100 text-gray-800'
  }
  return methodClasses[method] || 'bg-gray-100 text-gray-800'
}

// 檢查訂單狀態是否可以修改
export function canModifyOrder(status: OrderStatus): boolean {
  return status === 'pending'
}

// 檢查訂單狀態是否可以取消
export function canCancelOrder(status: OrderStatus): boolean {
  return status === 'pending'
}

// 檢查訂單狀態是否可以確認
export function canConfirmOrder(status: OrderStatus): boolean {
  return status === 'pending'
}

// 檢查訂單狀態是否可以添加付款
export function canAddPayment(status: OrderStatus): boolean {
  return status === 'confirmed'
}
