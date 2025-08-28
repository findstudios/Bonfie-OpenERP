import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ContactDataModule from '../ContactDataModule.vue'

// Mock Supabase
vi.mock('@/services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      })),
      insert: vi.fn(() => ({ error: null })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      }))
    }))
  }
}))

// Mock auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { user_id: 'test-user' }
  })
}))

describe('ContactDataModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should load student contacts when studentDbId is provided', async () => {
    const wrapper = mount(ContactDataModule, {
      props: {
        studentDbId: 2,
        studentId: 'S20250001'
      }
    })

    await wrapper.vm.$nextTick()

    // 應該嘗試載入聯絡人資料
    expect(wrapper.text()).toContain('聯絡人資料')
  })

  it('should show empty state when no contacts', async () => {
    const wrapper = mount(ContactDataModule, {
      props: {
        studentDbId: 2,
        studentId: 'S20250001'
      }
    })

    await wrapper.vm.$nextTick()

    // 應該顯示空狀態
    expect(wrapper.text()).toContain('尚未新增任何聯絡人')
  })

  it('should allow adding new contact', async () => {
    const wrapper = mount(ContactDataModule, {
      props: {
        studentDbId: 2,
        studentId: 'S20250001'
      }
    })

    await wrapper.vm.$nextTick()

    // 尋找新增按鈕
    const addButton = wrapper.find('button')
    expect(addButton.exists()).toBe(true)
    expect(addButton.text()).toContain('新增')
  })
})
