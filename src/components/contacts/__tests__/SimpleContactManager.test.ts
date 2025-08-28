import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SimpleContactManager from '../SimpleContactManager.vue'
import { contactService } from '@/services/contactService'
import type { ContactFormData } from '../types'

// Mock contactService
vi.mock('@/services/contactService', () => ({
  contactService: {
    getStudentContacts: vi.fn(),
    updateStudentContacts: vi.fn(),
    validateStudentContacts: vi.fn()
  }
}))

// Mock Supabase
vi.mock('@/services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      delete: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
      update: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
      insert: vi.fn(() => ({ error: null }))
    }))
  }
}))

// Mock auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { user_id: 'test-user' }
  })
}))

describe('SimpleContactManager', () => {
  const mockStudentId = 'S123'
  const mockContacts: ContactFormData[] = [
    {
      contact_id: 'C001',
      full_name: '張爸爸',
      phone: '0912345678',
      email: 'dad@example.com',
      address: '台北市信義區',
      relationship: '父親',
      is_primary: true,
      is_emergency: false,
      is_billing: true,
      notes: '主要聯絡人',
      student_contact_id: 1
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should load contacts on mount when studentId is provided', async () => {
    // Arrange
    const getStudentContactsMock = vi.mocked(contactService.getStudentContacts)
    getStudentContactsMock.mockResolvedValue(mockContacts)

    // Act
    const wrapper = mount(SimpleContactManager, {
      props: { studentId: mockStudentId }
    })

    // Wait for async operations
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Assert
    expect(getStudentContactsMock).toHaveBeenCalledWith(mockStudentId)
  })

  it('should show loading state while fetching contacts', async () => {
    // Arrange
    const getStudentContactsMock = vi.mocked(contactService.getStudentContacts)
    getStudentContactsMock.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve(mockContacts), 100))
    )

    // Act
    const wrapper = mount(SimpleContactManager, {
      props: { studentId: mockStudentId }
    })

    // Assert
    expect(wrapper.text()).toContain('載入聯絡人資料中')
  })

  it('should save contacts with proper validation', async () => {
    // Arrange
    const validateStudentContactsMock = vi.mocked(contactService.validateStudentContacts)
    const getStudentContactsMock = vi.mocked(contactService.getStudentContacts)

    validateStudentContactsMock.mockReturnValue([])
    getStudentContactsMock.mockResolvedValue(mockContacts)

    const wrapper = mount(SimpleContactManager, {
      props: {
        studentId: mockStudentId,
        initialContacts: mockContacts
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Manually trigger the save function
    const vm = wrapper.vm as any
    await vm.saveContacts()

    // Assert
    expect(validateStudentContactsMock).toHaveBeenCalled()
    // Note: We no longer call getStudentContacts in saveContacts to avoid redirect
  })

  it('should emit contacts-updated when contacts change', async () => {
    // Arrange
    const getStudentContactsMock = vi.mocked(contactService.getStudentContacts)
    getStudentContactsMock.mockResolvedValue([])

    const wrapper = mount(SimpleContactManager, {
      props: { studentId: mockStudentId }
    })

    await wrapper.vm.$nextTick()

    // Act - add contact
    const buttons = wrapper.findAll('button')
    const addButton = buttons.find(button => button.text().includes('新增第一個聯絡人'))
    if (addButton) {
      await addButton.trigger('click')
    }

    // Assert
    const emittedEvents = wrapper.emitted('contacts-updated')
    expect(emittedEvents).toBeTruthy()
    expect(emittedEvents![0][0]).toHaveLength(1) // Should have one contact after adding
  })

  it('should show error when save fails', async () => {
    // Arrange
    const validateStudentContactsMock = vi.mocked(contactService.validateStudentContacts)

    // Mock validation to return errors
    validateStudentContactsMock.mockReturnValue(['聯絡人姓名不能為空'])

    const wrapper = mount(SimpleContactManager, {
      props: {
        studentId: mockStudentId,
        initialContacts: mockContacts
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Act - manually trigger save function that will fail validation
    const vm = wrapper.vm as any
    await vm.saveContacts()

    // Assert
    const emittedEvents = wrapper.emitted('save-error')
    expect(emittedEvents).toBeTruthy()
    expect(emittedEvents![0][0]).toBeInstanceOf(Error)
  })
})
