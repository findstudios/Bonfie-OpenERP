import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useResponsiveStore } from '@/stores/responsive'

/**
 * 響應式工具 composable
 * 提供統一的響應式邏輯和工具函數
 */
export function useResponsive() {
  const responsiveStore = useResponsiveStore()

  // 響應式狀態
  const state = computed(() => responsiveStore.state)
  const config = computed(() => responsiveStore.config)

  // 裝置類型檢測
  const isMobile = computed(() => responsiveStore.state.isMobile)
  const isTablet = computed(() => responsiveStore.state.isTablet)
  const isDesktop = computed(() => responsiveStore.state.isDesktop)
  const isTouchDevice = computed(() => responsiveStore.state.isTouchDevice)

  // 螢幕方向
  const isPortrait = computed(() => responsiveStore.state.isPortrait)
  const isLandscape = computed(() => responsiveStore.state.isLandscape)

  // 當前斷點
  const currentBreakpoint = computed(() => responsiveStore.currentBreakpoint)

  // 側邊欄狀態
  const sidebarOpen = computed(() => responsiveStore.state.sidebarOpen)
  const sidebarCollapsed = computed(() => responsiveStore.state.sidebarCollapsed)
  const sidebarWidth = computed(() => responsiveStore.sidebarWidth)

  // 佈局相關
  const contentMargin = computed(() => responsiveStore.contentMargin)
  const formGridCols = computed(() => responsiveStore.formGridCols)
  const formSpacing = computed(() => responsiveStore.formSpacing)

  // 方法
  const toggleSidebar = () => responsiveStore.toggleSidebar()
  const toggleSidebarCollapse = () => responsiveStore.toggleSidebar()
  const openSidebar = () => responsiveStore.openSidebar()
  const closeSidebar = () => responsiveStore.closeSidebar()
  const updateScreenSize = () => responsiveStore.updateScreenSize()

  return {
    // 狀態
    state,
    config,

    // 裝置檢測
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,

    // 方向檢測
    isPortrait,
    isLandscape,

    // 斷點
    currentBreakpoint,

    // 側邊欄
    sidebarOpen,
    sidebarCollapsed,
    sidebarWidth,

    // 佈局
    contentMargin,
    formGridCols,
    formSpacing,

    // 方法
    toggleSidebar,
    toggleSidebarCollapse,
    openSidebar,
    closeSidebar,
    updateScreenSize
  }
}

/**
 * 螢幕尺寸監聽 composable
 */
export function useScreenSize() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const height = ref(typeof window !== 'undefined' ? window.innerHeight : 768)

  const updateSize = () => {
    if (typeof window !== 'undefined') {
      width.value = window.innerWidth
      height.value = window.innerHeight
    }
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateSize)
      updateSize()
    }
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', updateSize)
    }
  })

  return {
    width,
    height,
    updateSize
  }
}

/**
 * 媒體查詢 composable
 */
export function useMediaQuery(query: string) {
  const matches = ref(false)
  let mediaQuery: MediaQueryList | null = null

  const updateMatches = (e: MediaQueryListEvent) => {
    matches.value = e.matches
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      mediaQuery = window.matchMedia(query)
      matches.value = mediaQuery.matches

      // 使用新的 addEventListener 方法
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', updateMatches)
      } else {
        // 降級支援舊版瀏覽器
        mediaQuery.addListener(updateMatches)
      }
    }
  })

  onUnmounted(() => {
    if (mediaQuery) {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateMatches)
      } else {
        mediaQuery.removeListener(updateMatches)
      }
    }
  })

  return matches
}

/**
 * 斷點檢測 composable
 */
export function useBreakpoints() {
  const responsiveStore = useResponsiveStore()

  // 預定義的媒體查詢
  const isSm = useMediaQuery('(min-width: 640px)')
  const isMd = useMediaQuery('(min-width: 768px)')
  const isLg = useMediaQuery('(min-width: 1024px)')
  const isXl = useMediaQuery('(min-width: 1280px)')
  const is2Xl = useMediaQuery('(min-width: 1536px)')

  // 自定義斷點
  const isMobile = computed(() => !isMd.value)
  const isTablet = computed(() => isMd.value && !isLg.value)
  const isDesktop = computed(() => isLg.value)

  // 方向檢測
  const isPortrait = useMediaQuery('(orientation: portrait)')
  const isLandscape = useMediaQuery('(orientation: landscape)')

  // 觸控裝置檢測
  const isTouchDevice = useMediaQuery('(hover: none) and (pointer: coarse)')

  // 高對比度檢測
  const prefersHighContrast = useMediaQuery('(prefers-contrast: high)')

  // 減少動畫檢測
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  return {
    // Tailwind 斷點
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,

    // 自定義斷點
    isMobile,
    isTablet,
    isDesktop,

    // 方向
    isPortrait,
    isLandscape,

    // 裝置特性
    isTouchDevice,
    prefersHighContrast,
    prefersReducedMotion
  }
}

/**
 * 觸控手勢 composable
 */
export function useTouch() {
  const startX = ref(0)
  const startY = ref(0)
  const endX = ref(0)
  const endY = ref(0)
  const isSwiping = ref(false)

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0]
    startX.value = touch.clientX
    startY.value = touch.clientY
    isSwiping.value = true
  }

  const onTouchMove = (event: TouchEvent) => {
    if (!isSwiping.value) return

    const touch = event.touches[0]
    endX.value = touch.clientX
    endY.value = touch.clientY
  }

  const onTouchEnd = () => {
    isSwiping.value = false
  }

  const getSwipeDirection = () => {
    const deltaX = endX.value - startX.value
    const deltaY = endY.value - startY.value
    const minSwipeDistance = 50

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 水平滑動
      if (Math.abs(deltaX) > minSwipeDistance) {
        return deltaX > 0 ? 'right' : 'left'
      }
    } else {
      // 垂直滑動
      if (Math.abs(deltaY) > minSwipeDistance) {
        return deltaY > 0 ? 'down' : 'up'
      }
    }

    return null
  }

  const getSwipeDistance = () => {
    const deltaX = endX.value - startX.value
    const deltaY = endY.value - startY.value
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  }

  return {
    startX,
    startY,
    endX,
    endY,
    isSwiping,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    getSwipeDirection,
    getSwipeDistance
  }
}

/**
 * 響應式 CSS 類別生成器
 */
export function useResponsiveClasses() {
  const { currentBreakpoint, isMobile, isTablet, isDesktop } = useResponsive()

  const getResponsiveClass = (classes: {
    mobile?: string
    tablet?: string
    desktop?: string
    default?: string
  }) => {
    if (isMobile.value && classes.mobile) {
      return classes.mobile
    } else if (isTablet.value && classes.tablet) {
      return classes.tablet
    } else if (isDesktop.value && classes.desktop) {
      return classes.desktop
    } else {
      return classes.default || ''
    }
  }

  const getGridCols = (cols: { mobile: number, tablet: number, desktop: number }) => {
    return getResponsiveClass({
      mobile: `grid-cols-${cols.mobile}`,
      tablet: `grid-cols-${cols.tablet}`,
      desktop: `grid-cols-${cols.desktop}`
    })
  }

  const getSpacing = (spacing: { mobile: string, tablet: string, desktop: string }) => {
    return getResponsiveClass({
      mobile: spacing.mobile,
      tablet: spacing.tablet,
      desktop: spacing.desktop
    })
  }

  const getTextSize = (sizes: { mobile: string, tablet: string, desktop: string }) => {
    return getResponsiveClass({
      mobile: sizes.mobile,
      tablet: sizes.tablet,
      desktop: sizes.desktop
    })
  }

  return {
    currentBreakpoint,
    getResponsiveClass,
    getGridCols,
    getSpacing,
    getTextSize
  }
}
