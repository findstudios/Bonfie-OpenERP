<template>
  <div class="space-y-6">
    <!-- Teacher Performance Table -->
    <div class="card">
      <div class="border-b border-gray-200 px-6 py-4">
        <h3 class="text-lg font-medium text-gray-900">教師績效統計</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                教師姓名
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                授課數量
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                學生人數
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                平均出席率
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                總收入貢獻
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                績效評分
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="teacher in teacherPerformance" :key="teacher.userId">
              <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                {{ teacher.teacherName }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {{ teacher.courseCount }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {{ teacher.studentCount }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <span
                  :class="[
                    'inline-flex rounded-full px-2 text-xs font-semibold',
                    teacher.avgAttendanceRate >= 80 ? 'bg-green-100 text-green-800' :
                    teacher.avgAttendanceRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  ]"
                >
                  {{ teacher.avgAttendanceRate.toFixed(0) }}%
                </span>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {{ formatCurrency(teacher.totalRevenue) }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <div class="flex items-center">
                  <span class="text-yellow-400">
                    {{ getStarRating(teacher.performanceScore) }}
                  </span>
                  <span class="ml-1 text-gray-600">
                    {{ teacher.performanceScore.toFixed(1) }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Teacher Course Load -->
      <div class="card p-6">
        <h3 class="mb-4 text-lg font-medium text-gray-900">教師課程負荷</h3>
        <div class="h-64">
          <ChartWrapper
            v-if="courseLoadChartData"
            type="bar"
            :data="courseLoadChartData"
            :options="barChartOptions"
          />
        </div>
      </div>

      <!-- Teacher Revenue Contribution -->
      <div class="card p-6">
        <h3 class="mb-4 text-lg font-medium text-gray-900">教師收入貢獻比例</h3>
        <div class="h-64">
          <ChartWrapper
            v-if="revenueContributionChartData"
            type="pie"
            :data="revenueContributionChartData"
          />
        </div>
      </div>
    </div>

    <!-- Teacher Summary Cards -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-4">
      <ReportCard
        title="總教師數"
        :value="totalTeachers"
        format="number"
        icon="users"
        color="blue"
      />
      <ReportCard
        title="平均授課數"
        :value="avgCoursesPerTeacher.toFixed(1)"
        format="number"
        icon="academic"
        color="primary"
      />
      <ReportCard
        title="平均學生數"
        :value="avgStudentsPerTeacher.toFixed(1)"
        format="number"
        icon="users"
        color="green"
      />
      <ReportCard
        title="整體出席率"
        :value="overallAttendanceRate.toFixed(1)"
        format="percent"
        icon="clipboard"
        color="yellow"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ReportCard from '@/components/reports/ReportCard.vue'
import ChartWrapper from '@/components/reports/ChartWrapper.vue'
import { reportService } from '@/services/reportService'
import { supabase } from '@/services/supabase'
import { formatCurrency } from '@/utils/formatters'
import type { DateRange, ChartData } from '@/types/reports'
import type { TeacherPerformance } from '@/services/reportService'

interface Props {
  dateRange: DateRange
}

interface EnhancedTeacherPerformance extends TeacherPerformance {
  performanceScore: number
}

const props = defineProps<Props>()

const teacherPerformance = ref<EnhancedTeacherPerformance[]>([])

const totalTeachers = computed(() => teacherPerformance.value.length)

const avgCoursesPerTeacher = computed(() => {
  if (teacherPerformance.value.length === 0) return 0
  const total = teacherPerformance.value.reduce((sum, t) => sum + t.courseCount, 0)
  return total / teacherPerformance.value.length
})

const avgStudentsPerTeacher = computed(() => {
  if (teacherPerformance.value.length === 0) return 0
  const total = teacherPerformance.value.reduce((sum, t) => sum + t.studentCount, 0)
  return total / teacherPerformance.value.length
})

const overallAttendanceRate = computed(() => {
  if (teacherPerformance.value.length === 0) return 0
  const total = teacherPerformance.value.reduce((sum, t) => sum + t.avgAttendanceRate, 0)
  return total / teacherPerformance.value.length
})

const courseLoadChartData = computed<ChartData | null>(() => {
  if (teacherPerformance.value.length === 0) return null

  return {
    labels: teacherPerformance.value.map(t => t.teacherName),
    datasets: [{
      label: '授課數量',
      data: teacherPerformance.value.map(t => t.courseCount),
      backgroundColor: 'rgba(59, 130, 246, 0.8)'
    }]
  }
})

const revenueContributionChartData = computed<ChartData | null>(() => {
  if (teacherPerformance.value.length === 0) return null

  const topTeachers = teacherPerformance.value
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5)

  return {
    labels: topTeachers.map(t => t.teacherName),
    datasets: [{
      label: '收入貢獻',
      data: topTeachers.map(t => t.totalRevenue),
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(147, 51, 234, 0.8)'
      ]
    }]
  }
})

const barChartOptions = {
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
}

const getStarRating = (score: number) => {
  const fullStars = Math.floor(score)
  const halfStar = score % 1 >= 0.5 ? 1 : 0
  const emptyStars = 5 - fullStars - halfStar

  return '★'.repeat(fullStars) + (halfStar ? '☆' : '') + '☆'.repeat(emptyStars)
}

const calculatePerformanceScore = (teacher: TeacherPerformance): number => {
  // Weighted scoring system
  const attendanceWeight = 0.4
  const studentCountWeight = 0.3
  const courseCountWeight = 0.2
  const revenueWeight = 0.1

  // Normalize scores (0-100)
  const attendanceScore = teacher.avgAttendanceRate
  const studentScore = Math.min((teacher.studentCount / 50) * 100, 100) // Assume 50 students is excellent
  const courseScore = Math.min((teacher.courseCount / 10) * 100, 100) // Assume 10 courses is excellent
  const revenueScore = Math.min((teacher.totalRevenue / 100000) * 100, 100) // Assume 100k is excellent

  const totalScore =
    (attendanceScore * attendanceWeight) +
    (studentScore * studentCountWeight) +
    (courseScore * courseCountWeight) +
    (revenueScore * revenueWeight)

  // Convert to 5-star scale
  return (totalScore / 100) * 5
}

const loadTeacherData = async () => {
  try {
    // Load teacher performance data
    const performance = await reportService.getTeacherPerformance({
      startDate: props.dateRange.startDate,
      endDate: props.dateRange.endDate
    })

    // Calculate revenue for each teacher
    const teacherRevenueMap = new Map<string, number>()

    // Get orders related to courses taught by each teacher
    const { data: courseOrders } = await supabase
      .from('order_items')
      .select(`
        final_price,
        item_id,
        courses!inner (
          instructor_id
        ),
        orders!inner (
          created_at,
          status
        )
      `)
      .eq('item_type', 'course')
      .eq('orders.status', 'paid')
      .gte('orders.created_at', props.dateRange.startDate)
      .lte('orders.created_at', props.dateRange.endDate)

    if (courseOrders) {
      courseOrders.forEach(item => {
        const course = item.courses as any
        if (course?.instructor_id) {
          teacherRevenueMap.set(
            course.instructor_id,
            (teacherRevenueMap.get(course.instructor_id) || 0) + Number(item.final_price)
          )
        }
      })
    }

    // Enhance performance data with revenue and performance score
    teacherPerformance.value = performance.map(teacher => {
      const enhancedTeacher = {
        ...teacher,
        totalRevenue: teacherRevenueMap.get(teacher.userId) || 0,
        performanceScore: 0
      }
      enhancedTeacher.performanceScore = calculatePerformanceScore(enhancedTeacher)
      return enhancedTeacher
    }).sort((a, b) => b.performanceScore - a.performanceScore)
  } catch (error) {
    console.error('Error loading teacher data:', error)
  }
}

onMounted(() => {
  loadTeacherData()
})

watch(() => props.dateRange, () => {
  loadTeacherData()
}, { deep: true })
</script>
