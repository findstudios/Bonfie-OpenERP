/**
 * 追蹤項目服務
 * 整合不同來源的追蹤需求：缺席學生、試聽預約、跟進提醒
 */

import { supabase } from './supabase'
import type { Database } from '@/types/database'

export type TrackingItemType = 'absent' | 'trial_scheduled' | 'follow_up' | 'trial_follow_up' | 'class_cancelled' | 'class_rescheduled'

export interface TrackingItem {
  id: string
  type: TrackingItemType
  priority: 'high' | 'medium' | 'low'
  student: {
    student_id: string
    chinese_name: string
    english_name?: string
  }
  course_name?: string
  class_time?: string
  scheduled_date?: string
  scheduled_time?: string
  contact: {
    name: string
    phone: string
    relationship: string
  }
  notes?: string
  completed: boolean
  created_at: string
  due_date?: string
  source_id: string // 來源記錄ID (attendance_id, trial_id, follow_up_id等)
}

export class TrackingService {
  /**
   * 獲取今日所有追蹤項目
   */
  async getTodayTrackingItems(): Promise<TrackingItem[]> {
    const items: TrackingItem[] = []

    try {
      // 並行載入不同類型的追蹤項目
      const [absentItems, todayTrials, classNotifications] = await Promise.all([
        this.getAbsentStudentItems(),
        this.getTodayAndTomorrowTrials(),
        this.getClassNotificationItems()
      ])

      items.push(...absentItems, ...todayTrials, ...classNotifications)

      // 按優先級和時間排序
      return items.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff

        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })
    } catch (error) {
      console.error('載入追蹤項目失敗:', error)
      return []
    }
  }

  /**
   * 獲取缺席學生追蹤項目
   */
  private async getAbsentStudentItems(): Promise<TrackingItem[]> {
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

    // 先查詢今天的所有課程
    const { data: todaySchedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('schedule_id')
      .gte('class_datetime', startOfDay)
      .lte('class_datetime', endOfDay)

    if (scheduleError || !todaySchedules) {
      console.error('載入今日課程失敗:', scheduleError)
      return []
    }

    const todayScheduleIds = todaySchedules.map(s => s.schedule_id)

    if (todayScheduleIds.length === 0) {
      return [] // 今天沒有課程
    }

    // 查詢今天課程的缺席記錄
    const { data: absences, error } = await supabase
      .from('attendance')
      .select(`
        *,
        students!attendance_student_id_fkey (
          student_id,
          chinese_name,
          english_name
        ),
        schedules!attendance_schedule_id_fkey (
          class_datetime,
          end_datetime,
          courses (
            course_name
          )
        )
      `)
      .eq('status', 'absent')
      .in('schedule_id', todayScheduleIds)

    if (error) {
      console.error('載入缺席記錄失敗:', error)
      return []
    }

    const items: TrackingItem[] = []

    for (const absence of absences || []) {
      // 獲取學生聯絡人
      const contacts = await this.getStudentContacts(absence.student_id)
      const primaryContact = contacts.find(c => c.is_primary) || contacts[0]

      if (!primaryContact) continue

      const schedule = absence.schedules
      const classTime = schedule ? this.formatTimeRange(schedule.class_datetime, schedule.end_datetime) : '未知時間'

      items.push({
        id: `absent_${absence.id}`,
        type: 'absent',
        priority: 'high', // 缺席優先級較高
        student: {
          student_id: absence.students.student_id,
          chinese_name: absence.students.chinese_name,
          english_name: absence.students.english_name
        },
        course_name: schedule?.courses?.course_name || '未知課程',
        class_time: classTime,
        contact: {
          name: primaryContact.contact.full_name,
          phone: primaryContact.contact.phone || '',
          relationship: this.getRelationshipText(primaryContact.relationship)
        },
        notes: absence.teacher_notes || '學生缺席，需要電話關懷',
        completed: false,
        created_at: absence.created_at,
        source_id: absence.id.toString()
      })
    }

    return items
  }

  /**
   * 獲取試聽後續追蹤項目
   */
  private async getTrialFollowUpItems(): Promise<TrackingItem[]> {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const { data: trials, error } = await supabase
      .from('trial_classes')
      .select(`
        *,
        leads (
          full_name,
          parent_name,
          phone
        ),
        courses (
          course_name
        )
      `)
      .eq('scheduled_date', yesterdayStr)
      .eq('status', 'completed')
      .eq('attendance', true)

    if (error) {
      console.error('載入試聽記錄失敗:', error)
      return []
    }

    return (trials || []).map(trial => ({
      id: `trial_${trial.trial_id}`,
      type: 'trial_follow_up' as TrackingItemType,
      priority: 'medium' as const,
      student: {
        student_id: `LEAD_${trial.lead_id}`,
        chinese_name: trial.leads.full_name,
        english_name: ''
      },
      course_name: trial.courses?.course_name || '未知課程',
      scheduled_date: trial.scheduled_date,
      scheduled_time: trial.scheduled_time,
      contact: {
        name: trial.leads.parent_name || trial.leads.full_name,
        phone: trial.leads.phone || '',
        relationship: trial.leads.parent_name ? '家長' : '本人'
      },
      notes: '昨日試聽完成，需要電話跟進了解感受並洽談報名',
      completed: false,
      created_at: trial.created_at,
      source_id: trial.trial_id
    }))
  }

  /**
   * 獲取跟進提醒項目
   */
  private async getFollowUpReminders(): Promise<TrackingItem[]> {
    const today = new Date().toISOString().split('T')[0]

    const { data: followUps, error } = await supabase
      .from('follow_ups')
      .select(`
        *,
        leads (
          full_name,
          parent_name,
          phone
        )
      `)
      .eq('next_follow_up', today)

    if (error) {
      console.error('載入跟進提醒失敗:', error)
      return []
    }

    return (followUps || []).map(followUp => ({
      id: `followup_${followUp.follow_up_id}`,
      type: 'follow_up' as TrackingItemType,
      priority: 'medium' as const,
      student: {
        student_id: `LEAD_${followUp.lead_id}`,
        chinese_name: followUp.leads.full_name,
        english_name: ''
      },
      contact: {
        name: followUp.leads.parent_name || followUp.leads.full_name,
        phone: followUp.leads.phone || '',
        relationship: followUp.leads.parent_name ? '家長' : '本人'
      },
      notes: `預定今日跟進：${followUp.subject}`,
      completed: false,
      created_at: followUp.created_at,
      due_date: followUp.next_follow_up,
      source_id: followUp.follow_up_id
    }))
  }

  /**
   * 獲取今天和明天的試聽預約
   */
  async getTodayAndTomorrowTrials(): Promise<TrackingItem[]> {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const dates = [
      today.toISOString().split('T')[0],
      tomorrow.toISOString().split('T')[0]
    ]

    const { data: trials, error } = await supabase
      .from('trial_classes')
      .select(`
        *,
        leads (
          full_name,
          parent_name,
          phone
        ),
        courses (
          course_name
        )
      `)
      .in('scheduled_date', dates)
      .eq('status', 'scheduled')

    if (error) {
      console.error('載入試聽預約失敗:', error)
      return []
    }

    return (trials || []).map(trial => {
      const trialDate = new Date(trial.scheduled_date)
      const isToday = trial.scheduled_date === dates[0]

      return {
        id: `trial_scheduled_${trial.trial_id}`,
        type: 'trial_scheduled' as TrackingItemType,
        priority: isToday ? 'high' : 'medium', // 今天的試聽優先級更高
        student: {
          student_id: `LEAD_${trial.lead_id}`,
          chinese_name: trial.leads.full_name,
          english_name: ''
        },
        course_name: trial.courses?.course_name || '未知課程',
        scheduled_date: trial.scheduled_date,
        scheduled_time: trial.scheduled_time,
        contact: {
          name: trial.leads.parent_name || trial.leads.full_name,
          phone: trial.leads.phone || '',
          relationship: trial.leads.parent_name ? '家長' : '本人'
        },
        notes: isToday ? '今日試聽，需提醒準時到場' : '明日試聽，需提前通知',
        completed: false,
        created_at: trial.created_at,
        source_id: trial.trial_id
      }
    })
  }

  /**
   * 獲取即將到來的試聽預約
   */
  async getUpcomingTrials(): Promise<TrackingItem[]> {
    const today = new Date()
    const dates: string[] = []

    // 生成今天和接下來兩天的日期
    for (let i = 0; i < 3; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }

    const { data: trials, error } = await supabase
      .from('trial_classes')
      .select(`
        *,
        leads (
          full_name,
          parent_name,
          phone
        ),
        courses (
          course_name
        )
      `)
      .in('scheduled_date', dates)
      .eq('status', 'scheduled')

    if (error) {
      console.error('載入試聽預約失敗:', error)
      return []
    }

    return (trials || []).map(trial => {
      const trialDate = new Date(trial.scheduled_date)
      const daysDiff = Math.floor((trialDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      // 決定優先級和提醒文字
      let priority: 'high' | 'medium' | 'low'
      let dayText: string

      if (daysDiff === 0) {
        priority = 'high'
        dayText = '今日'
      } else if (daysDiff === 1) {
        priority = 'medium'
        dayText = '明日'
      } else {
        priority = 'low'
        dayText = '後天'
      }

      return {
        id: `trial_scheduled_${trial.trial_id}`,
        type: 'trial_scheduled' as TrackingItemType,
        priority,
        student: {
          student_id: `LEAD_${trial.lead_id}`,
          chinese_name: trial.leads.full_name,
          english_name: ''
        },
        course_name: trial.courses?.course_name || '未知課程',
        scheduled_date: trial.scheduled_date,
        scheduled_time: trial.scheduled_time,
        contact: {
          name: trial.leads.parent_name || trial.leads.full_name,
          phone: trial.leads.phone || '',
          relationship: trial.leads.parent_name ? '家長' : '本人'
        },
        notes: `${dayText}試聽預約，需提醒準時到場`,
        completed: false,
        created_at: trial.created_at,
        source_id: trial.trial_id
      }
    })
  }

  /**
   * 標記追蹤項目為完成/未完成
   */
  async markItemComplete(itemId: string, completed: boolean): Promise<void> {
    // 這裡可以實作將完成狀態保存到資料庫的邏輯
    // 例如建立一個 tracking_completions 表來記錄完成狀態
    console.log(`標記項目 ${itemId} 為 ${completed ? '已完成' : '未完成'}`)
  }

  /**
   * 獲取學生聯絡人
   */
  private async getStudentContacts(studentId: string) {
    const { data, error } = await supabase
      .from('student_contacts')
      .select(`
        *,
        contact:contacts (
          full_name,
          phone
        )
      `)
      .eq('student_id', studentId)

    if (error) {
      console.error('載入學生聯絡人失敗:', error)
      return []
    }

    return data || []
  }

  /**
   * 格式化時間範圍
   */
  private formatTimeRange(startTime: string, endTime: string): string {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const formatOptions: any = { hour: '2-digit', minute: '2-digit', hour12: false }

    return `${start.toLocaleTimeString('zh-TW', formatOptions)}-${end.toLocaleTimeString('zh-TW', formatOptions)}`
  }

  /**
   * 獲取關係文字
   */
  private getRelationshipText(relationship: string): string {
    const relationshipMap: Record<string, string> = {
      'parent': '家長',
      'father': '父親',
      'mother': '母親',
      'guardian': '監護人',
      'self': '本人',
      'other': '其他'
    }
    return relationshipMap[relationship] || relationship
  }

  /**
   * 獲取課程異動通知項目（停課、調課）
   */
  private async getClassNotificationItems(): Promise<TrackingItem[]> {
    // 這裡我們使用 handover_notes 表來存儲課程異動通知
    // 查找今天創建的且標籤包含 'class_cancelled' 或 'class_rescheduled' 的備忘錄
    const today = new Date()
    const startOfDay = new Date(today)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    const { data: notifications, error } = await supabase
      .from('handover_notes')
      .select('*')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .or('tags.cs.{class_cancelled},tags.cs.{class_rescheduled}')

    if (error) {
      console.error('載入課程異動通知失敗:', error)
      return []
    }

    const items: TrackingItem[] = []

    for (const notification of notifications || []) {
      try {
        // 從備忘錄內容中解析學生和課程資訊
        const content = JSON.parse(notification.content)
        const notificationType = notification.tags.includes('class_cancelled') ? 'class_cancelled' : 'class_rescheduled'

        // 獲取學生聯絡人
        const contacts = await this.getStudentContacts(content.student_id)
        const primaryContact = contacts.find(c => c.is_primary) || contacts[0]

        if (!primaryContact) continue

        items.push({
          id: `${notificationType}_${notification.id}`,
          type: notificationType,
          priority: 'high', // 課程異動通知優先級較高
          student: {
            student_id: content.student_id,
            chinese_name: content.student_name,
            english_name: content.student_english_name || ''
          },
          course_name: content.course_name,
          class_time: content.original_time,
          scheduled_date: content.new_date,
          scheduled_time: content.new_time,
          contact: {
            name: primaryContact.contact.full_name,
            phone: primaryContact.contact.phone || '',
            relationship: this.getRelationshipText(primaryContact.relationship)
          },
          notes: content.message || (notificationType === 'class_cancelled' ? '課程已停課，需要通知家長' : '課程時間已調整，需要通知家長'),
          completed: false,
          created_at: notification.created_at,
          source_id: notification.id.toString()
        })
      } catch (parseError) {
        console.warn('解析課程異動通知失敗:', parseError)
        continue
      }
    }

    return items
  }

  /**
   * 創建課程停課通知
   */
  async createCancelNotification(scheduleId: number, courseInfo: {
    course_name: string
    class_time: string
    students: Array<{
      student_id: string
      chinese_name: string
      english_name?: string
    }>
  }, userId: string): Promise<void> {
    // 為每個學生創建停課通知
    for (const student of courseInfo.students) {
      // 獲取學生聯絡人資訊
      const contacts = await this.getStudentContacts(student.student_id)
      const primaryContact = contacts.find(c => c.is_primary) || contacts[0]

      const content = JSON.stringify({
        type: 'class_cancelled',
        schedule_id: scheduleId,
        student_id: student.student_id,
        student_name: student.chinese_name,
        student_english_name: student.english_name,
        course_name: courseInfo.course_name,
        original_time: courseInfo.class_time,
        contact_info: primaryContact ? {
          name: primaryContact.contact.full_name,
          phone: primaryContact.contact.phone || '',
          relationship: this.getRelationshipText(primaryContact.relationship)
        } : null,
        message: `${student.chinese_name} 的 ${courseInfo.course_name} 課程（${courseInfo.class_time}）已停課，需要電話通知家長`
      })

      await supabase
        .from('handover_notes')
        .insert({
          content,
          author_id: userId,
          priority: 'high',
          tags: ['class_cancelled', 'student_notification'],
          is_active: true
        })
    }
  }

  /**
   * 創建課程調課通知
   */
  async createRescheduleNotification(scheduleId: number, courseInfo: {
    course_name: string
    original_time: string
    new_date: string
    new_time: string
    students: Array<{
      student_id: string
      chinese_name: string
      english_name?: string
    }>
  }, userId: string): Promise<void> {
    // 為每個學生創建調課通知
    for (const student of courseInfo.students) {
      // 獲取學生聯絡人資訊
      const contacts = await this.getStudentContacts(student.student_id)
      const primaryContact = contacts.find(c => c.is_primary) || contacts[0]

      const content = JSON.stringify({
        type: 'class_rescheduled',
        schedule_id: scheduleId,
        student_id: student.student_id,
        student_name: student.chinese_name,
        student_english_name: student.english_name,
        course_name: courseInfo.course_name,
        original_time: courseInfo.original_time,
        new_date: courseInfo.new_date,
        new_time: courseInfo.new_time,
        contact_info: primaryContact ? {
          name: primaryContact.contact.full_name,
          phone: primaryContact.contact.phone || '',
          relationship: this.getRelationshipText(primaryContact.relationship)
        } : null,
        message: `${student.chinese_name} 的 ${courseInfo.course_name} 課程時間已調整：從 ${courseInfo.original_time} 改為 ${courseInfo.new_date} ${courseInfo.new_time}，需要電話通知家長`
      })

      await supabase
        .from('handover_notes')
        .insert({
          content,
          author_id: userId,
          priority: 'high',
          tags: ['class_rescheduled', 'student_notification'],
          is_active: true
        })
    }
  }

  /**
   * 獲取追蹤類型的顯示文字
   */
  getTypeText(type: TrackingItemType): string {
    const typeMap: Record<TrackingItemType, string> = {
      'absent': '缺席追蹤',
      'trial_scheduled': '試聽提醒',
      'follow_up': '跟進提醒',
      'trial_follow_up': '試聽追蹤',
      'class_cancelled': '停課通知',
      'class_rescheduled': '調課通知'
    }
    return typeMap[type]
  }

  /**
   * 獲取追蹤類型的顏色樣式
   */
  getTypeStyle(type: TrackingItemType): { bgColor: string; textColor: string; borderColor: string } {
    const styleMap: Record<TrackingItemType, { bgColor: string; textColor: string; borderColor: string }> = {
      'absent': {
        bgColor: 'bg-red-50',
        textColor: 'text-red-800',
        borderColor: 'border-red-200'
      },
      'trial_scheduled': {
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200'
      },
      'follow_up': {
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200'
      },
      'trial_follow_up': {
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-800',
        borderColor: 'border-purple-200'
      },
      'class_cancelled': {
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-200'
      },
      'class_rescheduled': {
        bgColor: 'bg-indigo-50',
        textColor: 'text-indigo-800',
        borderColor: 'border-indigo-200'
      }
    }
    return styleMap[type]
  }
}

// 導出服務實例
export const trackingService = new TrackingService()
