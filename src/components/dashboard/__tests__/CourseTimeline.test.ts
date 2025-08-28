import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CourseTimeline from '../CourseTimeline.vue'

describe('CourseTimeline.vue', () => {
  const mockSchedules = [
    {
      schedule_id: 'SCH001',
      course_id: 'CRS001',
      class_datetime: '2024-01-24T15:00:00',
      end_datetime: '2024-01-24T16:30:00',
      classroom: '101',
      status: 'scheduled',
      course: {
        course_name: 'XXX課',
        instructor: { full_name: '陳老師' }
      },
      enrollments: [
        { student_id: 'STD001', student_name: '陳佑昇' },
        { student_id: 'STD002', student_name: '佑生陳' }
      ],
      attendance_count: 0,
      has_trial: true
    },
    {
      schedule_id: 'SCH002',
      course_id: 'CRS002',
      class_datetime: '2024-01-24T15:00:00',
      end_datetime: '2024-01-24T16:30:00',
      classroom: '102',
      status: 'in_progress',
      course: {
        course_name: 'XXO課',
        instructor: { full_name: '林老師' }
      },
      enrollments: [
        { student_id: 'STD003', student_name: '林佩佩' },
        { student_id: 'STD004', student_name: '林佩佩' },
        { student_id: 'STD005', student_name: '林佩佩' }
      ],
      attendance_count: 12,
      has_trial: false
    }
  ]

  it('should render time scale from 8:00 to 22:00', () => {
    const wrapper = mount(CourseTimeline, {
      props: {
        schedules: []
      }
    })

    const timeLabels = wrapper.findAll('[data-testid="time-label"]')
    expect(timeLabels.length).toBe(15) // 8:00 to 22:00
    expect(timeLabels[0].text()).toBe('8:00')
    expect(timeLabels[14].text()).toBe('22:00')
  })

  it('should render course cards with correct information', () => {
    const wrapper = mount(CourseTimeline, {
      props: {
        schedules: mockSchedules
      }
    })

    const courseCards = wrapper.findAll('[data-testid="course-card"]')
    expect(courseCards.length).toBe(2)

    const firstCard = courseCards[0]
    expect(firstCard.text()).toContain('XXX課')
    expect(firstCard.text()).toContain('15:00-16:30')
    expect(firstCard.text()).toContain('0 / 2 人') // 0 attendance, 2 enrolled
    expect(firstCard.text()).toContain('試聽')
  })

  it('should apply correct status colors', () => {
    const wrapper = mount(CourseTimeline, {
      props: {
        schedules: mockSchedules
      }
    })

    const courseCards = wrapper.findAll('[data-testid="course-card"]')
    expect(courseCards[0].classes()).toContain('bg-red-100')
    expect(courseCards[1].classes()).toContain('bg-green-100')
  })

  it('should show current time indicator', () => {
    const wrapper = mount(CourseTimeline, {
      props: {
        schedules: mockSchedules,
        currentTime: new Date('2024-01-24T16:00:00')
      }
    })

    const indicator = wrapper.find('[data-testid="current-time-indicator"]')
    expect(indicator.exists()).toBe(true)
  })

  it('should emit course-click event when clicking a course card', async () => {
    const wrapper = mount(CourseTimeline, {
      props: {
        schedules: mockSchedules
      }
    })

    const firstCard = wrapper.find('[data-testid="course-card"]')
    await firstCard.trigger('click')

    expect(wrapper.emitted('course-click')).toBeTruthy()
    expect(wrapper.emitted('course-click')![0]).toEqual([mockSchedules[0]])
  })

  it('should toggle student list when clicking a course card', async () => {
    const wrapper = mount(CourseTimeline, {
      props: {
        schedules: mockSchedules
      }
    })

    const firstCard = wrapper.find('[data-testid="course-card"]')
    let studentList = wrapper.find('[data-testid="student-list-SCH001"]')
    expect(studentList.exists()).toBe(false)

    await firstCard.trigger('click')
    studentList = wrapper.find('[data-testid="student-list-SCH001"]')
    expect(studentList.exists()).toBe(true)
    expect(studentList.text()).toContain('陳佑昇')
    expect(studentList.text()).toContain('佑生陳')
  })
})
