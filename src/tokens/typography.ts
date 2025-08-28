/**
 * Enhanced Typography Token System
 * 增強的字體Token系統，支援響應式字體配置和完整的字體層級
 */

// 字體家族配置
export const FONT_FAMILIES = {
  sans: ['Inter', 'Noto Sans TC', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
  serif: ['Georgia', 'Times New Roman', 'serif']
} as const

// 字體權重配置
export const FONT_WEIGHTS = {
  thin: 100,
  extraLight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900
} as const

// 基礎字體大小配置（rem單位）
export const FONT_SIZES = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
  '6xl': '3.75rem', // 60px
  '7xl': '4.5rem',  // 72px
  '8xl': '6rem',    // 96px
  '9xl': '8rem'     // 128px
} as const

// 行高配置
export const LINE_HEIGHTS = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2'
} as const

// 字母間距配置
export const LETTER_SPACINGS = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em'
} as const

// 響應式字體配置
export const RESPONSIVE_TYPOGRAPHY = {
  mobile: {
    // 移動端字體配置
    h1: {
      fontSize: FONT_SIZES['2xl'],
      lineHeight: LINE_HEIGHTS.tight,
      fontWeight: FONT_WEIGHTS.bold,
      letterSpacing: LETTER_SPACINGS.tight
    },
    h2: {
      fontSize: FONT_SIZES.xl,
      lineHeight: LINE_HEIGHTS.tight,
      fontWeight: FONT_WEIGHTS.semibold,
      letterSpacing: LETTER_SPACINGS.tight
    },
    h3: {
      fontSize: FONT_SIZES.lg,
      lineHeight: LINE_HEIGHTS.snug,
      fontWeight: FONT_WEIGHTS.semibold,
      letterSpacing: LETTER_SPACINGS.normal
    },
    h4: {
      fontSize: FONT_SIZES.base,
      lineHeight: LINE_HEIGHTS.snug,
      fontWeight: FONT_WEIGHTS.semibold,
      letterSpacing: LETTER_SPACINGS.normal
    },
    h5: {
      fontSize: FONT_SIZES.sm,
      lineHeight: LINE_HEIGHTS.snug,
      fontWeight: FONT_WEIGHTS.semibold,
      letterSpacing: LETTER_SPACINGS.normal
    },
    h6: {
      fontSize: FONT_SIZES.xs,
      lineHeight: LINE_HEIGHTS.snug,
      fontWeight: FONT_WEIGHTS.semibold,
      letterSpacing: LETTER_SPACINGS.wide
    },
    body: {
      fontSize: FONT_SIZES.sm,
      lineHeight: LINE_HEIGHTS.relaxed,
      fontWeight: FONT_WEIGHTS.normal,
      letterSpacing: LETTER_SPACINGS.normal
    },
    bodyLarge: {
      fontSize: FONT_SIZES.base,
      lineHeight: LINE_HEIGHTS.relaxed,
      fontWeight: FONT_WEIGHTS.normal,
      letterSpacing: LETTER_SPACINGS.normal
    },
    bodySmall: {
      fontSize: FONT_SIZES.xs,
      lineHeight: LINE_HEIGHTS.normal,
      fontWeight: FONT_WEIGHTS.normal,
      letterSpacing: LETTER_SPACINGS.normal
    },
    caption: {
      fontSize: FONT_SIZES.xs,
      lineHeight: LINE_HEIGHTS.normal,
      fontWeight: FONT_WEIGHTS.medium,
      letterSpacing: LETTER_SPACINGS.wide
    },
    overline: {
      fontSize: FONT_SIZES.xs,
      lineHeight: LINE_HEIGHTS.normal,
      fontWeight: FONT_WEIGHTS.semibold,
      letterSpacing: LETTER_SPACINGS.widest,
      textTransform: 'uppercase' as const
    }
  },
  tablet: {
    // 平板端字體配置
    h1: {
      fontSize: FONT_SIZES['3xl'],
      lineHeight: LINE_HEIGHTS.tight,
      fontWeight: FONT_WEIGHTS.bold,
      letterSpacing: LETTER_SPACINGS.tight
    },
    h2: {
      fontSize: FONT_SIZES['2xl'],
      lineHeight: LINE_HEIGHTS.tight,
      fontWeight: FONT_WEIGHTS.semibold,
      letterSpacing: LETTER_SPACINGS.tight
    },
    h3: {
      fontSize: FONT_SIZES.xl,
      lineHeight: LINE_HEIGHTS.snug,
      fontWeight: FONT_WEIGHTS.semibold,
      letterSpacing: LETTER_SPACINGS.normal
    },
    h4: {
      fontSize: FONT_SIZES.lg,
      lineHeight: LINE_HEIGHTS.snug,
      fontWeight: FONT_WEIGHTS.semibold,
      letterSpacing: LETTER_SPACINGS.normal
    },
    h5: {
      fontSize: FONT_SIZES.base,
      lineHeight: LINE_HEIGHTS.snug,
      fontWeight: FONT_WEIGHTS.semibold,
      letterSpacing: LETTER_SPACINGS.normal
    },
    h6: {
      fontSize: FONT_SIZES.sm,
      lineHeight: LINE_HEIGHTS.snug,
      fontWeight: FONT_WEIGHTS.semibold,
      letterSpacing: LETTER_SPACINGS.wide
    },
    body: {
      fontSize: FONT_SIZES.base,
      lineHeight: LINE_HEIGHTS.relaxed,
      fontWeight: FONT_WEIGHTS.normal,
      letterSpacing: LETTER_SPACINGS.normal
    },
    bodyLarge: {
      fontSize: FONT_SIZES.lg,
      lineHeight: LINE_HEIGHTS.relaxed,
      fontWeight: FONT_WEIGHTS.normal,
      letterSpacing: LETTER_SPACINGS.normal
    },
    bodySmall: {
      fontSize: FONT_SIZES.sm,
      lineHeight: LINE_HEIGHTS.normal,
      fontWeight: FONT_WEIGHTS.normal,
      letterSpacing: LETTER_SPACINGS.normal
    },
    caption: {
      fontSize: FONT_SIZES.sm,
      lineHeight: LINE_HEIGHTS.normal,
      fontWeight: FONT_WEIGHTS.medium,
      letterSpacing: LETTER_SPACINGS.wide
    },
    overline: {
      fontSize: FONT_SIZES.sm,
      lineHeight: LINE_HEIGHTS.normal,
      fontWeight: FONT_WEIGHTS.semibold,
      letterSpacing: LETTER_SPACINGS.widest,
      textTransform: 'uppercase' as const
    }
  },
  desktop: {
    // 桌面端字體配置
    h1: {
      fontSize: FONT_SIZES['4xl'],
      lineHeight: LINE_HEIGHTS.tight,
      fontWeight: FONT_WEIGHTS.bold,
      letterSpacing: LETTER_SPACINGS.tight
    },
    h2: {
      fontSize: FONT_SIZES['3xl'],
      lineHeight: LINE_HEIGHTS.tight,
      fontWeight: FONT_WEIGHTS.semibold,
      letterSpacing: LETTER_SPACINGS.tight
    },
    h3: {
      fontSize: FONT_SIZES['2xl'],
      lineHeight: LINE_HEIGHTS.snug,
      fontWeight: FONT_WEIGHTS.semibold,
      letterSpacing: LETTER_SPACINGS.normal
    },
    h4: {
      fontSize: FONT_SIZES.xl,
      lineHeight: LINE_HEIGHTS.snug,
      fontWeight: FONT_WEIGHTS.semibold,
      letterSpacing: LETTER_SPACINGS.normal
    },
    h5: {
      fontSize: FONT_SIZES.lg,
      lineHeight: LINE_HEIGHTS.snug,
      fontWeight: FONT_WEIGHTS.semibold,
      letterSpacing: LETTER_SPACINGS.normal
    },
    h6: {
      fontSize: FONT_SIZES.base,
      lineHeight: LINE_HEIGHTS.snug,
      fontWeight: FONT_WEIGHTS.semibold,
      letterSpacing: LETTER_SPACINGS.wide
    },
    body: {
      fontSize: FONT_SIZES.base,
      lineHeight: LINE_HEIGHTS.relaxed,
      fontWeight: FONT_WEIGHTS.normal,
      letterSpacing: LETTER_SPACINGS.normal
    },
    bodyLarge: {
      fontSize: FONT_SIZES.lg,
      lineHeight: LINE_HEIGHTS.relaxed,
      fontWeight: FONT_WEIGHTS.normal,
      letterSpacing: LETTER_SPACINGS.normal
    },
    bodySmall: {
      fontSize: FONT_SIZES.sm,
      lineHeight: LINE_HEIGHTS.normal,
      fontWeight: FONT_WEIGHTS.normal,
      letterSpacing: LETTER_SPACINGS.normal
    },
    caption: {
      fontSize: FONT_SIZES.sm,
      lineHeight: LINE_HEIGHTS.normal,
      fontWeight: FONT_WEIGHTS.medium,
      letterSpacing: LETTER_SPACINGS.wide
    },
    overline: {
      fontSize: FONT_SIZES.sm,
      lineHeight: LINE_HEIGHTS.normal,
      fontWeight: FONT_WEIGHTS.semibold,
      letterSpacing: LETTER_SPACINGS.widest,
      textTransform: 'uppercase' as const
    }
  }
} as const

// 特殊用途字體配置
export const SPECIAL_TYPOGRAPHY = {
  // 代碼字體
  code: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.normal,
    fontWeight: FONT_WEIGHTS.normal,
    letterSpacing: LETTER_SPACINGS.normal
  },
  // 按鈕字體
  button: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.none,
    fontWeight: FONT_WEIGHTS.medium,
    letterSpacing: LETTER_SPACINGS.wide
  },
  // 輸入框字體
  input: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.base,
    lineHeight: LINE_HEIGHTS.normal,
    fontWeight: FONT_WEIGHTS.normal,
    letterSpacing: LETTER_SPACINGS.normal
  },
  // 標籤字體
  label: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.normal,
    fontWeight: FONT_WEIGHTS.medium,
    letterSpacing: LETTER_SPACINGS.normal
  },
  // 導航字體
  navigation: {
    fontFamily: FONT_FAMILIES.sans,
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.normal,
    fontWeight: FONT_WEIGHTS.medium,
    letterSpacing: LETTER_SPACINGS.normal
  },
  // 數據顯示字體
  data: {
    fontFamily: FONT_FAMILIES.mono,
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.normal,
    fontWeight: FONT_WEIGHTS.normal,
    letterSpacing: LETTER_SPACINGS.normal
  }
} as const

// 字體工具函數
export const typographyUtils = {
  /**
   * 獲取響應式字體配置
   */
  getResponsiveTypography: (
    breakpoint: keyof typeof RESPONSIVE_TYPOGRAPHY,
    variant: keyof typeof RESPONSIVE_TYPOGRAPHY.mobile
  ) => {
    return RESPONSIVE_TYPOGRAPHY[breakpoint][variant]
  },

  /**
   * 生成字體CSS字符串
   */
  generateFontCSS: (config: {
    fontSize?: string
    lineHeight?: string
    fontWeight?: number
    letterSpacing?: string
    fontFamily?: string[]
  }) => {
    const styles: string[] = []

    if (config.fontFamily) {
      styles.push(`font-family: ${config.fontFamily.join(', ')}`)
    }
    if (config.fontSize) {
      styles.push(`font-size: ${config.fontSize}`)
    }
    if (config.lineHeight) {
      styles.push(`line-height: ${config.lineHeight}`)
    }
    if (config.fontWeight) {
      styles.push(`font-weight: ${config.fontWeight}`)
    }
    if (config.letterSpacing) {
      styles.push(`letter-spacing: ${config.letterSpacing}`)
    }

    return styles.join('; ')
  },

  /**
   * 計算字體大小的像素值
   */
  remToPx: (remValue: string, baseFontSize: number = 16): number => {
    const numericValue = parseFloat(remValue.replace('rem', ''))
    return numericValue * baseFontSize
  },

  /**
   * 計算最佳行高
   */
  calculateOptimalLineHeight: (fontSize: string): string => {
    const pxValue = typographyUtils.remToPx(fontSize)

    if (pxValue <= 14) return LINE_HEIGHTS.normal
    if (pxValue <= 18) return LINE_HEIGHTS.relaxed
    if (pxValue <= 24) return LINE_HEIGHTS.snug
    return LINE_HEIGHTS.tight
  }
}

// 導出所有字體Token
export const TYPOGRAPHY_TOKENS = {
  fontFamilies: FONT_FAMILIES,
  fontWeights: FONT_WEIGHTS,
  fontSizes: FONT_SIZES,
  lineHeights: LINE_HEIGHTS,
  letterSpacings: LETTER_SPACINGS,
  responsive: RESPONSIVE_TYPOGRAPHY,
  special: SPECIAL_TYPOGRAPHY
} as const
