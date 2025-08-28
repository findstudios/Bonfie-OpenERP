// 基礎類型定義
// 匯出 CRM 相關類型
export * from './crm'
export interface BaseEntity {
  id: number
  created_at: string
  updated_at: string
}

// 用戶相關類型
export interface Role extends BaseEntity {
  role_code: 'ADMIN' | 'STAFF' | 'TEACHER'
  role_name: string
  permissions: Record<string, boolean>
  description?: string
  is_active: boolean
}

export interface User extends BaseEntity {
  user_id: string
  username: string
  password_hash: string
  full_name: string
  role_id: number
  role?: Role
  phone?: string
  email?: string
  avatar_url?: string
  status: 'active' | 'inactive'
  last_login_at?: string
}

// 聯絡人相關類型
export interface Contact extends BaseEntity {
  contact_id: string
  full_name: string
  phone: string
  email?: string
  address?: string
  notes?: string
  is_active: boolean
}

export interface Student extends BaseEntity {
  student_id: string
  chinese_name: string
  english_name?: string
  birth_date?: string
  notes?: string
  is_active: boolean
  contacts?: StudentContact[]
}

export interface StudentContact {
  id: number
  student_id: string
  contact_id: string
  relationship: '父親' | '母親' | '監護人' | '本人'
  is_primary: boolean
  is_emergency: boolean
  is_billing: boolean
  notes?: string
  created_at: string
  contact?: Contact
}

// 課程相關類型
export interface Course extends BaseEntity {
  course_id: string
  course_name: string
  instructor_id: string | null
  instructor?: User
  course_type: 'regular' | 'intensive' | 'makeup'
  category: string
  course_category?: 'theme' | 'regular'
  duration_weeks?: number
  start_date?: string
  end_date?: string
  allow_package_purchase?: boolean
  default_validity_days?: number
  total_sessions: number
  price_per_session: number
  max_students: number
  enrolled_count?: number
  status: 'planning' | 'active' | 'full' | 'ended'
  schedule_pattern: Record<string, any>
  description?: string
}

// 課程方案類型
export interface CoursePackage extends BaseEntity {
  package_id: string
  course_id: string
  package_name: string
  session_count: number
  price: number
  discount_percentage: number
  validity_days: number
  sort_order: number
  is_active: boolean
  course?: Course
}

export interface Enrollment extends BaseEntity {
  enrollment_id: string
  student_id: string
  course_id: string
  purchased_sessions: number
  remaining_sessions: number
  bonus_sessions: number
  status: 'active' | 'paused' | 'cancelled' | 'completed'
  source: 'manual' | 'line' | 'api'
  notes?: string
  enrollment_category?: 'theme' | 'regular'
  package_id?: string
  valid_from?: string
  valid_until?: string
  is_expired?: boolean
  extended_times?: number
  last_extended_at?: string
  last_extended_by?: string
  student?: Student
  course?: Course
  package?: CoursePackage
}

// 註冊期限延長記錄類型
export interface EnrollmentExtension extends BaseEntity {
  extension_id: string
  enrollment_id: string
  extended_days: number
  original_expiry: string
  new_expiry: string
  reason: string
  approved_by?: string
  created_by: string
  enrollment?: Enrollment
}

// 排程相關類型
export interface Schedule extends BaseEntity {
  schedule_id: string
  course_id: string
  class_datetime: string
  end_datetime: string
  session_number: number
  classroom: string
  status: 'scheduled' | 'completed' | 'cancelled'
  is_makeup: boolean
  makeup_for_schedule_id?: string
  notes?: string
  course?: Course
  attendance?: Attendance[]
  // 前端使用的動態屬性
  studentCount?: number
  loadingStudents?: boolean
  studentListLoaded?: boolean
  studentList?: Student[]
}

export interface Attendance extends BaseEntity {
  schedule_id: string
  student_id: string
  enrollment_id: string
  status: 'present' | 'absent' | 'late' | 'early_leave'
  session_deducted: boolean
  teacher_notes?: string
  marked_at?: string
  marked_by?: string
  student?: Student
  enrollment?: Enrollment
  schedule?: Schedule
}

// 出席記錄類型
export interface AttendanceRecord {
  id: number
  schedule_id: string
  student_id: number
  status: 'present' | 'absent' | 'late' | 'leave'
  notes?: string
  created_at: string
  student?: {
    id: number
    student_id: string
    chinese_name: string
    english_name?: string
  }
  schedule?: {
    id: number
    schedule_id: string
    class_datetime: string
    classroom: string
    course?: {
      course_id: string
      course_name: string
    }
  }
}

// 訂單相關類型
export interface Order extends BaseEntity {
  order_id: string
  student_id: string
  contact_id: string
  item_type: 'enrollment' | 'material' | 'activity'
  original_amount: number
  discount_amount: number
  final_amount: number
  status: 'pending' | 'confirmed' | 'cancelled'
  discount_reason?: string
  created_by: string
  student?: Student
  contact?: Contact
  items?: OrderItem[]
  payments?: Payment[]
}

export interface OrderItem {
  id: number
  order_id: string
  item_type: 'enrollment' | 'material' | 'activity'
  item_id: string
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
  discount_amount: number
  final_price: number
  notes?: string
  package_id?: string
  validity_days?: number
}

export interface Payment extends BaseEntity {
  payment_id: string
  order_id: string
  amount_paid: number
  payment_method: 'cash' | 'transfer' | 'credit_card' | 'line_pay'
  payment_date: string
  receipt_number?: string
  notes?: string
  created_by: string
  order?: Order
}

// 稽核記錄類型
export interface AuditLog {
  id: number
  user_id: string
  action: 'create' | 'update' | 'delete' | 'login' | 'session_deduct'
  table_name: string
  record_id: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  old_amount?: number
  new_amount?: number
  old_status?: string
  new_status?: string
  ip_address?: string
  user_agent?: string
  created_at: string
  user?: User
}

// API 響應類型
export interface ApiResponse<T = any> {
  data: T
  error?: string
  message?: string
  success: boolean
}

export interface PaginatedResponse<T = any> {
  data: T[]
  count: number
  page: number
  per_page: number
  total_pages: number
}

// 表單類型
export interface LoginForm {
  username: string
  password: string
}

export interface StudentForm {
  student_id?: string
  chinese_name: string
  english_name?: string
  birth_date?: string
}

export interface CourseForm {
  course_name: string
  instructor_id: string
  course_type: 'regular' | 'intensive' | 'makeup'
  category: string
  course_category?: 'theme' | 'regular'
  duration_weeks?: number
  start_date?: string
  end_date?: string
  allow_package_purchase?: boolean
  default_validity_days?: number
  total_sessions: number
  price_per_session: number
  max_students: number
  description?: string
  schedule_pattern: Record<string, any>
}

export interface OrderForm {
  student_id: string
  contact_id: string
  items: {
    item_type: 'enrollment' | 'material' | 'activity'
    item_id: string
    item_name: string
    quantity: number
    unit_price: number
    discount_amount?: number
  }[]
  discount_reason?: string
}

// 統計類型
export interface DashboardStats {
  total_students: number
  active_courses: number
  pending_orders: number
  today_classes: number
  monthly_revenue: number
  attendance_rate: number
}

// 篩選和排序類型
export interface FilterOptions {
  search?: string
  status?: string
  date_from?: string
  date_to?: string
  category?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// 模態框類型
export interface ModalOptions {
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'confirm'
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}

// 通知類型
export interface NotificationOptions {
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  persistent?: boolean
}

// 響應式相關類型
export interface ResponsiveState {
  screenWidth: number
  screenHeight: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  isPortrait: boolean
  isLandscape: boolean
  isTouchDevice: boolean
}

export interface ResponsiveBreakpoint {
  name: 'mobile' | 'tablet' | 'desktop'
  minWidth: number
  maxWidth?: number
}

export interface ResponsiveConfig {
  breakpoints: {
    mobile: number
    tablet: number
    desktop: number
  }
  sidebar: {
    width: {
      expanded: string
      collapsed: string
    }
    autoCollapse: boolean
    mobileOverlay: boolean
  }
  table: {
    mobileBreakpoint: number
    columnsToShow: {
      mobile: string[]
      tablet: string[]
      desktop: string[]
    }
  }
  form: {
    gridCols: {
      mobile: number
      tablet: number
      desktop: number
    }
    spacing: {
      mobile: string
      tablet: string
      desktop: string
    }
  }
}

export interface TouchGesture {
  startX: number
  startY: number
  endX: number
  endY: number
  direction: 'left' | 'right' | 'up' | 'down' | null
  distance: number
  duration: number
}

export interface MediaQueryOptions {
  query: string
  matches: boolean
}
