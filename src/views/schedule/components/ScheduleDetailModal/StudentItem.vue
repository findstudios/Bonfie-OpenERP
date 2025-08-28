<template>
  <div class="flex items-center">
    <Avatar
      :name="student.chinese_name"
      :size="40"
      bg-color="bg-green-100"
      text-color="text-green-600"
      class="mr-3"
    />

    <div class="flex-1">
      <p class="text-sm font-medium text-gray-900">
        {{ student.chinese_name }}
        <span v-if="student.english_name" class="text-gray-500">
          ({{ student.english_name }})
        </span>
      </p>
      <p class="text-xs text-gray-500">
        學號: {{ student.student_id }}
      </p>
    </div>

    <div>
      <AttendanceStatus :status="student.attendance_status" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Student } from '@/types'
import Avatar from './Avatar.vue'
import AttendanceStatus from './AttendanceStatus.vue'

interface Props {
  student: Student
}

defineProps<Props>()
</script>
