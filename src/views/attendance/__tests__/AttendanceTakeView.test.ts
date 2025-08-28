import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AttendanceTakeView from '../AttendanceTakeView.vue'
import { useAuthStore } from '@/stores/authSupabase'
import { db } from '@/services/supabase'

// Mock Supabase
vi.mock('@/services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  },
  db: {
    findMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    findOne: vi.fn()
  }
}))

// Mock Vue Router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  }),
  useRoute: () => ({
    query: {},
    params: {}
  })
}))

describe('AttendanceTakeView - RLS Integration', () => {
  let wrapper: any
  let authStore: any

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()

    wrapper = mount(AttendanceTakeView, {
      global: {
        plugins: [createPinia()],
        stubs: {
          MainLayout: { template: '<div><slot /></div>' },
          Teleport: { template: '<div><slot /></div>' }
        }
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('User ID Handling', () => {
    it('should use current user_id from authStore when creating attendance records', async () => {
      // Arrange
      const mockUserId = 'USR001'
      authStore.user = {
        user_id: mockUserId,
        full_name: 'Test User',
        role: { role_code: 'ADMIN' }
      }

      // Mock necessary data
      vi.mocked(db.findMany).mockResolvedValue([
        {
          id: 1,
          enrollment_id: 'ENR001',
          student_id: 'STD001',
          course_id: 'CRS001'
        }
      ])

      // Act
      const submitMethod = wrapper.vm.submitAttendance
      await submitMethod()

      // Assert
      expect(db.create).toHaveBeenCalledWith(
        'attendance',
        expect.objectContaining({
          marked_by: mockUserId
        })
      )
    })

    it('should redirect to login when user_id is missing', async () => {
      // Arrange
      authStore.user = null
      const pushMock = vi.fn()
      wrapper.vm.$router = { push: pushMock }

      // Act
      await wrapper.vm.submitAttendance()

      // Assert
      expect(pushMock).toHaveBeenCalledWith('/login')
      expect(db.create).not.toHaveBeenCalled()
    })
  })

  describe('RLS Error Handling', () => {
    it('should display appropriate message for RLS permission errors', async () => {
      // Arrange
      authStore.user = { user_id: 'USR001' }
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})

      vi.mocked(db.create).mockRejectedValue({
        code: '42501',
        message: 'new row violates row-level security policy'
      })

      // Act
      await wrapper.vm.submitAttendance()

      // Assert
      expect(alertMock).toHaveBeenCalledWith('您沒有權限執行此操作。請確認您的角色權限是否正確。')
    })

    it('should not attempt to use backup user_id when RLS fails', async () => {
      // Arrange
      authStore.user = { user_id: 'USR001' }
      vi.mocked(db.create).mockRejectedValue({
        message: 'row-level security policy violation'
      })

      // Act
      await wrapper.vm.submitAttendance()

      // Assert
      // Should only call create once, not multiple times with different user_ids
      expect(db.create).toHaveBeenCalledTimes(1)
    })
  })
})
