import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { printOrder, printReceipt, printDetailedInvoice, printSimple } from '../printService'
import type { Order } from '@/utils/paymentCalculator'

// Mock window.open
const mockPrintWindow = {
  document: {
    write: vi.fn(),
    close: vi.fn()
  }
}

describe('printService', () => {
  let consoleSpy: any
  let windowOpenSpy: any
  let fetchSpy: any
  let alertSpy: any

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(mockPrintWindow as any)
    fetchSpy = vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Template not found'))
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.stubEnv('NODE_ENV', 'development')
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    windowOpenSpy.mockRestore()
    fetchSpy.mockRestore()
    alertSpy.mockRestore()
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  describe('printOrder with invalid payment data', () => {
    it('should handle order with null payment amounts', async () => {
      const order: Order = {
        order_id: 'PRINT-001',
        original_amount: 1000,
        discount_amount: 100,
        final_amount: 900,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        payments: [
          {
            payment_date: '2024-01-01',
            method: 'cash',
            amount: null as any, // Invalid amount
            receipt_number: 'R001'
          },
          {
            payment_date: '2024-01-02',
            method: 'credit',
            amount: undefined as any, // Invalid amount
            receipt_number: 'R002'
          }
        ],
        items: [
          {
            item_name: 'Test Course',
            quantity: 1,
            unit_price: 1000,
            total_price: 1000,
            final_price: 900
          }
        ]
      }

      await expect(printOrder(order)).resolves.not.toThrow()

      // Should open print window
      expect(windowOpenSpy).toHaveBeenCalled()
      expect(mockPrintWindow.document.write).toHaveBeenCalled()
      expect(mockPrintWindow.document.close).toHaveBeenCalled()

      // Should log warnings about invalid payment data
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ErrorMonitor]',
        expect.objectContaining({
          message: expect.stringContaining('Payment validation failed'),
          category: 'payment_validation'
        })
      )
    })

    it('should handle order with string payment amounts', async () => {
      const order: Order = {
        order_id: 'PRINT-002',
        original_amount: 2000,
        discount_amount: 0,
        final_amount: 2000,
        status: 'pending',
        created_at: new Date().toISOString(),
        payments: [
          {
            payment_date: '2024-01-01',
            method: 'cash',
            amount: '500.50' as any, // String amount
            receipt_number: 'R003'
          },
          {
            payment_date: '2024-01-02',
            method: 'transfer',
            amount: 'invalid' as any, // Invalid string
            receipt_number: 'R004'
          },
          {
            payment_date: '2024-01-03',
            method: 'credit',
            amount: '' as any, // Empty string
            receipt_number: 'R005'
          }
        ]
      }

      await expect(printOrder(order)).resolves.not.toThrow()
      expect(windowOpenSpy).toHaveBeenCalled()
    })

    it('should handle order with missing payment array', async () => {
      const order: Order = {
        order_id: 'PRINT-003',
        original_amount: 1500,
        discount_amount: 0,
        final_amount: 1500,
        status: 'pending',
        created_at: new Date().toISOString(),
        payments: null as any, // Missing payments
        items: []
      }

      await expect(printOrder(order)).resolves.not.toThrow()
      expect(windowOpenSpy).toHaveBeenCalled()
    })

    it('should handle order with payment objects and arrays', async () => {
      const order: Order = {
        order_id: 'PRINT-004',
        original_amount: 3000,
        discount_amount: 300,
        final_amount: 2700,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        payments: [
          {
            payment_date: '2024-01-01',
            method: 'cash',
            amount: {} as any, // Invalid object
            receipt_number: 'R006'
          },
          {
            payment_date: '2024-01-02',
            method: 'credit',
            amount: [] as any, // Invalid array
            receipt_number: 'R007'
          },
          {
            payment_date: '2024-01-03',
            method: 'transfer',
            amount: { value: 1000 } as any, // Invalid nested object
            receipt_number: 'R008'
          }
        ]
      }

      await expect(printOrder(order)).resolves.not.toThrow()
      expect(windowOpenSpy).toHaveBeenCalled()
    })

    it('should handle payment with special numeric values', async () => {
      const order: Order = {
        order_id: 'PRINT-005',
        original_amount: 2000,
        discount_amount: 0,
        final_amount: 2000,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        payments: [
          {
            payment_date: '2024-01-01',
            method: 'cash',
            amount: NaN, // NaN
            receipt_number: 'R009'
          },
          {
            payment_date: '2024-01-02',
            method: 'credit',
            amount: Infinity, // Infinity
            receipt_number: 'R010'
          },
          {
            payment_date: '2024-01-03',
            method: 'transfer',
            amount: -Infinity, // -Infinity
            receipt_number: 'R011'
          }
        ]
      }

      await expect(printOrder(order)).resolves.not.toThrow()
      expect(windowOpenSpy).toHaveBeenCalled()
    })

    it('should handle payment with missing fields', async () => {
      const order: Order = {
        order_id: 'PRINT-006',
        original_amount: 1000,
        discount_amount: 0,
        final_amount: 1000,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        payments: [
          {
            // Missing payment_date
            method: 'cash',
            amount: 500
          } as any,
          {
            payment_date: '2024-01-02',
            // Missing method
            amount: 300
          } as any,
          {
            payment_date: '2024-01-03',
            method: 'credit',
            amount: 200,
            // Missing receipt_number (optional)
          }
        ]
      }

      await expect(printOrder(order)).resolves.not.toThrow()
      expect(windowOpenSpy).toHaveBeenCalled()
    })
  })

  describe('printReceipt', () => {
    it('should print receipt without payment history', async () => {
      const order: Order = {
        order_id: 'RECEIPT-001',
        original_amount: 1000,
        discount_amount: 0,
        final_amount: 1000,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        payments: [
          {
            payment_date: '2024-01-01',
            method: 'cash',
            amount: null as any, // Invalid amount should not break receipt
            receipt_number: 'R001'
          }
        ],
        items: [
          {
            item_name: 'Basic Course',
            quantity: 1,
            unit_price: 1000,
            total_price: 1000,
            final_price: 1000
          }
        ]
      }

      await expect(printReceipt(order)).resolves.not.toThrow()
      expect(windowOpenSpy).toHaveBeenCalled()
    })
  })

  describe('printDetailedInvoice', () => {
    it('should print detailed invoice with payment history containing invalid data', async () => {
      const order: Order = {
        order_id: 'INVOICE-001',
        original_amount: 5000,
        discount_amount: 500,
        final_amount: 4500,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        payments: [
          {
            payment_date: '2024-01-01',
            method: 'cash',
            amount: 2000, // Valid
            receipt_number: 'R001'
          },
          {
            payment_date: '2024-01-02',
            method: 'credit',
            amount: 'abc' as any, // Invalid
            receipt_number: 'R002'
          },
          {
            payment_date: '2024-01-03',
            method: 'transfer',
            amount: null as any, // Invalid
            receipt_number: 'R003'
          }
        ],
        items: [
          {
            item_name: 'Premium Course',
            quantity: 1,
            unit_price: 5000,
            total_price: 5000,
            final_price: 4500
          }
        ]
      }

      await expect(printDetailedInvoice(order)).resolves.not.toThrow()
      expect(windowOpenSpy).toHaveBeenCalled()

      // Check that HTML contains payment history
      const htmlContent = mockPrintWindow.document.write.mock.calls[0][0]
      expect(htmlContent).toContain('付款記錄')
    })
  })

  describe('printSimple', () => {
    it('should print simple version without payment history or item details', async () => {
      const order: Order = {
        order_id: 'SIMPLE-001',
        original_amount: 1000,
        discount_amount: 100,
        final_amount: 900,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        payments: [
          {
            payment_date: '2024-01-01',
            method: 'cash',
            amount: Symbol('test') as any, // Edge case: Symbol
            receipt_number: 'R001'
          }
        ]
      }

      await expect(printSimple(order)).resolves.not.toThrow()
      expect(windowOpenSpy).toHaveBeenCalled()

      // Check that HTML does not contain payment history
      const htmlContent = mockPrintWindow.document.write.mock.calls[0][0]
      expect(htmlContent).not.toContain('付款記錄')
      expect(htmlContent).toContain('項目明細已隱藏')
    })
  })

  describe('error recovery', () => {
    it('should handle when window.open returns null', async () => {
      windowOpenSpy.mockReturnValue(null)

      const order: Order = {
        order_id: 'ERROR-001',
        original_amount: 1000,
        discount_amount: 0,
        final_amount: 1000,
        status: 'confirmed',
        created_at: new Date().toISOString()
      }

      await expect(printOrder(order)).resolves.not.toThrow()
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('無法開啟列印視窗')
      )
    })

    it('should handle order with null/undefined payment objects', async () => {
      const order: Order = {
        order_id: 'NULL-PAYMENT-001',
        original_amount: 1000,
        discount_amount: 0,
        final_amount: 1000,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        payments: [
          null as any,
          undefined as any,
          {
            payment_date: '2024-01-01',
            method: 'cash',
            amount: 500,
            receipt_number: 'R001'
          }
        ]
      }

      await expect(printOrder(order)).resolves.not.toThrow()
      expect(windowOpenSpy).toHaveBeenCalled()

      // Should log warnings about null/undefined payments
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ErrorMonitor]',
        expect.objectContaining({
          message: expect.stringContaining('Payment validation failed at index 0'),
          category: 'payment_validation'
        })
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ErrorMonitor]',
        expect.objectContaining({
          message: expect.stringContaining('Payment validation failed at index 1'),
          category: 'payment_validation'
        })
      )
    })

    it('should handle payment with boolean amounts', async () => {
      const order: Order = {
        order_id: 'BOOL-001',
        original_amount: 100,
        discount_amount: 0,
        final_amount: 100,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        payments: [
          {
            payment_date: '2024-01-01',
            method: 'cash',
            amount: true as any, // Boolean true -> 1
            receipt_number: 'R001'
          },
          {
            payment_date: '2024-01-02',
            method: 'credit',
            amount: false as any, // Boolean false -> 0
            receipt_number: 'R002'
          }
        ]
      }

      await expect(printOrder(order)).resolves.not.toThrow()
      expect(windowOpenSpy).toHaveBeenCalled()
    })
  })
})
