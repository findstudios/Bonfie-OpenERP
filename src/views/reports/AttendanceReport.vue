<template>
  <div class="space-y-6">
    <!-- Attendance Summary Cards -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-4">
      <ReportCard
        title="總出席率"
        :value="overallAttendanceRate"
        format="percent"
        icon="clipboard"
        color="green"
      />
      <ReportCard
        title="總課堂數"
        :value="totalClasses"
        format="number"
        icon="calendar"
        color="blue"
      />
      <ReportCard
        title="出席人次"
        :value="totalPresent"
        format="number"
        icon="users"
        color="primary"
      />
      <ReportCard
        title="缺席人次"
        :value="totalAbsent"
        format="number"
        icon="users"
        color="red"
      />
    </div>

    <!-- Attendance Charts -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Daily Attendance Trend -->
      <div class="card p-6">
        <h3 class="mb-4 text-lg font-medium text-gray-900">每日出席率趨勢</h3>
        <div class="h-64">
          <ChartWrapper
            v-if="attendanceTrendChartData"
            type="line"
            :data="attendanceTrendChartData"
            :options="lineChartOptions"
          />
        </div>
      </div>

      <!-- Attendance by Day of Week -->
      <div class="card p-6">
        <h3 class="mb-4 text-lg font-medium text-gray-900">週間出席率分析</h3>
        <div class="h-64">
          <ChartWrapper
            v-if="weekdayChartData"
            type="bar"
            :data="weekdayChartData"
            :options="barChartOptions"
          />
        </div>
      </div>
    </div>

    <!-- Course Attendance Table -->
    <div class="card">
      <div class="border-b border-gray-200 px-6 py-4">
        <h3 class="text-lg font-medium text-gray-900">各課程出席率</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                課程名稱
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                教師
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                總堂數
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                平均出席人數
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                出席率
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="course in courseAttendance" :key="course.courseId">
              <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                {{ course.courseName }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {{ course.teacherName }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {{ course.totalClasses }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {{ course.avgAttendance.toFixed(1) }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <div class="flex items-center">
                  <span
                    :class="[
                      'inline-flex rounded-full px-2 text-xs font-semibold',
                      course.attendanceRate >= 80 ? 'bg-green-100 text-green-800' :
                      course.attendanceRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    ]"
                  >
                    {{ course.attendanceRate.toFixed(0) }}%
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ReportCard from '@/components/reports/ReportCard.vue'
import ChartWrapper from '@/components/reports/ChartWrapper.vue'
import { reportService } from '@/services/reportService'
import { supabase } from '@/services/supabase'
import type { DateRange, ChartData } from '@/types/reports'
import type { AttendanceStatistics } from '@/services/reportService'

interface Props {
  dateRange: DateRange
}

interface CourseAttendance {
  courseId: string
  courseName: string
  teacherName: string
  totalClasses: number
  avgAttendance: number
  attendanceRate: number
}

const props = defineProps<Props>()

const attendanceData = ref<AttendanceStatistics[]>([])
const courseAttendance = ref<CourseAttendance[]>([])
const weekdayAttendance = ref<{ day: string; rate: number }[]>([])

const totalClasses = computed(() =>
  attendanceData.value.reduce((sum, d) => sum + d.totalClasses, 0)
)

const totalPresent = computed(() =>
  attendanceData.value.reduce((sum, d) => sum + d.presentCount, 0)
)

const totalAbsent = computed(() =>
  attendanceData.value.reduce((sum, d) => sum + d.absentCount, 0)
)

const overallAttendanceRate = computed(() => {
  const total = totalPresent.value + totalAbsent.value
  return total > 0 ? (totalPresent.value / total) * 100 : 0
})

const attendanceTrendChartData = computed<ChartData | null>(() => {
  if (attendanceData.value.length === 0) return null

  return {
    labels: attendanceData.value.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [{
      label: '出席率 (%)',
      data: attendanceData.value.map(d => d.attendanceRate),
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      tension: 0.3,
      fill: true
    }]
  }
})

const weekdayChartData = computed<ChartData | null>(() => {
  if (weekdayAttendance.value.length === 0) return null

  return {
    labels: weekdayAttendance.value.map(d => d.day),
    datasets: [{
      label: '平均出席率 (%)',
      data: weekdayAttendance.value.map(d => d.rate),
      backgroundColor: 'rgba(59, 130, 246, 0.8)'
    }]
  }
})

const lineChartOptions = {
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: {
        callback(value: any) {
          return `${value}%`
        }
      }
    }
  }
}

const barChartOptions = {
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: {
        callback(value: any) {
          return `${value}%`
        }
      }
    }
  }
}

const getDayName = (dayIndex: number) => {
  const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
  return days[dayIndex]
}

const loadAttendanceData = async () => {
  try {
    // Load attendance statistics
    attendanceData.value = await reportService.getAttendanceStatistics({
      startDate: props.dateRange.startDate,
      endDate: props.dateRange.endDate
    })

    // Calculate weekday attendance
    const weekdayMap = new Map<number, { total: number; count: number }>()

    attendanceData.value.forEach(d => {
      const dayOfWeek = new Date(d.date).getDay()
      const existing = weekdayMap.get(dayOfWeek) || { total: 0, count: 0 }
      weekdayMap.set(dayOfWeek, {
        total: existing.total + d.attendanceRate,
        count: existing.count + 1
      })
    })

    weekdayAttendance.value = Array.from(weekdayMap.entries())
      .map(([day, stats]) => ({
        day: getDayName(day),
        rate: stats.count > 0 ? stats.total / stats.count : 0
      }))
      .sort((a, b) => {
        const order = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']
        return order.indexOf(a.day) - order.indexOf(b.day)
      })

    // Load course attendance data
    const { data: courses } = await supabase
      .from('courses')
      .select(`
        course_id,
        course_name,
        users!courses_instructor_id_fkey (
          full_name
        ),
        schedules!inner (
          schedule_id,
          class_datetime,
          status,
          attendance (
            status
          )
        )
      `)

    if (courses) {
      courseAttendance.value = courses.map(course => {
        const teacher = course.users as any
        const schedules = course.schedules?.filter(s =>
          s.status === 'completed' &&
          new Date(s.class_datetime) >= new Date(props.dateRange.startDate) &&
          new Date(s.class_datetime) <= new Date(props.dateRange.endDate)
        ) || []

        let totalAttendance = 0
        let totalAttendanceRecords = 0

        schedules.forEach(schedule => {
          const attendance = schedule.attendance || []
          totalAttendance += attendance.filter(a => a.status === 'present').length
          totalAttendanceRecords += attendance.length
        })

        const attendanceRate = totalAttendanceRecords > 0
          ? (totalAttendance / totalAttendanceRecords) * 100
          : 0

        const avgAttendance = schedules.length > 0
          ? totalAttendance / schedules.length
          : 0

        return {
          courseId: course.course_id,
          courseName: course.course_name,
          teacherName: teacher?.full_name || '未指定',
          totalClasses: schedules.length,
          avgAttendance,
          attendanceRate
        }
      }).filter(c => c.totalClasses > 0)
        .sort((a, b) => b.attendanceRate - a.attendanceRate)
    }
  } catch (error) {
    console.error('Error loading attendance data:', error)
  }
}

onMounted(() => {
  loadAttendanceData()
})

watch(() => props.dateRange, () => {
  loadAttendanceData()
}, { deep: true })
</script>
