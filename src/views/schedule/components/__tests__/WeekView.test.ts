import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import WeekView from '../WeekView.vue'
import type { Schedule, Course } from '@/types'

describe('WeekView', () => {
  const mockCourse: Course = {
    id: 1,
    course_id: 'COURSE001',
    course_name: '數學課程',
    instructor_id: 'TEACHER001',
    course_type: 'regular',
    category: 'math',
    total_sessions: 20,
    price_per_session: 500,
    max_students: 10,
    status: 'active',
    schedule_pattern: {
      start_time: '10:00',
      end_time: '11:00',
      classroom: '教室A'
    },
    description: '基礎數學課程',
    created_at: '2025-01-20T00:00:00',
    updated_at: '2025-01-20T00:00:00'
  }

  const mockSchedules: Schedule[] = [
    {
      id: 1,
      schedule_id: 'SCH001',
      course_id: 'COURSE001',
      class_datetime: '2025-01-20T10:00:00',
      end_datetime: '2025-01-20T11:00:00',
      classroom: '教室A',
      status: 'scheduled',
      session_number: 1,
      is_makeup: false,
      notes: '',
      created_at: '2025-01-20T00:00:00',
      updated_at: '2025-01-20T00:00:00',
      course: mockCourse
    }
  ]

  const currentDate = new Date('2025-01-20') // Monday

  let wrapper: any

  beforeEach(() => {
    wrapper = mount(WeekView, {
      props: {
        schedules: mockSchedules,
        currentDate
      }
    })
  })

  describe('時間欄顯示', () => {
    it('should display time slots from 8:00 to 21:00', () => {
      const timeSlots = wrapper.findAll('.time-slot-header')
      expect(timeSlots).toHaveLength(14) // 8:00 to 21:00 = 14 hours
    })

    it('should format hour correctly', () => {
      const firstTimeSlot = wrapper.find('[data-testid="time-slot-8"]')
      expect(firstTimeSlot.text()).toContain('08:00')
    })

    it('should show time period indicator', () => {
      const morningSlot = wrapper.find('[data-testid="time-slot-8"]')
      const afternoonSlot = wrapper.find('[data-testid="time-slot-14"]')
      const eveningSlot = wrapper.find('[data-testid="time-slot-19"]')

      expect(morningSlot.text()).toContain('上午')
      expect(afternoonSlot.text()).toContain('下午')
      expect(eveningSlot.text()).toContain('晚上')
    })
  })

  describe('週檢視標題', () => {
    it('should display all 7 days of the week', () => {
      const dayHeaders = wrapper.findAll('.day-header')
      expect(dayHeaders).toHaveLength(7)
    })

    it('should highlight current date', () => {
      // 在測試中，我們使用 2025-01-20 作為當前日期
      // 所以我們應該找到 day-header-1 (星期一) 被高亮
      const currentDateHeader = wrapper.find('[data-testid="day-header-1"]')
      expect(currentDateHeader.exists()).toBe(true)
      expect(currentDateHeader.classes()).toContain('bg-blue-50')
    })

    it('should show day name and date', () => {
      const sundayHeader = wrapper.find('[data-testid="day-header-0"]')
      expect(sundayHeader.text()).toContain('星期日')
      expect(sundayHeader.text()).toContain('19') // 2025-01-19 is Sunday
    })
  })

  describe('課程卡片顯示', () => {
    it('should display schedule card with course name', () => {
      const scheduleCard = wrapper.find('[data-testid="schedule-card"]')
      expect(scheduleCard.exists()).toBe(true)
      expect(scheduleCard.text()).toContain('數學課程')
    })

    it('should show classroom information', () => {
      const scheduleCard = wrapper.find('[data-testid="schedule-card"]')
      expect(scheduleCard.text()).toContain('教室A')
    })

    it('should display time range', () => {
      const scheduleCard = wrapper.find('[data-testid="schedule-card"]')
      expect(scheduleCard.text()).toContain('10:00 - 11:00')
    })

    it('should show status indicator', () => {
      const statusIndicator = wrapper.find('[data-testid="status-indicator"]')
      expect(statusIndicator.exists()).toBe(true)
      expect(statusIndicator.classes()).toContain('bg-blue-500')
    })
  })

  describe('互動功能', () => {
    it('should emit time-slot-click when clicking on empty time slot', async () => {
      const timeSlot = wrapper.find('[data-testid="clickable-time-slot"]')
      await timeSlot.trigger('click')

      expect(wrapper.emitted('time-slot-click')).toBeTruthy()
    })

    it('should emit schedule-click when clicking on schedule card', async () => {
      const scheduleCard = wrapper.find('[data-testid="schedule-card"]')
      await scheduleCard.trigger('click')

      expect(wrapper.emitted('schedule-click')).toBeTruthy()
    })
  })

  describe('視覺優化', () => {
    it('should apply enhanced styling to time slots', () => {
      const timeSlot = wrapper.find('.time-slot-header')
      expect(timeSlot.classes()).toContain('time-column')
    })

    it('should apply enhanced styling to schedule cards', () => {
      const scheduleCard = wrapper.find('[data-testid="schedule-card"]')
      expect(scheduleCard.classes()).toContain('schedule-card')
    })

    it('should show formatted month/day in header', () => {
      const dayHeader = wrapper.find('[data-testid="day-header-0"]')
      expect(dayHeader.text()).toContain('1/19') // 2025-01-19 formatted as month/day
    })
  })
})
