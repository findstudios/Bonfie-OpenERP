import type { Database } from './database'

// 基礎類型
export type Schedule = Database['public']['Tables']['schedules']['Row'] & {
  course?: Database['public']['Tables']['courses']['Row'] & {
    instructor?: Database['public']['Tables']['users']['Row']
  }
  // 計算屬性
  attendance_count?: number
  enrollments?: Enrollment[]
  studentList?: StudentInfo[]
  has_trial?: boolean
}

export type Student = Database['public']['Tables']['students']['Row']
export type Attendance = Database['public']['Tables']['attendance']['Row']
export type Enrollment = Database['public']['Tables']['enrollments']['Row'] & {
  student?: Student
}

export type StudentContact = Database['public']['Tables']['student_contacts']['Row'] & {
  contact: Database['public']['Tables']['contacts']['Row']
}

export type TrialClass = Database['public']['Tables']['trial_classes']['Row'] & {
  lead: Database['public']['Tables']['leads']['Row']
  course?: Database['public']['Tables']['courses']['Row']
}

// 學生資訊（用於顯示）
export interface StudentInfo {
  student_id: string
  chinese_name: string
  enrollment_id?: string | null
  is_trial?: boolean
  attendance_status?: string | null
}

// 追蹤項目（從 trackingService 匯入的類型）
export interface TrackingItem {
  id: string
  type: 'absent' | 'trial_scheduled' | 'follow_up' | 'trial_follow_up'
  student: {
    student_id: string
    chinese_name: string
    english_name?: string
  }
  contact: {
    name: string
    phone: string
    relationship: string
  }
  priority: 'high' | 'medium' | 'low'
  completed?: boolean
  course_name?: string
  class_time?: string
  scheduled_date?: string
  scheduled_time?: string
  due_date?: string
  notes?: string
  created_at: string
  source_id: string
}
