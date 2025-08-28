import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed } from 'vue'
import VueRoleGuard from '../VueRoleGuard.vue'

// Mock auth store
const mockUser = ref<any>(null)
const mockAuthStore = {
  isAuthenticated: false,
  user: mockUser,
  userRole: computed(() => mockUser.value?.role?.role_code || null)
}

vi.mock('@/stores/authSupabase', () => ({
  useAuthStore: () => mockAuthStore
}))

describe('TEACHER 角色權限測試', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 設置 TEACHER 用戶
    mockAuthStore.isAuthenticated = true
    mockUser.value = {
      id: '1',
      name: 'Teacher User',
      role: { role_code: 'TEACHER', role_name: '老師' }
    }
  })

  it('可以訪問學生模組', async () => {
    const wrapper = mount(VueRoleGuard, {
      props: {
        allowedRoles: ['ADMIN', 'STAFF', 'TEACHER']
      },
      slots: {
        default: 'Students Module'
      }
    })

    expect(wrapper.text()).toContain('Students Module')
  })

  it('可以訪問課程模組', async () => {
    const wrapper = mount(VueRoleGuard, {
      props: {
        allowedRoles: ['ADMIN', 'STAFF', 'TEACHER']
      },
      slots: {
        default: 'Courses Module'
      }
    })

    expect(wrapper.text()).toContain('Courses Module')
  })

  it('可以訪問出勤模組', async () => {
    const wrapper = mount(VueRoleGuard, {
      props: {
        allowedRoles: ['ADMIN', 'STAFF', 'TEACHER']
      },
      slots: {
        default: 'Attendance Module'
      }
    })

    expect(wrapper.text()).toContain('Attendance Module')
  })

  it('不能訪問訂單模組', async () => {
    const wrapper = mount(VueRoleGuard, {
      props: {
        allowedRoles: ['ADMIN', 'STAFF']
      },
      slots: {
        default: 'Orders Module'
      }
    })

    expect(wrapper.text()).not.toContain('Orders Module')
  })

  it('不能訪問聯絡人模組', async () => {
    const wrapper = mount(VueRoleGuard, {
      props: {
        allowedRoles: ['ADMIN', 'STAFF']
      },
      slots: {
        default: 'Contacts Module'
      }
    })

    expect(wrapper.text()).not.toContain('Contacts Module')
  })

  it('不能訪問報告模組', async () => {
    const wrapper = mount(VueRoleGuard, {
      props: {
        allowedRoles: ['ADMIN']
      },
      slots: {
        default: 'Reports Module'
      }
    })

    expect(wrapper.text()).not.toContain('Reports Module')
  })

  it('不能訪問設定模組', async () => {
    const wrapper = mount(VueRoleGuard, {
      props: {
        allowedRoles: ['ADMIN']
      },
      slots: {
        default: 'Settings Module'
      }
    })

    expect(wrapper.text()).not.toContain('Settings Module')
  })
})
