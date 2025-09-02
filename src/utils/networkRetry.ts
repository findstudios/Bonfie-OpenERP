import { createLogger } from '@/utils/logger'

const log = createLogger('NetworkRetry')

interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffFactor?: number
  retryCondition?: (error: any) => boolean
  onRetry?: (attempt: number, error: any) => void
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error) => {
    // 重試網路錯誤和 5xx 錯誤
    if (error.message?.includes('network') || 
        error.message?.includes('fetch') ||
        error.message?.includes('Failed to fetch')) {
      return true
    }
    
    // 重試 Supabase 特定錯誤
    if (error.status >= 500 || error.status === 0) {
      return true
    }
    
    // 重試連線超時錯誤
    if (error.code === 'ECONNABORTED' || 
        error.code === 'ETIMEDOUT' ||
        error.message?.includes('timeout')) {
      return true
    }
    
    return false
  },
  onRetry: (attempt, error) => {
    log.warn(`重試第 ${attempt} 次`, error.message)
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options }
  let lastError: any
  
  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // 檢查是否應該重試
      if (!opts.retryCondition(error)) {
        throw error
      }
      
      // 如果是最後一次嘗試，直接拋出錯誤
      if (attempt === opts.maxRetries) {
        log.error(`所有重試都失敗 (${opts.maxRetries} 次)`, error)
        throw error
      }
      
      // 計算延遲時間（指數退避）
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffFactor, attempt - 1),
        opts.maxDelay
      )
      
      // 執行重試回調
      opts.onRetry(attempt, error)
      
      // 等待後重試
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

// 檢測網路連線狀態
export function isOnline(): boolean {
  return navigator.onLine
}

// 等待網路恢復
export function waitForOnline(timeout = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isOnline()) {
      resolve()
      return
    }
    
    const timer = setTimeout(() => {
      reject(new Error('等待網路連線超時'))
    }, timeout)
    
    const handleOnline = () => {
      clearTimeout(timer)
      window.removeEventListener('online', handleOnline)
      resolve()
    }
    
    window.addEventListener('online', handleOnline)
  })
}

// 網路狀態監控
export class NetworkMonitor {
  private listeners: Set<(online: boolean) => void> = new Set()
  private isMonitoring = false
  
  start() {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
    
    log.log('網路監控已啟動')
  }
  
  stop() {
    if (!this.isMonitoring) return
    
    this.isMonitoring = false
    
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    
    this.listeners.clear()
    
    log.log('網路監控已停止')
  }
  
  onStatusChange(callback: (online: boolean) => void) {
    this.listeners.add(callback)
    
    return () => {
      this.listeners.delete(callback)
    }
  }
  
  private handleOnline = () => {
    log.log('網路已連線')
    this.notifyListeners(true)
  }
  
  private handleOffline = () => {
    log.warn('網路已斷線')
    this.notifyListeners(false)
  }
  
  private notifyListeners(online: boolean) {
    this.listeners.forEach(listener => {
      try {
        listener(online)
      } catch (error) {
        log.error('網路狀態監聽器錯誤', error)
      }
    })
  }
}

export const networkMonitor = new NetworkMonitor()