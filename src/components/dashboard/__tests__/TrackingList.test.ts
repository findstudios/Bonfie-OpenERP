import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TrackingList from '../TrackingList.vue'

describe('TrackingList.vue', () => {
  const mockTrackingItems = [
    {
      id: 'TRACK001',
      type: 'absent',
      priority: 'high',
      student: {
        student_id: 'STD001',
        chinese_name: '陳佑昇',
        english_name: 'Chen You-Sheng'
      },
      course_name: 'XXX課',
      class_time: '15:00-16:30',
      contact: {
        name: '陳媽媽',
        phone: '0912345678',
        relationship: '母親'
      },
      completed: false,
      notes: '已請假'
    },
    {
      id: 'TRACK002',
      type: 'trial',
      priority: 'medium',
      student: {
        student_id: 'STD002',
        chinese_name: '林佩佩',
        english_name: 'Lin Pei-Pei'
      },
      course_name: 'XXO課',
      class_time: '16:30-18:00',
      contact: {
        name: '林爸爸',
        phone: '0923456789',
        relationship: '父親'
      },
      completed: false,
      notes: '試聽'
    },
    {
      id: 'TRACK003',
      type: 'special',
      priority: 'low',
      student: {
        student_id: 'STD003',
        chinese_name: '王小明',
        english_name: 'Wang Xiao-Ming'
      },
      course_name: 'YYY課',
      class_time: '18:00-19:30',
      contact: {
        name: '王媽媽',
        phone: '0934567890',
        relationship: '母親'
      },
      completed: true,
      notes: '已聯絡'
    }
  ]

  it('should render tracking items grouped by type', () => {
    const wrapper = mount(TrackingList, {
      props: {
        items: mockTrackingItems
      }
    })

    const typeHeaders = wrapper.findAll('[data-testid="type-header"]')
    expect(typeHeaders.length).toBeGreaterThan(0)

    const absentSection = wrapper.find('[data-testid="type-section-absent"]')
    expect(absentSection.exists()).toBe(true)
    expect(absentSection.text()).toContain('缺席待聯絡')
  })

  it('should display student information correctly', () => {
    const wrapper = mount(TrackingList, {
      props: {
        items: mockTrackingItems
      }
    })

    const firstItem = wrapper.find('[data-testid="tracking-item-TRACK001"]')
    expect(firstItem.text()).toContain('陳佑昇')
    expect(firstItem.text()).toContain('XXX課')
    expect(firstItem.text()).toContain('15:00-16:30')
    expect(firstItem.text()).toContain('陳媽媽')
    expect(firstItem.text()).toContain('0912345678')
  })

  it('should show priority indicators', () => {
    const wrapper = mount(TrackingList, {
      props: {
        items: mockTrackingItems
      }
    })

    const highPriorityItem = wrapper.find('[data-testid="tracking-item-TRACK001"]')
    const priorityBadge = highPriorityItem.find('[data-testid="priority-badge"]')
    expect(priorityBadge.classes()).toContain('bg-red-100')
  })

  it('should handle checkbox toggle', async () => {
    const wrapper = mount(TrackingList, {
      props: {
        items: mockTrackingItems
      }
    })

    const checkbox = wrapper.find('[data-testid="checkbox-TRACK001"]')
    expect(checkbox.element.checked).toBe(false)

    await checkbox.setValue(true)
    expect(wrapper.emitted('item-complete')).toBeTruthy()
    expect(wrapper.emitted('item-complete')![0]).toEqual(['TRACK001', true])
  })

  it('should emit call event when clicking phone number', async () => {
    const wrapper = mount(TrackingList, {
      props: {
        items: mockTrackingItems
      }
    })

    const phoneButton = wrapper.find('[data-testid="phone-button-TRACK001"]')
    await phoneButton.trigger('click')

    expect(wrapper.emitted('call')).toBeTruthy()
    expect(wrapper.emitted('call')![0]).toEqual([mockTrackingItems[0]])
  })

  it('should filter completed items when hideCompleted is true', () => {
    const wrapper = mount(TrackingList, {
      props: {
        items: mockTrackingItems,
        hideCompleted: true
      }
    })

    const items = wrapper.findAll('[data-testid^="tracking-item-"]')
    expect(items.length).toBe(2) // Only 2 uncompleted items
    expect(wrapper.text()).not.toContain('王小明')
  })

  it('should sort items by priority', () => {
    const wrapper = mount(TrackingList, {
      props: {
        items: mockTrackingItems,
        sortBy: 'priority'
      }
    })

    const items = wrapper.findAll('[data-testid^="tracking-item-"]')
    const firstItemId = items[0].attributes('data-testid')
    expect(firstItemId).toBe('tracking-item-TRACK001') // High priority first
  })
})
