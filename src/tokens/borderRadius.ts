/**
 * Enhanced Border Radius Token System
 * 增強的邊框半徑Token系統，支援響應式邊框半徑和語義化配置
 */

// 基礎邊框半徑配置
export const BASE_BORDER_RADIUS = {
  none: '0',
  xs: '0.125rem',   // 2px
  sm: '0.25rem',    // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px'    // 完全圓角
} as const

// 語義化邊框半徑配置
export const SEMANTIC_BORDER_RADIUS = {
  // 按鈕邊框半徑
  button: {
    xs: BASE_BORDER_RADIUS.xs,    // 2px - 極小按鈕
    sm: BASE_BORDER_RADIUS.sm,    // 4px - 小按鈕
    md: BASE_BORDER_RADIUS.md,    // 6px - 中等按鈕
    lg: BASE_BORDER_RADIUS.lg,    // 8px - 大按鈕
    xl: BASE_BORDER_RADIUS.xl,    // 12px - 極大按鈕
    pill: BASE_BORDER_RADIUS.full // 膠囊形按鈕
  },

  // 輸入框邊框半徑
  input: {
    xs: BASE_BORDER_RADIUS.xs,    // 2px - 極小輸入框
    sm: BASE_BORDER_RADIUS.sm,    // 4px - 小輸入框
    md: BASE_BORDER_RADIUS.md,    // 6px - 中等輸入框
    lg: BASE_BORDER_RADIUS.lg,    // 8px - 大輸入框
    xl: BASE_BORDER_RADIUS.xl     // 12px - 極大輸入框
  },

  // 卡片邊框半徑
  card: {
    xs: BASE_BORDER_RADIUS.sm,    // 4px - 極小卡片
    sm: BASE_BORDER_RADIUS.md,    // 6px - 小卡片
    md: BASE_BORDER_RADIUS.lg,    // 8px - 中等卡片
    lg: BASE_BORDER_RADIUS.xl,    // 12px - 大卡片
    xl: BASE_BORDER_RADIUS['2xl'] // 16px - 極大卡片
  },

  // 模態框邊框半徑
  modal: {
    sm: BASE_BORDER_RADIUS.lg,    // 8px - 小模態框
    md: BASE_BORDER_RADIUS.xl,    // 12px - 中等模態框
    lg: BASE_BORDER_RADIUS['2xl'] // 16px - 大模態框
  },

  // 下拉選單邊框半徑
  dropdown: {
    sm: BASE_BORDER_RADIUS.sm,    // 4px - 小下拉選單
    md: BASE_BORDER_RADIUS.md,    // 6px - 中等下拉選單
    lg: BASE_BORDER_RADIUS.lg     // 8px - 大下拉選單
  },

  // 標籤邊框半徑
  badge: {
    sm: BASE_BORDER_RADIUS.xs,    // 2px - 小標籤
    md: BASE_BORDER_RADIUS.sm,    // 4px - 中等標籤
    lg: BASE_BORDER_RADIUS.md,    // 6px - 大標籤
    pill: BASE_BORDER_RADIUS.full // 膠囊形標籤
  },

  // 頭像邊框半徑
  avatar: {
    square: BASE_BORDER_RADIUS.md,  // 6px - 方形頭像
    rounded: BASE_BORDER_RADIUS.lg, // 8px - 圓角頭像
    circle: BASE_BORDER_RADIUS.full // 圓形頭像
  },

  // 圖片邊框半徑
  image: {
    none: BASE_BORDER_RADIUS.none,  // 0 - 無邊框半徑
    sm: BASE_BORDER_RADIUS.sm,      // 4px - 小圖片
    md: BASE_BORDER_RADIUS.md,      // 6px - 中等圖片
    lg: BASE_BORDER_RADIUS.lg,      // 8px - 大圖片
    xl: BASE_BORDER_RADIUS.xl       // 12px - 極大圖片
  }
} as const

// 響應式邊框半徑配置
export const RESPONSIVE_BORDER_RADIUS = {
  mobile: {
    // 移動端邊框半徑配置（較小的半徑）
    button: {
      xs: BASE_BORDER_RADIUS.xs,    // 2px
      sm: BASE_BORDER_RADIUS.sm,    // 4px
      md: BASE_BORDER_RADIUS.sm,    // 4px
      lg: BASE_BORDER_RADIUS.md,    // 6px
      xl: BASE_BORDER_RADIUS.lg     // 8px
    },
    input: {
      xs: BASE_BORDER_RADIUS.xs,    // 2px
      sm: BASE_BORDER_RADIUS.sm,    // 4px
      md: BASE_BORDER_RADIUS.sm,    // 4px
      lg: BASE_BORDER_RADIUS.md,    // 6px
      xl: BASE_BORDER_RADIUS.lg     // 8px
    },
    card: {
      xs: BASE_BORDER_RADIUS.sm,    // 4px
      sm: BASE_BORDER_RADIUS.sm,    // 4px
      md: BASE_BORDER_RADIUS.md,    // 6px
      lg: BASE_BORDER_RADIUS.lg,    // 8px
      xl: BASE_BORDER_RADIUS.xl     // 12px
    },
    modal: {
      sm: BASE_BORDER_RADIUS.md,    // 6px
      md: BASE_BORDER_RADIUS.lg,    // 8px
      lg: BASE_BORDER_RADIUS.xl     // 12px
    }
  },

  tablet: {
    // 平板端邊框半徑配置（中等半徑）
    button: {
      xs: BASE_BORDER_RADIUS.xs,    // 2px
      sm: BASE_BORDER_RADIUS.sm,    // 4px
      md: BASE_BORDER_RADIUS.md,    // 6px
      lg: BASE_BORDER_RADIUS.lg,    // 8px
      xl: BASE_BORDER_RADIUS.xl     // 12px
    },
    input: {
      xs: BASE_BORDER_RADIUS.xs,    // 2px
      sm: BASE_BORDER_RADIUS.sm,    // 4px
      md: BASE_BORDER_RADIUS.md,    // 6px
      lg: BASE_BORDER_RADIUS.lg,    // 8px
      xl: BASE_BORDER_RADIUS.xl     // 12px
    },
    card: {
      xs: BASE_BORDER_RADIUS.sm,    // 4px
      sm: BASE_BORDER_RADIUS.md,    // 6px
      md: BASE_BORDER_RADIUS.lg,    // 8px
      lg: BASE_BORDER_RADIUS.xl,    // 12px
      xl: BASE_BORDER_RADIUS['2xl'] // 16px
    },
    modal: {
      sm: BASE_BORDER_RADIUS.lg,    // 8px
      md: BASE_BORDER_RADIUS.xl,    // 12px
      lg: BASE_BORDER_RADIUS['2xl'] // 16px
    }
  },

  desktop: {
    // 桌面端邊框半徑配置（完整半徑）
    button: {
      xs: BASE_BORDER_RADIUS.xs,    // 2px
      sm: BASE_BORDER_RADIUS.sm,    // 4px
      md: BASE_BORDER_RADIUS.md,    // 6px
      lg: BASE_BORDER_RADIUS.lg,    // 8px
      xl: BASE_BORDER_RADIUS.xl     // 12px
    },
    input: {
      xs: BASE_BORDER_RADIUS.xs,    // 2px
      sm: BASE_BORDER_RADIUS.sm,    // 4px
      md: BASE_BORDER_RADIUS.md,    // 6px
      lg: BASE_BORDER_RADIUS.lg,    // 8px
      xl: BASE_BORDER_RADIUS.xl     // 12px
    },
    card: {
      xs: BASE_BORDER_RADIUS.sm,    // 4px
      sm: BASE_BORDER_RADIUS.md,    // 6px
      md: BASE_BORDER_RADIUS.lg,    // 8px
      lg: BASE_BORDER_RADIUS.xl,    // 12px
      xl: BASE_BORDER_RADIUS['2xl'] // 16px
    },
    modal: {
      sm: BASE_BORDER_RADIUS.lg,    // 8px
      md: BASE_BORDER_RADIUS.xl,    // 12px
      lg: BASE_BORDER_RADIUS['2xl'] // 16px
    }
  }
} as const

// 特殊邊框半徑配置
export const SPECIAL_BORDER_RADIUS = {
  // 不對稱邊框半徑
  asymmetric: {
    topLeft: {
      sm: `${BASE_BORDER_RADIUS.sm} 0 0 0`,
      md: `${BASE_BORDER_RADIUS.md} 0 0 0`,
      lg: `${BASE_BORDER_RADIUS.lg} 0 0 0`
    },
    topRight: {
      sm: `0 ${BASE_BORDER_RADIUS.sm} 0 0`,
      md: `0 ${BASE_BORDER_RADIUS.md} 0 0`,
      lg: `0 ${BASE_BORDER_RADIUS.lg} 0 0`
    },
    bottomLeft: {
      sm: `0 0 0 ${BASE_BORDER_RADIUS.sm}`,
      md: `0 0 0 ${BASE_BORDER_RADIUS.md}`,
      lg: `0 0 0 ${BASE_BORDER_RADIUS.lg}`
    },
    bottomRight: {
      sm: `0 0 ${BASE_BORDER_RADIUS.sm} 0`,
      md: `0 0 ${BASE_BORDER_RADIUS.md} 0`,
      lg: `0 0 ${BASE_BORDER_RADIUS.lg} 0`
    },
    top: {
      sm: `${BASE_BORDER_RADIUS.sm} ${BASE_BORDER_RADIUS.sm} 0 0`,
      md: `${BASE_BORDER_RADIUS.md} ${BASE_BORDER_RADIUS.md} 0 0`,
      lg: `${BASE_BORDER_RADIUS.lg} ${BASE_BORDER_RADIUS.lg} 0 0`
    },
    bottom: {
      sm: `0 0 ${BASE_BORDER_RADIUS.sm} ${BASE_BORDER_RADIUS.sm}`,
      md: `0 0 ${BASE_BORDER_RADIUS.md} ${BASE_BORDER_RADIUS.md}`,
      lg: `0 0 ${BASE_BORDER_RADIUS.lg} ${BASE_BORDER_RADIUS.lg}`
    },
    left: {
      sm: `${BASE_BORDER_RADIUS.sm} 0 0 ${BASE_BORDER_RADIUS.sm}`,
      md: `${BASE_BORDER_RADIUS.md} 0 0 ${BASE_BORDER_RADIUS.md}`,
      lg: `${BASE_BORDER_RADIUS.lg} 0 0 ${BASE_BORDER_RADIUS.lg}`
    },
    right: {
      sm: `0 ${BASE_BORDER_RADIUS.sm} ${BASE_BORDER_RADIUS.sm} 0`,
      md: `0 ${BASE_BORDER_RADIUS.md} ${BASE_BORDER_RADIUS.md} 0`,
      lg: `0 ${BASE_BORDER_RADIUS.lg} ${BASE_BORDER_RADIUS.lg} 0`
    }
  },

  // 組合邊框半徑
  combined: {
    // 標籤頁樣式（上方圓角）
    tab: `${BASE_BORDER_RADIUS.md} ${BASE_BORDER_RADIUS.md} 0 0`,
    // 工具提示樣式
    tooltip: BASE_BORDER_RADIUS.sm,
    // 通知樣式
    notification: BASE_BORDER_RADIUS.lg,
    // 進度條樣式
    progressBar: BASE_BORDER_RADIUS.full,
    // 分隔線樣式
    divider: BASE_BORDER_RADIUS.full
  }
} as const

// 邊框半徑工具函數
export const borderRadiusUtils = {
  /**
   * 獲取響應式邊框半徑
   */
  getResponsiveBorderRadius: (
    breakpoint: keyof typeof RESPONSIVE_BORDER_RADIUS,
    component: keyof typeof RESPONSIVE_BORDER_RADIUS.mobile,
    size: keyof typeof RESPONSIVE_BORDER_RADIUS.mobile.button
  ) => {
    return RESPONSIVE_BORDER_RADIUS[breakpoint][component][size]
  },

  /**
   * 轉換rem到像素值
   */
  remToPx: (remValue: string, baseFontSize: number = 16): number => {
    if (remValue === '0' || remValue === 'none') return 0
    if (remValue === '9999px') return 9999
    const numericValue = parseFloat(remValue.replace('rem', ''))
    return numericValue * baseFontSize
  },

  /**
   * 轉換像素到rem值
   */
  pxToRem: (pxValue: number, baseFontSize: number = 16): string => {
    if (pxValue === 0) return '0'
    if (pxValue >= 9999) return '9999px'
    return `${pxValue / baseFontSize}rem`
  },

  /**
   * 創建自定義邊框半徑
   */
  createCustomBorderRadius: (config: {
    topLeft?: string
    topRight?: string
    bottomRight?: string
    bottomLeft?: string
  }): string => {
    const {
      topLeft = '0',
      topRight = '0',
      bottomRight = '0',
      bottomLeft = '0'
    } = config

    return `${topLeft} ${topRight} ${bottomRight} ${bottomLeft}`
  },

  /**
   * 檢查是否為圓形
   */
  isCircular: (borderRadius: string): boolean => {
    return borderRadius === BASE_BORDER_RADIUS.full || borderRadius === '50%'
  },

  /**
   * 根據組件大小推薦邊框半徑
   */
  recommendBorderRadius: (componentSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): string => {
    const recommendations = {
      xs: BASE_BORDER_RADIUS.xs,
      sm: BASE_BORDER_RADIUS.sm,
      md: BASE_BORDER_RADIUS.md,
      lg: BASE_BORDER_RADIUS.lg,
      xl: BASE_BORDER_RADIUS.xl
    }
    return recommendations[componentSize]
  },

  /**
   * 調整邊框半徑大小
   */
  scaleBorderRadius: (borderRadius: string, scale: number): string => {
    if (borderRadius === '0' || borderRadius === 'none') return borderRadius
    if (borderRadius === '9999px' || borderRadius === BASE_BORDER_RADIUS.full) return borderRadius

    const numericValue = parseFloat(borderRadius.replace('rem', ''))
    const scaledValue = numericValue * scale
    return `${scaledValue}rem`
  }
}

// 導出所有邊框半徑Token
export const BORDER_RADIUS_TOKENS = {
  base: BASE_BORDER_RADIUS,
  semantic: SEMANTIC_BORDER_RADIUS,
  responsive: RESPONSIVE_BORDER_RADIUS,
  special: SPECIAL_BORDER_RADIUS
} as const
