import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCategoryColors } from '../useCategoryColors'
import { categoryService } from '@/services/categoryService'

// Mock the categoryService
vi.mock('@/services/categoryService', () => ({
  categoryService: {
    getCategories: vi.fn()
  }
}))

describe('useCategoryColors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should load categories successfully', async () => {
    const mockCategories = [
      { name: '數學', color: '#3B82F6' },
      { name: '英文', color: '#10B981' }
    ]

    vi.mocked(categoryService.getCategories).mockResolvedValue(mockCategories)

    const { loadCategories, categories } = useCategoryColors()

    await loadCategories()

    expect(categories.value).toEqual(mockCategories)
  })

  it('should return correct color for category', async () => {
    const mockCategories = [
      { name: '數學', color: '#3B82F6' },
      { name: '英文', color: '#10B981' }
    ]

    vi.mocked(categoryService.getCategories).mockResolvedValue(mockCategories)

    const { loadCategories, getCategoryColor } = useCategoryColors()

    await loadCategories()

    expect(getCategoryColor('數學')).toBe('#3B82F6')
    expect(getCategoryColor('英文')).toBe('#10B981')
    expect(getCategoryColor('不存在的分類')).toBe('#6B7280') // 預設顏色
  })

  it('should return correct styles for category', async () => {
    const mockCategories = [
      { name: '數學', color: '#3B82F6' }
    ]

    vi.mocked(categoryService.getCategories).mockResolvedValue(mockCategories)

    const { loadCategories, getCategoryStyles } = useCategoryColors()

    await loadCategories()

    const styles = getCategoryStyles('數學')

    expect(styles).toEqual({
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderLeftColor: '#3B82F6',
      color: '#3B82F6'
    })
  })

  it('should use default categories on error', async () => {
    vi.mocked(categoryService.getCategories).mockRejectedValue(new Error('Failed to load'))

    const { loadCategories, categories } = useCategoryColors()

    await loadCategories()

    // 應該使用預設分類
    expect(categories.value.length).toBeGreaterThan(0)
    expect(categories.value.some(cat => cat.name === '數學')).toBe(true)
  })

})
