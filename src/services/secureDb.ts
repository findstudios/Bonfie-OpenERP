import { supabase } from './supabase'
import { useAuthStore } from '@/stores/authSupabase'

/**
 * 安全資料庫服務 - 使用資料庫層安全函數
 * 配合 service role + 應用層權限驗證的平衡式方案
 */

// 獲取當前用戶ID的輔助函數
function getCurrentUserId(): string {
  const authStore = useAuthStore()
  if (!authStore.user?.user_id) {
    throw new Error('User not authenticated')
  }
  return authStore.user.user_id
}

export const secureDb = {
  /**
   * 安全取得學生資料
   */
  async getStudents() {
    const userId = getCurrentUserId()

    const { data, error } = await supabase.rpc('secure_get_students', {
      requesting_user_id: userId
    })

    if (error) {
      console.error('取得學生資料失敗:', error)
      throw new Error(error.message)
    }

    return data
  },

  /**
   * 安全新增學生
   */
  async createStudent(studentData: any) {
    const userId = getCurrentUserId()

    const { data, error } = await supabase.rpc('secure_insert_student', {
      requesting_user_id: userId,
      student_data: studentData
    })

    if (error) {
      console.error('新增學生失敗:', error)
      throw new Error(error.message)
    }

    return data
  },

  /**
   * 安全更新學生
   */
  async updateStudent(studentId: string, studentData: any) {
    const userId = getCurrentUserId()

    const { data, error } = await supabase.rpc('secure_update_student', {
      requesting_user_id: userId,
      student_id_param: studentId,
      student_data: studentData
    })

    if (error) {
      console.error('更新學生失敗:', error)
      throw new Error(error.message)
    }

    return data
  },

  /**
   * 安全刪除學生
   */
  async deleteStudent(studentId: string) {
    const userId = getCurrentUserId()

    const { data, error } = await supabase.rpc('secure_delete_student', {
      requesting_user_id: userId,
      student_id_param: studentId
    })

    if (error) {
      console.error('刪除學生失敗:', error)
      throw new Error(error.message)
    }

    return data
  },

  /**
   * 安全取得課程資料
   */
  async getCourses() {
    const userId = getCurrentUserId()

    const { data, error } = await supabase.rpc('secure_get_courses', {
      requesting_user_id: userId
    })

    if (error) {
      console.error('取得課程資料失敗:', error)
      throw new Error(error.message)
    }

    return data
  },

  /**
   * 安全取得訂單資料
   */
  async getOrders() {
    const userId = getCurrentUserId()

    const { data, error } = await supabase.rpc('secure_get_orders', {
      requesting_user_id: userId
    })

    if (error) {
      console.error('取得訂單資料失敗:', error)
      throw new Error(error.message)
    }

    return data
  },

  /**
   * 通用安全查詢（為了向後相容）
   * 注意：這個方法不如上面的專用函數安全，建議逐步遷移
   */
  async findMany(table: string, options: any = {}) {
    console.warn(`警告: 正在使用通用查詢方法訪問 ${table}，建議使用專用的安全函數`)

    // 對於關鍵表，強制使用安全函數
    if (table === 'students') {
      return this.getStudents()
    }
    if (table === 'courses') {
      return this.getCourses()
    }
    if (table === 'orders') {
      return this.getOrders()
    }

    // 對於其他表，暫時允許直接查詢但記錄警告
    let query = supabase.from(table).select(options.columns || '*')

    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    if (options.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending })
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return data
  },

  /**
   * 檢查用戶權限
   */
  async checkUserPermission(requiredRoles: string[]) {
    const userId = getCurrentUserId()

    const { data, error } = await supabase.rpc('check_user_permission', {
      user_id_param: userId,
      required_role_codes: requiredRoles
    })

    if (error) {
      console.error('權限檢查失敗:', error)
      return false
    }

    return data
  }
}
