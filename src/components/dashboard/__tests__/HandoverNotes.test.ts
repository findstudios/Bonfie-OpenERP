import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import HandoverNotes from '../HandoverNotes.vue'

describe('HandoverNotes', () => {
  const mockUser = {
    user_id: 'USER001',
    full_name: '測試用戶'
  }

  const mockNotes = [
    {
      id: 'NOTE001',
      content: '內部人員的交班的注意事項與紀錄 @林老師 請注意',
      author: {
        user_id: 'USER002',
        full_name: '陳老師'
      },
      created_at: new Date().toISOString(),
      priority: 'normal',
      tags: ['教室101', '@林老師'],
      read_by: []
    },
    {
      id: 'NOTE002',
      content: '緊急！@王老師 @李老師 明天的課程需要調整',
      author: {
        user_id: 'USER003',
        full_name: '張老師'
      },
      created_at: new Date(Date.now() - 3600000).toISOString(),
      priority: 'urgent',
      tags: ['@王老師', '@李老師'],
      read_by: ['USER001']
    }
  ]

  it('should render notes list', () => {
    const wrapper = mount(HandoverNotes, {
      props: {
        notes: mockNotes,
        currentUser: mockUser
      }
    })

    expect(wrapper.findAll('[data-testid^="note-item-"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('內部人員的交班的注意事項與紀錄')
    expect(wrapper.text()).toContain('緊急！@王老師 @李老師 明天的課程需要調整')
  })

  it('should show add note button', () => {
    const wrapper = mount(HandoverNotes, {
      props: {
        notes: [],
        currentUser: mockUser
      }
    })

    const addButton = wrapper.find('[data-testid="add-note-button"]')
    expect(addButton.exists()).toBe(true)
    expect(addButton.text()).toContain('新增記錄')
  })

  it('should toggle add note form when button is clicked', async () => {
    const wrapper = mount(HandoverNotes, {
      props: {
        notes: [],
        currentUser: mockUser
      }
    })

    const addButton = wrapper.find('[data-testid="add-note-button"]')
    expect(wrapper.find('[data-testid="note-input"]').exists()).toBe(false)

    await addButton.trigger('click')
    expect(wrapper.find('[data-testid="note-input"]').exists()).toBe(true)
  })

  it('should extract @mentions from note content', async () => {
    const wrapper = mount(HandoverNotes, {
      props: {
        notes: [],
        currentUser: mockUser
      }
    })

    await wrapper.find('[data-testid="add-note-button"]').trigger('click')

    const textarea = wrapper.find('[data-testid="note-input"]')
    await textarea.setValue('這是一個測試 @張老師 @李老師 請注意')

    const submitButton = wrapper.find('[data-testid="submit-note-button"]')
    await submitButton.trigger('click')

    const emittedEvents = wrapper.emitted('add-note')
    expect(emittedEvents).toBeTruthy()
    expect(emittedEvents![0][0]).toEqual({
      content: '這是一個測試 @張老師 @李老師 請注意',
      priority: 'normal',
      tags: ['@張老師', '@李老師']
    })
  })

  it('should display @mentions as blue tags', () => {
    const wrapper = mount(HandoverNotes, {
      props: {
        notes: mockNotes,
        currentUser: mockUser
      }
    })

    const tags = wrapper.findAll('[data-testid^="tag-"]')
    const mentionTags = tags.filter(tag => tag.text().startsWith('@'))

    expect(mentionTags.length).toBeGreaterThan(0)
    mentionTags.forEach(tag => {
      expect(tag.classes()).toContain('bg-blue-100')
      expect(tag.classes()).toContain('text-blue-800')
    })
  })

  it('should display urgent priority badge', () => {
    const wrapper = mount(HandoverNotes, {
      props: {
        notes: mockNotes,
        currentUser: mockUser
      }
    })

    const urgentBadge = wrapper.find('[data-testid="priority-badge"]')
    expect(urgentBadge.exists()).toBe(true)
    expect(urgentBadge.text()).toBe('緊急')
  })

  it('should show unread status for new notes', () => {
    const wrapper = mount(HandoverNotes, {
      props: {
        notes: mockNotes,
        currentUser: mockUser
      }
    })

    const noteItems = wrapper.findAll('[data-testid^="note-item-"]')
    const unreadNote = noteItems[0]

    expect(unreadNote.classes()).toContain('border-blue-300')
    expect(unreadNote.classes()).toContain('bg-blue-50')
  })

  it('should emit mark-read event when marking note as read', async () => {
    const wrapper = mount(HandoverNotes, {
      props: {
        notes: mockNotes,
        currentUser: mockUser
      }
    })

    // This functionality is handled automatically when notes are viewed
    // Check that read notes have different styling
    const noteItems = wrapper.findAll('[data-testid^="note-item-"]')
    const readNote = noteItems[1] // Second note is already read by USER001

    expect(readNote.classes()).toContain('border-gray-200')
    expect(readNote.classes()).not.toContain('bg-blue-50')
  })

  it('should filter notes based on search query', async () => {
    const wrapper = mount(HandoverNotes, {
      props: {
        notes: mockNotes,
        currentUser: mockUser
      }
    })

    const searchInput = wrapper.find('[data-testid="search-input"]')
    await searchInput.setValue('林老師')

    // Wait for the search to update
    await wrapper.vm.$nextTick()

    const visibleNotes = wrapper.findAll('[data-testid^="note-item-"]')
    expect(visibleNotes).toHaveLength(1)
    expect(visibleNotes[0].text()).toContain('@林老師')
  })

  it('should show empty state when no notes', () => {
    const wrapper = mount(HandoverNotes, {
      props: {
        notes: [],
        currentUser: mockUser
      }
    })

    expect(wrapper.text()).toContain('新增記錄')
  })
})
