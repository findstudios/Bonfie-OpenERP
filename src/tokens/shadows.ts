/**
 * Enhanced Shadow Token System
 * 增強的陰影Token系統，支援多層次陰影和響應式陰影配置
 */

// 基礎陰影配置
export const BASE_SHADOWS = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
} as const

// 語義化陰影配置
export const SEMANTIC_SHADOWS = {
  // 卡片陰影
  card: {
    resting: BASE_SHADOWS.sm,     // 靜止狀態
    hover: BASE_SHADOWS.md,       // 懸停狀態
    pressed: BASE_SHADOWS.xs,     // 按下狀態
    elevated: BASE_SHADOWS.lg,    // 提升狀態
    floating: BASE_SHADOWS.xl     // 浮動狀態
  },

  // 按鈕陰影
  button: {
    resting: BASE_SHADOWS.xs,     // 靜止狀態
    hover: BASE_SHADOWS.sm,       // 懸停狀態
    pressed: BASE_SHADOWS.inner,  // 按下狀態
    focus: '0 0 0 3px rgba(59, 130, 246, 0.1)', // 焦點狀態
    disabled: BASE_SHADOWS.none   // 禁用狀態
  },

  // 輸入框陰影
  input: {
    resting: BASE_SHADOWS.xs,     // 靜止狀態
    focus: '0 0 0 3px rgba(59, 130, 246, 0.1)', // 焦點狀態
    error: '0 0 0 3px rgba(239, 68, 68, 0.1)',  // 錯誤狀態
    success: '0 0 0 3px rgba(16, 185, 129, 0.1)', // 成功狀態
    disabled: BASE_SHADOWS.none   // 禁用狀態
  },

  // 模態框陰影
  modal: {
    backdrop: 'rgba(0, 0, 0, 0.5)', // 背景遮罩
    content: BASE_SHADOWS['2xl'],    // 內容區域
    floating: '0 25px 50px -12px rgba(0, 0, 0, 0.4)' // 浮動模態框
  },

  // 下拉選單陰影
  dropdown: {
    menu: BASE_SHADOWS.lg,        // 選單陰影
    item: BASE_SHADOWS.none,      // 選項陰影
    itemHover: BASE_SHADOWS.xs    // 選項懸停陰影
  },

  // 導航陰影
  navigation: {
    header: BASE_SHADOWS.sm,      // 頭部導航
    sidebar: BASE_SHADOWS.md,     // 側邊欄
    tab: BASE_SHADOWS.xs,         // 標籤頁
    tabActive: BASE_SHADOWS.sm    // 活動標籤頁
  }
} as const

// 響應式陰影配置
export const RESPONSIVE_SHADOWS = {
  mobile: {
    // 移動端陰影配置（較輕的陰影）
    card: {
      resting: BASE_SHADOWS.xs,
      hover: BASE_SHADOWS.sm,
      pressed: BASE_SHADOWS.none,
      elevated: BASE_SHADOWS.md
    },
    button: {
      resting: BASE_SHADOWS.none,
      hover: BASE_SHADOWS.xs,
      pressed: BASE_SHADOWS.inner
    },
    modal: {
      content: BASE_SHADOWS.lg
    },
    dropdown: {
      menu: BASE_SHADOWS.md
    }
  },

  tablet: {
    // 平板端陰影配置（中等陰影）
    card: {
      resting: BASE_SHADOWS.sm,
      hover: BASE_SHADOWS.md,
      pressed: BASE_SHADOWS.xs,
      elevated: BASE_SHADOWS.lg
    },
    button: {
      resting: BASE_SHADOWS.xs,
      hover: BASE_SHADOWS.sm,
      pressed: BASE_SHADOWS.inner
    },
    modal: {
      content: BASE_SHADOWS.xl
    },
    dropdown: {
      menu: BASE_SHADOWS.lg
    }
  },

  desktop: {
    // 桌面端陰影配置（完整陰影）
    card: {
      resting: BASE_SHADOWS.sm,
      hover: BASE_SHADOWS.lg,
      pressed: BASE_SHADOWS.xs,
      elevated: BASE_SHADOWS.xl
    },
    button: {
      resting: BASE_SHADOWS.xs,
      hover: BASE_SHADOWS.md,
      pressed: BASE_SHADOWS.inner
    },
    modal: {
      content: BASE_SHADOWS['2xl']
    },
    dropdown: {
      menu: BASE_SHADOWS.xl
    }
  }
} as const

// 特殊效果陰影
export const SPECIAL_SHADOWS = {
  // 發光效果
  glow: {
    primary: '0 0 20px rgba(59, 130, 246, 0.3)',
    success: '0 0 20px rgba(16, 185, 129, 0.3)',
    warning: '0 0 20px rgba(245, 158, 11, 0.3)',
    error: '0 0 20px rgba(239, 68, 68, 0.3)',
    info: '0 0 20px rgba(14, 165, 233, 0.3)'
  },

  // 內陰影效果
  inset: {
    light: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    medium: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
    heavy: 'inset 0 4px 8px 0 rgba(0, 0, 0, 0.15)'
  },

  // 邊框陰影（用於焦點狀態）
  outline: {
    primary: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    secondary: '0 0 0 3px rgba(107, 114, 128, 0.1)',
    success: '0 0 0 3px rgba(16, 185, 129, 0.1)',
    warning: '0 0 0 3px rgba(245, 158, 11, 0.1)',
    error: '0 0 0 3px rgba(239, 68, 68, 0.1)',
    info: '0 0 0 3px rgba(14, 165, 233, 0.1)'
  },

  // 層疊陰影（多層效果）
  layered: {
    light: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    medium: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
    heavy: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
    dramatic: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)'
  }
} as const

// 主題陰影配置
export const THEME_SHADOWS = {
  light: {
    // 淺色主題陰影
    card: SEMANTIC_SHADOWS.card,
    button: SEMANTIC_SHADOWS.button,
    input: SEMANTIC_SHADOWS.input,
    modal: SEMANTIC_SHADOWS.modal,
    dropdown: SEMANTIC_SHADOWS.dropdown,
    navigation: SEMANTIC_SHADOWS.navigation
  }
} as const

// 陰影工具函數
export const shadowUtils = {
  /**
   * 獲取響應式陰影
   */
  getResponsiveShadow: (
    breakpoint: keyof typeof RESPONSIVE_SHADOWS,
    component: keyof typeof RESPONSIVE_SHADOWS.mobile,
    state: string
  ) => {
    const shadows = RESPONSIVE_SHADOWS[breakpoint][component] as any
    return shadows[state] || BASE_SHADOWS.none
  },

  /**
   * 獲取主題陰影
   */
  getThemeShadow: (
    theme: keyof typeof THEME_SHADOWS,
    component: keyof typeof THEME_SHADOWS.light,
    state: string
  ) => {
    const shadows = THEME_SHADOWS[theme][component] as any
    return shadows[state] || BASE_SHADOWS.none
  },

  /**
   * 組合多個陰影
   */
  combineShadows: (...shadows: string[]): string => {
    return shadows.filter(shadow => shadow && shadow !== 'none').join(', ')
  },

  /**
   * 調整陰影透明度
   */
  adjustShadowOpacity: (shadow: string, opacity: number): string => {
    return shadow.replace(/rgba\(([^)]+)\)/g, (match, rgbaValues) => {
      const values = rgbaValues.split(',').map((v: string) => v.trim())
      if (values.length === 4) {
        values[3] = (parseFloat(values[3]) * opacity).toString()
        return `rgba(${values.join(', ')})`
      }
      return match
    })
  },

  /**
   * 生成自定義陰影
   */
  createCustomShadow: (config: {
    offsetX?: number
    offsetY?: number
    blurRadius?: number
    spreadRadius?: number
    color?: string
    opacity?: number
    inset?: boolean
  }): string => {
    const {
      offsetX = 0,
      offsetY = 1,
      blurRadius = 3,
      spreadRadius = 0,
      color = '0, 0, 0',
      opacity = 0.1,
      inset = false
    } = config

    const insetPrefix = inset ? 'inset ' : ''
    return `${insetPrefix}${offsetX}px ${offsetY}px ${blurRadius}px ${spreadRadius}px rgba(${color}, ${opacity})`
  }
}

// 導出所有陰影Token
export const SHADOW_TOKENS = {
  base: BASE_SHADOWS,
  semantic: SEMANTIC_SHADOWS,
  responsive: RESPONSIVE_SHADOWS,
  special: SPECIAL_SHADOWS,
  theme: THEME_SHADOWS
} as const
