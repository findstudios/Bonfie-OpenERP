/**
 * 簡單的 Logger 工具
 * 在正式環境中會自動關閉所有 console.log
 */

const isDev = import.meta.env.DEV

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args)
    }
  },

  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args)
    }
  },

  error: (...args: any[]) => {
    // 錯誤訊息在正式環境也要顯示
    console.error(...args)
  },

  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args)
    }
  },

  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args)
    }
  },

  // 群組功能
  group: (label: string) => {
    if (isDev) {
      console.group(label)
    }
  },

  groupEnd: () => {
    if (isDev) {
      console.groupEnd()
    }
  }
}

// 導出一個可以帶前綴的 logger
export function createLogger(prefix: string) {
  return {
    log: (...args: any[]) => logger.log(`[${prefix}]`, ...args),
    warn: (...args: any[]) => logger.warn(`[${prefix}]`, ...args),
    error: (...args: any[]) => logger.error(`[${prefix}]`, ...args),
    info: (...args: any[]) => logger.info(`[${prefix}]`, ...args),
    debug: (...args: any[]) => logger.debug(`[${prefix}]`, ...args)
  }
}
