/**
 * TypeScript Type Definitions for Design Tokens
 * 設計Token的TypeScript類型定義，提供完整的類型安全和自動完成支援
 */

import type {
  COLOR_TOKENS,
  PRIMARY_COLORS,
  NEUTRAL_COLORS,
  SEMANTIC_COLORS,
  EXTENDED_COLORS,
  THEME_COLORS
} from './colors'

import type {
  TYPOGRAPHY_TOKENS,
  FONT_FAMILIES,
  FONT_WEIGHTS,
  FONT_SIZES,
  LINE_HEIGHTS,
  LETTER_SPACINGS,
  RESPONSIVE_TYPOGRAPHY,
  SPECIAL_TYPOGRAPHY
} from './typography'

import type {
  SPACING_TOKENS,
  BASE_SPACING,
  SEMANTIC_SPACING,
  RESPONSIVE_SPACING,
  SPECIAL_SPACING
} from './spacing'

import type {
  SHADOW_TOKENS,
  BASE_SHADOWS,
  SEMANTIC_SHADOWS,
  RESPONSIVE_SHADOWS,
  SPECIAL_SHADOWS,
  THEME_SHADOWS
} from './shadows'

import type {
  BORDER_RADIUS_TOKENS,
  BASE_BORDER_RADIUS,
  SEMANTIC_BORDER_RADIUS,
  RESPONSIVE_BORDER_RADIUS,
  SPECIAL_BORDER_RADIUS
} from './borderRadius'

// ============================================================================
// 顏色類型定義
// ============================================================================

export type ColorScale = typeof PRIMARY_COLORS
export type ColorValue = string
export type ColorKey = keyof typeof PRIMARY_COLORS

export type PrimaryColorKey = keyof typeof PRIMARY_COLORS
export type NeutralColorKey = keyof typeof NEUTRAL_COLORS
export type SemanticColorType = keyof typeof SEMANTIC_COLORS
export type SemanticColorKey = keyof typeof SEMANTIC_COLORS.success
export type ExtendedColorType = keyof typeof EXTENDED_COLORS
export type ExtendedColorKey = keyof typeof EXTENDED_COLORS.purple

export type ThemeType = 'light' | 'highContrast'
export type ThemeColorCategory = keyof typeof THEME_COLORS.light
export type ThemeColorVariant = keyof typeof THEME_COLORS.light.background

export interface ColorToken {
  value: ColorValue
  description?: string
  usage?: string[]
}

export interface ColorPalette {
  [key: string]: ColorValue | ColorPalette
}

export interface ThemeColorConfig {
  background: {
    primary: ColorValue
    secondary: ColorValue
    tertiary: ColorValue
    elevated: ColorValue
    overlay: ColorValue
  }
  text: {
    primary: ColorValue
    secondary: ColorValue
    tertiary: ColorValue
    disabled: ColorValue
    inverse: ColorValue
    link: ColorValue
    linkHover: ColorValue
  }
  border: {
    primary: ColorValue
    secondary: ColorValue
    focus: ColorValue
    error: ColorValue
    success: ColorValue
  }
  surface: {
    primary: ColorValue
    secondary: ColorValue
    tertiary: ColorValue
    hover: ColorValue
    pressed: ColorValue
    selected: ColorValue
    disabled: ColorValue
  }
}

// ============================================================================
// 字體類型定義
// ============================================================================

export type FontFamilyKey = keyof typeof FONT_FAMILIES
export type FontWeightKey = keyof typeof FONT_WEIGHTS
export type FontSizeKey = keyof typeof FONT_SIZES
export type LineHeightKey = keyof typeof LINE_HEIGHTS
export type LetterSpacingKey = keyof typeof LETTER_SPACINGS

export type ResponsiveBreakpoint = keyof typeof RESPONSIVE_TYPOGRAPHY
export type TypographyVariant = keyof typeof RESPONSIVE_TYPOGRAPHY.mobile
export type SpecialTypographyType = keyof typeof SPECIAL_TYPOGRAPHY

export interface TypographyConfig {
  fontSize: string
  lineHeight: string
  fontWeight: number
  letterSpacing: string
  fontFamily?: string[]
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
}

export interface ResponsiveTypographyConfig {
  mobile: Record<TypographyVariant, TypographyConfig>
  tablet: Record<TypographyVariant, TypographyConfig>
  desktop: Record<TypographyVariant, TypographyConfig>
}

export interface TypographyToken {
  value: TypographyConfig
  description?: string
  usage?: string[]
}

// ============================================================================
// 間距類型定義
// ============================================================================

export type BaseSpacingKey = keyof typeof BASE_SPACING
export type SpacingValue = string

export type SemanticSpacingCategory = keyof typeof SEMANTIC_SPACING
export type SemanticSpacingSize = keyof typeof SEMANTIC_SPACING.component

export type ResponsiveSpacingBreakpoint = keyof typeof RESPONSIVE_SPACING
export type ResponsiveSpacingCategory = keyof typeof RESPONSIVE_SPACING.mobile
export type ResponsiveSpacingSize = keyof typeof RESPONSIVE_SPACING.mobile.component

export type SpecialSpacingType = keyof typeof SPECIAL_SPACING
export type TouchTargetSize = keyof typeof SPECIAL_SPACING.touchTarget
export type SidebarWidth = keyof typeof SPECIAL_SPACING.sidebar
export type HeaderHeight = keyof typeof SPECIAL_SPACING.header

export interface SpacingToken {
  value: SpacingValue
  description?: string
  usage?: string[]
}

export interface SpacingConfig {
  margin?: SpacingValue
  padding?: SpacingValue
  gap?: SpacingValue
  marginTop?: SpacingValue
  marginRight?: SpacingValue
  marginBottom?: SpacingValue
  marginLeft?: SpacingValue
  paddingTop?: SpacingValue
  paddingRight?: SpacingValue
  paddingBottom?: SpacingValue
  paddingLeft?: SpacingValue
}

// ============================================================================
// 陰影類型定義
// ============================================================================

export type BaseShadowKey = keyof typeof BASE_SHADOWS
export type ShadowValue = string

export type SemanticShadowComponent = keyof typeof SEMANTIC_SHADOWS
export type SemanticShadowState = keyof typeof SEMANTIC_SHADOWS.card

export type ResponsiveShadowBreakpoint = keyof typeof RESPONSIVE_SHADOWS
export type ResponsiveShadowComponent = keyof typeof RESPONSIVE_SHADOWS.mobile
export type ResponsiveShadowState = keyof typeof RESPONSIVE_SHADOWS.mobile.card

export type SpecialShadowType = keyof typeof SPECIAL_SHADOWS
export type GlowColor = keyof typeof SPECIAL_SHADOWS.glow
export type InsetLevel = keyof typeof SPECIAL_SHADOWS.inset
export type OutlineColor = keyof typeof SPECIAL_SHADOWS.outline
export type LayeredLevel = keyof typeof SPECIAL_SHADOWS.layered

export type ThemeShadowType = 'light'
export type ThemeShadowComponent = keyof typeof THEME_SHADOWS.light
export type ThemeShadowState = keyof typeof THEME_SHADOWS.light.card

export interface ShadowToken {
  value: ShadowValue
  description?: string
  usage?: string[]
}

export interface CustomShadowConfig {
  offsetX?: number
  offsetY?: number
  blurRadius?: number
  spreadRadius?: number
  color?: string
  opacity?: number
  inset?: boolean
}

// ============================================================================
// 邊框半徑類型定義
// ============================================================================

export type BaseBorderRadiusKey = keyof typeof BASE_BORDER_RADIUS
export type BorderRadiusValue = string

export type SemanticBorderRadiusComponent = keyof typeof SEMANTIC_BORDER_RADIUS
export type SemanticBorderRadiusSize = keyof typeof SEMANTIC_BORDER_RADIUS.button

export type ResponsiveBorderRadiusBreakpoint = keyof typeof RESPONSIVE_BORDER_RADIUS
export type ResponsiveBorderRadiusComponent = keyof typeof RESPONSIVE_BORDER_RADIUS.mobile
export type ResponsiveBorderRadiusSize = keyof typeof RESPONSIVE_BORDER_RADIUS.mobile.button

export type SpecialBorderRadiusType = keyof typeof SPECIAL_BORDER_RADIUS
export type AsymmetricDirection = keyof typeof SPECIAL_BORDER_RADIUS.asymmetric
export type AsymmetricSize = keyof typeof SPECIAL_BORDER_RADIUS.asymmetric.topLeft
export type CombinedStyle = keyof typeof SPECIAL_BORDER_RADIUS.combined

export interface BorderRadiusToken {
  value: BorderRadiusValue
  description?: string
  usage?: string[]
}

export interface CustomBorderRadiusConfig {
  topLeft?: string
  topRight?: string
  bottomRight?: string
  bottomLeft?: string
}

// ============================================================================
// 綜合設計Token類型
// ============================================================================

export interface DesignTokens {
  colors: typeof COLOR_TOKENS
  typography: typeof TYPOGRAPHY_TOKENS
  spacing: typeof SPACING_TOKENS
  shadows: typeof SHADOW_TOKENS
  borderRadius: typeof BORDER_RADIUS_TOKENS
}

export interface ComponentTokens {
  button: {
    colors: ThemeColorConfig
    typography: TypographyConfig
    spacing: SpacingConfig
    shadows: Record<string, ShadowValue>
    borderRadius: Record<string, BorderRadiusValue>
  }
  input: {
    colors: ThemeColorConfig
    typography: TypographyConfig
    spacing: SpacingConfig
    shadows: Record<string, ShadowValue>
    borderRadius: Record<string, BorderRadiusValue>
  }
  card: {
    colors: ThemeColorConfig
    typography: TypographyConfig
    spacing: SpacingConfig
    shadows: Record<string, ShadowValue>
    borderRadius: Record<string, BorderRadiusValue>
  }
}

export interface ResponsiveTokens {
  mobile: ComponentTokens
  tablet: ComponentTokens
  desktop: ComponentTokens
}

export interface ThemeTokens {
  light: ComponentTokens
  highContrast: ComponentTokens
}

// ============================================================================
// Token驗證類型
// ============================================================================

export interface TokenValidationRule {
  type: 'required' | 'format' | 'range' | 'enum'
  message: string
  validator?: (value: any) => boolean
  allowedValues?: any[]
  min?: number
  max?: number
}

export interface TokenValidationSchema {
  [tokenPath: string]: TokenValidationRule[]
}

export interface TokenValidationResult {
  isValid: boolean
  errors: Array<{
    path: string
    message: string
    value: any
  }>
}

// ============================================================================
// Token工具類型
// ============================================================================

export interface TokenUtils {
  colors: {
    getThemeColor: (theme: ThemeType, category: string, variant: string) => ColorValue
    isDarkColor: (color: ColorValue) => boolean
    withOpacity: (color: ColorValue, opacity: number) => ColorValue
  }
  typography: {
    getResponsiveTypography: (breakpoint: ResponsiveBreakpoint, variant: TypographyVariant) => TypographyConfig
    generateFontCSS: (config: Partial<TypographyConfig>) => string
    remToPx: (remValue: string, baseFontSize?: number) => number
    calculateOptimalLineHeight: (fontSize: string) => string
  }
  spacing: {
    getResponsiveSpacing: (breakpoint: ResponsiveSpacingBreakpoint, category: ResponsiveSpacingCategory, size: ResponsiveSpacingSize) => SpacingValue
    remToPx: (remValue: string, baseFontSize?: number) => number
    pxToRem: (pxValue: number, baseFontSize?: number) => string
    generateSpacingCSS: (config: SpacingConfig) => string
    calculateOptimalSpacing: (contentSize: 'small' | 'medium' | 'large') => string
  }
  shadows: {
    getResponsiveShadow: (breakpoint: ResponsiveShadowBreakpoint, component: ResponsiveShadowComponent, state: string) => ShadowValue
    getThemeShadow: (theme: ThemeShadowType, component: ThemeShadowComponent, state: string) => ShadowValue
    combineShadows: (...shadows: string[]) => string
    adjustShadowOpacity: (shadow: string, opacity: number) => string
    createCustomShadow: (config: CustomShadowConfig) => string
  }
  borderRadius: {
    getResponsiveBorderRadius: (breakpoint: ResponsiveBorderRadiusBreakpoint, component: ResponsiveBorderRadiusComponent, size: ResponsiveBorderRadiusSize) => BorderRadiusValue
    remToPx: (remValue: string, baseFontSize?: number) => number
    pxToRem: (pxValue: number, baseFontSize?: number) => string
    createCustomBorderRadius: (config: CustomBorderRadiusConfig) => string
    isCircular: (borderRadius: string) => boolean
    recommendBorderRadius: (componentSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => string
    scaleBorderRadius: (borderRadius: string, scale: number) => string
  }
}

// ============================================================================
// 導出所有類型
// ============================================================================

export type {
  // 重新導出所有Token常量的類型
  COLOR_TOKENS,
  TYPOGRAPHY_TOKENS,
  SPACING_TOKENS,
  SHADOW_TOKENS,
  BORDER_RADIUS_TOKENS
}
