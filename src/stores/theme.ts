import { defineStore } from 'pinia'
import { ref, computed, reactive, watch } from 'vue'
import { THEME_COLORS } from '@/tokens/colors'

// 主題類型定義
export type ThemeType = 'light' | 'auto'
export type EffectiveThemeType = 'light' | 'high-contrast'

// 主題偏好設置介面
export interface ThemePreferences {
  theme: ThemeType
  autoDetectSystemTheme: boolean
  highContrast: boolean
  reducedMotion: boolean
  fontSize: 'small' | 'medium' | 'large'
  density: 'compact' | 'comfortable' | 'spacious'
}

// 系統主題狀態介面
export interface SystemThemeState {
  prefersHighContrast: boolean
  prefersReducedMotion: boolean
}

// 默認主題偏好設置
const defaultPreferences: ThemePreferences = {
  theme: 'auto',
  autoDetectSystemTheme: true,
  highContrast: false,
  reducedMotion: false,
  fontSize: 'medium',
  density: 'comfortable'
}

export const useThemeStore = defineStore('theme', () => {
  // 主題狀態
  const currentTheme = ref<ThemeType>('auto')
  const systemTheme = ref<'light'>('light')
  const preferences = reactive<ThemePreferences>({ ...defaultPreferences })

  // 系統主題狀態
  const systemState = reactive<SystemThemeState>({
    prefersHighContrast: false,
    prefersReducedMotion: false
  })

  // 可用主題列表
  const availableThemes = computed(() => [
    { value: 'light', label: '淺色模式', icon: 'sun' },
    { value: 'auto', label: '跟隨系統', icon: 'computer-desktop' }
  ] as const)

  // 計算有效主題
  const effectiveTheme = computed<EffectiveThemeType>(() => {
    // 如果啟用高對比度，優先返回高對比度主題
    if (preferences.highContrast || systemState.prefersHighContrast) {
      return 'high-contrast'
    }

    // 根據當前主題設置決定有效主題
    switch (currentTheme.value) {
      case 'light':
        return 'light'
      case 'auto':
        return 'light'
      default:
        return 'light'
    }
  })

  // 主題切換方法
  function setTheme(theme: ThemeType) {
    currentTheme.value = theme
    preferences.theme = theme
    savePreferences()
  }

  function toggleTheme() {
    const currentEffective = effectiveTheme.value
    if (currentEffective === 'light') {
      setTheme('light')
    } else {
      // 高對比度模式下，切換到淺色模式
      setTheme('light')
    }
  }

  function toggleHighContrast() {
    preferences.highContrast = !preferences.highContrast
    savePreferences()
  }

  function toggleReducedMotion() {
    preferences.reducedMotion = !preferences.reducedMotion
    savePreferences()
  }

  // 更新系統主題狀態
  function updateSystemTheme() {
    systemTheme.value = 'light'
  }

  function updateSystemPreferences(state: Partial<SystemThemeState>) {
    Object.assign(systemState, state)
  }

  // 偏好設置管理
  function updatePreferences(newPreferences: Partial<ThemePreferences>) {
    Object.assign(preferences, newPreferences)

    // 如果主題設置改變，更新當前主題
    if (newPreferences.theme) {
      currentTheme.value = newPreferences.theme
    }

    savePreferences()
  }

  function resetToDefaults() {
    Object.assign(preferences, defaultPreferences)
    currentTheme.value = defaultPreferences.theme
    savePreferences()
  }

  // 獲取主題顏色
  function getThemeColor(category: string, variant: string): string {
    const theme = effectiveTheme.value === 'high-contrast' ? 'highContrast' : 'light'
    const themeColors = THEME_COLORS[theme as keyof typeof THEME_COLORS] as any
    return themeColors[category]?.[variant] || ''
  }

  // 獲取主題配置
  function getThemeConfig() {
    const theme = effectiveTheme.value === 'high-contrast' ? 'highContrast' : 'light'
    return THEME_COLORS[theme as keyof typeof THEME_COLORS]
  }

  // 持久化相關
  const STORAGE_KEY = 'tutoring-center-theme-preferences'

  function savePreferences() {
    try {
      const dataToSave = {
        theme: currentTheme.value,
        preferences: { ...preferences }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
    } catch (error) {
      console.warn('Failed to save theme preferences:', error)
    }
  }

  function loadPreferences() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)

        // 恢復主題設置
        if (data.theme) {
          currentTheme.value = data.theme
        }

        // 恢復偏好設置
        if (data.preferences) {
          Object.assign(preferences, { ...defaultPreferences, ...data.preferences })
        }
      }
    } catch (error) {
      console.warn('Failed to load theme preferences:', error)
      // 如果載入失敗，使用默認設置
      resetToDefaults()
    }
  }

  function clearPreferences() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear theme preferences:', error)
    }
  }

  // 初始化系統主題檢測
  function initializeSystemThemeDetection() {
    if (typeof window === 'undefined') return

    const highContrastQuery = window.matchMedia('(prefers-contrast: high)')
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    // 初始化狀態
    updateSystemTheme()
    updateSystemPreferences({
      prefersHighContrast: highContrastQuery.matches,
      prefersReducedMotion: reducedMotionQuery.matches
    })

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      updateSystemPreferences({ prefersHighContrast: e.matches })
    }

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      updateSystemPreferences({ prefersReducedMotion: e.matches })
    }

    // 添加事件監聽器 - 使用現代API
    highContrastQuery.addEventListener('change', handleHighContrastChange)
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange)

    // 返回清理函數
    return () => {
      highContrastQuery.removeEventListener('change', handleHighContrastChange)
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange)
    }
  }

  // 初始化
  function initialize() {
    // 載入保存的偏好設置
    loadPreferences()

    // 初始化系統主題檢測
    const cleanup = initializeSystemThemeDetection()

    // 監聽有效主題變化，自動應用到DOM
    watch(effectiveTheme, (newTheme) => {
      applyThemeToDOM(newTheme)
    }, { immediate: true })

    // 監聽減少動畫偏好變化
    watch(() => preferences.reducedMotion, (reducedMotion) => {
      applyReducedMotionToDOM(reducedMotion || systemState.prefersReducedMotion)
    }, { immediate: true })

    return cleanup
  }

  // 應用主題到DOM
  function applyThemeToDOM(theme: EffectiveThemeType) {
    if (typeof document === 'undefined') return

    // 設置data-theme屬性
    document.documentElement.setAttribute('data-theme', theme)

    // 移除舊的主題類別
    document.documentElement.classList.remove('theme-light', 'theme-high-contrast')

    // 添加新的主題類別
    document.documentElement.classList.add(`theme-${theme}`)
  }

  // 應用減少動畫設置到DOM
  function applyReducedMotionToDOM(reducedMotion: boolean) {
    if (typeof document === 'undefined') return

    if (reducedMotion) {
      document.documentElement.classList.add('reduced-motion')
    } else {
      document.documentElement.classList.remove('reduced-motion')
    }
  }

  // 生成主題CSS變數
  function generateThemeCSSVariables(): string {
    const themeConfig = getThemeConfig()
    const cssVars: string[] = []

    // 生成背景顏色變數
    Object.entries(themeConfig.background).forEach(([key, value]) => {
      cssVars.push(`--color-bg-${key}: ${value};`)
    })

    // 生成文字顏色變數
    Object.entries(themeConfig.text).forEach(([key, value]) => {
      cssVars.push(`--color-text-${key}: ${value};`)
    })

    // 生成邊框顏色變數
    Object.entries(themeConfig.border).forEach(([key, value]) => {
      cssVars.push(`--color-border-${key}: ${value};`)
    })

    // 生成表面顏色變數
    Object.entries(themeConfig.surface).forEach(([key, value]) => {
      cssVars.push(`--color-surface-${key}: ${value};`)
    })

    return cssVars.join('\n')
  }

  return {
    // 狀態
    currentTheme,
    systemTheme,
    preferences,
    systemState,

    // 計算屬性
    availableThemes,
    effectiveTheme,

    // 主題切換方法
    setTheme,
    toggleTheme,
    toggleHighContrast,
    toggleReducedMotion,

    // 系統主題更新
    updateSystemTheme,
    updateSystemPreferences,

    // 偏好設置管理
    updatePreferences,
    resetToDefaults,

    // 主題顏色獲取
    getThemeColor,
    getThemeConfig,

    // 持久化
    savePreferences,
    loadPreferences,
    clearPreferences,

    // 初始化和DOM操作
    initialize,
    initializeSystemThemeDetection,
    applyThemeToDOM,
    applyReducedMotionToDOM,
    generateThemeCSSVariables
  }
})
