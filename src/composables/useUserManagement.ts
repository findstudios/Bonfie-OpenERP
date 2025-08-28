import { ref } from 'vue'
import { supabase } from '@/services/supabase'
import { simpleHash } from '@/utils/crypto'
import { useFileUpload } from './useFileUpload'
import { useFormModal } from './useFormModal'

export interface User {
  user_id: string
  username: string
  full_name: string
  role_id: string
  phone?: string
  email?: string
  avatar_url?: string
  status: string
  roles?: {
    role_name: string
  }
}

export interface UserForm {
  username: string
  password: string
  full_name: string
  role_id: string
  phone: string
  email: string
  avatar_url: string
}

export function useUserManagement() {
  const users = ref<User[]>([])
  const roles = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Avatar upload
  const avatarUpload = useFileUpload({
    bucket: 'avatars',
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/'],
    generateFileName: (file) => {
      const ext = file.name.split('.').pop()
      return `avatar_${Date.now()}.${ext}`
    }
  })

  // User form modal
  const userModal = useFormModal<UserForm>({
    defaultValues: {
      username: '',
      password: '',
      full_name: '',
      role_id: '',
      phone: '',
      email: '',
      avatar_url: ''
    }
  })

  const editingUser = ref<User | null>(null)

  const loadUsers = async () => {
    loading.value = true
    error.value = null

    try {
      const { data, error: dbError } = await supabase
        .from('users')
        .select(`
          *,
          roles(role_name)
        `)
        .order('created_at', { ascending: false })

      if (dbError) throw dbError
      users.value = data || []
    } catch (err) {
      console.error('載入用戶列表失敗:', err)
      error.value = '載入用戶列表失敗'
    } finally {
      loading.value = false
    }
  }

  const loadRoles = async () => {
    try {
      const { data, error: dbError } = await supabase
        .from('roles')
        .select('*')
        .eq('is_active', true)
        .order('id')

      if (dbError) throw dbError
      roles.value = data || []
    } catch (err) {
      console.error('載入角色列表失敗:', err)
      error.value = '載入角色列表失敗'
    }
  }

  const getRoleBadgeClass = (roleName: string) => {
    switch (roleName) {
      case '管理員':
        return 'bg-purple-100 text-purple-800'
      case '職員':
        return 'bg-blue-100 text-blue-800'
      case '教師':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const openEditForm = (user: User) => {
    editingUser.value = user
    userModal.open({
      username: user.username,
      password: '',
      full_name: user.full_name,
      role_id: user.role_id.toString(),
      phone: user.phone || '',
      email: user.email || '',
      avatar_url: user.avatar_url || ''
    })
    avatarUpload.reset()
  }

  const openCreateForm = () => {
    editingUser.value = null
    userModal.open()
    avatarUpload.reset()
  }

  const saveUser = async () => {
    const formData = userModal.formData.value
    let avatarUrl = formData.avatar_url

    try {
      // Upload avatar if exists
      if (avatarUpload.file.value) {
        const result = await avatarUpload.upload(
          editingUser.value ? `${editingUser.value.user_id}.${avatarUpload.file.value.name.split('.').pop()}` : undefined
        )
        if (result) {
          avatarUrl = result.url
        }
      }

      if (editingUser.value) {
        // Update existing user
        const updateData: any = {
          full_name: formData.full_name,
          role_id: formData.role_id,
          phone: formData.phone,
          email: formData.email,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        }

        const { error: dbError } = await supabase
          .from('users')
          .update(updateData)
          .eq('user_id', editingUser.value.user_id)

        if (dbError) throw dbError
      } else {
        // Create new user
        const hashedPassword = simpleHash(formData.password)
        const timestamp = Date.now().toString(36)
        const random = Math.random().toString(36).substr(2, 5)
        const userId = `USR_${timestamp}_${random}`.substring(0, 20)

        const { error: dbError } = await supabase
          .from('users')
          .insert({
            user_id: userId,
            username: formData.username,
            password_hash: hashedPassword,
            full_name: formData.full_name,
            role_id: formData.role_id,
            phone: formData.phone,
            email: formData.email,
            avatar_url: avatarUrl,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (dbError) throw dbError
      }

      await loadUsers()
      return true
    } catch (err) {
      console.error('儲存用戶失敗:', err)
      throw err
    }
  }

  const toggleUserStatus = async (user: User) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active'
      const { error: dbError } = await supabase
        .from('users')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.user_id)

      if (dbError) throw dbError

      await loadUsers()
      return true
    } catch (err) {
      console.error('更新用戶狀態失敗:', err)
      error.value = '更新用戶狀態失敗'
      return false
    }
  }

  return {
    users,
    roles,
    loading,
    error,
    editingUser,
    userModal,
    avatarUpload,
    loadUsers,
    loadRoles,
    getRoleBadgeClass,
    openEditForm,
    openCreateForm,
    saveUser,
    toggleUserStatus
  }
}
