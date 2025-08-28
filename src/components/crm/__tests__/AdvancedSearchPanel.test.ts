import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AdvancedSearchPanel from '../AdvancedSearchPanel.vue'
import { crmService } from '@/services/crmService'
import type { LeadSearchParams, Tag } from '@/types/crm'

// Mock CRM Service
vi.mock('@/services/crmService', () => ({
  crmService: {
    getTags: vi.fn()
  }
}))

// Mock Heroicons
vi.mock('@heroicons/vue/24/outline', () => ({
  ChevronDownIcon: { template: '<svg></svg>' },
  MagnifyingGlassIcon: { template: '<svg></svg>' }
}))

describe('AdvancedSearchPanel', () => {
  const mockTags: Tag[] = [
    {
      id: 1,
      tag_id: 'TAG001',
      name: 'VIP',
      color: '#FF0000',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    {
      id: 2,
      tag_id: 'TAG002',
      name: '重要',
      color: '#00FF00',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(crmService.getTags).mockResolvedValue(mockTags)
  })

  it('should render basic search fields', () => {
    const wrapper = mount(AdvancedSearchPanel, {
      props: {
        modelValue: {}
      }
    })

    expect(wrapper.find('input[placeholder*="姓名"]').exists()).toBe(true)
    expect(wrapper.find('select[multiple]').exists()).toBe(true)
    expect(wrapper.text()).toContain('進階搜尋')
  })

  it('should toggle expanded state', async () => {
    const wrapper = mount(AdvancedSearchPanel, {
      props: {
        modelValue: {}
      }
    })

    // Initially collapsed
    expect(wrapper.find('[data-testid="advanced-filters"]').exists()).toBe(false)

    // Click expand button
    const toggleButton = wrapper.find('button')
    await toggleButton.trigger('click')

    // Should show advanced filters
    expect(wrapper.find('[data-testid="advanced-filters"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('日期範圍')
    expect(wrapper.text()).toContain('學生資訊')
  })

  it('should emit search event with filters', async () => {
    const wrapper = mount(AdvancedSearchPanel, {
      props: {
        modelValue: {}
      }
    })

    // Set search keyword
    const searchInput = wrapper.find('input[placeholder*="姓名"]')
    await searchInput.setValue('測試學生')

    // Click search button
    const searchButton = wrapper.find('button[class*="bg-primary"]')
    await searchButton.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('search')).toBeTruthy()

    const emittedValue = wrapper.emitted('update:modelValue')[0][0] as LeadSearchParams
    expect(emittedValue.search).toBe('測試學生')
  })

  it('should handle status multi-select', async () => {
    const wrapper = mount(AdvancedSearchPanel, {
      props: {
        modelValue: {}
      }
    })

    // Select multiple statuses
    const statusSelect = wrapper.find('select[multiple]')
    await statusSelect.setValue(['new', 'contacted'])

    // Trigger search
    const searchButton = wrapper.find('button[class*="bg-primary"]')
    await searchButton.trigger('click')

    const emittedValue = wrapper.emitted('update:modelValue')[0][0] as LeadSearchParams
    expect(emittedValue.status).toEqual(['new', 'contacted'])
  })

  it('should handle date range filters', async () => {
    const wrapper = mount(AdvancedSearchPanel, {
      props: {
        modelValue: {}
      }
    })

    // Expand panel
    await wrapper.find('button').trigger('click')

    // Set date range
    const dateInputs = wrapper.findAll('input[type="date"]')
    await dateInputs[0].setValue('2024-01-01')
    await dateInputs[1].setValue('2024-01-31')

    // Trigger search
    const searchButton = wrapper.find('button[class*="bg-primary"]')
    await searchButton.trigger('click')

    const emittedValue = wrapper.emitted('update:modelValue')[0][0] as LeadSearchParams
    expect(emittedValue.date_from).toBe('2024-01-01')
    expect(emittedValue.date_to).toBe('2024-01-31')
  })

  it('should handle age range filters', async () => {
    const wrapper = mount(AdvancedSearchPanel, {
      props: {
        modelValue: {}
      }
    })

    // Expand panel
    await wrapper.find('button').trigger('click')

    // Set age range
    const ageInputs = wrapper.findAll('input[type="number"]')
    await ageInputs[0].setValue(10)
    await ageInputs[1].setValue(18)

    // Trigger search
    const searchButton = wrapper.find('button[class*="bg-primary"]')
    await searchButton.trigger('click')

    const emittedValue = wrapper.emitted('update:modelValue')[0][0] as LeadSearchParams
    expect(emittedValue.age_min).toBe(10)
    expect(emittedValue.age_max).toBe(18)
  })

  it('should handle interest subjects checkboxes', async () => {
    const wrapper = mount(AdvancedSearchPanel, {
      props: {
        modelValue: {}
      }
    })

    // Expand panel
    await wrapper.find('button').trigger('click')

    // Select interests
    const interestCheckboxes = wrapper.findAll('input[type="checkbox"][value]')
    await interestCheckboxes[0].setValue(true) // english
    await interestCheckboxes[1].setValue(true) // math

    // Trigger search
    const searchButton = wrapper.find('button[class*="bg-primary"]')
    await searchButton.trigger('click')

    const emittedValue = wrapper.emitted('update:modelValue')[0][0] as LeadSearchParams
    expect(emittedValue.interest_subjects).toContain('english')
    expect(emittedValue.interest_subjects).toContain('math')
  })

  it('should load and display tags', async () => {
    const wrapper = mount(AdvancedSearchPanel, {
      props: {
        modelValue: {}
      }
    })

    // Wait for tags to load
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Expand panel
    await wrapper.find('button').trigger('click')

    expect(crmService.getTags).toHaveBeenCalled()
    expect(wrapper.text()).toContain('VIP')
    expect(wrapper.text()).toContain('重要')
  })

  it('should handle tag selection', async () => {
    const wrapper = mount(AdvancedSearchPanel, {
      props: {
        modelValue: {}
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Expand panel
    await wrapper.find('button').trigger('click')

    // Click on tag
    const tagLabels = wrapper.findAll('label span[class*="cursor-pointer"]')
    await tagLabels[0].trigger('click')

    // Trigger search
    const searchButton = wrapper.find('button[class*="bg-primary"]')
    await searchButton.trigger('click')

    const emittedValue = wrapper.emitted('update:modelValue')[0][0] as LeadSearchParams
    expect(emittedValue.tag_ids).toContain('TAG001')
  })

  it('should reset all filters', async () => {
    const wrapper = mount(AdvancedSearchPanel, {
      props: {
        modelValue: {
          search: 'test',
          status: ['new'],
          source: ['online']
        }
      }
    })

    // Click reset button
    const resetButton = wrapper.find('button:not([class*="bg-primary"])')
    await resetButton.trigger('click')

    const emittedValue = wrapper.emitted('update:modelValue')[0][0] as LeadSearchParams
    expect(emittedValue.search).toBe('')
    expect(emittedValue.status).toEqual([])
    expect(emittedValue.source).toEqual([])
  })

  it('should handle sort options', async () => {
    const wrapper = mount(AdvancedSearchPanel, {
      props: {
        modelValue: {}
      }
    })

    // Expand panel
    await wrapper.find('button').trigger('click')

    // Set sort options
    const sortSelects = wrapper.findAll('select:not([multiple])')
    await sortSelects[0].setValue('full_name')
    await sortSelects[1].setValue('asc')

    // Trigger search
    const searchButton = wrapper.find('button[class*="bg-primary"]')
    await searchButton.trigger('click')

    const emittedValue = wrapper.emitted('update:modelValue')[0][0] as LeadSearchParams
    expect(emittedValue.sort_by).toBe('full_name')
    expect(emittedValue.sort_order).toBe('asc')
  })

  it('should filter out empty values before emitting', async () => {
    const wrapper = mount(AdvancedSearchPanel, {
      props: {
        modelValue: {}
      }
    })

    // Set some empty values
    const searchInput = wrapper.find('input[placeholder*="姓名"]')
    await searchInput.setValue('')

    // Trigger search
    const searchButton = wrapper.find('button[class*="bg-primary"]')
    await searchButton.trigger('click')

    const emittedValue = wrapper.emitted('update:modelValue')[0][0] as LeadSearchParams
    expect(emittedValue.search).toBeUndefined()
  })
})
