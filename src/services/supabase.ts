import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { authPermissions } from './supabaseAuth'

// Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY

// 使用 anon key 以模擬生產環境
const supabaseKey = supabaseAnonKey

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

console.log('Supabase 配置:', {
  url: supabaseUrl,
  keyType: 'anon',
  environment: import.meta.env.VITE_APP_ENV || 'production'
})

// 創建 Supabase 客戶端
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'tutoring-center-frontend'
    }
  }
})

// 認證相關函數
export const auth = {
  /**
   * 登入
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      throw error
    }

    return data
  },

  /**
   * 登出
   */
  async signOut() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }
  },

  /**
   * 獲取當前會話
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    return data.session
  },

  /**
   * 獲取當前用戶
   */
  async getUser() {
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      throw error
    }

    return data.user
  },

  /**
   * 重設密碼
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      throw error
    }
  },

  /**
   * 監聽認證狀態變化
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// 實時訂閱
export const realtime = {
  /**
   * 訂閱表格變化
   */
  subscribe(
    table: string,
    callback: (payload: any) => void,
    filter?: string
  ) {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter
        },
        callback
      )
      .subscribe()

    return channel
  },

  /**
   * 取消訂閱
   */
  unsubscribe(channel: any) {
    if (channel) {
      channel.unsubscribe()
    }
  }
}

// 檔案存儲
export const storage = {
  /**
   * 上傳檔案
   */
  async upload(bucket: string, path: string, file: File, options?: { upsert?: boolean }) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: options?.upsert ?? false
      })

    if (error) {
      throw error
    }

    return data
  },

  /**
   * 下載檔案
   */
  async download(bucket: string, path: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)

    if (error) {
      throw error
    }

    return data
  },

  /**
   * 獲取檔案公開 URL
   */
  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return data.publicUrl
  },

  /**
   * 刪除檔案
   */
  async remove(bucket: string, paths: string[]) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(paths)

    if (error) {
      throw error
    }

    return data
  }
}

// 權限檢查輔助函數
export const permissions = {
  /**
   * 檢查當前用戶是否有指定權限
   */
  checkPermission(requiredRoles: string[]): void {
    // 從 localStorage 獲取當前用戶資料
    const userStr = localStorage.getItem('tutoring_user')
    if (!userStr) {
      throw new Error('用戶未登入')
    }

    let user
    try {
      user = JSON.parse(userStr)
    } catch (err) {
      throw new Error('用戶資料無效')
    }

    const userRole = user?.role?.role_code
    if (!userRole) {
      throw new Error('用戶角色未設定')
    }

    if (!requiredRoles.includes(userRole)) {
      throw new Error(`權限不足。需要權限：${requiredRoles.join(', ')}，當前權限：${userRole}`)
    }
  },

  /**
   * 檢查是否有讀取權限
   * 注意：由於 RLS 已經在資料庫層級控制權限，這裡的檢查主要是為了提供更好的錯誤訊息
   */
  checkReadPermission(table: string): void {
    // RLS 會自動處理權限，這裡只是前端的輔助檢查
    const userStr = localStorage.getItem('tutoring_user')
    if (!userStr) {
      throw new Error('用戶未登入')
    }

    // 特定表格的額外檢查（可選）
    switch (table) {
      case 'audit_logs':
      case 'security_events':
      case 'tutoring_center_settings':
        this.checkPermission(['ADMIN'])
        break
      case 'orders':
      case 'payments':
      case 'order_items':
        this.checkPermission(['ADMIN', 'STAFF'])
        break
      // 其他表格由 RLS 自動處理
    }
  },

  /**
   * 檢查是否有寫入權限
   * 注意：由於 RLS 已經在資料庫層級控制權限，這裡的檢查主要是為了提供更好的錯誤訊息
   */
  checkWritePermission(table: string, operation: 'create' | 'update' | 'delete'): void {
    // RLS 會自動處理權限，這裡只是前端的輔助檢查
    const userStr = localStorage.getItem('tutoring_user')
    if (!userStr) {
      throw new Error('用戶未登入')
    }

    // 特定操作的額外檢查（可選）
    switch (table) {
      case 'audit_logs':
      case 'security_events':
      case 'tutoring_center_settings':
        this.checkPermission(['ADMIN'])
        break
      case 'payments':
        if (operation === 'update' || operation === 'delete') {
          this.checkPermission(['ADMIN'])
        }
        break
      // 其他權限由 RLS 自動處理
    }
  }
}

// 資料庫查詢輔助函數
export const db = {
  /**
   * 處理資料庫錯誤，特別是 RLS 權限錯誤
   */
  handleDbError(error: any, operation: string): never {
    console.error(`資料庫操作失敗 (${operation}):`, error)

    // 處理 RLS 權限錯誤
    if (error.code === '42501' || error.message?.includes('row-level security')) {
      throw new Error('權限不足：您沒有權限執行此操作')
    }

    // 處理找不到資料的錯誤
    if (error.code === 'PGRST116') {
      throw new Error('找不到資料')
    }

    // 其他錯誤
    throw error
  },

  /**
   * 獲取單筆資料
   */
  async findOne<T>(
    table: string,
    idOrFilters: string | number | Record<string, any>,
    columns = '*'
  ) {
    // 註解掉舊的權限檢查，因為現在使用 Supabase Auth + RLS
    // 權限會在資料庫層級自動處理
    // try {
    //   permissions.checkReadPermission(table)
    // } catch (err) {
    //   console.warn('前端權限檢查提示:', err.message)
    // }

    let query = supabase.from(table).select(columns)

    if (typeof idOrFilters === 'object') {
      // 如果是對象，使用多個篩選條件
      Object.entries(idOrFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })
    } else {
      // 如果是字符串或數字，默認使用 id 欄位
      query = query.eq('id', idOrFilters)
    }

    const { data, error } = await query.single()

    if (error) {
      this.handleDbError(error, `findOne(${table})`)
    }

    return data as T
  },

  /**
   * 獲取多筆資料
   */
  async findMany<T>(
    table: string,
    options: {
      columns?: string
      filters?: Record<string, any>
      orderBy?: string
      ascending?: boolean
      limit?: number
      offset?: number
    } = {}
  ) {
    // 註解掉舊的權限檢查，因為現在使用 Supabase Auth + RLS
    // 權限會在資料庫層級自動處理
    // try {
    //   permissions.checkReadPermission(table)
    // } catch (err) {
    //   console.warn('前端權限檢查提示:', err.message)
    // }

    const {
      columns = '*',
      filters = {},
      orderBy,
      ascending = true,
      limit,
      offset
    } = options

    let query = supabase
      .from(table)
      .select(columns)

    // 添加篩選條件
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // 如果值是陣列，使用 IN 查詢
          query = query.in(key, value)
        } else {
          // 單一值使用 eq 查詢
          query = query.eq(key, value)
        }
      }
    })

    // 添加排序
    if (orderBy) {
      query = query.order(orderBy, { ascending })
    }

    // 添加分頁
    if (limit) {
      query = query.limit(limit)
    }
    if (offset) {
      query = query.range(offset, offset + (limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      this.handleDbError(error, `findMany(${table})`)
    }

    return data as T[]
  },

  /**
   * 創建資料
   */
  async create<T>(table: string, data: Partial<T>) {
    // 檢查寫入權限（前端輔助檢查）
    try {
      // permissions.checkWritePermission(table, 'create') // 由 RLS 處理
    } catch (err) {
      console.warn('前端權限檢查提示:', err.message)
    }

    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single()

    if (error) {
      this.handleDbError(error, `create(${table})`)
    }

    return result as T
  },

  /**
   * 更新資料
   */
  async update<T>(table: string, idOrFilters: string | number | Record<string, any>, data: Partial<T>) {
    // 檢查寫入權限（前端輔助檢查）
    try {
      // permissions.checkWritePermission(table, 'update') // 由 RLS 處理
    } catch (err) {
      console.warn('前端權限檢查提示:', err.message)
    }

    let query = supabase.from(table).update(data)

    if (typeof idOrFilters === 'object') {
      // 如果是對象，使用多個篩選條件
      Object.entries(idOrFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })
    } else {
      // 如果是字符串或數字，默認使用 id 欄位
      query = query.eq('id', idOrFilters)
    }

    const { data: result, error } = await query.select().single()

    if (error) {
      this.handleDbError(error, `update(${table})`)
    }

    return result as T
  },

  /**
   * 刪除資料
   */
  async delete(table: string, id: string | number) {
    // 檢查寫入權限（前端輔助檢查）
    try {
      // permissions.checkWritePermission(table, 'delete') // 由 RLS 處理
    } catch (err) {
      console.warn('前端權限檢查提示:', err.message)
    }

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)

    if (error) {
      this.handleDbError(error, `delete(${table})`)
    }

    return true
  }
}

// 專門的查詢函數
export const queries = {
  // 載入所有教師 (暫時載入所有活躍用戶，方便測試)
  async getInstructors() {
    console.log('載入教師列表...')

    try {
      // 嘗試多種可能的欄位組合
      const queries = [
        // 嘗試 1: 使用 status = 'active'
        () => supabase
          .from('users')
          .select('user_id, full_name, email, role_id, status')
          .eq('status', 'active')
          .order('full_name'),

        // 嘗試 2: 使用 is_active = true
        () => supabase
          .from('users')
          .select('user_id, full_name, email, role_id, is_active')
          .eq('is_active', true)
          .order('full_name'),

        // 嘗試 3: 載入所有用戶
        () => supabase
          .from('users')
          .select('user_id, full_name, email, role_id')
          .order('full_name')
      ]

      for (let i = 0; i < queries.length; i++) {
        console.log(`嘗試查詢方式 ${i + 1}...`)
        const { data, error } = await queries[i]()

        console.log(`查詢方式 ${i + 1} 結果:`, { data: data?.length, error })

        if (!error && data && data.length > 0) {
          console.log('成功載入用戶列表:', data)
          return data
        }
      }

      console.warn('所有查詢方式都失敗，返回空陣列')
      return []

    } catch (err) {
      console.error('載入教師列表異常:', err)
      return []
    }
  },

  // 根據ID載入單個教師
  async getInstructorById(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, full_name, email, role_id, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('載入教師資料失敗:', error)
      throw error
    }

    return data
  },

  // 載入所有可用教室 - 完整資訊
  async getClassrooms() {
    console.log('載入教室列表...')

    try {
      const { data: classroomsData, error: classroomsError } = await supabase
        .from('classrooms')
        .select('classroom_id, classroom_name, capacity, is_active')
        .eq('is_active', true)
        .order('classroom_name')

      console.log('教室查詢結果:', { data: classroomsData, error: classroomsError })

      if (classroomsError) {
        console.error('載入教室列表失敗:', classroomsError)
        throw classroomsError
      }

      if (classroomsData && classroomsData.length > 0) {
        console.log('成功載入教室列表:', classroomsData)
        return classroomsData
      }

      console.warn('未找到教室資料')
      return []

    } catch (err) {
      console.error('載入教室列表異常:', err)
      throw err
    }
  },

  // 載入教室名稱清單 (用於下拉選單)
  async getClassroomNames() {
    try {
      const classrooms = await this.getClassrooms()
      return classrooms.map(room => room.classroom_name)
    } catch (err) {
      console.error('載入教室名稱清單失敗:', err)
      // 返回預設教室清單作為備用方案
      return ['小教室 A', '小教室 B', '小會議室 C']
    }
  },

  // 根據教室名稱獲取教室詳細資訊
  async getClassroomByName(classroomName: string) {
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .eq('classroom_name', classroomName)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('載入教室詳細資訊失敗:', error)
        throw error
      }

      return data
    } catch (err) {
      console.error('查詢教室詳細資訊異常:', err)
      return null
    }
  },

  // 根據教室ID獲取教室資訊
  async getClassroomById(classroomId: string) {
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .eq('classroom_id', classroomId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('載入教室資訊失敗:', error)
        throw error
      }

      return data
    } catch (err) {
      console.error('查詢教室資訊異常:', err)
      return null
    }
  }
}

export default supabase
