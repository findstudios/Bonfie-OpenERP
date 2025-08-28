<template>
  <div class="space-y-6">
    <!-- Course Statistics Table -->
    <div class="card">
      <div class="border-b border-gray-200 px-6 py-4">
        <h3 class="text-lg font-medium text-gray-900">課程統計分析</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                課程名稱
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                學生人數
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                平均購買堂數
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                完成率
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                總收入
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="course in courseStatistics" :key="course.courseId">
              <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                {{ course.courseName }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {{ course.studentCount }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {{ course.avgSessionsPerStudent.toFixed(1) }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <div class="flex items-center">
                  <div class="mr-2 flex-1">
                    <div class="h-2 rounded-full bg-gray-200">
                      <div
                        class="h-2 rounded-full bg-primary-600"
                        :style="{ width: `${course.completionRate}%` }"
                      ></div>
                    </div>
                  </div>
                  <span class="text-xs">{{ course.completionRate.toFixed(0) }}%</span>
                </div>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {{ formatCurrency(course.totalRevenue) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Course Popularity -->
      <div class="card p-6">
        <h3 class="mb-4 text-lg font-medium text-gray-900">熱門課程 (按學生數)</h3>
        <div class="h-64">
          <ChartWrapper
            v-if="popularityChartData"
            type="bar"
            :data="popularityChartData"
            :options="barChartOptions"
          />
        </div>
      </div>

      <!-- Course Revenue -->
      <div class="card p-6">
        <h3 class="mb-4 text-lg font-medium text-gray-900">課程收入分布</h3>
        <div class="h-64">
          <ChartWrapper
            v-if="revenueChartData"
            type="doughnut"
            :data="revenueChartData"
          />
        </div>
      </div>
    </div>

    <!-- Course Type Analysis -->
    <div class="card p-6">
      <h3 class="mb-4 text-lg font-medium text-gray-900">課程類型分析</h3>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div v-for="type in courseTypes" :key="type.type" class="rounded-lg bg-gray-50 p-4">
          <div class="text-sm font-medium text-gray-500">{{ getCourseTypeLabel(type.type) }}</div>
          <div class="mt-1 text-2xl font-semibold text-gray-900">{{ type.count }}</div>
          <div class="mt-1 text-sm text-gray-500">{{ type.percentage.toFixed(0) }}% 佔比</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ChartWrapper from '@/components/reports/ChartWrapper.vue'
import { reportService } from '@/services/reportService'
import { supabase } from '@/services/supabase'
import { formatCurrency } from '@/utils/formatters'
import type { DateRange, ChartData } from '@/types/reports'
import type { CourseStatistics } from '@/services/reportService'

interface Props {
  dateRange: DateRange
}

interface CourseType {
  type: string
  count: number
  percentage: number
}

const props = defineProps<Props>()

const courseStatistics = ref<CourseStatistics[]>([])
const courseTypes = ref<CourseType[]>([])

const popularityChartData = computed<ChartData | null>(() => {
  if (courseStatistics.value.length === 0) return null

  const topCourses = courseStatistics.value
    .sort((a, b) => b.studentCount - a.studentCount)
    .slice(0, 10)

  return {
    labels: topCourses.map(c => c.courseName),
    datasets: [{
      label: '學生人數',
      data: topCourses.map(c => c.studentCount),
      backgroundColor: 'rgba(59, 130, 246, 0.8)'
    }]
  }
})

const revenueChartData = computed<ChartData | null>(() => {
  if (courseStatistics.value.length === 0) return null

  const topRevenueCourses = courseStatistics.value
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5)

  return {
    labels: topRevenueCourses.map(c => c.courseName),
    datasets: [{
      label: '收入',
      data: topRevenueCourses.map(c => c.totalRevenue),
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
  indexAxis: 'y' as const,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    x: {
      beginAtZero: true
    }
  }
}

const getCourseTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    regular: '常規課程',
    trial: '試聽課程',
    intensive: '密集課程',
    online: '線上課程',
    makeup: '補課'
  }
  return labels[type] || type
}

const loadCourseData = async () => {
  try {
    // Load course statistics
    const stats = await reportService.getCourseStatistics({
      startDate: props.dateRange.startDate,
      endDate: props.dateRange.endDate
    })

    // Calculate revenue for each course
    const courseRevenueMap = new Map<string, number>()

    // Get order items for courses
    const { data: orderItems } = await supabase
      .from('order_items')
      .select(`
        item_id,
        final_price,
        orders!inner (
          created_at,
          status
        )
      `)
      .eq('item_type', 'course')
      .eq('orders.status', 'paid')
      .gte('orders.created_at', props.dateRange.startDate)
      .lte('orders.created_at', props.dateRange.endDate)

    if (orderItems) {
      orderItems.forEach(item => {
        const courseId = item.item_id
        if (courseId) {
          courseRevenueMap.set(
            courseId,
            (courseRevenueMap.get(courseId) || 0) + Number(item.final_price)
          )
        }
      })
    }

    // Update statistics with revenue
    courseStatistics.value = stats.map(course => ({
      ...course,
      totalRevenue: courseRevenueMap.get(course.courseId) || 0
    }))

    // Load course types
    const { data: courses } = await supabase
      .from('courses')
      .select('course_type')

    if (courses) {
      const typeCount = new Map<string, number>()
      courses.forEach(c => {
        const type = c.course_type || 'regular'
        typeCount.set(type, (typeCount.get(type) || 0) + 1)
      })

      const total = courses.length
      courseTypes.value = Array.from(typeCount.entries())
        .map(([type, count]) => ({
          type,
          count,
          percentage: (count / total) * 100
        }))
        .sort((a, b) => b.count - a.count)
    }
  } catch (error) {
    console.error('Error loading course data:', error)
  }
}

onMounted(() => {
  loadCourseData()
})

watch(() => props.dateRange, () => {
  loadCourseData()
}, { deep: true })
</script>
