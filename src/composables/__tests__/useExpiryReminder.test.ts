import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useExpiryReminder } from '../useExpiryReminder'
import type { Enrollment } from '@/types'

// Mock dependencies
vi.mock('@/services/creditManagementService', () => ({
  creditManagementService: {
    getExpiringEnrollments: vi.fn()
  }
}))

import { creditManagementService } from '@/services/creditManagementService'

describe('useExpiryReminder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should check for expiring enrollments', async () => {
    const mockExpiringEnrollments: Enrollment[] = [
      {
        id: 1,
        enrollment_id: 'ENR001',
        student_id: 'STU001',
        course_id: 'CRS001',
        purchased_sessions: 10,
        remaining_sessions: 3,
        bonus_sessions: 0,
        status: 'active',
        enrollment_category: 'regular',
        valid_until: '2024-02-15',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        student: {
          student_id: 'STU001',
          chinese_name: '王小明',
          english_name: 'John Wang'
        },
        course: {
          course_id: 'CRS001',
          course_name: '數學班',
          course_category: 'regular'
        }
      },
      {
        id: 2,
        enrollment_id: 'ENR002',
        student_id: 'STU002',
        course_id: 'CRS002',
        purchased_sessions: 20,
        remaining_sessions: 5,
        bonus_sessions: 0,
        status: 'active',
        enrollment_category: 'theme',
        valid_until: '2024-02-10',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        student: {
          student_id: 'STU002',
          chinese_name: '李小華',
          english_name: 'Lisa Lee'
        },
        course: {
          course_id: 'CRS002',
          course_name: '美術創作班',
          course_category: 'theme'
        }
      }
    ]

    vi.mocked(creditManagementService.getExpiringEnrollments).mockResolvedValue(mockExpiringEnrollments)

    const { expiringEnrollments, checkExpiringEnrollments, loading } = useExpiryReminder()

    expect(loading.value).toBe(false)
    expect(expiringEnrollments.value).toHaveLength(0)

    // Check for expiring enrollments
    await checkExpiringEnrollments(7) // Check for enrollments expiring in 7 days

    expect(creditManagementService.getExpiringEnrollments).toHaveBeenCalledWith(7)
    expect(loading.value).toBe(false)
    expect(expiringEnrollments.value).toHaveLength(2)
    expect(expiringEnrollments.value[0].student?.chinese_name).toBe('王小明')
    expect(expiringEnrollments.value[1].student?.chinese_name).toBe('李小華')
  })

  it('should display expiry notifications with proper formatting', async () => {
    const mockExpiringEnrollments: Enrollment[] = [
      {
        id: 1,
        enrollment_id: 'ENR001',
        student_id: 'STU001',
        course_id: 'CRS001',
        purchased_sessions: 10,
        remaining_sessions: 3,
        bonus_sessions: 0,
        status: 'active',
        enrollment_category: 'regular',
        valid_until: '2024-02-05', // 5 days from now
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        student: {
          student_id: 'STU001',
          chinese_name: '王小明',
          english_name: 'John Wang'
        },
        course: {
          course_id: 'CRS001',
          course_name: '數學班',
          course_category: 'regular'
        }
      }
    ]

    vi.mocked(creditManagementService.getExpiringEnrollments).mockResolvedValue(mockExpiringEnrollments)

    const { expiringEnrollments, checkExpiringEnrollments, formatExpiryNotification } = useExpiryReminder()

    await checkExpiringEnrollments(7)

    const notification = formatExpiryNotification(expiringEnrollments.value[0])

    expect(notification.title).toBe('課程即將到期')
    expect(notification.message).toContain('王小明')
    expect(notification.message).toContain('數學班')
    expect(notification.message).toContain('2024-02-05')
    expect(notification.message).toContain('剩餘 3 堂')
    expect(notification.type).toBe('warning')
  })
})
