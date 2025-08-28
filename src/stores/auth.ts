import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth, db, supabase } from '@/services/supabase'
import type { User, Role } from '@/types'

// 使用簡化的用戶名認證，不依賴 Supabase Auth
const isDevelopment = import.meta.env.DEV
const USE_MOCK_AUTH = false // 使用真實資料庫但簡化認證

export const useAuthStore = defineStore('auth', () => {
  // 狀態定義
  const user = ref<User | null>(null)
  const session = ref<any>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 計算屬性
  const isAuthenticated = computed(() => !!session.value && !!user.value)
  const userRole = computed(() => user.value?.role)
  const userPermissions = computed(() => user.value?.role?.permissions || {})

  // 方法定義
  /**
   * 初始化認證狀態
   */
  async function initializeAuth() {
    loading.value = true
    error.value = null

    try {
      console.log('AuthStore - initializeAuth')

      {
        // 檢查本地存儲的會話
        const savedSession = sessionStorage.getItem('tutoring_session')
        const savedUser = sessionStorage.getItem('tutoring_user')

        if (savedSession && savedUser) {
          try {
            session.value = JSON.parse(savedSession)
            const userData = JSON.parse(savedUser)

            // 確保有 role 物件
            if (userData && !userData.role && userData.role_id) {
              const roleMap: { [key: number]: { role_code: string, role_name: string } } = {
                1: { role_code: 'ADMIN', role_name: '管理員' },
                2: { role_code: 'STAFF', role_name: '行政人員' },
                3: { role_code: 'TEACHER', role_name: '老師' }
              }
              userData.role = roleMap[userData.role_id] || { role_code: 'UNKNOWN', role_name: '未知' }
            }

            user.value = userData
            console.log('AuthStore - 從本地存儲恢復會話:', user.value?.full_name, '角色:', user.value?.role?.role_code)
          } catch (e) {
            console.error('解析本地會話失敗:', e)
            sessionStorage.removeItem('tutoring_session')
            sessionStorage.removeItem('tutoring_user')
          }
        }
      }
    } catch (err) {
      console.error('初始化認證失敗:', err)
      error.value = err instanceof Error ? err.message : '初始化認證失敗'
    } finally {
      loading.value = false
    }
  }

  /**
   * 獲取用戶資料 (通過用戶名)
   */
  async function fetchUserProfile(username: string) {
    try {
      const users = await db.findMany<User>('users', {
        columns: 'id, user_id, username, full_name, email, status, role_id, phone, avatar_url',
        filters: { username }
      })

      if (users.length === 0) {
        throw new Error('找不到用戶資料')
      }

      const userData = users[0]

      // 添加 role 物件以相容路由守衛
      const roleMap: { [key: number]: { role_code: string, role_name: string } } = {
        1: { role_code: 'ADMIN', role_name: '管理員' },
        2: { role_code: 'STAFF', role_name: '行政人員' },
        3: { role_code: 'TEACHER', role_name: '老師' }
      }

      userData.role = roleMap[userData.role_id] || { role_code: 'UNKNOWN', role_name: '未知' }
      user.value = userData

      // 記錄最後登入時間
      await db.update('users', userData.id, {
        last_login_at: new Date().toISOString()
      })
    } catch (err) {
      console.error('獲取用戶資料失敗:', err)
      throw err
    }
  }

  /**
   * 用戶登入
   */
  async function login(username: string, password: string) {
    loading.value = true
    error.value = null

    try {
      {
        // 使用資料庫直接驗證
        const userData = await validateUser(username, password)

        if (!userData) {
          throw new Error('帳號或密碼錯誤')
        }

        // 創建本地會話
        session.value = {
          user: { id: userData.id, username: userData.username },
          access_token: `local_token_${Date.now()}`,
          expires_at: Date.now() + (8 * 60 * 60 * 1000) // 8小時
        }

        // 為了相容路由守衛，添加 role 物件
        const roleMap: { [key: number]: { role_code: string, role_name: string } } = {
          1: { role_code: 'ADMIN', role_name: '管理員' },
          2: { role_code: 'STAFF', role_name: '行政人員' },
          3: { role_code: 'TEACHER', role_name: '老師' }
        }

        userData.role = roleMap[userData.role_id] || { role_code: 'UNKNOWN', role_name: '未知' }
        user.value = userData

        console.log('登入成功 - 完整用戶資料:', {
          user_id: userData.user_id,
          username: userData.username,
          full_name: userData.full_name,
          role_id: userData.role_id,
          id: userData.id,
          status: userData.status,
          userData
        })

        // 保存到本地存儲
        sessionStorage.setItem('tutoring_session', JSON.stringify(session.value))
        sessionStorage.setItem('tutoring_user', JSON.stringify(user.value))

        console.log('登入成功:', user.value.full_name, '角色:', user.value.role_id)
        console.log('儲存到 sessionStorage 的資料:', JSON.parse(sessionStorage.getItem('tutoring_user') || '{}'))
        return user.value
      }
    } catch (err) {
      console.error('登入失敗:', err)
      error.value = err instanceof Error ? err.message : '登入失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 驗證用戶
   */
  async function validateUser(username: string, password: string) {
    try {
      console.log('AuthStore - 開始驗證用戶:', username)

      // 直接使用 Supabase 查詢，跳過權限檢查（登入驗證時用戶還未登入）
      const { data: users, error } = await supabase
        .from('users')
        .select('id, user_id, username, password_hash, full_name, email, status, role_id, avatar_url, phone')
        .eq('username', username)

      if (error) {
        console.error('AuthStore - 查詢用戶失敗:', error)
        throw error
      }

      console.log('AuthStore - 查詢結果:', users?.length || 0, '筆用戶資料')
      console.log('AuthStore - 找到的用戶:', users?.map(u => ({
        username: u.username,
        status: u.status,
        role_id: u.role_id,
        password_hash: u.password_hash
      })) || [])

      if (!users || users.length === 0) {
        console.log('AuthStore - 用戶不存在:', username)
        return null
      }

      const foundUser = users[0]
      console.log('AuthStore - 驗證用戶:', foundUser.username, 'status:', foundUser.status)

      // 檢查用戶狀態
      if (foundUser.status !== 'active') {
        console.log('AuthStore - 帳號已停用:', foundUser.status)
        throw new Error('帳號已被停用')
      }

      // 密碼驗證：這裡是測試環境，使用簡化驗證
      // 檢查資料庫中的密碼雜湊是否為 'hashed_password'，且輸入的密碼符合預期
      const validPasswordMap: { [key: string]: string[] } = {
        'admin': ['admin'],
        'staff1': ['staff1', 'staff'],
        'staff2': ['staff2', 'staff'],
        'teacher1': ['teacher', 'teacher1'],
        'teacher2': ['teacher', 'teacher2']
      }

      const validPasswords = validPasswordMap[username] || []
      const isValidPassword = validPasswords.includes(password) && foundUser.password_hash === 'hashed_password'

      console.log('AuthStore - 密碼驗證:', {
        username,
        inputPassword: password,
        validPasswords,
        actualHash: foundUser.password_hash,
        isValidPassword
      })

      if (!isValidPassword) {
        console.log('AuthStore - 密碼不匹配')
        return null
      }

      console.log('AuthStore - 驗證成功:', foundUser.username)
      return foundUser
    } catch (err) {
      console.error('AuthStore - 用戶驗證失敗:', err)
      throw err
    }
  }

  /**
   * 用戶登出
   */
  async function logout() {
    loading.value = true
    error.value = null

    try {
      {
        // 清除本地存儲
        sessionStorage.removeItem('tutoring_session')
        sessionStorage.removeItem('tutoring_user')

        if (user.value) {
          console.log(`登出: ${user.value.full_name}`)
        }
      }

      // 清除狀態
      user.value = null
      session.value = null
    } catch (err) {
      console.error('登出失敗:', err)
      error.value = err instanceof Error ? err.message : '登出失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 重設密碼
   */
  async function resetPassword(email: string) {
    loading.value = true
    error.value = null

    try {
      await auth.resetPassword(email)
    } catch (err) {
      console.error('重設密碼失敗:', err)
      error.value = err instanceof Error ? err.message : '重設密碼失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新用戶資料
   */
  async function updateProfile(data: Partial<User>) {
    loading.value = true
    error.value = null

    try {
      if (!user.value) {
        throw new Error('用戶未登入')
      }

      const updatedUser = await db.update<User>('users', user.value.id, data)

      // 重新獲取用戶資料
      await fetchUserProfile(user.value.id.toString())

      // 記錄稽核日誌
      await logAudit('update', 'users', user.value.id.toString(), data)

      return updatedUser
    } catch (err) {
      console.error('更新用戶資料失敗:', err)
      error.value = err instanceof Error ? err.message : '更新用戶資料失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 檢查權限
   */
  function hasPermission(permission: string): boolean {
    if (!user.value || !user.value.role) {
      return false
    }

    return userPermissions.value[permission] === true
  }

  /**
   * 檢查角色
   */
  function hasRole(role: string): boolean {
    if (!user.value || !user.value.role) {
      return false
    }

    return user.value.role.role_code === role
  }

  /**
   * 檢查多個角色
   */
  function hasAnyRole(roles: string[]): boolean {
    if (!user.value || !user.value.role) {
      return false
    }

    return roles.includes(user.value.role.role_code)
  }

  /**
   * 記錄稽核日誌
   */
  async function logAudit(
    action: string,
    tableName: string,
    recordId: string,
    newValues?: any,
    oldValues?: any
  ) {
    try {
      if (!user.value) return

      await db.create('audit_logs', {
        user_id: user.value.user_id,
        action,
        table_name: tableName,
        record_id: recordId,
        old_values: oldValues,
        new_values: newValues,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent
      })
    } catch (err) {
      console.error('記錄稽核日誌失敗:', err)
    }
  }

  /**
   * 獲取客戶端 IP
   */
  async function getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }

  /**
   * 清除錯誤狀態
   */
  function clearError() {
    error.value = null
  }

  /**
   * 重置狀態
   */
  function resetState() {
    user.value = null
    session.value = null
    loading.value = false
    error.value = null
  }

  return {
    // 狀態
    user,
    session,
    loading,
    error,
    // 計算屬性
    isAuthenticated,
    userRole,
    userPermissions,
    // 方法
    initializeAuth,
    login,
    logout,
    resetPassword,
    updateProfile,
    hasPermission,
    hasRole,
    hasAnyRole,
    logAudit,
    clearError,
    resetState
  }
})
