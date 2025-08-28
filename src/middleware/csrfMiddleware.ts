/**
 * CSRF 中介層
 * 為所有表單提交和 API 請求添加 CSRF 保護
 */

import { useCSRF } from '@/composables/useCSRF'
import type { Router } from 'vue-router'

/**
 * 安裝 CSRF 中介層
 */
export function installCSRFMiddleware(router: Router) {
  const csrf = useCSRF()

  // 初始化 CSRF
  csrf.initializeCSRF()

  // 攔截所有導航
  router.beforeEach((to, from, next) => {
    // 檢查是否需要認證
    if (to.meta.requiresAuth) {
      // 確保 CSRF token 存在
      const token = csrf.getToken()
      if (!token) {
        console.warn('CSRF token 不存在，重新初始化')
        csrf.initializeCSRF()
      }
    }
    next()
  })

  // 監聽表單提交
  document.addEventListener('submit', (event) => {
    const form = event.target as HTMLFormElement

    // 跳過某些表單
    if (form.hasAttribute('data-no-csrf')) {
      return
    }

    // 檢查是否需要 CSRF 保護
    const method = form.method.toUpperCase()
    if (!csrf.needsCSRFProtection(method)) {
      return
    }

    // 添加 CSRF token
    const token = csrf.getToken()
    if (token) {
      // 檢查是否已有 CSRF input
      let csrfInput = form.querySelector('input[name="csrf_token"]') as HTMLInputElement

      if (!csrfInput) {
        // 創建隱藏的 CSRF input
        csrfInput = document.createElement('input')
        csrfInput.type = 'hidden'
        csrfInput.name = 'csrf_token'
        form.appendChild(csrfInput)
      }

      csrfInput.value = token
    } else {
      console.error('CSRF token 不存在，表單提交可能會失敗')
    }
  })

  // 攔截 fetch 請求
  const originalFetch = window.fetch
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    // 轉換 input 為 Request 對象
    const request = input instanceof Request ? input : new Request(input, init)

    // 檢查是否需要 CSRF 保護
    if (csrf.needsCSRFProtection(request.method)) {
      // 添加 CSRF header
      const headers = new Headers(request.headers)
      const csrfHeaders = csrf.getHeaders()

      Object.entries(csrfHeaders).forEach(([key, value]) => {
        headers.set(key, value)
      })

      // 創建新的請求
      const newInit: RequestInit = {
        ...init,
        headers,
        method: request.method,
        body: request.body
      }

      return originalFetch(request.url, newInit)
    }

    return originalFetch(input, init)
  }

  // 攔截 XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function(
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null
  ) {
    // 保存方法供後續使用
    this._method = method
    return originalOpen.apply(this, arguments as any)
  }

  const originalSend = XMLHttpRequest.prototype.send
  XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
    // 檢查是否需要 CSRF 保護
    if (this._method && csrf.needsCSRFProtection(this._method)) {
      const csrfHeaders = csrf.getHeaders()
      Object.entries(csrfHeaders).forEach(([key, value]) => {
        this.setRequestHeader(key, value)
      })
    }

    return originalSend.apply(this, arguments as any)
  }
}

// 擴展 XMLHttpRequest 介面
declare global {
  interface XMLHttpRequest {
    _method?: string
  }
}

/**
 * CSRF 表單組件 mixin
 */
export const CSRFFormMixin = {
  methods: {
    /**
     * 為表單資料添加 CSRF token
     */
    addCSRFToken(formData: FormData | Record<string, any>) {
      const csrf = useCSRF()
      return csrf.addTokenToForm(formData)
    },

    /**
     * 獲取包含 CSRF 的請求頭
     */
    getCSRFHeaders() {
      const csrf = useCSRF()
      return csrf.getHeaders()
    }
  }
}

/**
 * Vue 指令：自動添加 CSRF token 到表單
 */
export const vCsrf = {
  mounted(el: HTMLFormElement) {
    if (el.tagName !== 'FORM') return

    const csrf = useCSRF()

    el.addEventListener('submit', (event) => {
      const token = csrf.getToken()
      if (!token) return

      // 添加 CSRF token
      let csrfInput = el.querySelector('input[name="csrf_token"]') as HTMLInputElement

      if (!csrfInput) {
        csrfInput = document.createElement('input')
        csrfInput.type = 'hidden'
        csrfInput.name = 'csrf_token'
        el.appendChild(csrfInput)
      }

      csrfInput.value = token
    })
  }
}
