import { supabase } from './supabase'
import type { Enrollment, EnrollmentExtension, Student, Course } from '@/types'

/**
 * 儲值管理服務
 * 提供學生儲值查詢、到期提醒、有效期管理等功能
 */
export const creditManagementService = {
  /**
   * 取得學生的儲值狀態
   * @param studentId - 學生 ID
   * @returns 包含主題課程、常態課程和已過期註冊的物件
   */
  async getStudentCredits(studentId: string): Promise<{
    theme: Enrollment[]
    regular: Enrollment[]
    expired: Enrollment[]
  }> {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(*),
        package:course_packages(*)
      `)
      .eq('student_id', studentId)
      .order('valid_until', { ascending: true })

    if (error) {
      console.error('Error fetching student credits:', error)
      throw error
    }

    const enrollments = data || []
    const now = new Date()

    const theme = enrollments.filter(e =>
      e.enrollment_category === 'theme' &&
      !e.is_expired &&
      new Date(e.valid_until || '') >= now
    )

    const regular = enrollments.filter(e =>
      e.enrollment_category === 'regular' &&
      !e.is_expired &&
      new Date(e.valid_until || '') >= now
    )

    const expired = enrollments.filter(e =>
      e.is_expired ||
      new Date(e.valid_until || '') < now
    )

    return { theme, regular, expired }
  },


  /**
   * 檢查並更新過期的註冊記錄
   * @returns 更新的記錄數
   */
  async checkAndUpdateExpiredEnrollments(): Promise<number> {
    const { data, error } = await supabase
      .rpc('check_enrollment_expiry')

    if (error) {
      console.error('Error updating expired enrollments:', error)
      throw error
    }

    return data || 0
  },

  /**
   * 延長註冊有效期
   * @param enrollmentId - 註冊 ID
   * @param days - 延長天數
   * @param reason - 延期原因
   * @param approvedBy - 核准人員 ID
   * @param createdBy - 建立人員 ID
   * @returns 延期記錄
   */
  async extendEnrollmentValidity(
    enrollmentId: string,
    days: number,
    reason: string,
    approvedBy: string,
    createdBy: string
  ): Promise<EnrollmentExtension> {
    const enrollment = await this.getEnrollment(enrollmentId)
    if (!enrollment) throw new Error('註冊記錄不存在')

    const originalExpiry = new Date(enrollment.valid_until || '')
    const newExpiry = new Date(originalExpiry)
    newExpiry.setDate(newExpiry.getDate() + days)

    const { data: extension, error: extError } = await supabase
      .from('enrollment_extensions')
      .insert([{
        enrollment_id: enrollmentId,
        extended_days: days,
        original_expiry: originalExpiry.toISOString().split('T')[0],
        new_expiry: newExpiry.toISOString().split('T')[0],
        reason,
        approved_by: approvedBy,
        created_by: createdBy
      }])
      .select()
      .single()

    if (extError) {
      console.error('Error creating extension record:', extError)
      throw extError
    }

    const { error: updateError } = await supabase
      .from('enrollments')
      .update({
        valid_until: newExpiry.toISOString().split('T')[0],
        is_expired: false,
        extended_times: (enrollment.extended_times || 0) + 1,
        last_extended_at: new Date().toISOString(),
        last_extended_by: createdBy
      })
      .eq('enrollment_id', enrollmentId)

    if (updateError) {
      console.error('Error updating enrollment:', updateError)
      throw updateError
    }

    return extension
  },

  async getEnrollment(enrollmentId: string): Promise<Enrollment | null> {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .single()

    if (error) {
      console.error('Error fetching enrollment:', error)
      return null
    }

    return data
  },

  async getEnrollmentExtensions(enrollmentId: string): Promise<EnrollmentExtension[]> {
    const { data, error } = await supabase
      .from('enrollment_extensions')
      .select(`
        *,
        approved_by_user:users!enrollment_extensions_approved_by_fkey(full_name),
        created_by_user:users!enrollment_extensions_created_by_fkey(full_name)
      `)
      .eq('enrollment_id', enrollmentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching extensions:', error)
      return []
    }

    return data || []
  },

  /**
   * 計算剩餘天數
   * @param validUntil - 有效期限日期
   * @returns 剩餘天數（已過期則為 0）
   */
  calculateRemainingDays(validUntil: string | null): number {
    if (!validUntil) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const expiryDate = new Date(validUntil)
    expiryDate.setHours(0, 0, 0, 0)

    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return Math.max(0, diffDays)
  },

  /**
   * 檢查是否即將到期
   * @param validUntil - 有效期限日期
   * @param thresholdDays - 提醒天數閾值（預設 30 天）
   * @returns 是否即將到期
   */
  isExpiringSoon(validUntil: string | null, thresholdDays: number = 30): boolean {
    const remainingDays = this.calculateRemainingDays(validUntil)
    return remainingDays > 0 && remainingDays <= thresholdDays
  },

  /**
   * 取得到期狀態資訊
   * @param validUntil - 有效期限日期
   * @returns 包含狀態、剩餘天數和顯示文字的物件
   */
  getExpiryStatus(validUntil: string | null): {
    status: 'active' | 'expiring' | 'expired'
    remainingDays: number
    displayText: string
  } {
    const remainingDays = this.calculateRemainingDays(validUntil)

    if (remainingDays <= 0) {
      return {
        status: 'expired',
        remainingDays: 0,
        displayText: '已過期'
      }
    } else if (remainingDays <= 30) {
      return {
        status: 'expiring',
        remainingDays,
        displayText: `剩餘 ${remainingDays} 天`
      }
    } else {
      return {
        status: 'active',
        remainingDays,
        displayText: `剩餘 ${remainingDays} 天`
      }
    }
  },

  async getStudentValidCredits(studentId: string): Promise<{
    totalSessions: number
    byCategory: Record<string, number>
    byCourse: Array<{
      courseId: string
      courseName: string
      category: string
      remainingSessions: number
      validUntil: string
      expiryStatus: ReturnType<typeof this.getExpiryStatus>
    }>
  }> {
    const { theme, regular } = await this.getStudentCredits(studentId)
    const allActive = [...theme, ...regular]

    let totalSessions = 0
    const byCategory: Record<string, number> = {}
    const byCourse: Array<any> = []

    for (const enrollment of allActive) {
      totalSessions += enrollment.remaining_sessions

      const category = enrollment.enrollment_category || 'regular'
      byCategory[category] = (byCategory[category] || 0) + enrollment.remaining_sessions

      if (enrollment.course) {
        byCourse.push({
          courseId: enrollment.course_id,
          courseName: enrollment.course.course_name,
          category,
          remainingSessions: enrollment.remaining_sessions,
          validUntil: enrollment.valid_until || '',
          expiryStatus: this.getExpiryStatus(enrollment.valid_until)
        })
      }
    }

    return { totalSessions, byCategory, byCourse }
  },

  /**
   * 取得即將到期的註冊記錄
   * @param daysAhead - 查詢天數範圍（預設 7 天）
   * @returns 即將到期的註冊列表
   */
  async getExpiringEnrollments(daysAhead: number = 7): Promise<Enrollment[]> {
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + daysAhead)

    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        student:students(*),
        course:courses(*)
      `)
      .eq('status', 'active')
      .not('valid_until', 'is', null)
      .gte('valid_until', today.toISOString().split('T')[0])
      .lte('valid_until', futureDate.toISOString().split('T')[0])
      .order('valid_until', { ascending: true })

    if (error) {
      console.error('Error fetching expiring enrollments:', error)
      throw error
    }

    return data || []
  }
}
