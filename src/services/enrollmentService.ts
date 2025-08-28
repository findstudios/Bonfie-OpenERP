import { supabase } from './supabase'

export interface EnrollmentWithCourse {
  enrollment_id: string
  student_id: string
  course_id: string
  purchased_sessions: number
  remaining_sessions: number
  bonus_sessions: number
  status: string
  source: string
  notes: string | null
  created_at: string
  updated_at: string
  courses: {
    course_id: string
    course_name: string
    instructor_id: string
    course_type: string
    category: string | null
    total_sessions: number
    status: string
  } | null
}

export interface AttendanceRecord {
  id: number
  schedule_id: string
  student_id: string
  enrollment_id: string
  status: string
  session_deducted: boolean
  teacher_notes: string | null
  marked_at: string | null
  marked_by: string | null
  created_at: string
  schedules: {
    schedule_id: string
    class_datetime: string
    end_datetime: string
    session_number: number | null
    classroom: string | null
    status: string
  } | null
}

// 載入學生的課程註冊記錄
export async function loadStudentEnrollments(studentId: string): Promise<EnrollmentWithCourse[]> {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (
          course_id,
          course_name,
          instructor_id,
          course_type,
          category,
          total_sessions,
          status
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading student enrollments:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Failed to load student enrollments:', error)
    return []
  }
}

// 載入學生的出席記錄
export async function loadStudentAttendance(studentId: string, enrollmentId?: string): Promise<AttendanceRecord[]> {
  try {
    let query = supabase
      .from('attendance')
      .select(`
        *,
        schedules (
          schedule_id,
          class_datetime,
          end_datetime,
          session_number,
          classroom,
          status
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (enrollmentId) {
      query = query.eq('enrollment_id', enrollmentId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading student attendance:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Failed to load student attendance:', error)
    return []
  }
}

// 計算出席統計
export function calculateAttendanceStats(attendance: AttendanceRecord[]) {
  const total = attendance.length
  const present = attendance.filter(a => a.status === 'present').length
  const absent = attendance.filter(a => a.status === 'absent').length
  const late = attendance.filter(a => a.status === 'late').length
  const excused = attendance.filter(a => a.status === 'excused').length

  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0

  return {
    total,
    present,
    absent,
    late,
    excused,
    attendanceRate
  }
}
