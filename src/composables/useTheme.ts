import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useThemeStore } from '@/stores/theme'

/**
 * 主題管理 composable
 * 提供主題切換、持久化和響應式更新功能
 */
export function useTheme() {
  const themeStore = useThemeStore()

  // 主題狀態
  const currentTheme = computed(() => themeStore.currentTheme)
  const availableThemes = computed(() => themeStore.availableThemes)
  const systemTheme = computed(() => themeStore.systemTheme)
  const effectiveTheme = computed(() => themeStore.effectiveTheme)

  // 主題偏好設置
  const preferences = computed(() => themeStore.preferences)
  const autoDetectSystemTheme = computed(() => themeStore.preferences.autoDetectSystemTheme)
  const highContrast = computed(() => themeStore.preferences.highContrast)
  const reducedMotion = computed(() => themeStore.preferences.reducedMotion)

  // 主題切換方法
  const setTheme = (theme: 'light' | 'auto') => {
    themeStore.setTheme(theme)
  }

  const toggleTheme = () => {
    themeStore.toggleTheme()
  }

  const toggleHighContrast = () => {
    themeStore.toggleHighContrast()
  }

  const toggleReducedMotion = () => {
    themeStore.toggleReducedMotion()
  }

  // 偏好設置更新
  const updatePreferences = (newPreferences: Partial<typeof preferences.value>) => {
    themeStore.updatePreferences(newPreferences)
  }

  // 重置為默認設置
  const resetToDefaults = () => {
    themeStore.resetToDefaults()
  }

  // 獲取當前主題的顏色值
  const getThemeColor = (category: string, variant: string) => {
    return themeStore.getThemeColor(category, variant)
  }

  // 檢查是否為深色主題 - 已移除深色模式支持
  const isDarkTheme = computed(() => {
    return false
  })

  // 檢查是否為淺色主題
  const isLightTheme = computed(() => {
    return effectiveTheme.value === 'light'
  })

  // 檢查是否為高對比度模式
  const isHighContrast = computed(() => {
    return effectiveTheme.value === 'high-contrast'
  })

  // 初始化主題系統
  const initialize = () => {
    return themeStore.initialize()
  }

  // 生成主題CSS變數
  const generateThemeCSSVariables = () => {
    return themeStore.generateThemeCSSVariables()
  }

  return {
    // 狀態
    currentTheme,
    availableThemes,
    systemTheme,
    effectiveTheme,
    preferences,
    autoDetectSystemTheme,
    highContrast,
    reducedMotion,

    // 計算屬性
    isDarkTheme,
    isLightTheme,
    isHighContrast,

    // 方法
    setTheme,
    toggleTheme,
    toggleHighContrast,
    toggleReducedMotion,
    updatePreferences,
    resetToDefaults,
    getThemeColor,
    initialize,
    generateThemeCSSVariables
  }
}

/**
 * 系統主題檢測 composable
 */
export function useSystemTheme() {
  const systemTheme = ref<'light'>('light')
  const highContrast = ref(false)
  const reducedMotion = ref(false)

  let highContrastQuery: MediaQueryList | null = null
  let reducedMotionQuery: MediaQueryList | null = null

  const updateSystemTheme = () => {
    if (typeof window === 'undefined') return

    // 檢測高對比度偏好
    if (highContrastQuery) {
      highContrast.value = highContrastQuery.matches
    }

    // 檢測減少動畫偏好
    if (reducedMotionQuery) {
      reducedMotion.value = reducedMotionQuery.matches
    }
  }

  const handleHighContrastChange = (e: MediaQueryListEvent) => {
    highContrast.value = e.matches
  }

  const handleReducedMotionChange = (e: MediaQueryListEvent) => {
    reducedMotion.value = e.matches
  }

  onMounted(() => {
    if (typeof window === 'undefined') return

    // 設置媒體查詢監聽器
    highContrastQuery = window.matchMedia('(prefers-contrast: high)')
    reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    // 初始化狀態
    updateSystemTheme()

    // 添加事件監聽器 - 優先使用現代API
    highContrastQuery?.addEventListener('change', handleHighContrastChange)
    reducedMotionQuery?.addEventListener('change', handleReducedMotionChange)
  })

  onUnmounted(() => {
    // 清理事件監聽器
    if (highContrastQuery) {
      highContrastQuery?.removeEventListener('change', handleHighContrastChange)
      reducedMotionQuery?.removeEventListener('change', handleReducedMotionChange)
    }
  })

  return {
    systemTheme,
    highContrast,
    reducedMotion,
    updateSystemTheme
  }
}

/**
 * 主題持久化 composable
 */
export function useThemePersistence() {
  const STORAGE_KEY = 'tutoring-center-theme-preferences'

  const savePreferences = (preferences: any) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch (error) {
      console.warn('Failed to save theme preferences to localStorage:', error)
    }
  }

  const loadPreferences = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.warn('Failed to load theme preferences from localStorage:', error)
      return null
    }
  }

  const clearPreferences = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear theme preferences from localStorage:', error)
    }
  }

  return {
    savePreferences,
    loadPreferences,
    clearPreferences
  }
}

/**
 * 主題CSS類別管理 composable
 */
export function useThemeClasses() {
  const { effectiveTheme, highContrast, reducedMotion } = useTheme()

  // 根據當前主題生成CSS類別
  const themeClasses = computed(() => {
    const classes: string[] = []

    // 主題類別
    classes.push(`theme-${effectiveTheme.value}`)

    // 高對比度類別
    if (highContrast.value) {
      classes.push('high-contrast')
    }

    // 減少動畫類別
    if (reducedMotion.value) {
      classes.push('reduced-motion')
    }

    return classes.join(' ')
  })

  // 應用主題到document元素
  const applyThemeToDocument = () => {
    if (typeof document === 'undefined') return

    // 設置data-theme屬性
    document.documentElement.setAttribute('data-theme', effectiveTheme.value)

    // 設置CSS類別
    document.documentElement.className = document.documentElement.className
      .replace(/theme-\w+/g, '')
      .replace(/high-contrast/g, '')
      .replace(/reduced-motion/g, '')
      .trim()

    if (themeClasses.value) {
      document.documentElement.className += ` ${themeClasses.value}`
    }
  }

  // 監聽主題變化並自動應用
  watch([effectiveTheme, highContrast, reducedMotion], applyThemeToDocument, {
    immediate: true
  })

  onMounted(() => {
    applyThemeToDocument()
  })

  return {
    themeClasses,
    applyThemeToDocument
  }
}

/**
 * 主題顏色工具 composable
 */
export function useThemeColors() {
  const { effectiveTheme, getThemeColor } = useTheme()

  // 常用顏色的便捷訪問器
  const colors = computed(() => ({
    // 背景顏色
    background: {
      primary: getThemeColor('background', 'primary'),
      secondary: getThemeColor('background', 'secondary'),
      tertiary: getThemeColor('background', 'tertiary'),
      elevated: getThemeColor('background', 'elevated'),
      overlay: getThemeColor('background', 'overlay')
    },

    // 文字顏色
    text: {
      primary: getThemeColor('text', 'primary'),
      secondary: getThemeColor('text', 'secondary'),
      tertiary: getThemeColor('text', 'tertiary'),
      disabled: getThemeColor('text', 'disabled'),
      inverse: getThemeColor('text', 'inverse'),
      link: getThemeColor('text', 'link'),
      linkHover: getThemeColor('text', 'linkHover')
    },

    // 邊框顏色
    border: {
      primary: getThemeColor('border', 'primary'),
      secondary: getThemeColor('border', 'secondary'),
      focus: getThemeColor('border', 'focus'),
      error: getThemeColor('border', 'error'),
      success: getThemeColor('border', 'success')
    },

    // 表面顏色
    surface: {
      primary: getThemeColor('surface', 'primary'),
      secondary: getThemeColor('surface', 'secondary'),
      tertiary: getThemeColor('surface', 'tertiary'),
      hover: getThemeColor('surface', 'hover'),
      pressed: getThemeColor('surface', 'pressed'),
      selected: getThemeColor('surface', 'selected'),
      disabled: getThemeColor('surface', 'disabled')
    }
  }))

  // 生成CSS變數字符串
  const generateCSSVariables = () => {
    const vars: string[] = []

    Object.entries(colors.value).forEach(([category, categoryColors]) => {
      Object.entries(categoryColors).forEach(([variant, color]) => {
        vars.push(`--color-${category}-${variant}: ${color};`)
      })
    })

    return vars.join('\n')
  }

  return {
    colors,
    generateCSSVariables
  }
}
