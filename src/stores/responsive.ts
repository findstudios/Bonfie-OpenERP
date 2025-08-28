import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'

// 響應式狀態介面
export interface ResponsiveState {
  // 螢幕尺寸資訊
  screenWidth: number
  screenHeight: number

  // 裝置類型
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean

  // 側邊欄狀態
  sidebarOpen: boolean
  sidebarCollapsed: boolean

  // 方向
  isPortrait: boolean
  isLandscape: boolean

  // 觸控支援
  isTouchDevice: boolean
}

// 響應式配置介面
export interface ResponsiveConfig {
  // 斷點定義
  breakpoints: {
    mobile: number
    tablet: number
    desktop: number
  }

  // 側邊欄配置
  sidebar: {
    width: {
      expanded: string
      collapsed: string
    }
    autoCollapse: boolean
    mobileOverlay: boolean
  }

  // 表格配置
  table: {
    mobileBreakpoint: number
    columnsToShow: {
      mobile: string[]
      tablet: string[]
      desktop: string[]
    }
  }

  // 表單配置
  form: {
    gridCols: {
      mobile: number
      tablet: number
      desktop: number
    }
    spacing: {
      mobile: string
      tablet: string
      desktop: string
    }
  }
}

// 預設響應式配置
const defaultConfig: ResponsiveConfig = {
  breakpoints: {
    mobile: 768,    // < 768px 為行動裝置
    tablet: 1024,   // 768px - 1023px 為平板
    desktop: 1024   // >= 1024px 為桌面
  },
  sidebar: {
    width: {
      expanded: '16rem',
      collapsed: '4rem'
    },
    autoCollapse: true,
    mobileOverlay: true
  },
  table: {
    mobileBreakpoint: 768,
    columnsToShow: {
      mobile: ['name', 'status'],
      tablet: ['name', 'status', 'date'],
      desktop: ['name', 'status', 'date', 'actions']
    }
  },
  form: {
    gridCols: {
      mobile: 1,
      tablet: 2,
      desktop: 3
    },
    spacing: {
      mobile: '0.5rem',
      tablet: '1rem',
      desktop: '1.5rem'
    }
  }
}

export const useResponsiveStore = defineStore('responsive', () => {
  // 響應式狀態
  const state = reactive<ResponsiveState>({
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 768,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    sidebarOpen: true,
    sidebarCollapsed: false,
    isPortrait: true,
    isLandscape: false,
    isTouchDevice: false
  })

  // 配置
  const config = ref<ResponsiveConfig>(defaultConfig)

  // 計算屬性
  const currentBreakpoint = computed(() => {
    if (state.screenWidth < config.value.breakpoints.mobile) {
      return 'mobile'
    } else if (state.screenWidth < config.value.breakpoints.desktop) {
      return 'tablet'
    } else {
      return 'desktop'
    }
  })

  const sidebarWidth = computed(() => {
    if (state.isMobile) {
      return state.sidebarOpen ? config.value.sidebar.width.expanded : '0'
    } else if (state.isTablet && state.sidebarCollapsed) {
      return config.value.sidebar.width.collapsed
    } else {
      return config.value.sidebar.width.expanded
    }
  })

  const contentMargin = computed(() => {
    if (state.isMobile) {
      return '0'
    } else if (state.sidebarCollapsed) {
      return config.value.sidebar.width.collapsed
    } else {
      return config.value.sidebar.width.expanded
    }
  })

  const formGridCols = computed(() => {
    if (state.isMobile) {
      return config.value.form.gridCols.mobile
    } else if (state.isTablet) {
      return config.value.form.gridCols.tablet
    } else {
      return config.value.form.gridCols.desktop
    }
  })

  const formSpacing = computed(() => {
    if (state.isMobile) {
      return config.value.form.spacing.mobile
    } else if (state.isTablet) {
      return config.value.form.spacing.tablet
    } else {
      return config.value.form.spacing.desktop
    }
  })

  // 方法
  function updateScreenSize() {
    if (typeof window === 'undefined') return

    state.screenWidth = window.innerWidth
    state.screenHeight = window.innerHeight

    // 更新裝置類型
    state.isMobile = state.screenWidth < config.value.breakpoints.mobile
    state.isTablet = state.screenWidth >= config.value.breakpoints.mobile &&
                     state.screenWidth < config.value.breakpoints.desktop
    state.isDesktop = state.screenWidth >= config.value.breakpoints.desktop

    // 更新方向
    state.isPortrait = state.screenHeight > state.screenWidth
    state.isLandscape = state.screenWidth > state.screenHeight

    // 檢測觸控裝置
    state.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    // 自動調整側邊欄狀態
    if (config.value.sidebar.autoCollapse) {
      if (state.isMobile) {
        state.sidebarOpen = false
      } else if (state.isTablet) {
        // 平板版預設收合，但可以手動切換
        if (!state.sidebarOpen) {
          state.sidebarCollapsed = true
        }
      } else {
        // 桌面版預設展開，但保持用戶的手動設置
        state.sidebarOpen = true
        // 不自動修改 sidebarCollapsed，保持用戶設置
      }
    }
  }

  function toggleSidebar() {
    if (state.isMobile) {
      state.sidebarOpen = !state.sidebarOpen
    } else {
      state.sidebarCollapsed = !state.sidebarCollapsed
    }
  }

  function openSidebar() {
    if (state.isMobile) {
      state.sidebarOpen = true
    } else {
      state.sidebarCollapsed = false
    }
  }

  function closeSidebar() {
    if (state.isMobile) {
      state.sidebarOpen = false
    } else {
      state.sidebarCollapsed = true
    }
  }

  function setSidebarState(open: boolean, collapsed?: boolean) {
    if (state.isMobile) {
      state.sidebarOpen = open
    } else {
      state.sidebarOpen = open
      if (collapsed !== undefined) {
        state.sidebarCollapsed = collapsed
      }
    }
  }

  function updateConfig(newConfig: Partial<ResponsiveConfig>) {
    config.value = { ...config.value, ...newConfig }
    // 重新計算狀態
    updateScreenSize()
  }

  function resetConfig() {
    config.value = { ...defaultConfig }
    updateScreenSize()
  }

  // 初始化
  function initialize() {
    updateScreenSize()

    // 監聽視窗大小變化
    if (typeof window !== 'undefined') {
      const debouncedResize = debounce(updateScreenSize, 150)
      window.addEventListener('resize', debouncedResize)

      // 監聽方向變化
      window.addEventListener('orientationchange', () => {
        setTimeout(updateScreenSize, 100)
      })

      // 清理函數
      const cleanup = () => {
        window.removeEventListener('resize', debouncedResize)
        window.removeEventListener('orientationchange', updateScreenSize)
      }

      // 在頁面卸載時清理事件監聽器
      window.addEventListener('beforeunload', cleanup)
    }
  }

  return {
    // 狀態
    state,
    config,

    // 計算屬性
    currentBreakpoint,
    sidebarWidth,
    contentMargin,
    formGridCols,
    formSpacing,

    // 方法
    updateScreenSize,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    setSidebarState,
    updateConfig,
    resetConfig,
    initialize
  }
})

// 防抖函數
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}
