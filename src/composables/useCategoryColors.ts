import { ref, computed } from 'vue'
import { categoryService } from '@/services/categoryService'
import type { CourseCategory } from '@/services/categoryService'

const categoriesCache = ref<CourseCategory[]>([])
const isLoading = ref(false)
const lastFetchTime = ref(0)

export function useCategoryColors() {
  // 緩存5分鐘
  const CACHE_DURATION = 5 * 60 * 1000

  const loadCategories = async (forceRefresh = false) => {
    const now = Date.now()

    // 如果有緩存且未過期，且不是強制刷新，則使用緩存
    if (categoriesCache.value.length > 0 &&
        now - lastFetchTime.value < CACHE_DURATION &&
        !forceRefresh) {
      return
    }

    isLoading.value = true
    try {
      const categories = await categoryService.getCategories()
      categoriesCache.value = categories
      lastFetchTime.value = now
    } catch (error) {
      console.error('載入分類失敗:', error)
      // 如果載入失敗，使用預設分類
      categoriesCache.value = [
        { name: '數學', color: '#3B82F6' },
        { name: '英文', color: '#10B981' },
        { name: '程式設計', color: '#8B5CF6' },
        { name: '繪畫', color: '#F59E0B' },
        { name: '音樂', color: '#EF4444' },
        { name: '其他', color: '#6B7280' }
      ]
    } finally {
      isLoading.value = false
    }
  }

  const getCategoryColor = (categoryName: string): string => {
    if (!categoryName) return '#6B7280' // 預設灰色

    const category = categoriesCache.value.find(cat => cat.name === categoryName)
    return category?.color || '#6B7280'
  }

  const getCategoryColorClass = (categoryName: string): string => {
    const color = getCategoryColor(categoryName)

    // 將十六進制顏色轉換為 Tailwind CSS 類別
    // 這裡我們使用內聯樣式，因為顏色是動態的
    return ''
  }

  const getCategoryStyles = (categoryName: string) => {
    const color = getCategoryColor(categoryName)

    // 將十六進制顏色轉換為 RGB 以便創建透明度變化
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 107, g: 114, b: 128 } // 預設灰色
    }

    const rgb = hexToRgb(color)

    return {
      backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
      borderLeftColor: color,
      color
    }
  }

  const categories = computed(() => categoriesCache.value)

  return {
    categories,
    isLoading,
    loadCategories,
    getCategoryColor,
    getCategoryColorClass,
    getCategoryStyles
  }
}
