import { supabase } from './supabase'
import type { Order, OrderItem, Enrollment, Course, CoursePackage } from '@/types'
import { coursePackageService } from './coursePackageService'
import { calculateValidityPeriod } from '@/utils/validityCalculator'

export const orderEnrollmentService = {
  async createEnrollmentFromOrder(orderId: string): Promise<Enrollment[]> {
    try {
      const order = await this.getOrderWithDetails(orderId)
      if (!order) throw new Error('訂單不存在')

      if (order.status !== 'confirmed') {
        throw new Error('只有已確認的訂單才能建立註冊')
      }

      const enrollments: Enrollment[] = []

      for (const item of order.items || []) {
        if (item.item_type === 'enrollment') {
          const enrollment = await this.createEnrollmentFromItem(order, item)
          if (enrollment) {
            enrollments.push(enrollment)
          }
        }
      }

      return enrollments
    } catch (error) {
      console.error('Error creating enrollment from order:', error)
      throw error
    }
  },

  async getOrderWithDetails(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*),
        student:students(*),
        contact:contacts(*)
      `)
      .eq('order_id', orderId)
      .single()

    if (error) {
      console.error('Error fetching order:', error)
      return null
    }

    return data
  },

  async createEnrollmentFromItem(order: Order, item: OrderItem): Promise<Enrollment | null> {
    try {
      if (item.package_id) {
        return await this.createPackageEnrollment(order, item)
      } else {
        return await this.createDirectEnrollment(order, item)
      }
    } catch (error) {
      console.error('Error creating enrollment from item:', error)
      return null
    }
  },

  async createPackageEnrollment(order: Order, item: OrderItem): Promise<Enrollment> {
    if (!item.package_id) throw new Error('套餐ID不存在')

    const pkg = await coursePackageService.getPackageById(item.package_id)
    if (!pkg) throw new Error('套餐不存在')

    const course = await this.getCourse(pkg.course_id)
    if (!course) throw new Error('課程不存在')

    const validityPeriod = calculateValidityPeriod({
      courseType: course.course_category || 'regular',
      startDate: new Date(),
      sessionCount: pkg.session_count * item.quantity,
      packageValidityDays: item.validity_days || pkg.validity_days,
      courseEndDate: course.end_date ? new Date(course.end_date) : undefined
    })

    const enrollmentData = {
      enrollment_id: `ENR${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      student_id: order.student_id,
      course_id: pkg.course_id,
      purchased_sessions: pkg.session_count * item.quantity,
      remaining_sessions: pkg.session_count * item.quantity,
      bonus_sessions: 0,
      status: 'active' as const,
      source: 'manual' as const,
      enrollment_category: course.course_category || 'regular' as const,
      package_id: pkg.package_id,
      valid_from: validityPeriod.validFrom,
      valid_until: validityPeriod.validUntil,
      is_expired: false,
      extended_times: 0,
      notes: `訂單編號: ${order.order_id}`
    }

    if (course.course_category === 'regular') {
      return await this.upsertEnrollment(enrollmentData)
    } else {
      return await this.createEnrollment(enrollmentData)
    }
  },

  async createDirectEnrollment(order: Order, item: OrderItem): Promise<Enrollment> {
    const course = await this.getCourse(item.item_id)
    if (!course) throw new Error('課程不存在')

    const sessionCount = course.course_category === 'theme' ? course.total_sessions : item.quantity

    const validityPeriod = calculateValidityPeriod({
      courseType: course.course_category || 'regular',
      startDate: new Date(),
      sessionCount,
      courseEndDate: course.end_date ? new Date(course.end_date) : undefined,
      defaultValidityDays: course.default_validity_days || 180,
      sessionsPerWeek: course.sessions_per_week
    })

    const enrollmentData = {
      enrollment_id: `ENR${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      student_id: order.student_id,
      course_id: course.course_id,
      purchased_sessions: sessionCount,
      remaining_sessions: sessionCount,
      bonus_sessions: 0,
      status: 'active' as const,
      source: 'manual' as const,
      enrollment_category: course.course_category || 'regular' as const,
      valid_from: validityPeriod.validFrom,
      valid_until: validityPeriod.validUntil,
      is_expired: false,
      extended_times: 0,
      notes: `訂單編號: ${order.order_id}`
    }

    return await this.createEnrollment(enrollmentData)
  },

  async getCourse(courseId: string): Promise<Course | null> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('course_id', courseId)
      .single()

    if (error) {
      console.error('Error fetching course:', error)
      return null
    }

    return data
  },

  async createEnrollment(enrollmentData: any): Promise<Enrollment> {
    const { data, error } = await supabase
      .from('enrollments')
      .insert([enrollmentData])
      .select()
      .single()

    if (error) {
      console.error('Error creating enrollment:', error)
      throw error
    }

    return data
  },

  async upsertEnrollment(enrollmentData: any): Promise<Enrollment> {
    const existingEnrollment = await this.getExistingEnrollment(
      enrollmentData.student_id,
      enrollmentData.course_id
    )

    if (existingEnrollment && !existingEnrollment.is_expired) {
      const updatedSessions = existingEnrollment.remaining_sessions + enrollmentData.purchased_sessions
      const updatedPurchased = existingEnrollment.purchased_sessions + enrollmentData.purchased_sessions

      let newValidUntil = new Date(existingEnrollment.valid_until || '')
      const proposedValidUntil = new Date(enrollmentData.valid_until)

      if (proposedValidUntil > newValidUntil) {
        newValidUntil = proposedValidUntil
      }

      const { data, error } = await supabase
        .from('enrollments')
        .update({
          purchased_sessions: updatedPurchased,
          remaining_sessions: updatedSessions,
          valid_until: newValidUntil.toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('enrollment_id', existingEnrollment.enrollment_id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      return await this.createEnrollment(enrollmentData)
    }
  },

  async getExistingEnrollment(studentId: string, courseId: string): Promise<Enrollment | null> {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching existing enrollment:', error)
      return null
    }

    // 返回第一筆記錄，如果沒有記錄則返回 null
    return data && data.length > 0 ? data[0] : null
  },

  async processOrderCompletion(orderId: string): Promise<{
    success: boolean
    enrollments: Enrollment[]
    message: string
  }> {
    try {
      const enrollments = await this.createEnrollmentFromOrder(orderId)

      return {
        success: true,
        enrollments,
        message: `成功建立 ${enrollments.length} 個註冊記錄`
      }
    } catch (error: any) {
      return {
        success: false,
        enrollments: [],
        message: error.message || '建立註冊失敗'
      }
    }
  }
}
