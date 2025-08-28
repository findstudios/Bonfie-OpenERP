import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LeadImportModal from '../LeadImportModal.vue'
import { crmService } from '@/services/crmService'
import * as fileImport from '@/utils/fileImport'

// Mock dependencies
vi.mock('@/services/crmService', () => ({
  crmService: {
    bulkImportLeads: vi.fn()
  }
}))

vi.mock('@/utils/fileImport', () => ({
  parseCSV: vi.fn(),
  validateRequiredFields: vi.fn(),
  downloadTemplate: vi.fn()
}))

// Mock HeadlessUI components
vi.mock('@headlessui/vue', () => ({
  Dialog: {
    template: '<div v-if="open"><slot /></div>',
    props: ['open']
  },
  DialogOverlay: {
    template: '<div><slot /></div>'
  },
  DialogTitle: {
    template: '<h3><slot /></h3>'
  },
  TransitionRoot: {
    template: '<div><slot /></div>',
    props: ['show']
  },
  TransitionChild: {
    template: '<div><slot /></div>'
  }
}))

describe('LeadImportModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render modal when show is true', () => {
    const wrapper = mount(LeadImportModal, {
      props: {
        show: true
      }
    })

    expect(wrapper.text()).toContain('批量匯入潛在客戶')
    expect(wrapper.text()).toContain('上傳檔案')
  })

  it('should not render when show is false', () => {
    const wrapper = mount(LeadImportModal, {
      props: {
        show: false
      }
    })

    expect(wrapper.text()).not.toContain('批量匯入潛在客戶')
  })

  it('should download template when button is clicked', async () => {
    const wrapper = mount(LeadImportModal, {
      props: {
        show: true
      }
    })

    const downloadButton = wrapper.find('button[class*="text-primary"]')
    await downloadButton.trigger('click')

    expect(fileImport.downloadTemplate).toHaveBeenCalledWith(
      'leads_import_template.csv',
      expect.any(Array),
      expect.any(Array)
    )
  })

  it('should handle file selection', async () => {
    const wrapper = mount(LeadImportModal, {
      props: {
        show: true
      }
    })

    const mockFile = new File(['test,data'], 'test.csv', { type: 'text/csv' })
    const fileInput = wrapper.find('input[type="file"]')

    Object.defineProperty(fileInput.element, 'files', {
      value: [mockFile],
      writable: false
    })

    await fileInput.trigger('change')

    expect(wrapper.vm.selectedFile).toBe(mockFile)
  })

  it('should parse CSV and show preview', async () => {
    const mockCSVData = [
      ['姓名', '聯絡人', '電話', 'Email', '年齡', '學校', '年級', '來源', '興趣科目', '備註'],
      ['學生1', '家長1', '0912345678', 'test1@example.com', '12', '國小', '六年級', 'online', 'english,math', '測試備註']
    ]

    vi.mocked(fileImport.parseCSV).mockResolvedValue(mockCSVData)
    vi.mocked(fileImport.validateRequiredFields).mockReturnValue({ valid: true, errors: [] })

    const wrapper = mount(LeadImportModal, {
      props: {
        show: true
      }
    })

    // Select file
    const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' })
    wrapper.vm.selectedFile = mockFile

    // Click upload button
    const uploadButton = wrapper.find('button[class*="bg-primary"]')
    await uploadButton.trigger('click')

    // Wait for async operations
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(fileImport.parseCSV).toHaveBeenCalledWith(mockFile)
    expect(wrapper.vm.step).toBe(2) // Should move to preview step
    expect(wrapper.vm.parsedData).toHaveLength(1)
  })

  it('should validate required fields', async () => {
    const mockCSVData = [
      ['姓名', '電話'], // Missing required fields
      ['學生1', ''] // Missing phone
    ]

    vi.mocked(fileImport.parseCSV).mockResolvedValue(mockCSVData)
    vi.mocked(fileImport.validateRequiredFields).mockReturnValue({
      valid: false,
      errors: ['電話 is required']
    })

    const wrapper = mount(LeadImportModal, {
      props: {
        show: true
      }
    })

    wrapper.vm.selectedFile = new File(['test'], 'test.csv')

    const uploadButton = wrapper.find('button[class*="bg-primary"]')
    await uploadButton.trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Should still be on step 1 due to validation error
    expect(wrapper.vm.step).toBe(1)
    expect(wrapper.vm.error).toContain('資料驗證失敗')
  })

  it('should import leads successfully', async () => {
    const mockImportResult = {
      success: [
        { lead_id: 'LEAD001', full_name: '學生1' }
      ],
      failed: []
    }

    vi.mocked(crmService.bulkImportLeads).mockResolvedValue(mockImportResult)

    const wrapper = mount(LeadImportModal, {
      props: {
        show: true
      }
    })

    // Set parsed data
    wrapper.vm.parsedData = [{
      full_name: '學生1',
      parent_name: '家長1',
      phone: '0912345678',
      source: 'online'
    }]
    wrapper.vm.step = 2

    // Click import button
    const importButton = wrapper.findAll('button[class*="bg-primary"]')[1]
    await importButton.trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(crmService.bulkImportLeads).toHaveBeenCalledWith([
      expect.objectContaining({
        full_name: '學生1',
        parent_name: '家長1',
        phone: '0912345678',
        source: 'online'
      })
    ])

    expect(wrapper.vm.step).toBe(3) // Should move to results step
    expect(wrapper.vm.importResult.success).toHaveLength(1)
  })

  it('should handle import with failures', async () => {
    const mockImportResult = {
      success: [
        { lead_id: 'LEAD001', full_name: '學生1' }
      ],
      failed: [
        { data: { full_name: '學生2' }, error: 'Duplicate phone number' }
      ]
    }

    vi.mocked(crmService.bulkImportLeads).mockResolvedValue(mockImportResult)

    const wrapper = mount(LeadImportModal, {
      props: {
        show: true
      }
    })

    wrapper.vm.parsedData = [
      { full_name: '學生1', phone: '0912345678', source: 'online' },
      { full_name: '學生2', phone: '0912345678', source: 'online' }
    ]
    wrapper.vm.step = 2

    const importButton = wrapper.findAll('button[class*="bg-primary"]')[1]
    await importButton.trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.vm.importResult.success).toHaveLength(1)
    expect(wrapper.vm.importResult.failed).toHaveLength(1)
    expect(wrapper.text()).toContain('成功匯入')
    expect(wrapper.text()).toContain('匯入失敗')
  })

  it('should reset state when modal is closed', async () => {
    const wrapper = mount(LeadImportModal, {
      props: {
        show: true
      }
    })

    // Set some state
    wrapper.vm.step = 3
    wrapper.vm.selectedFile = new File(['test'], 'test.csv')
    wrapper.vm.error = 'Some error'

    // Close modal
    await wrapper.vm.close()

    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.vm.step).toBe(1)
    expect(wrapper.vm.selectedFile).toBeNull()
    expect(wrapper.vm.error).toBe('')
  })

  it('should emit imported event with count', async () => {
    const mockImportResult = {
      success: [
        { lead_id: 'LEAD001', full_name: '學生1' },
        { lead_id: 'LEAD002', full_name: '學生2' }
      ],
      failed: []
    }

    vi.mocked(crmService.bulkImportLeads).mockResolvedValue(mockImportResult)

    const wrapper = mount(LeadImportModal, {
      props: {
        show: true
      }
    })

    wrapper.vm.parsedData = [
      { full_name: '學生1', phone: '0912345678', source: 'online' },
      { full_name: '學生2', phone: '0987654321', source: 'referral' }
    ]
    wrapper.vm.step = 2

    const importButton = wrapper.findAll('button[class*="bg-primary"]')[1]
    await importButton.trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Click finish button
    const finishButton = wrapper.find('button[class*="bg-green"]')
    await finishButton.trigger('click')

    expect(wrapper.emitted('imported')).toBeTruthy()
    expect(wrapper.emitted('imported')[0]).toEqual([2])
  })

  it('should handle file type validation', async () => {
    const wrapper = mount(LeadImportModal, {
      props: {
        show: true
      }
    })

    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    const fileInput = wrapper.find('input[type="file"]')

    Object.defineProperty(fileInput.element, 'files', {
      value: [mockFile],
      writable: false
    })

    await fileInput.trigger('change')

    // File should be rejected due to wrong type
    expect(wrapper.vm.selectedFile).toBeNull()
  })

  it('should navigate between steps correctly', async () => {
    const wrapper = mount(LeadImportModal, {
      props: {
        show: true
      }
    })

    // Initially at step 1
    expect(wrapper.vm.step).toBe(1)

    // Move to step 2
    wrapper.vm.parsedData = [{ full_name: 'Test' }]
    wrapper.vm.step = 2

    // Should show preview table
    expect(wrapper.text()).toContain('預覽資料')

    // Click back button
    const backButton = wrapper.find('button[class*="border-gray"]')
    await backButton.trigger('click')

    expect(wrapper.vm.step).toBe(1)
  })
})
