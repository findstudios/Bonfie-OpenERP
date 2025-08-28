/**
 * 響應式設計配置
 * 定義各種斷點、佈局參數和響應式行為
 */

// 斷點定義
export const RESPONSIVE_BREAKPOINTS = {
  // 主要斷點
  mobile: 768,
  tablet: 1200,
  desktop: 1200,

  // Tailwind CSS 斷點
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

// 側邊欄配置
export const SIDEBAR_CONFIG = {
  width: {
    expanded: '16rem',      // 256px
    collapsed: '4rem',      // 64px
    mobile: '16rem',        // 行動版全寬
  },
  breakpoints: {
    autoCollapse: 1024,     // 小於此寬度自動收合
    mobileOverlay: 768,     // 小於此寬度使用覆蓋模式
  },
  animation: {
    duration: 250,          // 動畫持續時間 (ms)
    easing: 'ease-in-out',  // 動畫緩動函數
  },
  zIndex: {
    sidebar: 40,
    overlay: 30,
  },
} as const

// 表格響應式配置
export const TABLE_CONFIG = {
  breakpoints: {
    mobile: 768,            // 小於此寬度切換到卡片模式
    hideColumns: 640,       // 小於此寬度隱藏部分欄位
  },
  mobileCard: {
    maxFields: 4,           // 行動版卡片最多顯示欄位數
    spacing: '0.75rem',     // 卡片內間距
    borderRadius: '0.5rem', // 卡片圓角
  },
  columns: {
    // 不同螢幕尺寸下顯示的欄位
    mobile: ['name', 'status'],
    tablet: ['name', 'status', 'date'],
    desktop: ['name', 'status', 'date', 'actions'],
  },
} as const

// 表單響應式配置
export const FORM_CONFIG = {
  grid: {
    // 不同螢幕尺寸下的網格欄數
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
  spacing: {
    // 不同螢幕尺寸下的間距
    mobile: '1rem',
    tablet: '1.5rem',
    desktop: '2rem',
  },
  fieldSpacing: {
    // 表單欄位間距
    mobile: '0.75rem',
    tablet: '1rem',
    desktop: '1.25rem',
  },
  labelPosition: {
    // 標籤位置
    mobile: 'top',          // 行動版標籤在上方
    tablet: 'top',          // 平板版標籤在上方
    desktop: 'left',        // 桌面版標籤在左側
  },
} as const

// 導航配置
export const NAVIGATION_CONFIG = {
  mobile: {
    headerHeight: '3.5rem',  // 行動版頂部導航高度
    showBreadcrumb: false,   // 是否顯示麵包屑
    maxMenuItems: 5,         // 最多顯示選單項目數
  },
  tablet: {
    headerHeight: '4rem',
    showBreadcrumb: true,
    maxMenuItems: 8,
  },
  desktop: {
    headerHeight: '4rem',
    showBreadcrumb: true,
    maxMenuItems: 12,
  },
} as const

// 觸控配置
export const TOUCH_CONFIG = {
  minTargetSize: '2.75rem', // 44px 最小觸控目標尺寸
  tapHighlight: 'rgba(0, 0, 0, 0.1)', // 觸控高亮顏色
  swipe: {
    minDistance: 50,        // 最小滑動距離 (px)
    maxTime: 300,           // 最大滑動時間 (ms)
    threshold: 0.3,         // 滑動閾值
  },
  gesture: {
    sidebarSwipe: true,     // 是否啟用側邊欄滑動手勢
    pullToRefresh: true,    // 是否啟用下拉重新整理
    longPress: 500,         // 長按時間 (ms)
  },
} as const

// 效能配置
export const PERFORMANCE_CONFIG = {
  debounce: {
    resize: 150,            // resize 事件防抖時間 (ms)
    scroll: 16,             // scroll 事件防抖時間 (ms)
    search: 300,            // 搜尋輸入防抖時間 (ms)
  },
  throttle: {
    animation: 16,          // 動畫節流時間 (ms)
    interaction: 100,       // 互動節流時間 (ms)
  },
  lazyLoad: {
    rootMargin: '50px',     // 懶載入觸發邊距
    threshold: 0.1,         // 懶載入觸發閾值
  },
} as const

// 動畫配置
export const ANIMATION_CONFIG = {
  duration: {
    fast: 150,              // 快速動畫 (ms)
    normal: 250,            // 一般動畫 (ms)
    slow: 350,              // 慢速動畫 (ms)
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  reducedMotion: {
    respectPreference: true, // 是否尊重使用者的減少動畫偏好
    fallbackDuration: 0,     // 減少動畫時的降級持續時間
  },
} as const

// 字體配置
export const TYPOGRAPHY_CONFIG = {
  fontSize: {
    mobile: {
      xs: '0.75rem',        // 12px
      sm: '0.875rem',       // 14px
      base: '1rem',         // 16px
      lg: '1.125rem',       // 18px
      xl: '1.25rem',        // 20px
      '2xl': '1.5rem',      // 24px
    },
    tablet: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
    desktop: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const

// 間距配置
export const SPACING_CONFIG = {
  container: {
    mobile: '1rem',         // 16px
    tablet: '1.5rem',       // 24px
    desktop: '2rem',        // 32px
  },
  section: {
    mobile: '2rem',         // 32px
    tablet: '3rem',         // 48px
    desktop: '4rem',        // 64px
  },
  component: {
    mobile: '0.75rem',      // 12px
    tablet: '1rem',         // 16px
    desktop: '1.25rem',     // 20px
  },
} as const

// 顏色配置
export const COLOR_CONFIG = {
  contrast: {
    normal: {
      text: '#374151',      // gray-700
      background: '#ffffff',
      border: '#e5e7eb',    // gray-200
    },
    high: {
      text: '#000000',
      background: '#ffffff',
      border: '#000000',
    },
  },
} as const

// 圖片配置
export const IMAGE_CONFIG = {
  responsive: {
    mobile: {
      width: 400,
      quality: 75,
      format: 'webp' as const,
    },
    tablet: {
      width: 800,
      quality: 80,
      format: 'webp' as const,
    },
    desktop: {
      width: 1200,
      quality: 85,
      format: 'webp' as const,
    },
  },
  lazyLoad: {
    placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PC9zdmc+',
    fadeInDuration: 300,
  },
} as const

// 可訪問性配置
export const ACCESSIBILITY_CONFIG = {
  focusVisible: {
    outline: '2px solid #3b82f6', // blue-500
    outlineOffset: '2px',
  },
  skipLinks: {
    enabled: true,
    targets: ['#main-content', '#navigation', '#sidebar'],
  },
  announcements: {
    polite: true,           // 使用 aria-live="polite"
    delay: 100,             // 宣告延遲時間 (ms)
  },
  keyboardNavigation: {
    trapFocus: true,        // 是否在模態框中困住焦點
    restoreFocus: true,     // 是否在關閉模態框後恢復焦點
  },
} as const

// 預設響應式配置
export const DEFAULT_RESPONSIVE_CONFIG = {
  breakpoints: RESPONSIVE_BREAKPOINTS,
  sidebar: SIDEBAR_CONFIG,
  table: TABLE_CONFIG,
  form: FORM_CONFIG,
  navigation: NAVIGATION_CONFIG,
  touch: TOUCH_CONFIG,
  performance: PERFORMANCE_CONFIG,
  animation: ANIMATION_CONFIG,
  typography: TYPOGRAPHY_CONFIG,
  spacing: SPACING_CONFIG,
  color: COLOR_CONFIG,
  image: IMAGE_CONFIG,
  accessibility: ACCESSIBILITY_CONFIG,
} as const

// 配置類型定義
export type ResponsiveBreakpoints = typeof RESPONSIVE_BREAKPOINTS
export type SidebarConfig = typeof SIDEBAR_CONFIG
export type TableConfig = typeof TABLE_CONFIG
export type FormConfig = typeof FORM_CONFIG
export type NavigationConfig = typeof NAVIGATION_CONFIG
export type TouchConfig = typeof TOUCH_CONFIG
export type PerformanceConfig = typeof PERFORMANCE_CONFIG
export type AnimationConfig = typeof ANIMATION_CONFIG
export type TypographyConfig = typeof TYPOGRAPHY_CONFIG
export type SpacingConfig = typeof SPACING_CONFIG
export type ColorConfig = typeof COLOR_CONFIG
export type ImageConfig = typeof IMAGE_CONFIG
export type AccessibilityConfig = typeof ACCESSIBILITY_CONFIG
export type ResponsiveConfig = typeof DEFAULT_RESPONSIVE_CONFIG
