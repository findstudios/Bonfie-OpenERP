import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generatePDF, generateReceiptPDF, generateDetailedInvoicePDF, generateCustomPDF } from '../pdfPrintService'
import type { Order } from '@/utils/paymentCalculator'

// Mock html2canvas
vi.mock('html2canvas', () => {
  return {
    default: vi.fn(() => Promise.resolve({
      toDataURL: vi.fn(() => 'data:image/png;base64,mockImageData'),
      width: 794,
      height: 1123
    }))
  }
})

// Mock jsPDF
vi.mock('jspdf', () => {
  return {
    default: vi.fn(() => ({
      addImage: vi.fn(),
      addPage: vi.fn(),
      save: vi.fn()
    }))
  }
})

describe('pdfPrintService', () => {
  let consoleSpy: any
  let createElementSpy: any
  let appendChildSpy: any
  let removeChildSpy: any
  let mockDiv: any

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubEnv('NODE_ENV', 'development')

    // Mock DOM manipulation
    mockDiv = {
      innerHTML: '',
      style: {},
      querySelector: vi.fn(() => ({} as any))
    }
    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockDiv as any)
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockDiv)
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockDiv)
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  describe('generatePDF with invalid payment data', () => {
    it('should handle order with null payment amounts', async () => {
      const order: Order = {
        order_id: 'PDF-001',
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

      await expect(generatePDF(order)).resolves.not.toThrow()

      // Should log warnings about invalid payment data
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ErrorMonitor]',
        expect.objectContaining({
          message: expect.stringContaining('Payment validation failed'),
          category: 'payment_validation'
        })
      )

      // Should create temporary div
      expect(createElementSpy).toHaveBeenCalledWith('div')
      expect(appendChildSpy).toHaveBeenCalled()
      expect(removeChildSpy).toHaveBeenCalled()
    })

    it('should handle order with string payment amounts', async () => {
      const order: Order = {
        order_id: 'PDF-002',
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
            amount: '   ' as any, // Whitespace string
            receipt_number: 'R005'
          }
        ]
      }

      await expect(generatePDF(order)).resolves.not.toThrow()
    })

    it('should handle order with mixed valid and invalid payment data', async () => {
      const order: Order = {
        order_id: 'PDF-003',
        original_amount: 3000,
        discount_amount: 300,
        final_amount: 2700,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        payments: [
          {
            payment_date: '2024-01-01',
            method: 'cash',
            amount: 1000, // Valid amount
            receipt_number: 'R005'
          },
          {
            payment_date: '2024-01-02',
            method: 'credit',
            amount: {} as any, // Invalid object
            receipt_number: 'R006'
          },
          {
            payment_date: '2024-01-03',
            method: 'transfer',
            amount: [] as any, // Invalid array
            receipt_number: 'R007'
          },
          {
            payment_date: '2024-01-04',
            method: 'cash',
            amount: NaN, // Invalid NaN
            receipt_number: 'R008'
          },
          {
            payment_date: '2024-01-05',
            method: 'credit',
            amount: Infinity, // Invalid Infinity
            receipt_number: 'R009'
          }
        ],
        items: [
          {
            item_name: 'Advanced Course',
            quantity: 1,
            unit_price: 3000,
            total_price: 3000,
            final_price: 2700
          }
        ]
      }

      await expect(generatePDF(order)).resolves.not.toThrow()

      // Check HTML content includes formatted amounts
      expect(mockDiv.innerHTML).toContain('NT$ 1,000') // Valid payment
      expect(mockDiv.innerHTML).toContain('NT$ 0') // Invalid payments converted to 0
    })

    it('should handle order with missing payment array', async () => {
      const order: Order = {
        order_id: 'PDF-004',
        original_amount: 1500,
        discount_amount: 0,
        final_amount: 1500,
        status: 'pending',
        created_at: new Date().toISOString(),
        payments: null as any, // Missing payments
        items: []
      }

      await expect(generatePDF(order)).resolves.not.toThrow()

      // Should not include payment history section
      expect(mockDiv.innerHTML).not.toContain('付款記錄')
    })

    it('should handle payment with missing fields', async () => {
      const order: Order = {
        order_id: 'PDF-005',
        original_amount: 2000,
        discount_amount: 200,
        final_amount: 1800,
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
            amount: 1000,
            // Missing receipt_number (optional)
          }
        ]
      }

      await expect(generatePDF(order)).resolves.not.toThrow()

      // Check that missing fields are handled with defaults
      expect(mockDiv.innerHTML).toContain('Unknown') // Default method
    })
  })

  describe('generateReceiptPDF', () => {
    it('should generate receipt without payment history', async () => {
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

      await expect(generateReceiptPDF(order)).resolves.not.toThrow()

      // Should not include payment history
      expect(mockDiv.innerHTML).not.toContain('付款記錄')
    })
  })

  describe('generateDetailedInvoicePDF', () => {
    it('should generate detailed invoice with payment history containing invalid data', async () => {
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
            receipt_number: 'R001',
            notes: 'First payment'
          },
          {
            payment_date: '2024-01-02',
            method: 'credit',
            amount: 'abc' as any, // Invalid
            receipt_number: 'R002',
            notes: 'Second payment'
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

      await expect(generateDetailedInvoicePDF(order)).resolves.not.toThrow()

      // Should include payment history
      expect(mockDiv.innerHTML).toContain('付款記錄')
      expect(mockDiv.innerHTML).toContain('NT$ 2,000') // Valid payment
      expect(mockDiv.innerHTML).toContain('NT$ 0') // Invalid payments
    })
  })

  describe('generateCustomPDF', () => {
    it('should generate PDF with custom filename', async () => {
      const order: Order = {
        order_id: 'CUSTOM-001',
        original_amount: 1000,
        discount_amount: 0,
        final_amount: 1000,
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

      await expect(generateCustomPDF(order, 'custom-invoice.pdf')).resolves.not.toThrow()
    })
  })

  describe('error recovery', () => {
    it('should handle null/undefined payment objects', async () => {
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

      await expect(generatePDF(order)).resolves.not.toThrow()

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

      await expect(generatePDF(order)).resolves.not.toThrow()

      // Check that boolean values are converted properly
      expect(mockDiv.innerHTML).toContain('NT$ 1') // true -> 1
      expect(mockDiv.innerHTML).toContain('NT$ 0') // false -> 0
    })

    it('should handle extremely large payment amounts', async () => {
      const order: Order = {
        order_id: 'LARGE-001',
        original_amount: Number.MAX_VALUE,
        discount_amount: 0,
        final_amount: Number.MAX_VALUE,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        payments: [
          {
            payment_date: '2024-01-01',
            method: 'transfer',
            amount: Number.MAX_VALUE,
            receipt_number: 'R001'
          },
          {
            payment_date: '2024-01-02',
            method: 'credit',
            amount: Number.MIN_VALUE,
            receipt_number: 'R002'
          }
        ]
      }

      await expect(generatePDF(order)).resolves.not.toThrow()
    })
  })
})
