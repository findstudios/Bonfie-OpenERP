import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed } from 'vue'
import VueRoleGuard from '../VueRoleGuard.vue'

// Mock auth store
const mockUser = ref<any>(null)
const mockIsAuthenticated = ref(false)
const mockAuthStore = {
  get isAuthenticated() {
    return mockIsAuthenticated.value
  },
  set isAuthenticated(value: boolean) {
    mockIsAuthenticated.value = value
  },
  user: mockUser,
  userRole: computed(() => mockUser.value?.role || null)
}

vi.mock('@/stores/authSupabase', () => ({
  useAuthStore: () => mockAuthStore
}))

describe('ADMIN 角色權限測試', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 設置 ADMIN 用戶
    mockAuthStore.isAuthenticated = true
    mockUser.value = {
      id: '1',
      name: 'Admin User',
      role: { role_code: 'ADMIN', role_name: '管理員' }
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

  it('可以訪問訂單模組', async () => {
    const wrapper = mount(VueRoleGuard, {
      props: {
        allowedRoles: ['ADMIN', 'STAFF']
      },
      slots: {
        default: 'Orders Module'
      }
    })

    expect(wrapper.text()).toContain('Orders Module')
  })

  it('可以訪問聯絡人模組', async () => {
    const wrapper = mount(VueRoleGuard, {
      props: {
        allowedRoles: ['ADMIN', 'STAFF']
      },
      slots: {
        default: 'Contacts Module'
      }
    })

    expect(wrapper.text()).toContain('Contacts Module')
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

  it('可以訪問報告模組', async () => {
    const wrapper = mount(VueRoleGuard, {
      props: {
        allowedRoles: ['ADMIN']
      },
      slots: {
        default: 'Reports Module'
      }
    })

    expect(wrapper.text()).toContain('Reports Module')
  })

  it('可以訪問設定模組', async () => {
    const wrapper = mount(VueRoleGuard, {
      props: {
        allowedRoles: ['ADMIN']
      },
      slots: {
        default: 'Settings Module'
      }
    })

    expect(wrapper.text()).toContain('Settings Module')
  })
})
