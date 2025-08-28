import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CreditManagementDashboard from '../CreditManagementDashboard.vue'
import { useAuthStore } from '@/stores/authSupabase'

// Mock services
vi.mock('@/services/creditManagementService', () => ({
  creditManagementService: {
    getExpiringEnrollments: vi.fn(),
    checkAndUpdateExpiredEnrollments: vi.fn()
  }
}))

vi.mock('@/services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({
            data: [
              {
                enrollment_id: 'ENR003',
                student_id: 'STU003',
                course_id: 'CRS001',
                remaining_sessions: 8,
                valid_until: '2024-03-15',
                enrollment_category: 'regular',
                student: { chinese_name: '張小美' },
                course: { course_name: '數學班' }
              }
            ],
            error: null
          }))
        }))
      }))
    }))
  }
}))

import { creditManagementService } from '@/services/creditManagementService'

describe('CreditManagementDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    const authStore = useAuthStore()
    authStore.user = {
      user_id: 'USER001',
      username: 'admin',
      full_name: '管理員',
      role: {
        role_name: '管理員',
        role_code: 'ADMIN'
      }
    }

    // Setup default mock responses with future dates
    const today = new Date()
    const in5Days = new Date(today)
    in5Days.setDate(today.getDate() + 5)
    const in10Days = new Date(today)
    in10Days.setDate(today.getDate() + 10)

    vi.mocked(creditManagementService.getExpiringEnrollments).mockResolvedValue([
      {
        enrollment_id: 'ENR001',
        student_id: 'STU001',
        course_id: 'CRS001',
        remaining_sessions: 3,
        valid_until: in5Days.toISOString().split('T')[0],
        enrollment_category: 'regular',
        student: { chinese_name: '王小明' },
        course: { course_name: '數學班' }
      },
      {
        enrollment_id: 'ENR002',
        student_id: 'STU002',
        course_id: 'CRS002',
        remaining_sessions: 5,
        valid_until: in10Days.toISOString().split('T')[0],
        enrollment_category: 'theme',
        student: { chinese_name: '李小華' },
        course: { course_name: '美術創作班' }
      }
    ])

    vi.mocked(creditManagementService.checkAndUpdateExpiredEnrollments).mockResolvedValue(2)
  })

  it('should display credit management dashboard sections', async () => {
    const wrapper = mount(CreditManagementDashboard)

    // Wait for component to mount and initial data load
    await wrapper.vm.$nextTick()

    // Check main sections
    expect(wrapper.find('[data-testid="dashboard-title"]').text()).toBe('儲值管理儀表板')

    // Check statistics cards
    expect(wrapper.find('[data-testid="expiring-soon-card"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="expired-today-card"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="active-enrollments-card"]').exists()).toBe(true)

    // Check expiring enrollments section
    expect(wrapper.find('[data-testid="expiring-section"]').exists()).toBe(true)

    // Wait for async data to load
    await vi.waitFor(() => {
      wrapper.vm.$forceUpdate()
      return wrapper.findAll('[data-testid="expiring-item"]').length > 0
    })

    // With default 7-day filter, only 1 enrollment should show (in5Days)
    expect(wrapper.findAll('[data-testid="expiring-item"]')).toHaveLength(1)
  })

  it('should filter enrollments by validity period', async () => {
    const wrapper = mount(CreditManagementDashboard)

    await wrapper.vm.$nextTick()
    await vi.dynamicImportSettled()

    // Check filter buttons
    const filterButtons = wrapper.findAll('[data-testid^="filter-"]')
    expect(filterButtons.length).toBeGreaterThan(0)

    // Click 7 days filter
    const sevenDaysFilter = wrapper.find('[data-testid="filter-7days"]')
    await sevenDaysFilter.trigger('click')

    // Should update the displayed enrollments
    expect(wrapper.vm.selectedFilter).toBe(7)
  })

  it('should show enrollment extension dialog', async () => {
    const wrapper = mount(CreditManagementDashboard)

    // Wait for component to mount and initial data load
    await wrapper.vm.$nextTick()

    // Wait for async data to load
    await vi.waitFor(() => {
      wrapper.vm.$forceUpdate()
      return wrapper.findAll('[data-testid="expiring-item"]').length > 0
    })

    // Initially dialog should not exist
    expect(wrapper.find('[data-testid="extension-dialog"]').exists()).toBe(false)

    // Click extend button on first enrollment
    const extendButton = wrapper.find('[data-testid="extend-button-ENR001"]')
    await extendButton.trigger('click')

    // Dialog should now be visible
    expect(wrapper.find('[data-testid="extension-dialog"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="extension-student-name"]').text()).toContain('王小明')
  })
})
