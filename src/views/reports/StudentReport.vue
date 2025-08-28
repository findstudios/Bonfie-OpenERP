<template>
  <div class="space-y-6">
    <!-- Student Summary Cards -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-4">
      <ReportCard
        title="總學生數"
        :value="studentStats.totalStudents"
        format="number"
        icon="users"
        color="blue"
      />
      <ReportCard
        title="活躍學生"
        :value="studentStats.activeStudents"
        format="number"
        icon="academic"
        color="green"
      />
      <ReportCard
        title="本月新生"
        :value="studentStats.newStudentsThisMonth"
        format="number"
        icon="users"
        color="primary"
      />
      <ReportCard
        title="平均報名課程"
        :value="studentStats.avgEnrollmentsPerStudent.toFixed(1)"
        format="number"
        icon="chart"
        color="yellow"
      />
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- New Students Trend -->
      <div class="card p-6">
        <h3 class="mb-4 text-lg font-medium text-gray-900">新生趨勢</h3>
        <div class="h-64">
          <ChartWrapper
            v-if="newStudentChartData"
            type="line"
            :data="newStudentChartData"
            :options="lineChartOptions"
          />
        </div>
      </div>

      <!-- Grade Distribution -->
      <div class="card p-6">
        <h3 class="mb-4 text-lg font-medium text-gray-900">年級分布</h3>
        <div class="h-64">
          <ChartWrapper
            v-if="gradeDistributionChartData"
            type="bar"
            :data="gradeDistributionChartData"
          />
        </div>
      </div>
    </div>

    <!-- Student Enrollment Table -->
    <div class="card">
      <div class="border-b border-gray-200 px-6 py-4">
        <h3 class="text-lg font-medium text-gray-900">最活躍學生</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                學生姓名
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                報名課程數
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                總購買堂數
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                剩餘堂數
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                出席率
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="student in topStudents" :key="student.studentId">
              <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                {{ student.studentName }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {{ student.enrollmentCount }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {{ student.totalSessions }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {{ student.remainingSessions }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <span
                  :class="[
                    'inline-flex rounded-full px-2 text-xs font-semibold',
                    student.attendanceRate >= 80 ? 'bg-green-100 text-green-800' :
                    student.attendanceRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  ]"
                >
                  {{ student.attendanceRate.toFixed(0) }}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Expiring Enrollments Section -->
    <div class="card p-6">
      <h3 class="mb-4 text-lg font-medium text-gray-900">即將到期課程</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="bg-gray-50">
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                學生姓名
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                課程名稱
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                到期日期
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                剩餘堂數
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                狀態
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="enrollment in expiringEnrollments" :key="enrollment.enrollment_id">
              <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                {{ enrollment.student?.chinese_name || '-' }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {{ enrollment.course?.course_name || '-' }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {{ formatDate(enrollment.valid_until) }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {{ enrollment.remaining_sessions }}
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <span
                  :class="[
                    'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                    getDaysUntilExpiry(enrollment.valid_until) <= 0 ? 'bg-red-100 text-red-800' :
                    getDaysUntilExpiry(enrollment.valid_until) <= 7 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  ]"
                >
                  {{ getDaysUntilExpiry(enrollment.valid_until) <= 0 ? '已到期' :
                     `${getDaysUntilExpiry(enrollment.valid_until)} 天後到期` }}
                </span>
              </td>
            </tr>
            <tr v-if="expiringEnrollments.length === 0">
              <td colspan="5" class="px-6 py-8 text-center text-sm text-gray-500">
                目前沒有即將到期的課程
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
import type { StudentStatistics } from '@/services/reportService'

interface Props {
  dateRange: DateRange
}

interface TopStudent {
  studentId: string
  studentName: string
  enrollmentCount: number
  totalSessions: number
  remainingSessions: number
  attendanceRate: number
}

const props = defineProps<Props>()

const studentStats = ref<StudentStatistics>({
  totalStudents: 0,
  activeStudents: 0,
  newStudentsThisMonth: 0,
  avgEnrollmentsPerStudent: 0
})

const newStudentData = ref<{ date: string; count: number }[]>([])
const gradeDistribution = ref<{ grade: string; count: number }[]>([])
const topStudents = ref<TopStudent[]>([])
const expiringEnrollments = ref<any[]>([])

const newStudentChartData = computed<ChartData | null>(() => {
  if (newStudentData.value.length === 0) return null

  return {
    labels: newStudentData.value.map(d => d.date),
    datasets: [{
      label: '新生人數',
      data: newStudentData.value.map(d => d.count),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.3,
      fill: true
    }]
  }
})

const gradeDistributionChartData = computed<ChartData | null>(() => {
  if (gradeDistribution.value.length === 0) return null

  return {
    labels: gradeDistribution.value.map(d => d.grade || '未設定'),
    datasets: [{
      label: '學生人數',
      data: gradeDistribution.value.map(d => d.count),
      backgroundColor: 'rgba(147, 51, 234, 0.8)'
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
      ticks: {
        stepSize: 1
      }
    }
  }
}

const loadStudentData = async () => {
  try {
    // Load student statistics
    studentStats.value = await reportService.getStudentStatistics({
      startDate: props.dateRange.startDate,
      endDate: props.dateRange.endDate
    })

    // Load new student trend
    const { data: students } = await supabase
      .from('students')
      .select('created_at')
      .gte('created_at', props.dateRange.startDate)
      .lte('created_at', props.dateRange.endDate)

    if (students) {
      const studentsByDate = new Map<string, number>()
      students.forEach(s => {
        const date = new Date(s.created_at).toISOString().split('T')[0]
        studentsByDate.set(date, (studentsByDate.get(date) || 0) + 1)
      })

      newStudentData.value = Array.from(studentsByDate.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
    }

    // Load top students with enrollment data
    const { data: enrollmentData } = await supabase
      .from('enrollments')
      .select(`
        student_id,
        students (
          chinese_name,
          english_name
        ),
        purchased_sessions,
        remaining_sessions,
        status
      `)
      .eq('status', 'active')

    if (enrollmentData) {
      const studentMap = new Map<string, {
        name: string
        enrollments: number
        totalSessions: number
        remainingSessions: number
      }>()

      enrollmentData.forEach(e => {
        const student = e.students as any
        const name = student?.chinese_name || student?.english_name || '未知'
        const existing = studentMap.get(e.student_id) || {
          name,
          enrollments: 0,
          totalSessions: 0,
          remainingSessions: 0
        }

        studentMap.set(e.student_id, {
          name,
          enrollments: existing.enrollments + 1,
          totalSessions: existing.totalSessions + e.purchased_sessions,
          remainingSessions: existing.remainingSessions + e.remaining_sessions
        })
      })

      // Calculate attendance rates
      const studentsWithAttendance: TopStudent[] = []

      for (const [studentId, data] of studentMap.entries()) {
        // Get attendance data
        const { data: attendance } = await supabase
          .from('attendance')
          .select('status')
          .eq('student_id', studentId)
          .gte('created_at', props.dateRange.startDate)
          .lte('created_at', props.dateRange.endDate)

        const totalAttendance = attendance?.length || 0
        const presentCount = attendance?.filter(a => a.status === 'present').length || 0
        const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0

        studentsWithAttendance.push({
          studentId,
          studentName: data.name,
          enrollmentCount: data.enrollments,
          totalSessions: data.totalSessions,
          remainingSessions: data.remainingSessions,
          attendanceRate
        })
      }

      topStudents.value = studentsWithAttendance
        .sort((a, b) => b.totalSessions - a.totalSessions)
        .slice(0, 10)
    }
  } catch (error) {
    console.error('Error loading student data:', error)
  }
}

onMounted(() => {
  loadStudentData()
})

watch(() => props.dateRange, () => {
  loadStudentData()
}, { deep: true })
</script>
