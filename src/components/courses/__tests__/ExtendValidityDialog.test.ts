import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import ExtendValidityDialog from '../ExtendValidityDialog.vue'
import type { Enrollment } from '@/types'

// Mock creditManagementService
vi.mock('@/services/creditManagementService', () => ({
  creditManagementService: {
    extendEnrollmentValidity: vi.fn().mockResolvedValue({
      extension_id: 'EXT001',
      enrollment_id: 'ENR001',
      extended_days: 30,
      original_expiry: '2024-03-01',
      new_expiry: '2024-03-31',
      reason: 'Test reason'
    })
  }
}))

// Mock Headless UI components
vi.mock('@headlessui/vue', () => ({
  TransitionRoot: { template: '<div><slot /></div>' },
  TransitionChild: { template: '<div><slot /></div>' },
  Dialog: { template: '<div><slot /></div>' },
  DialogPanel: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<h3><slot /></h3>' }
}))

// Mock auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { user_id: 'USER001', full_name: 'Test User' }
  })
}))

describe('ExtendValidityDialog', () => {
  let wrapper: any
  const mockEnrollment: Enrollment = {
    enrollment_id: 'ENR001',
    student_id: 'STU001',
    course_id: 'CRS001',
    student: {
      student_id: 'STU001',
      chinese_name: '王小明',
      english_name: 'John Wang'
    },
    course: {
      course_id: 'CRS001',
      course_name: '數學基礎班'
    },
    valid_until: '2024-03-01',
    remaining_sessions: 10,
    purchased_sessions: 20,
    status: 'active'
  } as Enrollment

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display enrollment information', async () => {
    wrapper = mount(ExtendValidityDialog, {
      props: {
        show: true,
        enrollment: mockEnrollment
      },
      global: {
        plugins: [createPinia()]
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('王小明')
    expect(wrapper.text()).toContain('數學基礎班')
    expect(wrapper.text()).toContain('2024/3/1')
    expect(wrapper.text()).toContain('10 堂')
  })

  it('should calculate new expiry date when days are selected', async () => {
    wrapper = mount(ExtendValidityDialog, {
      props: {
        show: true,
        enrollment: mockEnrollment
      },
      global: {
        plugins: [createPinia()]
      }
    })

    await wrapper.vm.$nextTick()

    // Select 60 days
    const select = wrapper.find('select')
    await select.setValue(60)

    // Check if new expiry date is calculated correctly
    expect(wrapper.text()).toContain('新到期日')
    expect(wrapper.text()).toContain('2024/4/30')
  })

  it('should require reason before confirming', async () => {
    wrapper = mount(ExtendValidityDialog, {
      props: {
        show: true,
        enrollment: mockEnrollment
      },
      global: {
        plugins: [createPinia()]
      }
    })

    await wrapper.vm.$nextTick()

    // Confirm button should be disabled initially
    const confirmButton = wrapper.findAll('button').find((btn: any) => btn.text().includes('確認延長'))
    expect(confirmButton?.element.disabled).toBe(true)

    // Enter reason
    const textarea = wrapper.find('textarea')
    await textarea.setValue('學生生病請假')

    // Confirm button should now be enabled
    expect(confirmButton?.element.disabled).toBe(false)
  })

  it('should call extendEnrollmentValidity when confirmed', async () => {
    const { creditManagementService } = await import('@/services/creditManagementService')

    wrapper = mount(ExtendValidityDialog, {
      props: {
        show: true,
        enrollment: mockEnrollment
      },
      global: {
        plugins: [createPinia()]
      }
    })

    await wrapper.vm.$nextTick()

    // Set reason
    const textarea = wrapper.find('textarea')
    await textarea.setValue('學生生病請假')

    // Click confirm
    const confirmButton = wrapper.findAll('button').find((btn: any) => btn.text().includes('確認延長'))
    await confirmButton?.trigger('click')

    // Check if service was called
    expect(creditManagementService.extendEnrollmentValidity).toHaveBeenCalledWith(
      'ENR001',
      30,
      '學生生病請假',
      'USER001',
      'USER001'
    )
  })

  it('should emit confirm event with data after successful extension', async () => {
    wrapper = mount(ExtendValidityDialog, {
      props: {
        show: true,
        enrollment: mockEnrollment
      },
      global: {
        plugins: [createPinia()]
      }
    })

    await wrapper.vm.$nextTick()

    // Set reason
    const textarea = wrapper.find('textarea')
    await textarea.setValue('學生生病請假')

    // Click confirm
    const confirmButton = wrapper.findAll('button').find((btn: any) => btn.text().includes('確認延長'))
    await confirmButton?.trigger('click')

    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check if confirm event was emitted
    expect(wrapper.emitted('confirm')).toBeTruthy()
    expect(wrapper.emitted('confirm')[0]).toEqual([{
      days: 30,
      reason: '學生生病請假'
    }])
  })
})
