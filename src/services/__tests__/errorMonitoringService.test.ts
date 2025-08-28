import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  errorMonitor,
  ErrorCategory,
  ErrorSeverity,
  logFormattingError,
  logPaymentValidationError,
  logPdfGenerationError,
  withErrorMonitoring
} from '../errorMonitoringService'

describe('errorMonitoringService', () => {
  const consoleSpies: any = {}

  beforeEach(() => {
    errorMonitor.clearLogs()
    consoleSpies.info = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleSpies.warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleSpies.error = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubEnv('NODE_ENV', 'development')
  })

  afterEach(() => {
    Object.values(consoleSpies).forEach((spy: any) => spy.mockRestore())
    vi.unstubAllEnvs()
  })

  describe('logError', () => {
    it('should log error with full context', () => {
      const error = new Error('Test error')
      errorMonitor.logError(
        'Test error message',
        {
          category: ErrorCategory.PDF_GENERATION,
          severity: ErrorSeverity.ERROR,
          service: 'testService',
          function: 'testFunction',
          input: { test: 'data' },
          metadata: { orderId: '12345' }
        },
        error
      )

      const stats = errorMonitor.getStats()
      expect(stats.totalErrors).toBe(1)
      expect(stats.errorsByCategory[ErrorCategory.PDF_GENERATION]).toBe(1)
      expect(stats.errorsBySeverity[ErrorSeverity.ERROR]).toBe(1)
      expect(stats.errorsByService['testService']).toBe(1)

      const logs = errorMonitor.getRecentLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].message).toBe('Test error message')
      expect(logs[0].error).toBe(error)
      expect(logs[0].context.service).toBe('testService')
    })

    it('should use default values for missing context', () => {
      errorMonitor.logError('Minimal error', {})

      const logs = errorMonitor.getRecentLogs()
      expect(logs[0].context.category).toBe(ErrorCategory.SYSTEM)
      expect(logs[0].context.severity).toBe(ErrorSeverity.ERROR)
      expect(logs[0].context.service).toBe('unknown')
    })

    it('should sanitize sensitive data', () => {
      errorMonitor.logError(
        'Error with sensitive data',
        {
          service: 'auth',
          input: {
            username: 'test',
            password: 'secret123',
            token: 'jwt-token',
            credit_card: '1234-5678-9012-3456'
          }
        }
      )

      const logs = errorMonitor.getRecentLogs()
      const sanitizedInput = logs[0].context.input
      expect(sanitizedInput.username).toBe('test')
      expect(sanitizedInput.password).toBe('[REDACTED]')
      expect(sanitizedInput.token).toBe('[REDACTED]')
      expect(sanitizedInput.credit_card).toBe('[REDACTED]')
    })

    it('should truncate long strings', () => {
      const longString = 'a'.repeat(250)
      errorMonitor.logError(
        'Error with long string',
        {
          service: 'test',
          input: longString
        }
      )

      const logs = errorMonitor.getRecentLogs()
      expect(logs[0].context.input).toHaveLength(203) // 200 + '...'
      expect(logs[0].context.input).toMatch(/\.\.\.$/)
    })
  })

  describe('logFormattingError', () => {
    it('should log formatting errors with appropriate context', () => {
      logFormattingError(null, 'formatCurrency')

      const logs = errorMonitor.getRecentLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].message).toBe('Formatting error in formatCurrency')
      expect(logs[0].context.category).toBe(ErrorCategory.FORMATTING)
      expect(logs[0].context.severity).toBe(ErrorSeverity.WARNING)
      expect(logs[0].context.service).toBe('formatters')
      expect(logs[0].context.metadata?.inputType).toBe('object')
      expect(logs[0].context.metadata?.inputValue).toBe('null')
    })

    it('should handle various input types', () => {
      const testCases = [
        { input: undefined, expectedType: 'undefined', expectedValue: 'undefined' },
        { input: NaN, expectedType: 'number', expectedValue: 'NaN' },
        { input: Infinity, expectedType: 'number', expectedValue: 'Infinity' },
        { input: -Infinity, expectedType: 'number', expectedValue: '-Infinity' },
        { input: {}, expectedType: 'object', expectedValue: 'Object(0 keys)' },
        { input: [], expectedType: 'object', expectedValue: 'Array(0)' },
        { input: 'test', expectedType: 'string', expectedValue: 'test' }
      ]

      testCases.forEach(({ input, expectedType, expectedValue }) => {
        errorMonitor.clearLogs()
        logFormattingError(input, 'testFunction')

        const logs = errorMonitor.getRecentLogs()
        expect(logs[0].context.metadata?.inputType).toBe(expectedType)
        expect(logs[0].context.metadata?.inputValue).toBe(expectedValue)
      })
    })
  })

  describe('logPaymentValidationError', () => {
    it('should log payment validation errors', () => {
      const payment = {
        payment_date: '2024-01-01',
        method: 'cash',
        amount: 'invalid' as any,
        receipt_number: 'R001'
      }

      logPaymentValidationError(payment, 5, 'pdfService', 'Invalid amount format')

      const logs = errorMonitor.getRecentLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].message).toContain('Payment validation failed at index 5')
      expect(logs[0].message).toContain('Invalid amount format')
      expect(logs[0].context.category).toBe(ErrorCategory.PAYMENT_VALIDATION)
      expect(logs[0].context.metadata?.paymentIndex).toBe(5)
      expect(logs[0].context.metadata?.amountType).toBe('string')
      expect(logs[0].context.metadata?.amountValue).toBe('invalid')
    })

    it('should handle null/undefined payments', () => {
      logPaymentValidationError(null, 0, 'printService')
      logPaymentValidationError(undefined, 1, 'printService')

      const logs = errorMonitor.getRecentLogs()
      expect(logs).toHaveLength(2)
      expect(logs[0].context.metadata?.amountType).toBe('null')
      expect(logs[1].context.metadata?.amountType).toBe('null')
    })
  })

  describe('logPdfGenerationError', () => {
    it('should log PDF generation errors', () => {
      const error = new Error('PDF generation failed: Out of memory')
      logPdfGenerationError('ORDER-123', 'directPdfService', error, 'rendering')

      const logs = errorMonitor.getRecentLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].message).toBe('PDF generation failed for order ORDER-123 at stage: rendering')
      expect(logs[0].context.category).toBe(ErrorCategory.PDF_GENERATION)
      expect(logs[0].context.severity).toBe(ErrorSeverity.ERROR)
      expect(logs[0].context.metadata?.orderId).toBe('ORDER-123')
      expect(logs[0].context.metadata?.stage).toBe('rendering')
      expect(logs[0].context.metadata?.errorMessage).toBe('PDF generation failed: Out of memory')
    })
  })

  describe('getStats', () => {
    it('should aggregate statistics correctly', () => {
      // Log various types of errors
      logFormattingError(null, 'format1')
      logFormattingError(undefined, 'format2')
      logPaymentValidationError(null, 0, 'service1')
      logPdfGenerationError('ORDER-1', 'service2', new Error('Test'))
      errorMonitor.logError('System error', {
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.CRITICAL,
        service: 'service3'
      })

      const stats = errorMonitor.getStats()
      expect(stats.totalErrors).toBe(5)
      expect(stats.errorsByCategory[ErrorCategory.FORMATTING]).toBe(2)
      expect(stats.errorsByCategory[ErrorCategory.PAYMENT_VALIDATION]).toBe(1)
      expect(stats.errorsByCategory[ErrorCategory.PDF_GENERATION]).toBe(1)
      expect(stats.errorsByCategory[ErrorCategory.SYSTEM]).toBe(1)
      expect(stats.errorsBySeverity[ErrorSeverity.WARNING]).toBe(3)
      expect(stats.errorsBySeverity[ErrorSeverity.ERROR]).toBe(1)
      expect(stats.errorsBySeverity[ErrorSeverity.CRITICAL]).toBe(1)
    })
  })

  describe('getLogsByCategory', () => {
    it('should filter logs by category', () => {
      logFormattingError(null, 'test1')
      logFormattingError(undefined, 'test2')
      logPaymentValidationError(null, 0, 'service')
      logPdfGenerationError('ORDER-1', 'service', new Error('Test'))

      const formattingLogs = errorMonitor.getLogsByCategory(ErrorCategory.FORMATTING)
      expect(formattingLogs).toHaveLength(2)
      expect(formattingLogs.every(log => log.context.category === ErrorCategory.FORMATTING)).toBe(true)

      const paymentLogs = errorMonitor.getLogsByCategory(ErrorCategory.PAYMENT_VALIDATION)
      expect(paymentLogs).toHaveLength(1)
      expect(paymentLogs[0].context.category).toBe(ErrorCategory.PAYMENT_VALIDATION)
    })

    it('should respect limit parameter', () => {
      for (let i = 0; i < 10; i++) {
        logFormattingError(i, `test${i}`)
      }

      const limitedLogs = errorMonitor.getLogsByCategory(ErrorCategory.FORMATTING, 3)
      expect(limitedLogs).toHaveLength(3)
    })
  })

  describe('withErrorMonitoring', () => {
    it('should wrap synchronous functions', () => {
      const mockFn = vi.fn((a: number, b: number) => a + b)
      const wrapped = withErrorMonitoring(mockFn, 'mathService', 'add')

      const result = wrapped(2, 3)
      expect(result).toBe(5)
      expect(mockFn).toHaveBeenCalledWith(2, 3)

      // No errors should be logged for successful execution
      expect(errorMonitor.getStats().totalErrors).toBe(0)
    })

    it('should catch and rethrow synchronous errors', () => {
      const error = new Error('Division by zero')
      const mockFn = vi.fn(() => { throw error })
      const wrapped = withErrorMonitoring(mockFn, 'mathService', 'divide')

      expect(() => wrapped()).toThrow('Division by zero')

      const logs = errorMonitor.getRecentLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].message).toBe('Function divide failed')
      expect(logs[0].context.service).toBe('mathService')
      expect(logs[0].error).toBe(error)
    })

    it('should wrap async functions', async () => {
      const mockFn = vi.fn(async (a: number, b: number) => a * b)
      const wrapped = withErrorMonitoring(mockFn, 'mathService', 'multiplyAsync')

      const result = await wrapped(4, 5)
      expect(result).toBe(20)
      expect(mockFn).toHaveBeenCalledWith(4, 5)

      // No errors should be logged for successful execution
      expect(errorMonitor.getStats().totalErrors).toBe(0)
    })

    it('should catch and rethrow async errors', async () => {
      const error = new Error('Async operation failed')
      const mockFn = vi.fn(async () => { throw error })
      const wrapped = withErrorMonitoring(mockFn, 'asyncService', 'failingOperation')

      await expect(wrapped()).rejects.toThrow('Async operation failed')

      const logs = errorMonitor.getRecentLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].message).toBe('Async function failingOperation failed')
      expect(logs[0].context.service).toBe('asyncService')
      expect(logs[0].error).toBe(error)
    })
  })

  describe('log output', () => {
    it('should output to console in development mode', () => {
      errorMonitor.logError('Test info', {
        severity: ErrorSeverity.INFO,
        service: 'test'
      })
      expect(consoleSpies.info).toHaveBeenCalledWith('[ErrorMonitor]', expect.any(Object))

      errorMonitor.logError('Test warning', {
        severity: ErrorSeverity.WARNING,
        service: 'test'
      })
      expect(consoleSpies.warn).toHaveBeenCalledWith('[ErrorMonitor]', expect.any(Object))

      errorMonitor.logError('Test error', {
        severity: ErrorSeverity.ERROR,
        service: 'test'
      })
      expect(consoleSpies.error).toHaveBeenCalledWith('[ErrorMonitor]', expect.any(Object))

      errorMonitor.logError('Test critical', {
        severity: ErrorSeverity.CRITICAL,
        service: 'test'
      })
      expect(consoleSpies.error).toHaveBeenCalledWith('[ErrorMonitor]', expect.any(Object))
    })

    it('should not output to console in production mode', () => {
      vi.stubEnv('NODE_ENV', 'production')

      errorMonitor.logError('Production error', {
        severity: ErrorSeverity.ERROR,
        service: 'test'
      })

      expect(consoleSpies.error).not.toHaveBeenCalled()
    })

    it('should output if ENABLE_ERROR_LOGGING is set in production', () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('ENABLE_ERROR_LOGGING', 'true')

      errorMonitor.logError('Production error with logging enabled', {
        severity: ErrorSeverity.ERROR,
        service: 'test'
      })

      expect(consoleSpies.error).toHaveBeenCalled()
    })
  })

  describe('memory management', () => {
    it('should limit log entries to prevent memory issues', () => {
      // Generate more logs than the limit
      for (let i = 0; i < 1100; i++) {
        errorMonitor.logError(`Error ${i}`, { service: 'test' })
      }

      const logs = errorMonitor.getRecentLogs(2000)
      expect(logs.length).toBeLessThanOrEqual(1000) // Max logs is 1000
    })
  })
})
