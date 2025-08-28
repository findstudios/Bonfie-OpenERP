/**
 * Design Token Validation System
 * 設計Token驗證系統，確保Token值的正確性和一致性
 */

import type {
  TokenValidationRule,
  TokenValidationSchema,
  TokenValidationResult,
  ColorValue,
  SpacingValue,
  ShadowValue,
  BorderRadiusValue,
  TypographyConfig
} from './types'

// ============================================================================
// 驗證規則定義
// ============================================================================

export const TOKEN_VALIDATION_SCHEMA: TokenValidationSchema = {
  // 顏色驗證規則
  'colors.primary.*': [
    {
      type: 'required',
      message: '主色調不能為空'
    },
    {
      type: 'format',
      message: '顏色格式必須為有效的十六進制、RGB或RGBA值',
      validator: (value: string) => isValidColor(value)
    }
  ],

  'colors.neutral.*': [
    {
      type: 'required',
      message: '中性色不能為空'
    },
    {
      type: 'format',
      message: '顏色格式必須為有效的十六進制、RGB或RGBA值',
      validator: (value: string) => isValidColor(value)
    }
  ],

  'colors.semantic.*.*': [
    {
      type: 'required',
      message: '語義化顏色不能為空'
    },
    {
      type: 'format',
      message: '顏色格式必須為有效的十六進制、RGB或RGBA值',
      validator: (value: string) => isValidColor(value)
    }
  ],

  // 字體驗證規則
  'typography.fontSizes.*': [
    {
      type: 'required',
      message: '字體大小不能為空'
    },
    {
      type: 'format',
      message: '字體大小必須為有效的CSS單位（rem、px、em等）',
      validator: (value: string) => isValidCSSUnit(value)
    },
    {
      type: 'range',
      message: '字體大小應在0.5rem到10rem之間',
      min: 0.5,
      max: 10,
      validator: (value: string) => {
        const numValue = parseFloat(value.replace('rem', ''))
        return numValue >= 0.5 && numValue <= 10
      }
    }
  ],

  'typography.fontWeights.*': [
    {
      type: 'required',
      message: '字體權重不能為空'
    },
    {
      type: 'range',
      message: '字體權重應在100到900之間',
      min: 100,
      max: 900
    },
    {
      type: 'enum',
      message: '字體權重必須是100的倍數',
      allowedValues: [100, 200, 300, 400, 500, 600, 700, 800, 900]
    }
  ],

  'typography.lineHeights.*': [
    {
      type: 'required',
      message: '行高不能為空'
    },
    {
      type: 'format',
      message: '行高必須為有效的數值或CSS單位',
      validator: (value: string) => isValidLineHeight(value)
    }
  ],

  // 間距驗證規則
  'spacing.base.*': [
    {
      type: 'required',
      message: '基礎間距不能為空'
    },
    {
      type: 'format',
      message: '間距必須為有效的CSS單位（rem、px等）',
      validator: (value: string) => isValidCSSUnit(value) || value === '0'
    }
  ],

  // 陰影驗證規則
  'shadows.base.*': [
    {
      type: 'required',
      message: '陰影值不能為空'
    },
    {
      type: 'format',
      message: '陰影必須為有效的CSS box-shadow值',
      validator: (value: string) => isValidBoxShadow(value)
    }
  ],

  // 邊框半徑驗證規則
  'borderRadius.base.*': [
    {
      type: 'required',
      message: '邊框半徑不能為空'
    },
    {
      type: 'format',
      message: '邊框半徑必須為有效的CSS單位',
      validator: (value: string) => isValidCSSUnit(value) || value === '0' || value === '9999px'
    }
  ]
}

// ============================================================================
// 驗證工具函數
// ============================================================================

/**
 * 驗證顏色格式
 */
function isValidColor(color: string): boolean {
  // 十六進制顏色
  const hexRegex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/
  if (hexRegex.test(color)) return true

  // RGB/RGBA顏色
  const rgbRegex = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/
  if (rgbRegex.test(color)) {
    const matches = color.match(rgbRegex)
    if (matches) {
      const [, r, g, b, a] = matches
      const red = parseInt(r)
      const green = parseInt(g)
      const blue = parseInt(b)
      const alpha = a ? parseFloat(a) : 1

      return red >= 0 && red <= 255 &&
             green >= 0 && green <= 255 &&
             blue >= 0 && blue <= 255 &&
             alpha >= 0 && alpha <= 1
    }
  }

  // HSL/HSLA顏色
  const hslRegex = /^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d.]+))?\s*\)$/
  if (hslRegex.test(color)) {
    const matches = color.match(hslRegex)
    if (matches) {
      const [, h, s, l, a] = matches
      const hue = parseInt(h)
      const saturation = parseInt(s)
      const lightness = parseInt(l)
      const alpha = a ? parseFloat(a) : 1

      return hue >= 0 && hue <= 360 &&
             saturation >= 0 && saturation <= 100 &&
             lightness >= 0 && lightness <= 100 &&
             alpha >= 0 && alpha <= 1
    }
  }

  // CSS顏色關鍵字
  const colorKeywords = [
    'transparent', 'currentColor', 'inherit', 'initial', 'unset',
    'black', 'white', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta',
    'gray', 'grey', 'darkgray', 'darkgrey', 'lightgray', 'lightgrey'
  ]

  return colorKeywords.includes(color.toLowerCase())
}

/**
 * 驗證CSS單位
 */
function isValidCSSUnit(value: string): boolean {
  if (value === '0') return true

  const cssUnitRegex = /^-?[\d.]+(?:px|em|rem|%|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc)$/
  return cssUnitRegex.test(value)
}

/**
 * 驗證行高
 */
function isValidLineHeight(value: string): boolean {
  // 數值行高（如 1.5）
  const numberRegex = /^[\d.]+$/
  if (numberRegex.test(value)) {
    const numValue = parseFloat(value)
    return numValue >= 0.5 && numValue <= 3
  }

  // CSS單位行高
  return isValidCSSUnit(value)
}

/**
 * 驗證box-shadow值
 */
function isValidBoxShadow(value: string): boolean {
  if (value === 'none' || value === 'inherit' || value === 'initial' || value === 'unset') {
    return true
  }

  // 簡單的box-shadow格式驗證
  const shadowRegex = /^(?:inset\s+)?(?:-?[\d.]+(?:px|em|rem)\s+){2,4}(?:rgba?\([^)]+\)|#[A-Fa-f0-9]{3,8}|[a-zA-Z]+)(?:\s*,\s*(?:inset\s+)?(?:-?[\d.]+(?:px|em|rem)\s+){2,4}(?:rgba?\([^)]+\)|#[A-Fa-f0-9]{3,8}|[a-zA-Z]+))*$/
  return shadowRegex.test(value.trim())
}

// ============================================================================
// 主要驗證函數
// ============================================================================

/**
 * 驗證單個Token值
 */
export function validateTokenValue(
  path: string,
  value: any,
  rules: TokenValidationRule[]
): Array<{ message: string; value: any }> {
  const errors: Array<{ message: string; value: any }> = []

  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '') {
          errors.push({ message: rule.message, value })
        }
        break

      case 'format':
        if (rule.validator && !rule.validator(value)) {
          errors.push({ message: rule.message, value })
        }
        break

      case 'range':
        if (typeof value === 'number') {
          if ((rule.min !== undefined && value < rule.min) ||
              (rule.max !== undefined && value > rule.max)) {
            errors.push({ message: rule.message, value })
          }
        } else if (rule.validator && !rule.validator(value)) {
          errors.push({ message: rule.message, value })
        }
        break

      case 'enum':
        if (rule.allowedValues && !rule.allowedValues.includes(value)) {
          errors.push({ message: rule.message, value })
        }
        break
    }
  }

  return errors
}

/**
 * 驗證Token對象
 */
export function validateTokens(
  tokens: Record<string, any>,
  schema: TokenValidationSchema = TOKEN_VALIDATION_SCHEMA
): TokenValidationResult {
  const errors: Array<{ path: string; message: string; value: any }> = []

  function validateObject(obj: any, currentPath: string = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = currentPath ? `${currentPath}.${key}` : key

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        validateObject(value, fullPath)
      } else {
        // 查找匹配的驗證規則
        const matchingRules = findMatchingRules(fullPath, schema)
        if (matchingRules.length > 0) {
          const tokenErrors = validateTokenValue(fullPath, value, matchingRules)
          errors.push(...tokenErrors.map(error => ({
            path: fullPath,
            message: error.message,
            value: error.value
          })))
        }
      }
    }
  }

  validateObject(tokens)

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 查找匹配的驗證規則
 */
function findMatchingRules(path: string, schema: TokenValidationSchema): TokenValidationRule[] {
  const rules: TokenValidationRule[] = []

  for (const [pattern, patternRules] of Object.entries(schema)) {
    if (matchesPattern(path, pattern)) {
      rules.push(...patternRules)
    }
  }

  return rules
}

/**
 * 檢查路徑是否匹配模式
 */
function matchesPattern(path: string, pattern: string): boolean {
  // 將模式轉換為正則表達式
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '[^.]+')
    .replace(/\*\*/g, '.*')

  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(path)
}

// ============================================================================
// 特定Token類型的驗證函數
// ============================================================================

/**
 * 驗證顏色Token
 */
export function validateColorToken(color: ColorValue): boolean {
  return isValidColor(color)
}

/**
 * 驗證字體配置
 */
export function validateTypographyConfig(config: TypographyConfig): Array<string> {
  const errors: string[] = []

  if (!isValidCSSUnit(config.fontSize)) {
    errors.push('字體大小格式無效')
  }

  if (!isValidLineHeight(config.lineHeight)) {
    errors.push('行高格式無效')
  }

  if (config.fontWeight < 100 || config.fontWeight > 900 || config.fontWeight % 100 !== 0) {
    errors.push('字體權重必須是100到900之間的100的倍數')
  }

  if (!isValidCSSUnit(config.letterSpacing) && config.letterSpacing !== '0em') {
    errors.push('字母間距格式無效')
  }

  return errors
}

/**
 * 驗證間距Token
 */
export function validateSpacingToken(spacing: SpacingValue): boolean {
  return isValidCSSUnit(spacing) || spacing === '0'
}

/**
 * 驗證陰影Token
 */
export function validateShadowToken(shadow: ShadowValue): boolean {
  return isValidBoxShadow(shadow)
}

/**
 * 驗證邊框半徑Token
 */
export function validateBorderRadiusToken(borderRadius: BorderRadiusValue): boolean {
  return isValidCSSUnit(borderRadius) || borderRadius === '0' || borderRadius === '9999px'
}

// ============================================================================
// 驗證報告生成
// ============================================================================

/**
 * 生成驗證報告
 */
export function generateValidationReport(result: TokenValidationResult): string {
  if (result.isValid) {
    return '✅ 所有Token驗證通過'
  }

  const report = ['❌ Token驗證失敗:', '']

  // 按路徑分組錯誤
  const errorsByPath = result.errors.reduce((acc, error) => {
    if (!acc[error.path]) {
      acc[error.path] = []
    }
    acc[error.path].push(error)
    return acc
  }, {} as Record<string, typeof result.errors>)

  for (const [path, errors] of Object.entries(errorsByPath)) {
    report.push(`路徑: ${path}`)
    for (const error of errors) {
      report.push(`  - ${error.message} (值: ${JSON.stringify(error.value)})`)
    }
    report.push('')
  }

  report.push(`總計: ${result.errors.length} 個錯誤`)

  return report.join('\n')
}

// ============================================================================
// 導出驗證工具
// ============================================================================

export const tokenValidation = {
  validateTokens,
  validateTokenValue,
  validateColorToken,
  validateTypographyConfig,
  validateSpacingToken,
  validateShadowToken,
  validateBorderRadiusToken,
  generateValidationReport,

  // 驗證工具函數
  utils: {
    isValidColor,
    isValidCSSUnit,
    isValidLineHeight,
    isValidBoxShadow
  }
}
