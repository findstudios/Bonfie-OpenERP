import { ref } from 'vue'
import { creditManagementService } from '@/services/creditManagementService'
import type { Enrollment } from '@/types'

export function useExpiryReminder() {
  const expiringEnrollments = ref<Enrollment[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function checkExpiringEnrollments(daysAhead: number = 7) {
    loading.value = true
    error.value = null

    try {
      const enrollments = await creditManagementService.getExpiringEnrollments(daysAhead)
      expiringEnrollments.value = enrollments
    } catch (err) {
      console.error('Failed to check expiring enrollments:', err)
      error.value = err instanceof Error ? err.message : 'Failed to check expiring enrollments'
      expiringEnrollments.value = []
    } finally {
      loading.value = false
    }
  }

  function formatExpiryNotification(enrollment: Enrollment) {
    const studentName = enrollment.student?.chinese_name || '學生'
    const courseName = enrollment.course?.course_name || '課程'
    const validUntil = enrollment.valid_until || ''
    const remainingSessions = enrollment.remaining_sessions || 0

    return {
      title: '課程即將到期',
      message: `${studentName} 的 ${courseName} 將於 ${validUntil} 到期，剩餘 ${remainingSessions} 堂`,
      type: 'warning' as const
    }
  }

  return {
    expiringEnrollments,
    loading,
    error,
    checkExpiringEnrollments,
    formatExpiryNotification
  }
}
