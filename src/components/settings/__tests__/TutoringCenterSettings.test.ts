import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TutoringCenterSettings from '../TutoringCenterSettings.vue'
import { useAuthStore } from '@/stores/authSupabase'

// Mock Supabase
vi.mock('@/services/supabase', () => ({
  db: {
    create: vi.fn()
  },
  queries: {
    getClassrooms: vi.fn().mockResolvedValue([])
  },
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
        })),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      })),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null })
      })),
      insert: vi.fn().mockResolvedValue({ error: null })
    }))
  },
  storage: {
    upload: vi.fn(),
    getPublicUrl: vi.fn()
  }
}))

// Mock template services
vi.mock('@/services/templateService', () => ({
  loadTemplates: vi.fn().mockResolvedValue([]),
  uploadCustomTemplate: vi.fn(),
  deleteTemplate: vi.fn()
}))

vi.mock('@/services/templatePreviewService', () => ({
  generateTemplatePreview: vi.fn().mockReturnValue('<div>Preview</div>')
}))

describe('TutoringCenterSettings', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const authStore = useAuthStore()
    authStore.user = { user_id: 'test-user' }
  })

  describe('Component Structure', () => {
    it('should render receipt settings section when activeSection is templates', async () => {
      const wrapper = mount(TutoringCenterSettings)

      // Set active section to templates
      wrapper.vm.activeSection = 'templates'
      await wrapper.vm.$nextTick()

      // Check if receipt settings section exists
      const receiptSection = wrapper.find('[data-testid="receipt-settings"]')
      expect(receiptSection.exists()).toBe(false) // Should fail initially since we haven't added the data-testid

      // Check for receipt settings content
      const receiptHeading = wrapper.find('h3')
      expect(receiptHeading.text()).toContain('收據設定')
    })
  })

  describe('Receipt Settings Extraction', () => {
    it('should be able to extract receipt settings into a separate component', async () => {
      const wrapper = mount(TutoringCenterSettings)

      // Set active section to templates to show the receipt settings
      wrapper.vm.activeSection = 'templates'
      await wrapper.vm.$nextTick()

      // Look for the ReceiptSettings component
      const receiptSettingsComponent = wrapper.findComponent({ name: 'ReceiptSettings' })
      expect(receiptSettingsComponent.exists()).toBe(true)
    })
  })

  describe('Template Upload Modal Extraction', () => {
    it('should extract template upload modal into a separate component', async () => {
      const wrapper = mount(TutoringCenterSettings)

      // Set showTemplateForm to true to show the modal
      wrapper.vm.showTemplateForm = true
      await wrapper.vm.$nextTick()

      // Look for the TemplateUploadModal component
      const templateUploadModal = wrapper.findComponent({ name: 'TemplateUploadModal' })
      expect(templateUploadModal.exists()).toBe(true)
    })
  })

  describe('System Info Settings Extraction', () => {
    it('should extract basic system info settings into a separate component', async () => {
      const wrapper = mount(TutoringCenterSettings)

      // Set active section to basic to show system info
      wrapper.vm.activeSection = 'basic'
      await wrapper.vm.$nextTick()

      // Look for the SystemInfoSettings component
      const systemInfoSettings = wrapper.findComponent({ name: 'SystemInfoSettings' })
      expect(systemInfoSettings.exists()).toBe(true)
    })
  })

  describe('Classroom Settings Extraction', () => {
    it('should extract classroom settings into a separate component', async () => {
      const wrapper = mount(TutoringCenterSettings)

      // Set active section to classrooms
      wrapper.vm.activeSection = 'classrooms'
      await wrapper.vm.$nextTick()

      // Look for the ClassroomSettings component
      const classroomSettings = wrapper.findComponent({ name: 'ClassroomSettings' })
      expect(classroomSettings.exists()).toBe(true)
    })
  })
})
