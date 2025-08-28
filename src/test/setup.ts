import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// 模擬 Supabase
vi.mock('@/services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    })),
  },
}))

// 全域測試設定
config.global.stubs = {
  'router-link': true,
  'router-view': true,
}

// 模擬 console
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
}

// 模擬 Browser APIs
// Mock window.alert
Object.defineProperty(window, 'alert', {
  writable: true,
  value: vi.fn(),
})

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn().mockReturnValue(true), // Default to true to allow operations to proceed
})

// Mock window.prompt
Object.defineProperty(window, 'prompt', {
  writable: true,
  value: vi.fn().mockReturnValue('test-input'),
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
}

Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
}

Object.defineProperty(window, 'sessionStorage', {
  writable: true,
  value: sessionStorageMock,
})

// 模擬 window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock window.getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    getPropertyValue: vi.fn(),
    width: '1024px',
    height: '768px',
  })),
})

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
})

// Mock window.scroll
Object.defineProperty(window, 'scroll', {
  writable: true,
  value: vi.fn(),
})

// Mock Element.scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn().mockImplementation(cb => setTimeout(cb, 16))
global.cancelAnimationFrame = vi.fn()

// Mock getSelection
Object.defineProperty(window, 'getSelection', {
  writable: true,
  value: vi.fn().mockReturnValue({
    removeAllRanges: vi.fn(),
    addRange: vi.fn(),
  }),
})

// Mock createRange
global.document.createRange = vi.fn(() => ({
  selectNodeContents: vi.fn(),
  cloneRange: vi.fn(),
  selectNode: vi.fn(),
  collapse: vi.fn(),
  setStart: vi.fn(),
  setEnd: vi.fn(),
}))

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-object-url')
global.URL.revokeObjectURL = vi.fn()

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = vi.fn()

// Mock HTMLElement.focus and blur
HTMLElement.prototype.focus = vi.fn()
HTMLElement.prototype.blur = vi.fn()

// Mock File and FileReader
global.FileReader = vi.fn().mockImplementation(() => ({
  readAsText: vi.fn(),
  readAsDataURL: vi.fn(),
  readAsArrayBuffer: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  result: null,
  error: null,
}))

// Extend jsdom environment
global.structuredClone = vi.fn().mockImplementation(obj => JSON.parse(JSON.stringify(obj)))
