/**
 * Enhanced Design Token System - Main Export
 * 增強設計Token系統主要導出文件
 *
 * 這個文件統一導出所有設計Token、類型定義、工具函數和驗證系統
 */

// ============================================================================
// Token導出
// ============================================================================

// 顏色Token
export {
  PRIMARY_COLORS,
  NEUTRAL_COLORS,
  SEMANTIC_COLORS,
  EXTENDED_COLORS,
  THEME_COLORS,
  COLOR_TOKENS,
  colorUtils
} from './colors'

// 字體Token
export {
  FONT_FAMILIES,
  FONT_WEIGHTS,
  FONT_SIZES,
  LINE_HEIGHTS,
  LETTER_SPACINGS,
  RESPONSIVE_TYPOGRAPHY,
  SPECIAL_TYPOGRAPHY,
  TYPOGRAPHY_TOKENS,
  typographyUtils
} from './typography'

// 間距Token
export {
  BASE_SPACING,
  SEMANTIC_SPACING,
  RESPONSIVE_SPACING,
  SPECIAL_SPACING,
  SPACING_TOKENS,
  spacingUtils
} from './spacing'

// 陰影Token
export {
  BASE_SHADOWS,
  SEMANTIC_SHADOWS,
  RESPONSIVE_SHADOWS,
  SPECIAL_SHADOWS,
  THEME_SHADOWS,
  SHADOW_TOKENS,
  shadowUtils
} from './shadows'

// 邊框半徑Token
export {
  BASE_BORDER_RADIUS,
  SEMANTIC_BORDER_RADIUS,
  RESPONSIVE_BORDER_RADIUS,
  SPECIAL_BORDER_RADIUS,
  BORDER_RADIUS_TOKENS,
  borderRadiusUtils
} from './borderRadius'

// ============================================================================
// 類型定義導出
// ============================================================================

export type {
  // 顏色類型
  ColorScale,
  ColorValue,
  ColorKey,
  PrimaryColorKey,
  NeutralColorKey,
  SemanticColorType,
  SemanticColorKey,
  ExtendedColorType,
  ExtendedColorKey,
  ThemeType,
  ThemeColorCategory,
  ThemeColorVariant,
  ColorToken,
  ColorPalette,
  ThemeColorConfig,

  // 字體類型
  FontFamilyKey,
  FontWeightKey,
  FontSizeKey,
  LineHeightKey,
  LetterSpacingKey,
  ResponsiveBreakpoint,
  TypographyVariant,
  SpecialTypographyType,
  TypographyConfig,
  ResponsiveTypographyConfig,
  TypographyToken,

  // 間距類型
  BaseSpacingKey,
  SpacingValue,
  SemanticSpacingCategory,
  SemanticSpacingSize,
  ResponsiveSpacingBreakpoint,
  ResponsiveSpacingCategory,
  ResponsiveSpacingSize,
  SpecialSpacingType,
  TouchTargetSize,
  SidebarWidth,
  HeaderHeight,
  SpacingToken,
  SpacingConfig,

  // 陰影類型
  BaseShadowKey,
  ShadowValue,
  SemanticShadowComponent,
  SemanticShadowState,
  ResponsiveShadowBreakpoint,
  ResponsiveShadowComponent,
  ResponsiveShadowState,
  SpecialShadowType,
  GlowColor,
  InsetLevel,
  OutlineColor,
  LayeredLevel,
  ThemeShadowType,
  ThemeShadowComponent,
  ThemeShadowState,
  ShadowToken,
  CustomShadowConfig,

  // 邊框半徑類型
  BaseBorderRadiusKey,
  BorderRadiusValue,
  SemanticBorderRadiusComponent,
  SemanticBorderRadiusSize,
  ResponsiveBorderRadiusBreakpoint,
  ResponsiveBorderRadiusComponent,
  ResponsiveBorderRadiusSize,
  SpecialBorderRadiusType,
  AsymmetricDirection,
  AsymmetricSize,
  CombinedStyle,
  BorderRadiusToken,
  CustomBorderRadiusConfig,

  // 綜合類型
  DesignTokens,
  ComponentTokens,
  ResponsiveTokens,
  ThemeTokens,
  TokenValidationRule,
  TokenValidationSchema,
  TokenValidationResult,
  TokenUtils
} from './types'

// ============================================================================
// 驗證系統導出
// ============================================================================

export {
  TOKEN_VALIDATION_SCHEMA,
  validateTokens,
  validateTokenValue,
  validateColorToken,
  validateTypographyConfig,
  validateSpacingToken,
  validateShadowToken,
  validateBorderRadiusToken,
  generateValidationReport,
  tokenValidation
} from './validation'

// ============================================================================
// 統一Token對象
// ============================================================================

import { COLOR_TOKENS, THEME_COLORS } from './colors'
import { TYPOGRAPHY_TOKENS } from './typography'
import { SPACING_TOKENS } from './spacing'
import { SHADOW_TOKENS } from './shadows'
import { BORDER_RADIUS_TOKENS } from './borderRadius'
import {
  validateTokens,
  validateTokenValue,
  validateColorToken,
  validateTypographyConfig,
  validateSpacingToken,
  validateShadowToken,
  validateBorderRadiusToken,
  generateValidationReport,
  tokenValidation
} from './validation'
import type { DesignTokens } from './types'

/**
 * 統一的設計Token對象
 * 包含所有類別的Token
 */
export const DESIGN_TOKENS: DesignTokens = {
  colors: COLOR_TOKENS,
  typography: TYPOGRAPHY_TOKENS,
  spacing: SPACING_TOKENS,
  shadows: SHADOW_TOKENS,
  borderRadius: BORDER_RADIUS_TOKENS
} as const

// ============================================================================
// 統一工具函數對象
// ============================================================================

import { colorUtils } from './colors'
import { typographyUtils } from './typography'
import { spacingUtils } from './spacing'
import { shadowUtils } from './shadows'
import { borderRadiusUtils } from './borderRadius'
import type { TokenUtils } from './types'

/**
 * 統一的Token工具函數對象
 * 包含所有類別的工具函數
 */
export const TOKEN_UTILS: TokenUtils = {
  colors: colorUtils,
  typography: typographyUtils,
  spacing: spacingUtils,
  shadows: shadowUtils,
  borderRadius: borderRadiusUtils
} as const

// ============================================================================
// 便捷訪問函數
// ============================================================================

/**
 * 獲取顏色Token
 */
export function getColor(
  category: keyof typeof COLOR_TOKENS,
  key: string
): string {
  const colorCategory = COLOR_TOKENS[category] as any
  return colorCategory[key] || ''
}

/**
 * 獲取主題顏色
 */
export function getThemeColor(
  theme: 'light' | 'dark' | 'highContrast',
  category: string,
  variant: string
): string {
  return colorUtils.getThemeColor(theme, category, variant)
}

/**
 * 獲取響應式字體配置
 */
export function getResponsiveTypography(
  breakpoint: 'mobile' | 'tablet' | 'desktop',
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'bodyLarge' | 'bodySmall' | 'caption' | 'overline'
) {
  return typographyUtils.getResponsiveTypography(breakpoint, variant)
}

/**
 * 獲取響應式間距
 */
export function getResponsiveSpacing(
  breakpoint: 'mobile' | 'tablet' | 'desktop',
  category: 'component' | 'layout' | 'container',
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
): string {
  return spacingUtils.getResponsiveSpacing(breakpoint, category, size)
}

/**
 * 獲取響應式陰影
 */
export function getResponsiveShadow(
  breakpoint: 'mobile' | 'tablet' | 'desktop',
  component: 'card' | 'button' | 'modal' | 'dropdown',
  state: string
): string {
  return shadowUtils.getResponsiveShadow(breakpoint, component, state)
}

/**
 * 獲取響應式邊框半徑
 */
export function getResponsiveBorderRadius(
  breakpoint: 'mobile' | 'tablet' | 'desktop',
  component: 'button' | 'input' | 'card' | 'modal',
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
): string {
  return borderRadiusUtils.getResponsiveBorderRadius(breakpoint, component, size)
}

// ============================================================================
// CSS變數生成函數
// ============================================================================

/**
 * 生成CSS變數字符串
 */
export function generateCSSVariables(): string {
  const cssVars: string[] = [':root {']

  // 顏色變數
  Object.entries(COLOR_TOKENS.primary).forEach(([key, value]) => {
    cssVars.push(`  --color-primary-${key}: ${value};`)
  })

  Object.entries(COLOR_TOKENS.neutral).forEach(([key, value]) => {
    cssVars.push(`  --color-neutral-${key}: ${value};`)
  })

  Object.entries(COLOR_TOKENS.semantic).forEach(([category, colors]) => {
    Object.entries(colors).forEach(([key, value]) => {
      cssVars.push(`  --color-${category}-${key}: ${value};`)
    })
  })

  // 字體變數
  Object.entries(TYPOGRAPHY_TOKENS.fontSizes).forEach(([key, value]) => {
    cssVars.push(`  --font-size-${key}: ${value};`)
  })

  Object.entries(TYPOGRAPHY_TOKENS.fontWeights).forEach(([key, value]) => {
    cssVars.push(`  --font-weight-${key}: ${value};`)
  })

  Object.entries(TYPOGRAPHY_TOKENS.lineHeights).forEach(([key, value]) => {
    cssVars.push(`  --line-height-${key}: ${value};`)
  })

  // 間距變數
  Object.entries(SPACING_TOKENS.base).forEach(([key, value]) => {
    cssVars.push(`  --spacing-${key}: ${value};`)
  })

  // 陰影變數
  Object.entries(SHADOW_TOKENS.base).forEach(([key, value]) => {
    cssVars.push(`  --shadow-${key}: ${value};`)
  })

  // 邊框半徑變數
  Object.entries(BORDER_RADIUS_TOKENS.base).forEach(([key, value]) => {
    cssVars.push(`  --border-radius-${key}: ${value};`)
  })

  cssVars.push('}')

  return cssVars.join('\n')
}

/**
 * 生成主題CSS變數
 */
export function generateThemeCSSVariables(theme: 'light' | 'dark' | 'highContrast'): string {
  const themeColors = THEME_COLORS[theme]
  const cssVars: string[] = [`[data-theme="${String(theme)}"] {`]

  // 背景顏色變數
  Object.entries(themeColors.background).forEach(([key, value]) => {
    cssVars.push(`  --color-bg-${key}: ${value};`)
  })

  // 文字顏色變數
  Object.entries(themeColors.text).forEach(([key, value]) => {
    cssVars.push(`  --color-text-${key}: ${value};`)
  })

  // 邊框顏色變數
  Object.entries(themeColors.border).forEach(([key, value]) => {
    cssVars.push(`  --color-border-${key}: ${value};`)
  })

  // 表面顏色變數
  Object.entries(themeColors.surface).forEach(([key, value]) => {
    cssVars.push(`  --color-surface-${key}: ${value};`)
  })

  cssVars.push('}')

  return cssVars.join('\n')
}

// ============================================================================
// 默認導出
// ============================================================================

export default {
  tokens: DESIGN_TOKENS,
  utils: TOKEN_UTILS,
  validation: {
    validateTokens,
    validateTokenValue,
    validateColorToken,
    validateTypographyConfig,
    validateSpacingToken,
    validateShadowToken,
    validateBorderRadiusToken,
    generateValidationReport
  },

  // 便捷函數
  getColor,
  getThemeColor,
  getResponsiveTypography,
  getResponsiveSpacing,
  getResponsiveShadow,
  getResponsiveBorderRadius,

  // CSS生成函數
  generateCSSVariables,
  generateThemeCSSVariables
}
