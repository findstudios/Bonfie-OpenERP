<template>
  <MainLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">報表統計</h2>
        <div class="flex gap-2">
          <button
            @click="exportReport('pdf')"
            class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <DocumentArrowDownIcon class="-ml-1 mr-2 size-5" />
            匯出 PDF
          </button>
          <button
            @click="exportReport('excel')"
            class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <TableCellsIcon class="-ml-1 mr-2 size-5" />
            匯出 Excel
          </button>
        </div>
      </div>

      <!-- Date Range Picker -->
      <div class="card p-4">
        <DateRangePicker v-model="dateRange" />
      </div>

      <!-- Tab Navigation -->
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              tab.id === activeTab
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
              'whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium'
            ]"
          >
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div v-if="activeTab === 'summary'">
        <SummaryReport :date-range="dateRange" />
      </div>
      <div v-else-if="activeTab === 'revenue'">
        <RevenueReport :date-range="dateRange" />
      </div>
      <div v-else-if="activeTab === 'students'">
        <StudentReport :date-range="dateRange" />
      </div>
      <div v-else-if="activeTab === 'courses'">
        <CourseReport :date-range="dateRange" />
      </div>
      <div v-else-if="activeTab === 'attendance'">
        <AttendanceReport :date-range="dateRange" />
      </div>
      <!-- 教師績效模組暫時隱藏 -->
      <!-- <div v-else-if="activeTab === 'teachers'">
        <TeacherReport :date-range="dateRange" />
      </div> -->
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import DateRangePicker from '@/components/reports/DateRangePicker.vue'
import SummaryReport from './SummaryReport.vue'
import RevenueReport from './RevenueReport.vue'
import StudentReport from './StudentReport.vue'
import CourseReport from './CourseReport.vue'
import AttendanceReport from './AttendanceReport.vue'
// import TeacherReport from './TeacherReport.vue' // 暫時隱藏
import { DocumentArrowDownIcon, TableCellsIcon } from '@heroicons/vue/24/outline'
import { exportToPDF, exportToExcel } from '@/services/exportService'
import type { DateRange } from '@/types/reports'

const route = useRoute()
const activeTab = ref('summary')
const tabs = [
  { id: 'summary', name: '總覽' },
  { id: 'revenue', name: '收入分析' },
  { id: 'students', name: '學生統計' },
  { id: 'courses', name: '課程分析' },
  { id: 'attendance', name: '出席率' }
  // { id: 'teachers', name: '教師績效' } // 暫時隱藏
]

// Initialize date range to current month
const today = new Date()
const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

const dateRange = ref<DateRange>({
  startDate: startOfMonth.toISOString().split('T')[0],
  endDate: endOfMonth.toISOString().split('T')[0]
})

// Handle query parameters
onMounted(() => {
  const filter = route.query.filter as string
  if (filter === 'expiring') {
    // Switch to students tab to show expiring enrollments
    activeTab.value = 'students'
  }
})

const exportReport = async (format: 'pdf' | 'excel') => {
  try {
    if (format === 'pdf') {
      await exportToPDF({
        type: activeTab.value,
        dateRange: dateRange.value
      })
    } else {
      await exportToExcel({
        type: activeTab.value,
        dateRange: dateRange.value
      })
    }
  } catch (error) {
    console.error('Export failed:', error)
    alert('匯出失敗，請稍後再試')
  }
}
</script>
