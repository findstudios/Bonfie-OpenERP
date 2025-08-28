/**
 * 課程分類服務
 * 提供課程分類相關的操作
 */

import { supabase } from './supabase'

export interface CourseCategory {
  id?: string
  name: string
  description?: string
  color?: string
  is_active?: boolean
}

class CategoryService {
  /**
   * 獲取所有課程分類
   */
  async getCategories(): Promise<CourseCategory[]> {
    try {
      const { data, error } = await supabase
        .from('tutoring_center_settings')
        .select('setting_value')
        .eq('setting_key', 'course_categories')
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        throw error
      }

      if (data?.setting_value && Array.isArray(data.setting_value)) {
        return data.setting_value.filter((cat: CourseCategory) => cat.is_active !== false)
      }

      // 沒有設定時返回空陣列
      return []
    } catch (error) {
      console.error('載入課程分類失敗:', error)
      // 錯誤時也返回空陣列
      return []
    }
  }

  /**
   * 根據分類名稱獲取分類資訊
   */
  async getCategoryByName(name: string): Promise<CourseCategory | null> {
    const categories = await this.getCategories()
    return categories.find(cat => cat.name === name) || null
  }

  /**
   * 獲取分類選項列表（用於表單選擇）
   */
  async getCategoryOptions(): Promise<{ value: string; label: string; color?: string }[]> {
    const categories = await this.getCategories()
    return categories.map(cat => ({
      value: cat.name,
      label: cat.name,
      color: cat.color
    }))
  }
}

// 導出單例
export const categoryService = new CategoryService()
