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

describe('基礎權限檢查測試', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 重置 mock auth store
    mockAuthStore.isAuthenticated = false
    mockUser.value = null
  })

  it('未登入用戶無法訪問任何受保護頁面', async () => {
    const wrapper = mount(VueRoleGuard, {
      props: {
        allowedRoles: ['ADMIN']
      },
      slots: {
        default: 'Protected Content'
      }
    })

    // 驗證未登入用戶無法看到受保護內容
    expect(wrapper.text()).not.toContain('Protected Content')
  })

  it('已登入用戶可以訪問授權的模組', async () => {
    mockAuthStore.isAuthenticated = true
    mockUser.value = {
      id: '1',
      name: 'Test User',
      role: { role_code: 'ADMIN', role_name: '管理員' }
    }

    const wrapper = mount(VueRoleGuard, {
      props: {
        allowedRoles: ['ADMIN']
      },
      slots: {
        default: 'Protected Content'
      }
    })

    // 驗證已登入且有權限的用戶可以看到受保護內容
    expect(wrapper.text()).toContain('Protected Content')
  })

  it('已登入但無權限用戶不能訪問未授權模組', async () => {
    mockAuthStore.isAuthenticated = true
    mockUser.value = {
      id: '1',
      name: 'Test User',
      role: { role_code: 'TEACHER', role_name: '老師' }
    }

    const wrapper = mount(VueRoleGuard, {
      props: {
        allowedRoles: ['ADMIN']
      },
      slots: {
        default: 'Protected Content'
      }
    })

    // 驗證無權限用戶無法看到受保護內容
    expect(wrapper.text()).not.toContain('Protected Content')
  })
})
