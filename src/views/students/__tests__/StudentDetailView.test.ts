import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import StudentDetailView from '../StudentDetailView.vue'
import { creditManagementService } from '@/services/creditManagementService'
import type { Enrollment } from '@/types'

// Mock dependencies
vi.mock('@/services/creditManagementService', () => ({
  creditManagementService: {
    getStudentCredits: vi.fn(),
    getExpiryStatus: vi.fn((validUntil) => ({
      status: 'active',
      remainingDays: 30,
      displayText: '剩餘 30 天'
    }))
  }
}))
vi.mock('@/services/orderService', () => ({
  loadOrdersList: vi.fn(() => Promise.resolve([]))
}))
vi.mock('@/services/enrollmentService', () => ({
  loadStudentEnrollments: vi.fn(() => Promise.resolve([])),
  loadStudentAttendance: vi.fn(() => Promise.resolve([])),
  calculateAttendanceStats: vi.fn(() => ({ total: 0, attendanceRate: 0 }))
}))
vi.mock('@/services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 1,
              student_id: 'STU001',
              chinese_name: '王小明',
              english_name: 'John Wang',
              is_active: true
            },
            error: null
          }))
        }))
      }))
    }))
  },
  db: {
    findOne: vi.fn(() => Promise.resolve({
      id: 1,
      student_id: 'STU001',
      chinese_name: '王小明',
      english_name: 'John Wang',
      is_active: true
    }))
  }
}))
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: { user_id: 'test-user', role_code: 'ADMIN' },
    hasRole: vi.fn(() => true),
    hasAnyRole: vi.fn(() => true)
  }))
}))
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useRoute: vi.fn(() => ({
    params: { id: '1' },
    path: '/students/1'
  })),
  RouterLink: { name: 'RouterLink', template: '<a><slot /></a>' }
}))

describe('StudentDetailView - Credit Display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('should display student valid credits list', async () => {
    // Mock student data
    const mockStudent = {
      id: 1,
      student_id: 'STU001',
      chinese_name: '王小明',
      english_name: 'John Wang'
    }

    // Mock credit data
    const mockCredits = {
      theme: [
        {
          enrollment_id: 'ENR001',
          course_id: 'CRS001',
          remaining_sessions: 8,
          valid_until: '2024-03-31',
          enrollment_category: 'theme',
          course: {
            course_name: '主題美術班',
            course_category: 'theme'
          }
        }
      ],
      regular: [
        {
          enrollment_id: 'ENR002',
          course_id: 'CRS002',
          remaining_sessions: 15,
          valid_until: '2024-06-30',
          enrollment_category: 'regular',
          course: {
            course_name: '數學班',
            course_category: 'regular'
          }
        }
      ],
      expired: []
    }

    vi.mocked(creditManagementService).getStudentCredits.mockResolvedValue(mockCredits)

    const wrapper = mount(StudentDetailView, {
      global: {
        mocks: {
          $route: {
            params: { id: '1' },
            path: '/students/1'
          }
        }
      }
    })

    // Wait for component to load
    await wrapper.vm.$nextTick()

    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    // Debug: print the HTML to see what's rendered
    console.log(wrapper.html())

    // Check if credit display section exists
    const creditSection = wrapper.find('[data-testid="credit-section"]')
    expect(creditSection.exists()).toBe(true)

    // Check if theme courses are displayed
    const themeCredits = wrapper.find('[data-testid="theme-credits"]')
    expect(themeCredits.exists()).toBe(true)
    expect(themeCredits.text()).toContain('主題美術班')
    expect(themeCredits.text()).toContain('8')

    // Check if regular courses are displayed
    const regularCredits = wrapper.find('[data-testid="regular-credits"]')
    expect(regularCredits.exists()).toBe(true)
    expect(regularCredits.text()).toContain('數學班')
    expect(regularCredits.text()).toContain('15')
  })
})
