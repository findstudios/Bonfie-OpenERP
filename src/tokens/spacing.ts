/**
 * Enhanced Spacing Token System
 * 增強的間距Token系統，支援響應式間距和語義化間距配置
 */

// 基礎間距配置（rem單位）
export const BASE_SPACING = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem'       // 384px
} as const

// 語義化間距配置
export const SEMANTIC_SPACING = {
  // 組件內部間距
  component: {
    xs: BASE_SPACING[1],      // 4px - 極小間距
    sm: BASE_SPACING[2],      // 8px - 小間距
    md: BASE_SPACING[4],      // 16px - 中等間距
    lg: BASE_SPACING[6],      // 24px - 大間距
    xl: BASE_SPACING[8],      // 32px - 極大間距
    '2xl': BASE_SPACING[12]   // 48px - 超大間距
  },

  // 佈局間距
  layout: {
    xs: BASE_SPACING[2],      // 8px - 極小佈局間距
    sm: BASE_SPACING[4],      // 16px - 小佈局間距
    md: BASE_SPACING[8],      // 32px - 中等佈局間距
    lg: BASE_SPACING[12],     // 48px - 大佈局間距
    xl: BASE_SPACING[16],     // 64px - 極大佈局間距
    '2xl': BASE_SPACING[24]   // 96px - 超大佈局間距
  },

  // 容器間距
  container: {
    xs: BASE_SPACING[4],      // 16px - 極小容器間距
    sm: BASE_SPACING[6],      // 24px - 小容器間距
    md: BASE_SPACING[8],      // 32px - 中等容器間距
    lg: BASE_SPACING[12],     // 48px - 大容器間距
    xl: BASE_SPACING[16],     // 64px - 極大容器間距
    '2xl': BASE_SPACING[20]   // 80px - 超大容器間距
  }
} as const

// 響應式間距配置
export const RESPONSIVE_SPACING = {
  mobile: {
    // 移動端間距配置
    component: {
      xs: BASE_SPACING[1],    // 4px
      sm: BASE_SPACING[2],    // 8px
      md: BASE_SPACING[3],    // 12px
      lg: BASE_SPACING[4],    // 16px
      xl: BASE_SPACING[6],    // 24px
      '2xl': BASE_SPACING[8]  // 32px
    },
    layout: {
      xs: BASE_SPACING[2],    // 8px
      sm: BASE_SPACING[3],    // 12px
      md: BASE_SPACING[4],    // 16px
      lg: BASE_SPACING[6],    // 24px
      xl: BASE_SPACING[8],    // 32px
      '2xl': BASE_SPACING[12] // 48px
    },
    container: {
      xs: BASE_SPACING[3],    // 12px
      sm: BASE_SPACING[4],    // 16px
      md: BASE_SPACING[6],    // 24px
      lg: BASE_SPACING[8],    // 32px
      xl: BASE_SPACING[10],   // 40px
      '2xl': BASE_SPACING[12] // 48px
    }
  },

  tablet: {
    // 平板端間距配置
    component: {
      xs: BASE_SPACING[1.5],  // 6px
      sm: BASE_SPACING[2.5],  // 10px
      md: BASE_SPACING[4],    // 16px
      lg: BASE_SPACING[5],    // 20px
      xl: BASE_SPACING[7],    // 28px
      '2xl': BASE_SPACING[10] // 40px
    },
    layout: {
      xs: BASE_SPACING[3],    // 12px
      sm: BASE_SPACING[5],    // 20px
      md: BASE_SPACING[6],    // 24px
      lg: BASE_SPACING[8],    // 32px
      xl: BASE_SPACING[12],   // 48px
      '2xl': BASE_SPACING[16] // 64px
    },
    container: {
      xs: BASE_SPACING[4],    // 16px
      sm: BASE_SPACING[6],    // 24px
      md: BASE_SPACING[8],    // 32px
      lg: BASE_SPACING[10],   // 40px
      xl: BASE_SPACING[14],   // 56px
      '2xl': BASE_SPACING[16] // 64px
    }
  },

  desktop: {
    // 桌面端間距配置
    component: {
      xs: BASE_SPACING[2],    // 8px
      sm: BASE_SPACING[3],    // 12px
      md: BASE_SPACING[4],    // 16px
      lg: BASE_SPACING[6],    // 24px
      xl: BASE_SPACING[8],    // 32px
      '2xl': BASE_SPACING[12] // 48px
    },
    layout: {
      xs: BASE_SPACING[4],    // 16px
      sm: BASE_SPACING[6],    // 24px
      md: BASE_SPACING[8],    // 32px
      lg: BASE_SPACING[12],   // 48px
      xl: BASE_SPACING[16],   // 64px
      '2xl': BASE_SPACING[20] // 80px
    },
    container: {
      xs: BASE_SPACING[6],    // 24px
      sm: BASE_SPACING[8],    // 32px
      md: BASE_SPACING[12],   // 48px
      lg: BASE_SPACING[16],   // 64px
      xl: BASE_SPACING[20],   // 80px
      '2xl': BASE_SPACING[24] // 96px
    }
  }
} as const

// 特殊用途間距配置
export const SPECIAL_SPACING = {
  // 觸控目標最小尺寸
  touchTarget: {
    min: BASE_SPACING[11],    // 44px - 最小觸控目標
    comfortable: BASE_SPACING[12], // 48px - 舒適觸控目標
    large: BASE_SPACING[14]   // 56px - 大觸控目標
  },

  // 側邊欄寬度
  sidebar: {
    collapsed: BASE_SPACING[16],  // 64px - 收合側邊欄
    expanded: BASE_SPACING[64],   // 256px - 展開側邊欄
    wide: BASE_SPACING[72]        // 288px - 寬側邊欄
  },

  // 頭部高度
  header: {
    mobile: BASE_SPACING[14],     // 56px - 移動端頭部
    tablet: BASE_SPACING[16],     // 64px - 平板端頭部
    desktop: BASE_SPACING[20]     // 80px - 桌面端頭部
  },

  // 表單間距
  form: {
    fieldGap: BASE_SPACING[4],    // 16px - 表單欄位間距
    groupGap: BASE_SPACING[6],    // 24px - 表單群組間距
    sectionGap: BASE_SPACING[8],  // 32px - 表單區段間距
    labelGap: BASE_SPACING[2]     // 8px - 標籤與輸入框間距
  },

  // 卡片間距
  card: {
    padding: {
      xs: BASE_SPACING[3],        // 12px
      sm: BASE_SPACING[4],        // 16px
      md: BASE_SPACING[6],        // 24px
      lg: BASE_SPACING[8],        // 32px
      xl: BASE_SPACING[10]        // 40px
    },
    gap: {
      xs: BASE_SPACING[2],        // 8px
      sm: BASE_SPACING[4],        // 16px
      md: BASE_SPACING[6],        // 24px
      lg: BASE_SPACING[8],        // 32px
      xl: BASE_SPACING[12]        // 48px
    }
  },

  // 按鈕間距
  button: {
    padding: {
      xs: `${BASE_SPACING[1]} ${BASE_SPACING[2]}`,      // 4px 8px
      sm: `${BASE_SPACING[2]} ${BASE_SPACING[3]}`,      // 8px 12px
      md: `${BASE_SPACING[2.5]} ${BASE_SPACING[4]}`,    // 10px 16px
      lg: `${BASE_SPACING[3]} ${BASE_SPACING[6]}`,      // 12px 24px
      xl: `${BASE_SPACING[4]} ${BASE_SPACING[8]}`       // 16px 32px
    },
    gap: BASE_SPACING[2]          // 8px - 按鈕間距
  },

  // 表格間距
  table: {
    cellPadding: {
      xs: `${BASE_SPACING[2]} ${BASE_SPACING[3]}`,      // 8px 12px
      sm: `${BASE_SPACING[3]} ${BASE_SPACING[4]}`,      // 12px 16px
      md: `${BASE_SPACING[4]} ${BASE_SPACING[6]}`,      // 16px 24px
      lg: `${BASE_SPACING[5]} ${BASE_SPACING[8]}`       // 20px 32px
    },
    rowGap: BASE_SPACING[1]       // 4px - 表格行間距
  }
} as const

// 間距工具函數
export const spacingUtils = {
  /**
   * 獲取響應式間距
   */
  getResponsiveSpacing: (
    breakpoint: keyof typeof RESPONSIVE_SPACING,
    category: keyof typeof RESPONSIVE_SPACING.mobile,
    size: keyof typeof RESPONSIVE_SPACING.mobile.component
  ) => {
    return RESPONSIVE_SPACING[breakpoint][category][size]
  },

  /**
   * 轉換rem到像素值
   */
  remToPx: (remValue: string, baseFontSize: number = 16): number => {
    const numericValue = parseFloat(remValue.replace('rem', ''))
    return numericValue * baseFontSize
  },

  /**
   * 轉換像素到rem值
   */
  pxToRem: (pxValue: number, baseFontSize: number = 16): string => {
    return `${pxValue / baseFontSize}rem`
  },

  /**
   * 生成間距CSS字符串
   */
  generateSpacingCSS: (config: {
    margin?: string
    padding?: string
    gap?: string
    marginTop?: string
    marginRight?: string
    marginBottom?: string
    marginLeft?: string
    paddingTop?: string
    paddingRight?: string
    paddingBottom?: string
    paddingLeft?: string
  }) => {
    const styles: string[] = []

    Object.entries(config).forEach(([property, value]) => {
      if (value) {
        // 轉換駝峰命名為CSS屬性名
        const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase()
        styles.push(`${cssProperty}: ${value}`)
      }
    })

    return styles.join('; ')
  },

  /**
   * 計算最佳間距
   */
  calculateOptimalSpacing: (contentSize: 'small' | 'medium' | 'large'): string => {
    switch (contentSize) {
      case 'small':
        return SEMANTIC_SPACING.component.sm
      case 'medium':
        return SEMANTIC_SPACING.component.md
      case 'large':
        return SEMANTIC_SPACING.component.lg
      default:
        return SEMANTIC_SPACING.component.md
    }
  }
}

// 導出所有間距Token
export const SPACING_TOKENS = {
  base: BASE_SPACING,
  semantic: SEMANTIC_SPACING,
  responsive: RESPONSIVE_SPACING,
  special: SPECIAL_SPACING
} as const
