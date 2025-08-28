import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FollowUpReminderWidget from '../FollowUpReminderWidget.vue'
import { useFollowUpReminder } from '@/composables/useFollowUpReminder'
import type { FollowUp } from '@/types/crm'

// Mock composable
vi.mock('@/composables/useFollowUpReminder', () => ({
  useFollowUpReminder: vi.fn()
}))

// Mock Heroicons
vi.mock('@heroicons/vue/24/outline', () => ({
  BellIcon: { template: '<svg></svg>' },
  CalendarIcon: { template: '<svg></svg>' },
  ClockIcon: { template: '<svg></svg>' },
  ExclamationCircleIcon: { template: '<svg></svg>' }
}))

describe('FollowUpReminderWidget', () => {
  const mockFollowUps: FollowUp[] = [
    {
      id: 1,
      follow_up_id: 'FU001',
      lead_id: 'LEAD001',
      type: 'phone_call',
      subject: '初次聯絡',
      content: '討論課程安排',
      result: 'positive',
      next_follow_up: '2024-01-20',
      created_by: 'USER001',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }
  ]

  const createMockComposableReturn = (overrides = {}) => ({
    reminders: {
      value: {
        overdue: [],
        today: [],
        upcoming: []
      }
    },
    totalCount: { value: 0 },
    urgentCount: { value: 0 },
    loading: { value: false },
    loadReminders: vi.fn(),
    ...overrides
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render widget with bell icon', () => {
    vi.mocked(useFollowUpReminder).mockReturnValue(createMockComposableReturn())

    const wrapper = mount(FollowUpReminderWidget)

    expect(wrapper.find('svg').exists()).toBe(true) // Bell icon
  })

  it('should show badge when there are reminders', () => {
    vi.mocked(useFollowUpReminder).mockReturnValue(
      createMockComposableReturn({
        totalCount: { value: 5 },
        urgentCount: { value: 2 }
      })
    )

    const wrapper = mount(FollowUpReminderWidget)

    const badge = wrapper.find('[data-testid="reminder-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('5')
  })

  it('should not show badge when count is zero', () => {
    vi.mocked(useFollowUpReminder).mockReturnValue(createMockComposableReturn())

    const wrapper = mount(FollowUpReminderWidget)

    const badge = wrapper.find('[data-testid="reminder-badge"]')
    expect(badge.exists()).toBe(false)
  })

  it('should toggle dropdown on click', async () => {
    vi.mocked(useFollowUpReminder).mockReturnValue(
      createMockComposableReturn({
        reminders: {
          value: {
            overdue: mockFollowUps,
            today: [],
            upcoming: []
          }
        },
        totalCount: { value: 1 }
      })
    )

    const wrapper = mount(FollowUpReminderWidget)

    // Initially closed
    expect(wrapper.find('[data-testid="reminder-dropdown"]').exists()).toBe(false)

    // Click to open
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('[data-testid="reminder-dropdown"]').exists()).toBe(true)

    // Click to close
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('[data-testid="reminder-dropdown"]').exists()).toBe(false)
  })

  it('should display overdue reminders', async () => {
    vi.mocked(useFollowUpReminder).mockReturnValue(
      createMockComposableReturn({
        reminders: {
          value: {
            overdue: mockFollowUps,
            today: [],
            upcoming: []
          }
        },
        totalCount: { value: 1 },
        urgentCount: { value: 1 }
      })
    )

    const wrapper = mount(FollowUpReminderWidget)
    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('逾期')
    expect(wrapper.text()).toContain('初次聯絡')
    expect(wrapper.find('[class*="text-red"]').exists()).toBe(true)
  })

  it('should display today reminders', async () => {
    const todayFollowUp = {
      ...mockFollowUps[0],
      follow_up_id: 'FU002',
      subject: '今日跟進'
    }

    vi.mocked(useFollowUpReminder).mockReturnValue(
      createMockComposableReturn({
        reminders: {
          value: {
            overdue: [],
            today: [todayFollowUp],
            upcoming: []
          }
        },
        totalCount: { value: 1 }
      })
    )

    const wrapper = mount(FollowUpReminderWidget)
    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('今日')
    expect(wrapper.text()).toContain('今日跟進')
    expect(wrapper.find('[class*="text-yellow"]').exists()).toBe(true)
  })

  it('should display upcoming reminders', async () => {
    const upcomingFollowUp = {
      ...mockFollowUps[0],
      follow_up_id: 'FU003',
      subject: '即將到期跟進'
    }

    vi.mocked(useFollowUpReminder).mockReturnValue(
      createMockComposableReturn({
        reminders: {
          value: {
            overdue: [],
            today: [],
            upcoming: [upcomingFollowUp]
          }
        },
        totalCount: { value: 1 }
      })
    )

    const wrapper = mount(FollowUpReminderWidget)
    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('即將到期')
    expect(wrapper.text()).toContain('即將到期跟進')
    expect(wrapper.find('[class*="text-blue"]').exists()).toBe(true)
  })

  it('should show empty state when no reminders', async () => {
    vi.mocked(useFollowUpReminder).mockReturnValue(createMockComposableReturn())

    const wrapper = mount(FollowUpReminderWidget)
    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('暫無待跟進事項')
  })

  it('should show loading state', async () => {
    vi.mocked(useFollowUpReminder).mockReturnValue(
      createMockComposableReturn({
        loading: { value: true }
      })
    )

    const wrapper = mount(FollowUpReminderWidget)
    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('載入中...')
  })

  it('should navigate to lead detail on click', async () => {
    const mockRouter = {
      push: vi.fn()
    }

    vi.mocked(useFollowUpReminder).mockReturnValue(
      createMockComposableReturn({
        reminders: {
          value: {
            overdue: mockFollowUps,
            today: [],
            upcoming: []
          }
        },
        totalCount: { value: 1 }
      })
    )

    const wrapper = mount(FollowUpReminderWidget, {
      global: {
        mocks: {
          $router: mockRouter
        }
      }
    })

    await wrapper.find('button').trigger('click')

    const reminderItem = wrapper.find('[data-testid="reminder-item-FU001"]')
    await reminderItem.trigger('click')

    expect(mockRouter.push).toHaveBeenCalledWith('/crm/leads/LEAD001')
  })

  it('should show "View All" link', async () => {
    vi.mocked(useFollowUpReminder).mockReturnValue(
      createMockComposableReturn({
        reminders: {
          value: {
            overdue: mockFollowUps,
            today: [],
            upcoming: []
          }
        },
        totalCount: { value: 1 }
      })
    )

    const wrapper = mount(FollowUpReminderWidget)
    await wrapper.find('button').trigger('click')

    const viewAllLink = wrapper.find('[data-testid="view-all-link"]')
    expect(viewAllLink.exists()).toBe(true)
    expect(viewAllLink.text()).toContain('查看所有跟進事項')
  })

  it('should navigate to follow-up list on "View All" click', async () => {
    const mockRouter = {
      push: vi.fn()
    }

    vi.mocked(useFollowUpReminder).mockReturnValue(
      createMockComposableReturn({
        totalCount: { value: 1 }
      })
    )

    const wrapper = mount(FollowUpReminderWidget, {
      global: {
        mocks: {
          $router: mockRouter
        }
      }
    })

    await wrapper.find('button').trigger('click')

    const viewAllLink = wrapper.find('[data-testid="view-all-link"]')
    await viewAllLink.trigger('click')

    expect(mockRouter.push).toHaveBeenCalledWith('/crm/follow-ups')
  })

  it('should close dropdown when clicking outside', async () => {
    vi.mocked(useFollowUpReminder).mockReturnValue(
      createMockComposableReturn({
        totalCount: { value: 1 }
      })
    )

    const wrapper = mount(FollowUpReminderWidget, {
      attachTo: document.body
    })

    // Open dropdown
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('[data-testid="reminder-dropdown"]').exists()).toBe(true)

    // Click outside
    document.body.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="reminder-dropdown"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('should format dates correctly', async () => {
    const followUpWithDate = {
      ...mockFollowUps[0],
      next_follow_up: '2024-01-20'
    }

    vi.mocked(useFollowUpReminder).mockReturnValue(
      createMockComposableReturn({
        reminders: {
          value: {
            overdue: [followUpWithDate],
            today: [],
            upcoming: []
          }
        },
        totalCount: { value: 1 }
      })
    )

    const wrapper = mount(FollowUpReminderWidget)
    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('2024/01/20')
  })

  it('should apply urgent styles when there are urgent reminders', () => {
    vi.mocked(useFollowUpReminder).mockReturnValue(
      createMockComposableReturn({
        totalCount: { value: 5 },
        urgentCount: { value: 3 }
      })
    )

    const wrapper = mount(FollowUpReminderWidget)

    const badge = wrapper.find('[data-testid="reminder-badge"]')
    expect(badge.classes()).toContain('bg-red-500')
  })

  it('should apply normal styles when no urgent reminders', () => {
    vi.mocked(useFollowUpReminder).mockReturnValue(
      createMockComposableReturn({
        totalCount: { value: 5 },
        urgentCount: { value: 0 }
      })
    )

    const wrapper = mount(FollowUpReminderWidget)

    const badge = wrapper.find('[data-testid="reminder-badge"]')
    expect(badge.classes()).toContain('bg-blue-500')
  })
})
