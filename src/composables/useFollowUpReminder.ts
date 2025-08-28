import { ref, computed } from 'vue'
import { crmService } from '@/services/crmService'
import type { FollowUp } from '@/types/crm'

export interface FollowUpReminder {
  followUp: FollowUp
  lead: any
  daysUntilDue: number
  isOverdue: boolean
  isPending: boolean
}

export function useFollowUpReminder() {
  const followUps = ref<FollowUp[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let refreshInterval: number | null = null

  // 分類的提醒
  const reminders = ref<{
    overdue: FollowUp[]
    today: FollowUp[]
    upcoming: FollowUp[]
  }>({
    overdue: [],
    today: [],
    upcoming: []
  })

  // 計算屬性
  const totalCount = computed(() =>
    reminders.value.overdue.length +
    reminders.value.today.length +
    reminders.value.upcoming.length
  )

  const urgentCount = computed(() =>
    reminders.value.overdue.length + reminders.value.today.length
  )

  // 載入跟進提醒
  async function loadReminders() {
    loading.value = true
    error.value = null

    try {
      // 獲取所有有下次跟進日期的跟進記錄
      const allFollowUps = await crmService.getFollowUps({
        limit: 100,
        page: 1
      })

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const overdueList: FollowUp[] = []
      const todayList: FollowUp[] = []
      const upcomingList: FollowUp[] = []

      for (const followUp of allFollowUps) {
        if (followUp.next_follow_up) {
          const dueDate = new Date(followUp.next_follow_up)
          dueDate.setHours(0, 0, 0, 0)

          const diffTime = dueDate.getTime() - today.getTime()
          const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          if (daysUntilDue < 0) {
            overdueList.push(followUp)
          } else if (daysUntilDue === 0) {
            todayList.push(followUp)
          } else if (daysUntilDue > 0 && daysUntilDue <= 7) {
            upcomingList.push(followUp)
          }
        }
      }

      // 排序：按日期升序
      overdueList.sort((a, b) =>
        new Date(a.next_follow_up!).getTime() - new Date(b.next_follow_up!).getTime()
      )
      upcomingList.sort((a, b) =>
        new Date(a.next_follow_up!).getTime() - new Date(b.next_follow_up!).getTime()
      )

      reminders.value = {
        overdue: overdueList,
        today: todayList,
        upcoming: upcomingList
      }

      followUps.value = allFollowUps
    } catch (err) {
      console.error('載入跟進提醒失敗:', err)
      error.value = '載入跟進提醒失敗'
    } finally {
      loading.value = false
    }
  }

  // 開始自動刷新
  function startAutoRefresh(intervalMinutes = 5) {
    stopAutoRefresh()

    // 立即載入一次
    loadReminders()

    // 設置定時刷新
    refreshInterval = window.setInterval(() => {
      loadReminders()
    }, intervalMinutes * 60 * 1000)
  }

  // 停止自動刷新
  function stopAutoRefresh() {
    if (refreshInterval) {
      window.clearInterval(refreshInterval)
      refreshInterval = null
    }
  }

  return {
    // 狀態
    reminders,
    loading,
    error,

    // 計算屬性
    totalCount,
    urgentCount,

    // 方法
    loadReminders,
    startAutoRefresh,
    stopAutoRefresh
  }
}
