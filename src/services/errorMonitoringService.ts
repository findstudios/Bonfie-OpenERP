/**
 * Error Monitoring Service
 * Provides structured error logging and monitoring for PDF generation and formatting errors
 */

import type { Payment } from '@/utils/paymentCalculator'

// Error severity levels
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Error categories for better organization
export enum ErrorCategory {
  FORMATTING = 'formatting',
  PDF_GENERATION = 'pdf_generation',
  PAYMENT_VALIDATION = 'payment_validation',
  DATA_INTEGRITY = 'data_integrity',
  SYSTEM = 'system'
}

// Error context interface
export interface ErrorContext {
  category: ErrorCategory
  severity: ErrorSeverity
  service: string
  function?: string
  input?: any
  metadata?: Record<string, any>
  timestamp: string
  environment: string
}

// Error log entry
export interface ErrorLogEntry {
  message: string
  context: ErrorContext
  error?: Error
  stackTrace?: string
}

// Monitoring statistics
export interface MonitoringStats {
  totalErrors: number
  errorsByCategory: Record<ErrorCategory, number>
  errorsBySeverity: Record<ErrorSeverity, number>
  errorsByService: Record<string, number>
  lastError?: ErrorLogEntry
  startTime: string
}

class ErrorMonitoringService {
  private logs: ErrorLogEntry[] = []
  private stats: MonitoringStats
  private maxLogs = 1000 // Maximum number of logs to keep in memory
  private sensitiveKeys = ['password', 'token', 'secret', 'credit_card', 'ssn']

  constructor() {
    this.stats = this.initializeStats()
  }

  private initializeStats(): MonitoringStats {
    return {
      totalErrors: 0,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      errorsByService: {} as Record<string, number>,
      startTime: new Date().toISOString()
    }
  }

  /**
   * Log an error with context
   */
  logError(
    message: string,
    context: Partial<ErrorContext>,
    error?: Error
  ): void {
    const fullContext: ErrorContext = {
      category: context.category || ErrorCategory.SYSTEM,
      severity: context.severity || ErrorSeverity.ERROR,
      service: context.service || 'unknown',
      function: context.function,
      input: this.sanitizeInput(context.input),
      metadata: this.sanitizeMetadata(context.metadata),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production'
    }

    const logEntry: ErrorLogEntry = {
      message,
      context: fullContext,
      error,
      stackTrace: error?.stack
    }

    this.addLog(logEntry)
    this.updateStats(logEntry)
    this.outputLog(logEntry)
  }

  /**
   * Log formatting errors specifically
   */
  logFormattingError(
    input: any,
    functionName: string,
    error?: Error
  ): void {
    this.logError(
      `Formatting error in ${functionName}`,
      {
        category: ErrorCategory.FORMATTING,
        severity: ErrorSeverity.WARNING,
        service: 'formatters',
        function: functionName,
        input,
        metadata: {
          inputType: typeof input,
          inputValue: this.getInputSummary(input)
        }
      },
      error
    )
  }

  /**
   * Log payment validation errors
   */
  logPaymentValidationError(
    payment: Payment | null | undefined,
    index: number,
    service: string,
    details?: string
  ): void {
    this.logError(
      `Payment validation failed at index ${index}: ${details || 'Invalid payment data'}`,
      {
        category: ErrorCategory.PAYMENT_VALIDATION,
        severity: ErrorSeverity.WARNING,
        service,
        function: 'validatePaymentData',
        input: payment,
        metadata: {
          paymentIndex: index,
          amountType: payment ? typeof payment.amount : 'null',
          amountValue: payment?.amount
        }
      }
    )
  }

  /**
   * Log PDF generation errors
   */
  logPdfGenerationError(
    orderId: string,
    service: string,
    error: Error,
    stage?: string
  ): void {
    this.logError(
      `PDF generation failed for order ${orderId}${stage ? ` at stage: ${stage}` : ''}`,
      {
        category: ErrorCategory.PDF_GENERATION,
        severity: ErrorSeverity.ERROR,
        service,
        function: 'generatePDF',
        metadata: {
          orderId,
          stage,
          errorMessage: error.message
        }
      },
      error
    )
  }

  /**
   * Get monitoring statistics
   */
  getStats(): MonitoringStats {
    return { ...this.stats }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 50): ErrorLogEntry[] {
    return this.logs.slice(-count)
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: ErrorCategory, limit?: number): ErrorLogEntry[] {
    const filtered = this.logs.filter(log => log.context.category === category)
    return limit ? filtered.slice(-limit) : filtered
  }

  /**
   * Clear logs (useful for testing)
   */
  clearLogs(): void {
    this.logs = []
    this.stats = this.initializeStats()
  }

  /**
   * Private helper methods
   */
  private addLog(entry: ErrorLogEntry): void {
    this.logs.push(entry)

    // Keep only the most recent logs to prevent memory issues
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  private updateStats(entry: ErrorLogEntry): void {
    this.stats.totalErrors++
    this.stats.lastError = entry

    // Update category stats
    const category = entry.context.category
    this.stats.errorsByCategory[category] = (this.stats.errorsByCategory[category] || 0) + 1

    // Update severity stats
    const severity = entry.context.severity
    this.stats.errorsBySeverity[severity] = (this.stats.errorsBySeverity[severity] || 0) + 1

    // Update service stats
    const service = entry.context.service
    this.stats.errorsByService[service] = (this.stats.errorsByService[service] || 0) + 1
  }

  private outputLog(entry: ErrorLogEntry): void {
    // Only log in development or if explicitly enabled
    if (process.env.NODE_ENV !== 'development' && !process.env.ENABLE_ERROR_LOGGING) {
      return
    }

    const logData = {
      timestamp: entry.context.timestamp,
      severity: entry.context.severity,
      category: entry.context.category,
      service: entry.context.service,
      function: entry.context.function,
      message: entry.message,
      metadata: entry.context.metadata,
      error: entry.error?.message,
      stackTrace: entry.stackTrace
    }

    // Use appropriate console method based on severity
    switch (entry.context.severity) {
      case ErrorSeverity.INFO:
        console.info('[ErrorMonitor]', logData)
        break
      case ErrorSeverity.WARNING:
        console.warn('[ErrorMonitor]', logData)
        break
      case ErrorSeverity.ERROR:
      case ErrorSeverity.CRITICAL:
        console.error('[ErrorMonitor]', logData)
        break
    }
  }

  private sanitizeInput(input: any): any {
    if (!input) return input

    // Don't log sensitive data types
    if (input instanceof File || input instanceof Blob) {
      return '[Binary Data]'
    }

    // Sanitize objects
    if (typeof input === 'object') {
      return this.sanitizeObject(input)
    }

    // Truncate long strings
    if (typeof input === 'string' && input.length > 200) {
      return `${input.substring(0, 200)}...`
    }

    return input
  }

  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.slice(0, 5).map(item => this.sanitizeInput(item))
    }

    const sanitized: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Skip sensitive keys
        if (this.sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          sanitized[key] = '[REDACTED]'
        } else {
          sanitized[key] = this.sanitizeInput(obj[key])
        }
      }
    }
    return sanitized
  }

  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) return undefined
    return this.sanitizeObject(metadata)
  }

  private getInputSummary(input: any): string {
    if (input === null) return 'null'
    if (input === undefined) return 'undefined'
    if (typeof input === 'number') {
      if (isNaN(input)) return 'NaN'
      if (!isFinite(input)) return input > 0 ? 'Infinity' : '-Infinity'
      return String(input)
    }
    if (typeof input === 'string') {
      return input.length > 50 ? `${input.substring(0, 50)}... (length: ${input.length})` : input
    }
    if (typeof input === 'object') {
      if (Array.isArray(input)) return `Array(${input.length})`
      return `Object(${Object.keys(input).length} keys)`
    }
    return String(input)
  }
}

// Export singleton instance
export const errorMonitor = new ErrorMonitoringService()

// Helper functions for common error logging scenarios
export function logFormattingError(input: any, functionName: string, error?: Error): void {
  errorMonitor.logFormattingError(input, functionName, error)
}

export function logPaymentValidationError(
  payment: Payment | null | undefined,
  index: number,
  service: string,
  details?: string
): void {
  errorMonitor.logPaymentValidationError(payment, index, service, details)
}

export function logPdfGenerationError(
  orderId: string,
  service: string,
  error: Error,
  stage?: string
): void {
  errorMonitor.logPdfGenerationError(orderId, service, error, stage)
}

// Performance monitoring helper
export function withErrorMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  service: string,
  functionName: string
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const startTime = Date.now()
    try {
      const result = fn(...args)

      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          errorMonitor.logError(
            `Async function ${functionName} failed`,
            {
              category: ErrorCategory.SYSTEM,
              severity: ErrorSeverity.ERROR,
              service,
              function: functionName,
              metadata: {
                duration: Date.now() - startTime,
                argsCount: args.length
              }
            },
            error
          )
          throw error
        }) as ReturnType<T>
      }

      return result
    } catch (error) {
      errorMonitor.logError(
        `Function ${functionName} failed`,
        {
          category: ErrorCategory.SYSTEM,
          severity: ErrorSeverity.ERROR,
          service,
          function: functionName,
          metadata: {
            duration: Date.now() - startTime,
            argsCount: args.length
          }
        },
        error as Error
      )
      throw error
    }
  }) as T
}
