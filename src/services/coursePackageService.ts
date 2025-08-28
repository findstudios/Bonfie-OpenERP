import { supabase } from './supabase'
import type { CoursePackage } from '@/types'

/**
 * 課程套餐服務
 * 管理常態課程的套餐方案，包含新增、修改、刪除等功能
 */
export const coursePackageService = {
  /**
   * 取得指定課程的所有有效套餐
   * @param courseId - 課程 ID
   * @returns 套餐列表
   */
  async getPackagesByCourse(courseId: string): Promise<CoursePackage[]> {
    const { data, error } = await supabase
      .from('course_packages')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('session_count', { ascending: true })

    if (error) {
      console.error('Error fetching course packages:', error)
      throw error
    }

    return data || []
  },

  /**
   * 取得指定課程的所有套餐（別名方法，為了相容性）
   * @param courseId - 課程 ID
   * @returns 套餐列表
   */
  async getCoursePackages(courseId: string): Promise<CoursePackage[]> {
    return this.getPackagesByCourse(courseId)
  },

  async getPackageById(packageId: string): Promise<CoursePackage | null> {
    const { data, error } = await supabase
      .from('course_packages')
      .select('*')
      .eq('package_id', packageId)
      .single()

    if (error) {
      console.error('Error fetching package:', error)
      return null
    }

    return data
  },

  /**
   * 建立新套餐
   * @param packageData - 套餐資料
   * @returns 建立的套餐
   */
  async createPackage(packageData: Partial<CoursePackage>): Promise<CoursePackage> {
    const { data, error } = await supabase
      .from('course_packages')
      .insert([packageData])
      .select()
      .single()

    if (error) {
      console.error('Error creating package:', error)
      throw error
    }

    return data
  },

  /**
   * 更新套餐資料
   * @param packageId - 套餐 ID
   * @param updates - 要更新的欄位
   * @returns 更新後的套餐
   */
  async updatePackage(packageId: string, updates: Partial<CoursePackage>): Promise<CoursePackage> {
    const { data, error } = await supabase
      .from('course_packages')
      .update(updates)
      .eq('package_id', packageId)
      .select()
      .single()

    if (error) {
      console.error('Error updating package:', error)
      throw error
    }

    return data
  },

  /**
   * 刪除套餐（軟刪除）
   * @param packageId - 套餐 ID
   */
  async deletePackage(packageId: string): Promise<void> {
    const { error } = await supabase
      .from('course_packages')
      .update({ is_active: false })
      .eq('package_id', packageId)

    if (error) {
      console.error('Error deleting package:', error)
      throw error
    }
  },

  /**
   * 計算折扣後價格
   * @param basePrice - 單堂原價
   * @param sessionCount - 堂數
   * @param discountPercentage - 折扣百分比
   * @returns 折扣後總價
   */
  calculateDiscountedPrice(basePrice: number, sessionCount: number, discountPercentage: number): number {
    const totalPrice = basePrice * sessionCount
    const discountAmount = totalPrice * (discountPercentage / 100)
    return totalPrice - discountAmount
  },

  calculatePricePerSession(totalPrice: number, sessionCount: number): number {
    return Math.round(totalPrice / sessionCount)
  },

  /**
   * 建立預設套餐方案
   * @param courseId - 課程 ID
   * @param pricePerSession - 單堂價格
   * @param validityDays - 有效天數（預設 180 天）
   * @returns 建立的套餐列表
   */
  async createDefaultPackages(courseId: string, pricePerSession: number, validityDays: number = 180): Promise<CoursePackage[]> {
    const defaultPackages = [
      { name: '體驗方案', sessions: 1, discount: 0 },
      { name: '基礎方案', sessions: 10, discount: 5 },
      { name: '標準方案', sessions: 20, discount: 10 },
      { name: '優惠方案', sessions: 30, discount: 15 }
    ]

    const packages: Partial<CoursePackage>[] = defaultPackages.map((pkg, index) => ({
      course_id: courseId,
      package_name: pkg.name,
      session_count: pkg.sessions,
      price: this.calculateDiscountedPrice(pricePerSession, pkg.sessions, pkg.discount),
      discount_percentage: pkg.discount,
      validity_days: validityDays,
      sort_order: index,
      is_active: true
    }))

    const { data, error } = await supabase
      .from('course_packages')
      .insert(packages)
      .select()

    if (error) {
      console.error('Error creating default packages:', error)
      throw error
    }

    return data || []
  },

  /**
   * 驗證套餐是否可購買
   * @param packageId - 套餐 ID
   * @returns 驗證結果和錯誤訊息
   */
  async validatePackagePurchase(packageId: string): Promise<{ valid: boolean; message?: string }> {
    const pkg = await this.getPackageById(packageId)

    if (!pkg) {
      return { valid: false, message: '套餐不存在' }
    }

    if (!pkg.is_active) {
      return { valid: false, message: '套餐已停用' }
    }

    const { data: course } = await supabase
      .from('courses')
      .select('allow_package_purchase, status')
      .eq('course_id', pkg.course_id)
      .single()

    if (!course?.allow_package_purchase) {
      return { valid: false, message: '此課程不支援套餐購買' }
    }

    if (course.status !== 'active') {
      return { valid: false, message: '課程未開放' }
    }

    return { valid: true }
  }
}
