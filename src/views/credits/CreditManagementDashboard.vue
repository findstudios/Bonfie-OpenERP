<template>
  <MainLayout>
    <div class="mx-auto max-w-6xl p-6">
      <!-- 儀表板標題 -->
      <h1 data-testid="dashboard-title" class="mb-6 text-2xl font-bold text-gray-900">
        儲值管理儀表板
      </h1>

    <!-- 統計卡片區 -->
    <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <!-- 即將到期卡片 -->
      <div data-testid="expiring-soon-card" class="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-yellow-600">即將到期</p>
            <p class="text-2xl font-bold text-yellow-800">{{ expiringSoonCount }}</p>
          </div>
          <ExclamationTriangleIcon class="size-8 text-yellow-500" />
        </div>
      </div>

      <!-- Expired Today Card -->
      <div data-testid="expired-today-card" class="rounded-lg border border-red-200 bg-red-50 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-red-600">今日到期</p>
            <p class="text-2xl font-bold text-red-800">{{ expiredTodayCount }}</p>
          </div>
          <XCircleIcon class="size-8 text-red-500" />
        </div>
      </div>

      <!-- Active Enrollments Card -->
      <div data-testid="active-enrollments-card" class="rounded-lg border border-green-200 bg-green-50 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-green-600">有效註冊</p>
            <p class="text-2xl font-bold text-green-800">{{ activeEnrollmentsCount }}</p>
          </div>
          <CheckCircleIcon class="size-8 text-green-500" />
        </div>
      </div>
    </div>

    <!-- Filter Buttons -->
    <div class="mb-4 flex gap-2">
      <button
        v-for="filter in filters"
        :key="filter.value"
        :data-testid="`filter-${filter.key}`"
        @click="selectedFilter = filter.value"
        class="rounded-lg px-4 py-2 transition-colors"
        :class="selectedFilter === filter.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
      >
        {{ filter.label }}
      </button>
    </div>

    <!-- Expiring Enrollments Section -->
    <div data-testid="expiring-section" class="rounded-lg bg-white shadow">
      <div class="border-b border-gray-200 px-6 py-4">
        <h2 class="text-lg font-semibold text-gray-900">即將到期的註冊</h2>
      </div>

      <div v-if="loading" class="p-6 text-center text-gray-500">
        載入中...
      </div>

      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="enrollment in filteredEnrollments"
          :key="enrollment.enrollment_id"
          data-testid="expiring-item"
          class="p-6 transition-colors hover:bg-gray-50"
        >
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-medium text-gray-900">
                {{ enrollment.student?.chinese_name }} - {{ enrollment.course?.course_name }}
              </h3>
              <div class="mt-1 space-y-1">
                <p class="text-sm text-gray-600">
                  類別：{{ enrollment.enrollment_category === 'theme' ? '主題課程' : '常態課程' }}
                </p>
                <p class="text-sm text-gray-600">
                  剩餘堂數：{{ enrollment.remaining_sessions }} 堂
                </p>
                <p class="text-sm text-gray-600">
                  到期日：{{ enrollment.valid_until }}
                </p>
              </div>
            </div>
            <button
              :data-testid="`extend-button-${enrollment.enrollment_id}`"
              @click="openExtensionDialog(enrollment)"
              class="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
            >
              延期
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Extension Dialog -->
    <div
      v-if="showExtensionDialog"
      data-testid="extension-dialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75"
    >
      <div class="w-full max-w-md rounded-lg bg-white p-6">
        <h3 class="mb-4 text-lg font-semibold text-gray-900">延期註冊</h3>
        <p data-testid="extension-student-name" class="mb-4 text-gray-600">
          學生：{{ selectedEnrollment?.student?.chinese_name }}
        </p>
        <div class="flex justify-end gap-2">
          <button
            @click="showExtensionDialog = false"
            class="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
          >
            取消
          </button>
          <button
            class="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          >
            確認延期
          </button>
        </div>
      </div>
    </div>
  </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ExclamationTriangleIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import { creditManagementService } from '@/services/creditManagementService'
import { supabase } from '@/services/supabase'
import type { Enrollment } from '@/types'
import MainLayout from '@/components/layout/MainLayout.vue'

const expiringEnrollments = ref<Enrollment[]>([])
const activeEnrollmentsCount = ref(0)
const showExtensionDialog = ref(false)
const selectedEnrollment = ref<Enrollment | null>(null)
const selectedFilter = ref(7)
const loading = ref(true)

const filters = [
  { key: '7days', value: 7, label: '7天內' },
  { key: '14days', value: 14, label: '14天內' },
  { key: '30days', value: 30, label: '30天內' },
  { key: 'all', value: 365, label: '全部' }
]

const expiringSoonCount = computed(() => {
  return expiringEnrollments.value.filter(e => {
    const days = calculateDaysUntilExpiry(e.valid_until)
    return days > 0 && days <= 7
  }).length
})

const expiredTodayCount = computed(() => {
  return expiringEnrollments.value.filter(e => {
    const days = calculateDaysUntilExpiry(e.valid_until)
    return days === 0
  }).length
})

const filteredEnrollments = computed(() => {
  return expiringEnrollments.value.filter(e => {
    const days = calculateDaysUntilExpiry(e.valid_until)
    return days >= 0 && days <= selectedFilter.value
  })
})

function calculateDaysUntilExpiry(validUntil: string | null): number {
  if (!validUntil) return -1
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(validUntil)
  expiry.setHours(0, 0, 0, 0)
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function openExtensionDialog(enrollment: Enrollment) {
  selectedEnrollment.value = enrollment
  showExtensionDialog.value = true
}

async function loadData() {
  try {
    loading.value = true
    // Load expiring enrollments
    expiringEnrollments.value = await creditManagementService.getExpiringEnrollments(365)

    // Load active enrollments count
    const { data, error } = await supabase
      .from('enrollments')
      .select('enrollment_id', { count: 'exact' })
      .eq('status', 'active')
      .not('valid_until', 'is', null)

    if (!error && data) {
      activeEnrollmentsCount.value = data.length
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
