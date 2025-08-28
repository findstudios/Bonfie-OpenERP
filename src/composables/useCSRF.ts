/**
 * CSRF 保護 composable
 * 提供 CSRF token 管理和驗證功能
 */

import { ref, computed } from 'vue'
import { sessionService } from '@/services/sessionService'
import { validateCSRFToken } from '@/utils/crypto'

export function useCSRF() {
  const csrfToken = ref<string | null>(null)
  const isTokenValid = ref(false)

  /**
   * 初始化 CSRF token
   */
  const initializeCSRF = () => {
    const token = sessionService.getCSRFToken()
    if (token) {
      csrfToken.value = token
      isTokenValid.value = true
    }
  }

  /**
   * 獲取 CSRF token
   */
  const getToken = (): string | null => {
    if (!csrfToken.value) {
      initializeCSRF()
    }
    return csrfToken.value
  }

  /**
   * 驗證 CSRF token
   */
  const verifyToken = (token: string): boolean => {
    if (!csrfToken.value) return false
    return validateCSRFToken(token, csrfToken.value)
  }

  /**
   * 為表單添加 CSRF token
   */
  const addTokenToForm = (formData: FormData | Record<string, any>) => {
    const token = getToken()
    if (!token) {
      console.warn('CSRF token 不存在')
      return formData
    }

    if (formData instanceof FormData) {
      formData.append('csrf_token', token)
    } else {
      formData.csrf_token = token
    }

    return formData
  }

  /**
   * 為請求頭添加 CSRF token
   */
  const getHeaders = (): Record<string, string> => {
    const token = getToken()
    if (!token) {
      return {}
    }

    return {
      'X-CSRF-Token': token
    }
  }

  /**
   * 清除 CSRF token
   */
  const clearToken = () => {
    csrfToken.value = null
    isTokenValid.value = false
  }

  /**
   * 檢查請求是否需要 CSRF 保護
   */
  const needsCSRFProtection = (method: string): boolean => {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS', 'TRACE']
    return !safeMethods.includes(method.toUpperCase())
  }

  return {
    csrfToken: computed(() => csrfToken.value),
    isTokenValid: computed(() => isTokenValid.value),
    initializeCSRF,
    getToken,
    verifyToken,
    addTokenToForm,
    getHeaders,
    clearToken,
    needsCSRFProtection
  }
}
