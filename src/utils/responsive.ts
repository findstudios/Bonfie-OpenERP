/**
 * 響應式工具函數
 * 提供螢幕尺寸檢測、裝置判斷等工具函數
 */

// 斷點定義
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1200,
  desktop: 1200
} as const

// Tailwind CSS 斷點
export const TAILWIND_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const

/**
 * 獲取當前螢幕尺寸
 */
export function getScreenSize() {
  if (typeof window === 'undefined') {
    return { width: 1024, height: 768 }
  }

  try {
    return {
      width: window.innerWidth || document.documentElement.clientWidth || 1024,
      height: window.innerHeight || document.documentElement.clientHeight || 768
    }
  } catch (error) {
    console.warn('無法取得螢幕尺寸，使用預設值', error)
    return { width: 1024, height: 768 }
  }
}

/**
 * 檢測是否為行動裝置
 */
export function isMobileDevice(width?: number): boolean {
  const screenWidth = width || getScreenSize().width
  return screenWidth < BREAKPOINTS.mobile
}

/**
 * 檢測是否為平板裝置
 */
export function isTabletDevice(width?: number): boolean {
  const screenWidth = width || getScreenSize().width
  return screenWidth >= BREAKPOINTS.mobile && screenWidth < BREAKPOINTS.tablet
}

/**
 * 檢測是否為桌面裝置
 */
export function isDesktopDevice(width?: number): boolean {
  const screenWidth = width || getScreenSize().width
  return screenWidth >= BREAKPOINTS.desktop
}

/**
 * 獲取當前斷點
 */
export function getCurrentBreakpoint(width?: number): 'mobile' | 'tablet' | 'desktop' {
  const screenWidth = width || getScreenSize().width

  if (screenWidth < BREAKPOINTS.mobile) {
    return 'mobile'
  } else if (screenWidth < BREAKPOINTS.tablet) {
    return 'tablet'
  } else {
    return 'desktop'
  }
}

/**
 * 檢測是否為觸控裝置
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  )
}

/**
 * 檢測螢幕方向
 */
export function getScreenOrientation(): 'portrait' | 'landscape' {
  const { width, height } = getScreenSize()
  return height > width ? 'portrait' : 'landscape'
}

/**
 * 檢測是否為直向螢幕
 */
export function isPortrait(): boolean {
  return getScreenOrientation() === 'portrait'
}

/**
 * 檢測是否為橫向螢幕
 */
export function isLandscape(): boolean {
  return getScreenOrientation() === 'landscape'
}

/**
 * 防抖函數
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    const callNow = immediate && !timeout

    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      timeout = null
      if (!immediate) func(...args)
    }, wait)

    if (callNow) func(...args)
  }
}

/**
 * 節流函數
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 媒體查詢匹配檢測
 */
export function matchMedia(query: string): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.matchMedia(query).matches
  } catch (error) {
    console.warn('媒體查詢檢測失敗', error)
    return false
  }
}

/**
 * 檢測是否偏好減少動畫
 */
export function prefersReducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)')
}

/**
 * 檢測是否偏好高對比度
 */
export function prefersHighContrast(): boolean {
  return matchMedia('(prefers-contrast: high)')
}

/**
 * 檢測是否偏好深色模式 - 已移除深色模式支持
 */
export function prefersDarkMode(): boolean {
  return false
}

/**
 * 獲取安全區域內邊距（用於 iOS 瀏海屏等）
 */
export function getSafeAreaInsets() {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 }
  }

  const style = getComputedStyle(document.documentElement)

  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0')
  }
}

/**
 * 計算響應式字體大小
 */
export function getResponsiveFontSize(
  baseSizes: { mobile: number, tablet: number, desktop: number },
  currentWidth?: number
): number {
  const breakpoint = getCurrentBreakpoint(currentWidth)

  switch (breakpoint) {
    case 'mobile':
      return baseSizes.mobile
    case 'tablet':
      return baseSizes.tablet
    case 'desktop':
      return baseSizes.desktop
    default:
      return baseSizes.desktop
  }
}

/**
 * 計算響應式間距
 */
export function getResponsiveSpacing(
  baseSpacing: { mobile: number, tablet: number, desktop: number },
  currentWidth?: number
): number {
  const breakpoint = getCurrentBreakpoint(currentWidth)

  switch (breakpoint) {
    case 'mobile':
      return baseSpacing.mobile
    case 'tablet':
      return baseSpacing.tablet
    case 'desktop':
      return baseSpacing.desktop
    default:
      return baseSpacing.desktop
  }
}

/**
 * 生成響應式 CSS 類別
 */
export function generateResponsiveClasses(
  baseClass: string,
  modifiers: { mobile?: string, tablet?: string, desktop?: string }
): string {
  const classes = [baseClass]

  if (modifiers.mobile) {
    classes.push(`${modifiers.mobile}`)
  }

  if (modifiers.tablet) {
    classes.push(`md:${modifiers.tablet}`)
  }

  if (modifiers.desktop) {
    classes.push(`lg:${modifiers.desktop}`)
  }

  return classes.join(' ')
}

/**
 * 檢測裝置像素比
 */
export function getDevicePixelRatio(): number {
  if (typeof window === 'undefined') {
    return 1
  }

  return window.devicePixelRatio || 1
}

/**
 * 檢測是否為高解析度螢幕
 */
export function isHighDensityScreen(): boolean {
  return getDevicePixelRatio() > 1
}

/**
 * 獲取視窗可視區域尺寸
 */
export function getViewportSize() {
  if (typeof window === 'undefined') {
    return { width: 1024, height: 768 }
  }

  return {
    width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
    height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
  }
}

/**
 * 檢測是否支援 CSS Grid
 */
export function supportsGrid(): boolean {
  if (typeof window === 'undefined') {
    return true
  }

  return CSS.supports('display', 'grid')
}

/**
 * 檢測是否支援 CSS Flexbox
 */
export function supportsFlexbox(): boolean {
  if (typeof window === 'undefined') {
    return true
  }

  return CSS.supports('display', 'flex')
}

/**
 * 檢測是否支援 CSS 自定義屬性
 */
export function supportsCustomProperties(): boolean {
  if (typeof window === 'undefined') {
    return true
  }

  return CSS.supports('--custom', 'property')
}

/**
 * 響應式圖片 URL 生成器
 */
export function getResponsiveImageUrl(
  baseUrl: string,
  options: {
    width?: number
    quality?: number
    format?: 'webp' | 'jpg' | 'png'
  } = {}
): string {
  const { width, quality = 80, format = 'webp' } = options
  const params = new URLSearchParams()

  if (width) {
    params.append('w', width.toString())
  }

  params.append('q', quality.toString())
  params.append('f', format)

  return `${baseUrl}?${params.toString()}`
}

/**
 * 根據螢幕尺寸獲取適當的圖片 URL
 */
export function getAdaptiveImageUrl(baseUrl: string, currentWidth?: number): string {
  const breakpoint = getCurrentBreakpoint(currentWidth)

  const sizeMap = {
    mobile: { width: 400, quality: 75 },
    tablet: { width: 800, quality: 80 },
    desktop: { width: 1200, quality: 85 }
  }

  const config = sizeMap[breakpoint]
  return getResponsiveImageUrl(baseUrl, config)
}
