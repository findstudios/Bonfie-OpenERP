import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CoursePackageManagement from '../CoursePackageManagement.vue'
import type { CoursePackage } from '@/types'

// Mock dependencies
vi.mock('@/services/coursePackageService', () => ({
  coursePackageService: {
    getPackagesByCourse: vi.fn(),
    createPackage: vi.fn(),
    updatePackage: vi.fn(),
    deletePackage: vi.fn()
  }
}))

import { coursePackageService } from '@/services/coursePackageService'
vi.mock('@/services/supabase', () => ({
  db: {
    findOne: vi.fn()
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
    params: { id: 'CRS001' },
    path: '/courses/CRS001/packages'
  })),
  RouterLink: { name: 'RouterLink', template: '<a><slot /></a>' }
}))

describe('CoursePackageManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('should display course packages list', async () => {
    const mockPackages: CoursePackage[] = [
      {
        package_id: 'PKG001',
        course_id: 'CRS001',
        package_name: '10堂優惠套餐',
        session_count: 10,
        price: 4500,
        validity_days: 180,
        discount_percentage: 10,
        is_active: true,
        display_order: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      },
      {
        package_id: 'PKG002',
        course_id: 'CRS001',
        package_name: '20堂超值套餐',
        session_count: 20,
        price: 8000,
        validity_days: 365,
        discount_percentage: 20,
        is_active: true,
        display_order: 2,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ]

    vi.mocked(coursePackageService.getPackagesByCourse).mockResolvedValue(mockPackages)

    const wrapper = mount(CoursePackageManagement, {
      global: {
        mocks: {
          $route: {
            params: { id: 'CRS001' },
            path: '/courses/CRS001/packages'
          }
        }
      }
    })

    // Wait for component to load
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check if packages are displayed
    const packageItems = wrapper.findAll('[data-testid="package-item"]')
    expect(packageItems).toHaveLength(2)

    // Check first package details
    expect(packageItems[0].text()).toContain('10堂優惠套餐')
    expect(packageItems[0].text()).toContain('10 堂')
    expect(packageItems[0].text()).toContain('$4,500')
    expect(packageItems[0].text()).toContain('180 天')

    // Check second package details
    expect(packageItems[1].text()).toContain('20堂超值套餐')
    expect(packageItems[1].text()).toContain('20 堂')
    expect(packageItems[1].text()).toContain('$8,000')
    expect(packageItems[1].text()).toContain('365 天')
  })

  it('should show add package button and form', async () => {
    vi.mocked(coursePackageService.getPackagesByCourse).mockResolvedValue([])

    const wrapper = mount(CoursePackageManagement, {
      global: {
        mocks: {
          $route: {
            params: { id: 'CRS001' },
            path: '/courses/CRS001/packages'
          }
        }
      }
    })

    await wrapper.vm.$nextTick()

    // Check if add button exists
    const addButton = wrapper.find('[data-testid="add-package-button"]')
    expect(addButton.exists()).toBe(true)
    expect(addButton.text()).toContain('新增套餐')

    // Click add button
    await addButton.trigger('click')
    await wrapper.vm.$nextTick()

    // Check if form is displayed
    const packageForm = wrapper.find('[data-testid="package-form"]')
    expect(packageForm.exists()).toBe(true)

    // Check form fields
    expect(wrapper.find('[data-testid="package-name-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="session-count-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="price-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="validity-days-input"]').exists()).toBe(true)
  })

  it('should show edit and delete buttons for each package', async () => {
    const mockPackages: CoursePackage[] = [
      {
        package_id: 'PKG001',
        course_id: 'CRS001',
        package_name: '10堂優惠套餐',
        session_count: 10,
        price: 4500,
        validity_days: 180,
        discount_percentage: 10,
        is_active: true,
        display_order: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ]

    vi.mocked(coursePackageService.getPackagesByCourse).mockResolvedValue(mockPackages)

    const wrapper = mount(CoursePackageManagement, {
      global: {
        mocks: {
          $route: {
            params: { id: 'CRS001' },
            path: '/courses/CRS001/packages'
          }
        }
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check if edit button exists
    const editButton = wrapper.find('[data-testid="edit-button-PKG001"]')
    expect(editButton.exists()).toBe(true)

    // Check if delete button exists
    const deleteButton = wrapper.find('[data-testid="delete-button-PKG001"]')
    expect(deleteButton.exists()).toBe(true)

    // Check if status toggle exists
    const statusToggle = wrapper.find('[data-testid="status-toggle-PKG001"]')
    expect(statusToggle.exists()).toBe(true)
  })
})
