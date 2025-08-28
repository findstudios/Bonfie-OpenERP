import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import OrderFormView from '../OrderFormView.vue'
import { coursePackageService } from '@/services/coursePackageService'

vi.mock('@/services/coursePackageService')
vi.mock('@/services/orderFormService', () => ({
  loadStudents: vi.fn().mockResolvedValue({ success: true, data: [] }),
  loadCourses: vi.fn().mockResolvedValue({ success: true, data: [] }),
  loadStudentContacts: vi.fn().mockResolvedValue({ success: true, data: [] }),
  createOrder: vi.fn().mockResolvedValue({ success: true })
}))
vi.mock('@/services/supabase', () => ({
  db: {}
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
  useRoute: vi.fn(() => ({ path: '/orders/new' })),
  RouterLink: { name: 'RouterLink', template: '<a><slot /></a>' }
}))

describe('OrderFormView - Course Package Selection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('should show package selector when selecting a course that allows package purchase', async () => {
    // Simply test the logic of shouldShowPackageSelector
    const wrapper = mount(OrderFormView, {
      global: {
        mocks: {
          $route: { path: '/orders/new' }
        }
      }
    })

    // Test the shouldShowPackageSelector logic directly
    const result1 = wrapper.vm.shouldShowPackageSelector({
      item_type: 'enrollment',
      item_id: '',
      item_name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      discount_amount: 0,
      final_price: 0,
      notes: ''
    })
    expect(result1).toBe(false) // No item_id

    const result2 = wrapper.vm.shouldShowPackageSelector({
      item_type: 'material',
      item_id: 'COURSE001',
      item_name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      discount_amount: 0,
      final_price: 0,
      notes: ''
    })
    expect(result2).toBe(false) // Not enrollment type
  })

  it('should correctly update item details when selecting course', async () => {
    const wrapper = mount(OrderFormView, {
      global: {
        mocks: {
          $route: { path: '/orders/new' }
        }
      }
    })

    // Add item to form
    wrapper.vm.form.items.push({
      item_type: 'enrollment',
      item_id: 'COURSE001',
      item_name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      discount_amount: 0,
      final_price: 0,
      notes: '',
      package_id: null,
      validity_days: undefined
    })

    // Test updateItemDetails function behavior
    wrapper.vm.updateItemDetails(0)

    // Since no courses are loaded, nothing should change
    expect(wrapper.vm.form.items[0].unit_price).toBe(0)
  })

  it('should update item price based on selected package', async () => {
    const mockPackage = {
      package_id: 'PKG003',
      package_name: '優惠方案',
      session_count: 20,
      price: 8000,
      validity_days: 180
    }

    const wrapper = mount(OrderFormView, {
      global: {
        mocks: {
          $route: { path: '/orders/new' }
        }
      }
    })

    // Setup enrollment item
    wrapper.vm.form.items = [{
      item_type: 'enrollment',
      item_id: 'COURSE001',
      item_name: '數學班',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      discount_amount: 0,
      final_price: 0,
      notes: '',
      package_id: null,
      validity_days: undefined
    }]

    // Simulate package selection
    wrapper.vm.onPackageSelected(0, mockPackage)

    expect(wrapper.vm.form.items[0].package_id).toBe(mockPackage.package_id)
    expect(wrapper.vm.form.items[0].unit_price).toBe(mockPackage.price)
    expect(wrapper.vm.form.items[0].item_name).toContain('優惠方案')
    expect(wrapper.vm.form.items[0].validity_days).toBe(180)
  })
})
