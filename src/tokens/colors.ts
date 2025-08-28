/**
 * Enhanced Color Token System
 * 擴展的顏色Token系統，支援完整的顏色調色板和語義化顏色
 */

// 主色調擴展 - 完整的藍色調色板
export const PRIMARY_COLORS = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6', // 主色
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
  950: '#172554'
} as const

// 中性色調 - 完整的灰色調色板
export const NEUTRAL_COLORS = {
  0: '#ffffff',
  50: '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
  950: '#030712'
} as const

// 語義化顏色系統
export const SEMANTIC_COLORS = {
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // 主成功色
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22'
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // 主警告色
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03'
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // 主錯誤色
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a'
  },
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // 主信息色
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49'
  }
} as const

// 擴展顏色調色板
export const EXTENDED_COLORS = {
  // 紫色調色板
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764'
  },
  // 青色調色板
  teal: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    950: '#042f2e'
  },
  // 橙色調色板
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    950: '#431407'
  }
} as const

// 主題顏色配置
export const THEME_COLORS = {
  light: {
    background: {
      primary: NEUTRAL_COLORS[0],      // 純白背景
      secondary: NEUTRAL_COLORS[50],   // 淺灰背景
      tertiary: NEUTRAL_COLORS[100],   // 更深的淺灰背景
      elevated: NEUTRAL_COLORS[0],     // 提升元素背景（卡片等）
      overlay: 'rgba(0, 0, 0, 0.5)'   // 遮罩背景
    },
    text: {
      primary: NEUTRAL_COLORS[900],    // 主要文字
      secondary: NEUTRAL_COLORS[700],  // 次要文字
      tertiary: NEUTRAL_COLORS[500],   // 第三級文字
      disabled: NEUTRAL_COLORS[400],   // 禁用文字
      inverse: NEUTRAL_COLORS[0],      // 反色文字（深色背景上）
      link: PRIMARY_COLORS[600],       // 連結文字
      linkHover: PRIMARY_COLORS[700]   // 連結懸停文字
    },
    border: {
      primary: NEUTRAL_COLORS[200],    // 主要邊框
      secondary: NEUTRAL_COLORS[300],  // 次要邊框
      focus: PRIMARY_COLORS[500],      // 焦點邊框
      error: SEMANTIC_COLORS.error[500], // 錯誤邊框
      success: SEMANTIC_COLORS.success[500] // 成功邊框
    },
    surface: {
      primary: NEUTRAL_COLORS[0],      // 主要表面
      secondary: NEUTRAL_COLORS[50],   // 次要表面
      tertiary: NEUTRAL_COLORS[100],   // 第三級表面
      hover: NEUTRAL_COLORS[100],      // 懸停表面
      pressed: NEUTRAL_COLORS[200],    // 按下表面
      selected: PRIMARY_COLORS[50],    // 選中表面
      disabled: NEUTRAL_COLORS[100]    // 禁用表面
    }
  },
  highContrast: {
    background: {
      primary: '#ffffff',
      secondary: '#f0f0f0',
      tertiary: '#e0e0e0',
      elevated: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.8)'
    },
    text: {
      primary: '#000000',
      secondary: '#333333',
      tertiary: '#666666',
      disabled: '#999999',
      inverse: '#ffffff',
      link: '#0066cc',
      linkHover: '#004499'
    },
    border: {
      primary: '#000000',
      secondary: '#333333',
      focus: '#0066cc',
      error: '#cc0000',
      success: '#006600'
    },
    surface: {
      primary: '#ffffff',
      secondary: '#f0f0f0',
      tertiary: '#e0e0e0',
      hover: '#e0e0e0',
      pressed: '#d0d0d0',
      selected: '#cce6ff',
      disabled: '#f0f0f0'
    }
  }
} as const

// 顏色工具函數
export const colorUtils = {
  /**
   * 獲取指定主題的顏色
   */
  getThemeColor: (theme: keyof typeof THEME_COLORS, category: string, variant: string) => {
    const themeColors = THEME_COLORS[theme] as any
    return themeColors[category]?.[variant] || ''
  },

  /**
   * 檢查顏色是否為深色
   */
  isDarkColor: (color: string): boolean => {
    // 簡單的亮度檢測
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness < 128
  },

  /**
   * 生成顏色的透明度變體
   */
  withOpacity: (color: string, opacity: number): string => {
    const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0')
    return `${color}${alpha}`
  }
}

// 導出所有顏色Token
export const COLOR_TOKENS = {
  primary: PRIMARY_COLORS,
  neutral: NEUTRAL_COLORS,
  semantic: SEMANTIC_COLORS,
  extended: EXTENDED_COLORS,
  theme: THEME_COLORS
} as const
