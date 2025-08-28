import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import type { Schedule, Attendance, Enrollment, TrialClass, StudentInfo } from '@/types/dashboard'

export function useScheduleData() {
  // 資料狀態
  const todaySchedules = ref<Schedule[]>([])
  const attendanceRecords = ref<Attendance[]>([])
  const enrollments = ref<Enrollment[]>([])
  const todayTrialStudents = ref<TrialClass[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 組合課程資料（加入出席人數和試聽標記）
  const todaySchedulesWithData = computed(() => {
    return todaySchedules.value.map(schedule => {
      // 計算出席人數
      const attendanceCount = attendanceRecords.value.filter(
        record => record.schedule_id === schedule.schedule_id && record.status === 'present'
      ).length

      // 獲取該課程的報名學生
      const courseEnrollments = enrollments.value.filter(
        e => e.course_id === schedule.course_id && e.status === 'active'
      )

      // 生成學生名單
      const studentList: StudentInfo[] = courseEnrollments.map(enrollment => {
        const attendance = attendanceRecords.value.find(
          a => a.schedule_id === schedule.schedule_id && a.student_id === enrollment.student_id
        )
        return {
          student_id: enrollment.student_id,
          chinese_name: enrollment.student?.chinese_name || `學生${enrollment.student_id.slice(-3)}`,
          enrollment_id: enrollment.enrollment_id,
          is_trial: false,
          attendance_status: attendance?.status || null
        }
      })

      // 添加試聽學生
      const trialsForThisSchedule = todayTrialStudents.value.filter(
        trial => trial.course_id === schedule.course_id &&
                 trial.scheduled_time.startsWith(schedule.class_datetime.split('T')[1].substring(0, 5))
      )

      trialsForThisSchedule.forEach(trial => {
        studentList.push({
          student_id: `TRIAL_${trial.trial_id}`,
          chinese_name: trial.lead.full_name,
          enrollment_id: null,
          is_trial: true,
          attendance_status: trial.attendance ? 'present' : null
        })
      })

      return {
        ...schedule,
        attendance_count: attendanceCount,
        enrollments: courseEnrollments,
        studentList,
        has_trial: trialsForThisSchedule.length > 0
      }
    })
  })

  // 載入今日課程
  async function loadTodaySchedules() {
    try {
      const today = new Date()
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

      const { data, error: err } = await supabase
        .from('schedules')
        .select(`
          *,
          course:courses (
            *,
            instructor:users!courses_instructor_id_fkey (
              user_id,
              full_name
            )
          )
        `)
        .gte('class_datetime', startOfDay)
        .lte('class_datetime', endOfDay)
        .order('class_datetime', { ascending: true })

      if (err) throw err
      todaySchedules.value = data || []
    } catch (err) {
      console.error('載入今日課程失敗:', err)
      error.value = err instanceof Error ? err.message : '載入失敗'
    }
  }

  // 載入出席記錄
  async function loadAttendanceData() {
    try {
      const today = new Date()
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()

      const { data, error: err } = await supabase
        .from('attendance')
        .select('*')
        .gte('created_at', startOfDay)

      if (err) throw err
      attendanceRecords.value = data || []
    } catch (err) {
      console.error('載入出席記錄失敗:', err)
      error.value = err instanceof Error ? err.message : '載入失敗'
    }
  }

  // 載入報名資料
  async function loadEnrollments() {
    try {
      const courseIds = todaySchedules.value.map(s => s.course_id)
      if (courseIds.length === 0) return

      const { data, error: err } = await supabase
        .from('enrollments')
        .select(`
          *,
          student:students (
            student_id,
            chinese_name,
            english_name
          )
        `)
        .in('course_id', courseIds)
        .eq('status', 'active')

      if (err) throw err
      enrollments.value = data || []
    } catch (err) {
      console.error('載入報名資料失敗:', err)
      error.value = err instanceof Error ? err.message : '載入失敗'
    }
  }

  // 載入試聽學生
  async function loadTrialStudents() {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data, error: err } = await supabase
        .from('trial_classes')
        .select(`
          *,
          lead:leads (*),
          course:courses (*)
        `)
        .eq('scheduled_date', today)
        .order('scheduled_time', { ascending: true })

      if (err) throw err
      todayTrialStudents.value = data || []
    } catch (err) {
      console.error('載入試聽學生失敗:', err)
      todayTrialStudents.value = []
      error.value = err instanceof Error ? err.message : '載入失敗'
    }
  }

  // 為了兼容性，創建 scheduleStudents Map
  const scheduleStudents = computed(() => {
    const map = new Map<string, StudentInfo[]>()
    todaySchedulesWithData.value.forEach(schedule => {
      map.set(schedule.schedule_id, schedule.studentList || [])
    })
    return map
  })

  // 計算出席率
  const attendanceRate = computed(() => {
    const totalStudents = enrollments.value.length
    const presentStudents = attendanceRecords.value.filter(r => r.status === 'present').length
    return totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0
  })

  // 載入所有資料
  async function loadAllScheduleData() {
    loading.value = true
    error.value = null

    try {
      await loadTodaySchedules()
      await Promise.all([
        loadAttendanceData(),
        loadTrialStudents(),
        loadEnrollments()
      ])
    } catch (err) {
      console.error('載入課程資料失敗:', err)
      error.value = err instanceof Error ? err.message : '載入失敗'
    } finally {
      loading.value = false
    }
  }

  return {
    // 狀態
    todaySchedules: todaySchedulesWithData, // 返回包含學生資料的版本
    scheduleStudents,
    attendanceRecords,
    loading,
    error,
    attendanceRate,
    // 方法
    loadTodaySchedules: loadAllScheduleData, // 統一使用 loadAllScheduleData
    loadAttendanceData,
    loadEnrollments,
    loadTrialStudents
  }
}
