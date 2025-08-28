<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="mx-auto mb-4 size-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
        <p class="text-gray-500">載入報表數據中...</p>
      </div>
    </div>

    <!-- Report Content -->
    <div v-else class="space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <ReportCard
        title="本月收入"
        :value="summary.revenue.currentMonth"
        :change="summary.revenue.growth"
        format="currency"
        icon="currency"
        color="green"
      />
      <ReportCard
        title="活躍學生"
        :value="summary.students.activeStudents"
        format="number"
        icon="users"
        color="blue"
      />
      <ReportCard
        title="本月新學生"
        :value="summary.students.newStudentsThisMonth"
        format="number"
        icon="users"
        color="primary"
      />
      <ReportCard
        title="平均出席率"
        :value="summary.attendance.monthlyAverage"
        format="percent"
        icon="clipboard"
        color="yellow"
      />
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Revenue Trend -->
      <div class="card p-6">
        <h3 class="mb-4 text-lg font-medium text-gray-900">收入趨勢</h3>
        <div class="h-64">
          <ChartWrapper
            v-if="revenueChartData"
            type="line"
            :data="revenueChartData"
            :options="lineChartOptions"
          />
        </div>
      </div>

      <!-- Course Distribution -->
      <div class="card p-6">
        <h3 class="mb-4 text-lg font-medium text-gray-900">課程分布</h3>
        <div class="h-64">
          <ChartWrapper
            v-if="courseChartData"
            type="doughnut"
            :data="courseChartData"
          />
        </div>
      </div>
    </div>

    <!-- Recent Activities -->
    <div class="card">
      <div class="border-b border-gray-200 px-6 py-4">
        <h3 class="text-lg font-medium text-gray-900">最近活動</h3>
      </div>
      <div class="divide-y divide-gray-200">
        <div v-for="activity in recentActivities" :key="activity.id" class="px-6 py-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-900">{{ activity.description }}</p>
              <p class="text-sm text-gray-500">{{ formatDateTime(activity.created_at) }}</p>
            </div>
            <span
              :class="[
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                getActivityTypeClass(activity.type)
              ]"
            >
              {{ activity.type }}
            </span>
          </div>
        </div>
      </div>
    </div>
    </div> <!-- End of v-else div -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import ReportCard from '@/components/reports/ReportCard.vue'
import ChartWrapper from '@/components/reports/ChartWrapper.vue'
import { reportService } from '@/services/reportService'
import { formatDateTime } from '@/utils/formatters'
import type { DateRange, ChartData } from '@/types/reports'

interface Props {
  dateRange: DateRange
}

const props = defineProps<Props>()

const summary = ref({
  revenue: { currentMonth: 0, lastMonth: 0, growth: 0 },
  students: { totalStudents: 0, activeStudents: 0, newStudentsThisMonth: 0, avgEnrollmentsPerStudent: 0 },
  attendance: { monthlyAverage: 0 }
})

const loading = ref(true)
const revenueChartData = ref<ChartData | null>(null)
const courseChartData = ref<ChartData | null>(null)
const recentActivities = ref<any[]>([])

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
        callback(value: any) {
          return `$${value.toLocaleString()}`
        }
      }
    }
  }
}

const loadSummaryData = async () => {
  try {
    loading.value = true
    // Load summary statistics
    const summaryData = await reportService.getSummaryStatistics({
      startDate: props.dateRange.startDate,
      endDate: props.dateRange.endDate
    })

    if (summaryData) {
      summary.value = summaryData
    }

    // Load revenue trend
    const revenueData = await reportService.getRevenueReport({
      startDate: props.dateRange.startDate,
      endDate: props.dateRange.endDate
    })

    revenueChartData.value = {
      labels: revenueData.map(d => d.date),
      datasets: [{
        label: '每日收入',
        data: revenueData.map(d => d.amount),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.3,
        fill: true
      }]
    }

    // Load course statistics for pie chart
    const courseStats = await reportService.getCourseStatistics({
      startDate: props.dateRange.startDate,
      endDate: props.dateRange.endDate
    })

    const topCourses = courseStats
      .sort((a, b) => b.studentCount - a.studentCount)
      .slice(0, 5)

    courseChartData.value = {
      labels: topCourses.map(c => c.courseName),
      datasets: [{
        label: '學生人數',
        data: topCourses.map(c => c.studentCount),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)'
        ]
      }]
    }

    // TODO: Load recent activities from audit logs
    recentActivities.value = []
  } catch (error) {
    console.error('Error loading summary data:', error)
  } finally {
    loading.value = false
  }
}

const getActivityTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    enrollment: 'bg-green-100 text-green-800',
    payment: 'bg-blue-100 text-blue-800',
    attendance: 'bg-yellow-100 text-yellow-800',
    course: 'bg-purple-100 text-purple-800'
  }
  return classes[type] || 'bg-gray-100 text-gray-800'
}

onMounted(() => {
  loadSummaryData()
})

watch(() => props.dateRange, () => {
  loadSummaryData()
}, { deep: true })
</script>
