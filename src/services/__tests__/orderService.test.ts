import { describe, it, expect, vi, beforeEach } from 'vitest'
import { confirmOrder, cancelOrder, updateOrder, deleteOrder } from '../orderService'
import { db } from '../supabase'
import { useAuthStore } from '@/stores/authSupabase'

// Mock dependencies
vi.mock('../supabase', () => ({
  db: {
    update: vi.fn().mockResolvedValue(true)
  }
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn()
}))

describe('orderService', () => {
  const mockUser = {
    user_id: 'test-user-123',
    username: 'testuser'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser
    })
  })

  describe('confirmOrder', () => {
    it('should update order status to confirmed without updated_by field', async () => {
      const orderNumber = 'ORD-2024-001'

      await confirmOrder(orderNumber)

      expect(db.update).toHaveBeenCalledWith(
        'orders',
        { order_id: orderNumber },
        {
          status: 'confirmed',
          updated_at: expect.any(String)
        }
      )

      // Verify updated_by is NOT included
      const updateCall = vi.mocked(db.update).mock.calls[0]
      expect(updateCall[2]).not.toHaveProperty('updated_by')
    })
  })

  describe('cancelOrder', () => {
    it('should update order status to cancelled without updated_by field', async () => {
      const orderNumber = 'ORD-2024-001'
      const reason = 'Customer request'

      await cancelOrder(orderNumber, reason)

      expect(db.update).toHaveBeenCalledWith(
        'orders',
        { order_id: orderNumber },
        {
          status: 'cancelled',
          updated_at: expect.any(String),
          discount_reason: `取消原因: ${reason}`
        }
      )

      // Verify updated_by is NOT included
      const updateCall = vi.mocked(db.update).mock.calls[0]
      expect(updateCall[2]).not.toHaveProperty('updated_by')
    })

    it('should handle cancellation without reason', async () => {
      const orderNumber = 'ORD-2024-001'

      await cancelOrder(orderNumber)

      expect(db.update).toHaveBeenCalledWith(
        'orders',
        { order_id: orderNumber },
        {
          status: 'cancelled',
          updated_at: expect.any(String)
        }
      )

      // Verify discount_reason is not set when no reason provided
      const updateCall = vi.mocked(db.update).mock.calls[0]
      expect(updateCall[2]).not.toHaveProperty('discount_reason')
    })
  })

  describe('updateOrder', () => {
    it('should update order without updated_by field', async () => {
      const orderNumber = 'ORD-2024-001'
      const updateData = {
        status: 'processing' as any,
        discount_amount: 100,
        discount_reason: 'Loyalty discount'
      }

      await updateOrder(orderNumber, updateData)

      expect(db.update).toHaveBeenCalledWith(
        'orders',
        { order_id: orderNumber },
        {
          ...updateData,
          updated_at: expect.any(String)
        }
      )

      // Verify updated_by is NOT included
      const updateCall = vi.mocked(db.update).mock.calls[0]
      expect(updateCall[2]).not.toHaveProperty('updated_by')
    })
  })

  describe('deleteOrder', () => {
    it('should soft delete order using cancelled status', async () => {
      const orderNumber = 'ORD-2024-001'

      await deleteOrder(orderNumber)

      expect(db.update).toHaveBeenCalledWith(
        'orders',
        { order_id: orderNumber },
        {
          status: 'cancelled',
          updated_at: expect.any(String),
          discount_reason: expect.stringContaining('訂單已刪除')
        }
      )

      // Verify no is_deleted, deleted_at, or deleted_by fields
      const updateCall = vi.mocked(db.update).mock.calls[0]
      expect(updateCall[2]).not.toHaveProperty('is_deleted')
      expect(updateCall[2]).not.toHaveProperty('deleted_at')
      expect(updateCall[2]).not.toHaveProperty('deleted_by')
    })
  })
})
