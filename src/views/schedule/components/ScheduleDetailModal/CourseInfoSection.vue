<template>
  <div class="rounded-lg bg-gray-50 p-4">
    <h4 class="mb-3 text-lg font-medium text-gray-900">課程資訊</h4>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <!-- 課程名稱 -->
      <InfoItem
        label="課程名稱"
        :value="course?.course_name || '未知課程'"
      />

      <!-- 課程分類 -->
      <InfoItem label="課程分類">
        <template #value>
          <span class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            {{ course?.category || '一般課程' }}
          </span>
        </template>
      </InfoItem>

      <!-- 上課時間 -->
      <InfoItem
        label="上課時間"
        :value="classTime"
      />

      <!-- 教室 -->
      <InfoItem
        label="教室"
        :value="classroom || '未指定'"
      />

      <!-- 狀態 -->
      <InfoItem label="狀態">
        <template #value>
          <span :class="getStatusClass(status)">
            {{ getStatusText(status) }}
          </span>
        </template>
      </InfoItem>

      <!-- 課程類型 (補課) -->
      <InfoItem v-if="isMakeup" label="課程類型">
        <template #value>
          <span class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            補課
          </span>
        </template>
      </InfoItem>
    </div>

    <!-- 備註 -->
    <div v-if="notes" class="mt-4">
      <InfoItem
        label="備註"
        :value="notes"
        full-width
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Course } from '@/types'
import InfoItem from './InfoItem.vue'

interface Props {
  course?: Course | null
  classroom?: string
  status: string
  isMakeup?: boolean
  notes?: string
  classTime: string
}

defineProps<Props>()

// 狀態樣式映射
function getStatusClass(status: string): string {
  const classes = {
    'scheduled': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
    'completed': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800',
    'cancelled': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'
  }
  return classes[status as keyof typeof classes] || classes.scheduled
}

// 狀態文字映射
function getStatusText(status: string): string {
  const statusMap = {
    'scheduled': '已排程',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status as keyof typeof statusMap] || status
}
</script>
