import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useFollowUpReminder } from '../useFollowUpReminder'
import { crmService } from '@/services/crmService'
import type { FollowUp } from '@/types/crm'

// Mock CRM Service
vi.mock('@/services/crmService', () => ({
  crmService: {
    getFollowUps: vi.fn()
  }
}))

describe('useFollowUpReminder', () => {
  let intervalId: NodeJS.Timeout | null = null

  // Get dates for testing
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 5)

  const mockFollowUps: FollowUp[] = [
    {
      id: 1,
      follow_up_id: 'FU001',
      lead_id: 'LEAD001',
      type: 'phone_call',
      subject: '逾期跟進',
      content: '需要聯絡',
      result: 'positive',
      next_follow_up: yesterday.toISOString().split('T')[0], // Yesterday - overdue
      created_by: 'USER001',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      leads: {
        full_name: '學生1',
        parent_name: '家長1'
      }
    },
    {
      id: 2,
      follow_up_id: 'FU002',
      lead_id: 'LEAD002',
      type: 'email',
      subject: '今日跟進',
      content: '發送郵件',
      result: 'neutral',
      next_follow_up: today.toISOString().split('T')[0], // Today
      created_by: 'USER001',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      leads: {
        full_name: '學生2',
        parent_name: '家長2'
      }
    },
    {
      id: 3,
      follow_up_id: 'FU003',
      lead_id: 'LEAD003',
      type: 'visit',
      subject: '未來跟進',
      content: '安排拜訪',
      result: 'positive',
      next_follow_up: nextWeek.toISOString().split('T')[0], // Within 7 days
      created_by: 'USER001',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      leads: {
        full_name: '學生3',
        parent_name: '家長3'
      }
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  })

  it('should initialize with empty reminders', () => {
    const { reminders, totalCount, urgentCount } = useFollowUpReminder()

    expect(reminders.value.overdue).toEqual([])
    expect(reminders.value.today).toEqual([])
    expect(reminders.value.upcoming).toEqual([])
    expect(totalCount.value).toBe(0)
    expect(urgentCount.value).toBe(0)
  })

  it('should load and categorize reminders correctly', async () => {
    vi.mocked(crmService.getFollowUps).mockResolvedValue(mockFollowUps)

    const { loadReminders, reminders, totalCount, urgentCount } = useFollowUpReminder()

    await loadReminders()

    expect(crmService.getFollowUps).toHaveBeenCalledWith({
      limit: 100,
      page: 1
    })

    // Check categorization
    expect(reminders.value.overdue).toHaveLength(1)
    expect(reminders.value.overdue[0].follow_up_id).toBe('FU001')

    expect(reminders.value.today).toHaveLength(1)
    expect(reminders.value.today[0].follow_up_id).toBe('FU002')

    expect(reminders.value.upcoming).toHaveLength(1)
    expect(reminders.value.upcoming[0].follow_up_id).toBe('FU003')

    expect(totalCount.value).toBe(3)
    expect(urgentCount.value).toBe(2) // overdue + today
  })

  it('should filter out follow-ups without next_follow_up date', async () => {
    const followUpsWithoutDate = [
      ...mockFollowUps,
      {
        id: 4,
        follow_up_id: 'FU004',
        lead_id: 'LEAD004',
        type: 'phone_call',
        subject: '無日期跟進',
        content: '無下次跟進日期',
        result: 'positive',
        next_follow_up: undefined, // No date
        created_by: 'USER001',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ]

    vi.mocked(crmService.getFollowUps).mockResolvedValue(followUpsWithoutDate)

    const { loadReminders, totalCount } = useFollowUpReminder()
    await loadReminders()

    expect(totalCount.value).toBe(3) // Should not include the one without date
  })

  it('should handle loading state', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise(resolve => {
      resolvePromise = resolve
    })

    vi.mocked(crmService.getFollowUps).mockReturnValue(promise as any)

    const { loadReminders, loading } = useFollowUpReminder()

    expect(loading.value).toBe(false)

    const loadPromise = loadReminders()
    expect(loading.value).toBe(true)

    // Resolve the promise
    resolvePromise!(mockFollowUps)
    await loadPromise

    expect(loading.value).toBe(false)
  })

  it('should handle errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(crmService.getFollowUps).mockRejectedValue(new Error('API Error'))

    const { loadReminders, loading } = useFollowUpReminder()
    await loadReminders()

    expect(consoleSpy).toHaveBeenCalledWith('載入跟進提醒失敗:', expect.any(Error))
    expect(loading.value).toBe(false)

    consoleSpy.mockRestore()
  })

  it('should auto-refresh every 5 minutes', async () => {
    vi.mocked(crmService.getFollowUps).mockResolvedValue(mockFollowUps)

    const { startAutoRefresh, stopAutoRefresh } = useFollowUpReminder()

    startAutoRefresh()

    // Initial load should happen immediately
    expect(crmService.getFollowUps).toHaveBeenCalledTimes(1)

    // Clear initial call
    vi.clearAllMocks()

    // Fast-forward 5 minutes
    vi.advanceTimersByTime(5 * 60 * 1000)

    // Should have been called again
    expect(crmService.getFollowUps).toHaveBeenCalledTimes(1)

    // Fast-forward another 5 minutes
    vi.advanceTimersByTime(5 * 60 * 1000)

    expect(crmService.getFollowUps).toHaveBeenCalledTimes(2)

    stopAutoRefresh()
  })

  it('should stop auto-refresh when stopAutoRefresh is called', async () => {
    vi.mocked(crmService.getFollowUps).mockResolvedValue(mockFollowUps)

    const { startAutoRefresh, stopAutoRefresh } = useFollowUpReminder()

    startAutoRefresh()

    // Initial load
    expect(crmService.getFollowUps).toHaveBeenCalledTimes(1)

    stopAutoRefresh()

    // Fast-forward 10 minutes
    vi.advanceTimersByTime(10 * 60 * 1000)
    await vi.runAllTimersAsync()

    // Should still be 1 because auto-refresh was stopped
    expect(crmService.getFollowUps).toHaveBeenCalledTimes(1)
  })

  it('should sort reminders by date', async () => {
    const unsortedFollowUps = [
      {
        ...mockFollowUps[0],
        next_follow_up: '2024-01-03'
      },
      {
        ...mockFollowUps[0],
        follow_up_id: 'FU005',
        next_follow_up: '2024-01-01'
      },
      {
        ...mockFollowUps[0],
        follow_up_id: 'FU006',
        next_follow_up: '2024-01-02'
      }
    ]

    vi.mocked(crmService.getFollowUps).mockResolvedValue(unsortedFollowUps)

    const { loadReminders, reminders } = useFollowUpReminder()
    await loadReminders()

    // Check that overdue items are sorted by date (ascending)
    expect(reminders.value.overdue[0].next_follow_up).toBe('2024-01-01')
    expect(reminders.value.overdue[1].next_follow_up).toBe('2024-01-02')
    expect(reminders.value.overdue[2].next_follow_up).toBe('2024-01-03')
  })

  it('should calculate days difference correctly', async () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const upcomingFollowUp = {
      ...mockFollowUps[0],
      next_follow_up: tomorrow.toISOString().split('T')[0]
    }

    vi.mocked(crmService.getFollowUps).mockResolvedValue([upcomingFollowUp])

    const { loadReminders, reminders } = useFollowUpReminder()
    await loadReminders()

    expect(reminders.value.upcoming).toHaveLength(1)
    // The follow-up should be in upcoming (within 7 days)
  })

  it('should handle empty response', async () => {
    vi.mocked(crmService.getFollowUps).mockResolvedValue([])

    const { loadReminders, reminders, totalCount, urgentCount } = useFollowUpReminder()
    await loadReminders()

    expect(reminders.value.overdue).toEqual([])
    expect(reminders.value.today).toEqual([])
    expect(reminders.value.upcoming).toEqual([])
    expect(totalCount.value).toBe(0)
    expect(urgentCount.value).toBe(0)
  })
})
