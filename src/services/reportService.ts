import { supabase } from './supabase'
import type { Database } from '@/types/database'

type Tables = Database['public']['Tables']

export interface RevenueData {
  date: string
  amount: number
  orderCount: number
}

export interface CourseStatistics {
  courseId: string
  courseName: string
  studentCount: number
  totalRevenue: number
  avgSessionsPerStudent: number
  completionRate: number
}

export interface StudentStatistics {
  totalStudents: number
  activeStudents: number
  newStudentsThisMonth: number
  avgEnrollmentsPerStudent: number
}

export interface AttendanceStatistics {
  date: string
  totalClasses: number
  presentCount: number
  absentCount: number
  attendanceRate: number
}

export interface TeacherPerformance {
  userId: string
  teacherName: string
  courseCount: number
  studentCount: number
  avgAttendanceRate: number
  totalRevenue: number
}

export interface ReportFilters {
  startDate?: string
  endDate?: string
  courseId?: string
  teacherId?: string
  studentId?: string
}

class ReportService {
  // 收入統計
  async getRevenueReport(filters: ReportFilters): Promise<RevenueData[]> {
    try {
      let query = supabase
        .from('orders')
        .select('created_at, final_amount')
        .eq('status', 'paid')

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate)
      }

      const { data, error } = await query

      if (error) throw error

      // 按日期分組統計
      const revenueByDate = new Map<string, { amount: number; count: number }>()

      data?.forEach(order => {
        const date = new Date(order.created_at).toISOString().split('T')[0]
        const existing = revenueByDate.get(date) || { amount: 0, count: 0 }
        revenueByDate.set(date, {
          amount: existing.amount + Number(order.final_amount),
          count: existing.count + 1
        })
      })

      return Array.from(revenueByDate.entries())
        .map(([date, stats]) => ({
          date,
          amount: stats.amount,
          orderCount: stats.count
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    } catch (error) {
      console.error('Error fetching revenue report:', error)
      return []
    }
  }

  // 課程統計
  async getCourseStatistics(filters: ReportFilters): Promise<CourseStatistics[]> {
    try {
      // 獲取所有課程
      let coursesQuery = supabase
        .from('courses')
        .select(`
          course_id,
          course_name,
          enrollments (
            enrollment_id,
            student_id,
            purchased_sessions,
            remaining_sessions,
            status
          )
        `)

      if (filters.courseId) {
        coursesQuery = coursesQuery.eq('course_id', filters.courseId)
      }
      if (filters.teacherId) {
        coursesQuery = coursesQuery.eq('instructor_id', filters.teacherId)
      }

      const { data: courses, error } = await coursesQuery

      if (error) throw error

      // 計算每個課程的統計
      return courses?.map(course => {
        const activeEnrollments = course.enrollments?.filter(e => e.status === 'active') || []
        const studentCount = new Set(activeEnrollments.map(e => e.student_id)).size

        // 計算總收入 (需要關聯訂單數據)
        const totalRevenue = 0 // TODO: 需要關聯訂單表計算

        // 計算平均購買堂數
        const avgSessionsPerStudent = activeEnrollments.length > 0
          ? activeEnrollments.reduce((sum, e) => sum + e.purchased_sessions, 0) / activeEnrollments.length
          : 0

        // 計算完成率
        const totalPurchased = activeEnrollments.reduce((sum, e) => sum + e.purchased_sessions, 0)
        const totalRemaining = activeEnrollments.reduce((sum, e) => sum + e.remaining_sessions, 0)
        const completionRate = totalPurchased > 0
          ? ((totalPurchased - totalRemaining) / totalPurchased) * 100
          : 0

        return {
          courseId: course.course_id,
          courseName: course.course_name,
          studentCount,
          totalRevenue,
          avgSessionsPerStudent,
          completionRate
        }
      }) || []
    } catch (error) {
      console.error('Error fetching course statistics:', error)
      return []
    }
  }

  // 學生統計
  async getStudentStatistics(filters: ReportFilters): Promise<StudentStatistics> {
    try {
      // 總學生數
      const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })

      // 活躍學生數 (有活躍報名的學生)
      const { data: activeEnrollments } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('status', 'active')

      const activeStudents = new Set(activeEnrollments?.map(e => e.student_id) || []).size

      // 本月新學生
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count: newStudentsThisMonth } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())

      // 平均報名課程數
      const { data: allEnrollments } = await supabase
        .from('enrollments')
        .select('student_id')

      const enrollmentsByStudent = new Map<string, number>()
      allEnrollments?.forEach(e => {
        enrollmentsByStudent.set(e.student_id, (enrollmentsByStudent.get(e.student_id) || 0) + 1)
      })

      const avgEnrollmentsPerStudent = enrollmentsByStudent.size > 0
        ? Array.from(enrollmentsByStudent.values()).reduce((sum, count) => sum + count, 0) / enrollmentsByStudent.size
        : 0

      return {
        totalStudents: totalStudents || 0,
        activeStudents,
        newStudentsThisMonth: newStudentsThisMonth || 0,
        avgEnrollmentsPerStudent
      }
    } catch (error) {
      console.error('Error fetching student statistics:', error)
      return {
        totalStudents: 0,
        activeStudents: 0,
        newStudentsThisMonth: 0,
        avgEnrollmentsPerStudent: 0
      }
    }
  }

  // 出席率統計
  async getAttendanceStatistics(filters: ReportFilters): Promise<AttendanceStatistics[]> {
    try {
      let query = supabase
        .from('schedules')
        .select(`
          class_datetime,
          attendance (
            status
          )
        `)
        .eq('status', 'completed')

      if (filters.startDate) {
        query = query.gte('class_datetime', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('class_datetime', filters.endDate)
      }
      if (filters.courseId) {
        query = query.eq('course_id', filters.courseId)
      }

      const { data, error } = await query

      if (error) throw error

      // 按日期分組統計
      const attendanceByDate = new Map<string, {
        totalClasses: number
        presentCount: number
        absentCount: number
      }>()

      data?.forEach(schedule => {
        const date = new Date(schedule.class_datetime).toISOString().split('T')[0]
        const existing = attendanceByDate.get(date) || {
          totalClasses: 0,
          presentCount: 0,
          absentCount: 0
        }

        const attendance = schedule.attendance || []
        const presentCount = attendance.filter(a => a.status === 'present').length
        const absentCount = attendance.filter(a => a.status === 'absent').length

        attendanceByDate.set(date, {
          totalClasses: existing.totalClasses + 1,
          presentCount: existing.presentCount + presentCount,
          absentCount: existing.absentCount + absentCount
        })
      })

      return Array.from(attendanceByDate.entries())
        .map(([date, stats]) => ({
          date,
          totalClasses: stats.totalClasses,
          presentCount: stats.presentCount,
          absentCount: stats.absentCount,
          attendanceRate: stats.presentCount + stats.absentCount > 0
            ? (stats.presentCount / (stats.presentCount + stats.absentCount)) * 100
            : 0
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    } catch (error) {
      console.error('Error fetching attendance statistics:', error)
      return []
    }
  }

  // 教師績效統計
  async getTeacherPerformance(filters: ReportFilters): Promise<TeacherPerformance[]> {
    try {
      let query = supabase
        .from('users')
        .select(`
          user_id,
          full_name,
          courses!courses_instructor_id_fkey (
            course_id,
            course_name,
            enrollments (
              enrollment_id,
              student_id
            )
          )
        `)

      if (filters.teacherId) {
        query = query.eq('user_id', filters.teacherId)
      }

      const { data: teachers, error } = await query

      if (error) throw error

      return teachers?.map(teacher => {
        const courses = teacher.courses || []
        const courseCount = courses.length

        // 計算總學生數 (去重)
        const allStudents = new Set<string>()
        courses.forEach(course => {
          course.enrollments?.forEach(e => allStudents.add(e.student_id))
        })
        const studentCount = allStudents.size

        // 計算平均出席率 - 暫時設為0，需要另外查詢
        const avgAttendanceRate = 0

        return {
          userId: teacher.user_id,
          teacherName: teacher.full_name,
          courseCount,
          studentCount,
          avgAttendanceRate,
          totalRevenue: 0 // TODO: 需要關聯訂單表計算
        }
      }) || []
    } catch (error) {
      console.error('Error fetching teacher performance:', error)
      return []
    }
  }

  // 綜合統計摘要
  async getSummaryStatistics(filters: ReportFilters) {
    try {
      // 本月收入
      const currentMonth = new Date()
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

      const monthlyRevenue = await this.getRevenueReport({
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString()
      })

      const totalMonthlyRevenue = monthlyRevenue.reduce((sum, day) => sum + day.amount, 0)

      // 上月收入 (用於比較)
      const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
      const endOfLastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0)

      const lastMonthRevenue = await this.getRevenueReport({
        startDate: lastMonth.toISOString(),
        endDate: endOfLastMonth.toISOString()
      })

      const totalLastMonthRevenue = lastMonthRevenue.reduce((sum, day) => sum + day.amount, 0)
      const revenueGrowth = totalLastMonthRevenue > 0
        ? ((totalMonthlyRevenue - totalLastMonthRevenue) / totalLastMonthRevenue) * 100
        : 0

      // 學生統計
      const studentStats = await this.getStudentStatistics(filters)

      // 本月出席率
      const monthlyAttendance = await this.getAttendanceStatistics({
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString()
      })

      const avgMonthlyAttendance = monthlyAttendance.length > 0
        ? monthlyAttendance.reduce((sum, day) => sum + day.attendanceRate, 0) / monthlyAttendance.length
        : 0

      return {
        revenue: {
          currentMonth: totalMonthlyRevenue,
          lastMonth: totalLastMonthRevenue,
          growth: revenueGrowth
        },
        students: studentStats,
        attendance: {
          monthlyAverage: avgMonthlyAttendance
        }
      }
    } catch (error) {
      console.error('Error fetching summary statistics:', error)
      return null
    }
  }
}

export const reportService = new ReportService()
