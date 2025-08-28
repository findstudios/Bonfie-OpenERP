import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TagSelector from '../TagSelector.vue'
import { crmService } from '@/services/crmService'
import type { Tag } from '@/types/crm'

// Mock CRM Service
vi.mock('@/services/crmService', () => ({
  crmService: {
    getTags: vi.fn(),
    createTag: vi.fn(),
    addTagsToLead: vi.fn(),
    removeTagFromLead: vi.fn()
  }
}))

describe('TagSelector', () => {
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

  it('should render and load tags on mount', async () => {
    const wrapper = mount(TagSelector, {
      props: {
        modelValue: [],
        leadId: 'LEAD001'
      }
    })

    // Wait for tags to load
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(crmService.getTags).toHaveBeenCalled()
    expect(wrapper.text()).toContain('標籤')
  })

  it('should display selected tags', async () => {
    const selectedTags = [mockTags[0]]
    const wrapper = mount(TagSelector, {
      props: {
        modelValue: selectedTags,
        leadId: 'LEAD001'
      }
    })

    await wrapper.vm.$nextTick()

    const tagElements = wrapper.findAll('[data-testid="selected-tag"]')
    expect(tagElements).toHaveLength(1)
    expect(wrapper.text()).toContain('VIP')
  })

  it('should emit update when tag is selected', async () => {
    const wrapper = mount(TagSelector, {
      props: {
        modelValue: [],
        leadId: 'LEAD001'
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Open dropdown
    const dropdown = wrapper.find('[data-testid="tag-dropdown-button"]')
    await dropdown.trigger('click')

    // Select a tag
    const tagOption = wrapper.find('[data-testid="tag-option-TAG001"]')
    await tagOption.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0][0]).toContainEqual(
      expect.objectContaining({ tag_id: 'TAG001' })
    )
  })

  it('should remove tag when X is clicked', async () => {
    const selectedTags = [mockTags[0]]
    const wrapper = mount(TagSelector, {
      props: {
        modelValue: selectedTags,
        leadId: 'LEAD001'
      }
    })

    await wrapper.vm.$nextTick()

    const removeButton = wrapper.find('[data-testid="remove-tag-TAG001"]')
    await removeButton.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual([])
  })

  it('should filter tags based on search input', async () => {
    const wrapper = mount(TagSelector, {
      props: {
        modelValue: [],
        leadId: 'LEAD001'
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Open dropdown
    const dropdown = wrapper.find('[data-testid="tag-dropdown-button"]')
    await dropdown.trigger('click')

    // Type in search
    const searchInput = wrapper.find('[data-testid="tag-search-input"]')
    await searchInput.setValue('VIP')

    // Check filtered results
    const tagOptions = wrapper.findAll('[data-testid^="tag-option-"]')
    expect(tagOptions).toHaveLength(1)
    expect(wrapper.text()).toContain('VIP')
    expect(wrapper.text()).not.toContain('重要')
  })

  it('should show create option when searching for new tag', async () => {
    const wrapper = mount(TagSelector, {
      props: {
        modelValue: [],
        leadId: 'LEAD001'
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Open dropdown and search for non-existing tag
    const dropdown = wrapper.find('[data-testid="tag-dropdown-button"]')
    await dropdown.trigger('click')

    const searchInput = wrapper.find('[data-testid="tag-search-input"]')
    await searchInput.setValue('新標籤')

    // Should show create option
    const createOption = wrapper.find('[data-testid="create-tag-option"]')
    expect(createOption.exists()).toBe(true)
    expect(createOption.text()).toContain('建立新標籤 "新標籤"')
  })

  it('should create new tag', async () => {
    const newTag: Tag = {
      id: 3,
      tag_id: 'TAG003',
      name: '新標籤',
      color: '#0000FF',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }

    vi.mocked(crmService.createTag).mockResolvedValue(newTag)

    const wrapper = mount(TagSelector, {
      props: {
        modelValue: [],
        leadId: 'LEAD001'
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Open dropdown and search
    const dropdown = wrapper.find('[data-testid="tag-dropdown-button"]')
    await dropdown.trigger('click')

    const searchInput = wrapper.find('[data-testid="tag-search-input"]')
    await searchInput.setValue('新標籤')

    // Click create option
    const createOption = wrapper.find('[data-testid="create-tag-option"]')
    await createOption.trigger('click')

    expect(crmService.createTag).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '新標籤',
        color: expect.any(String)
      })
    )

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('should handle API errors gracefully', async () => {
    vi.mocked(crmService.getTags).mockRejectedValue(new Error('API Error'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mount(TagSelector, {
      props: {
        modelValue: [],
        leadId: 'LEAD001'
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(consoleSpy).toHaveBeenCalledWith('載入標籤失敗:', expect.any(Error))
    consoleSpy.mockRestore()
  })

  it('should display tag colors correctly', async () => {
    const wrapper = mount(TagSelector, {
      props: {
        modelValue: mockTags,
        leadId: 'LEAD001'
      }
    })

    await wrapper.vm.$nextTick()

    const tagElements = wrapper.findAll('[data-testid^="selected-tag-"]')

    // Check that tag colors are applied
    tagElements.forEach((tag, index) => {
      const style = tag.attributes('style')
      expect(style).toContain(mockTags[index].color)
    })
  })
})
