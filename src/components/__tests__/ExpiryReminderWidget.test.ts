import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ExpiryReminderWidget from '../ExpiryReminderWidget.vue'

// Mock the composable
vi.mock('@/composables/useExpiryReminder', () => ({
  useExpiryReminder: vi.fn(() => ({
    expiringEnrollments: ref([
      {
        enrollment_id: 'ENR001',
        student: { chinese_name: '王小明' },
        course: { course_name: '數學班' },
        valid_until: '2024-02-15',
        remaining_sessions: 3
      },
      {
        enrollment_id: 'ENR002',
        student: { chinese_name: '李小華' },
        course: { course_name: '美術班' },
        valid_until: '2024-02-10',
        remaining_sessions: 5
      }
    ]),
    loading: ref(false),
    error: ref(null),
    checkExpiringEnrollments: vi.fn(),
    formatExpiryNotification: vi.fn()
  }))
}))

import { ref } from 'vue'

describe('ExpiryReminderWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('should display expiry reminder widget with count', async () => {
    const wrapper = mount(ExpiryReminderWidget)

    await wrapper.vm.$nextTick()

    // Check if widget is displayed
    const widget = wrapper.find('[data-testid="expiry-reminder-widget"]')
    expect(widget.exists()).toBe(true)

    // Check if count is displayed
    const badge = wrapper.find('[data-testid="expiry-count-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('2')

    // Check if widget has correct styling when there are expiring items
    expect(widget.classes()).toContain('bg-yellow-50')
    expect(widget.classes()).toContain('text-yellow-700')
  })

  it('should show reminder list when clicked', async () => {
    const wrapper = mount(ExpiryReminderWidget)

    await wrapper.vm.$nextTick()

    // Initially dropdown should be hidden
    let dropdown = wrapper.find('[data-testid="expiry-dropdown"]')
    expect(dropdown.exists()).toBe(false)

    // Click the widget
    const widget = wrapper.find('[data-testid="expiry-reminder-widget"]')
    await widget.trigger('click')
    await wrapper.vm.$nextTick()

    // Dropdown should now be visible
    dropdown = wrapper.find('[data-testid="expiry-dropdown"]')
    expect(dropdown.exists()).toBe(true)

    // Check if reminders are listed
    const reminderItems = wrapper.findAll('[data-testid="reminder-item"]')
    expect(reminderItems).toHaveLength(2)

    // Check first reminder content
    expect(reminderItems[0].text()).toContain('王小明')
    expect(reminderItems[0].text()).toContain('數學班')
    expect(reminderItems[0].text()).toContain('2024-02-15')

    // Check second reminder content
    expect(reminderItems[1].text()).toContain('李小華')
    expect(reminderItems[1].text()).toContain('美術班')
    expect(reminderItems[1].text()).toContain('2024-02-10')
  })
})
