<template>
  <div class="space-y-3">
    <div class="text-sm font-semibold text-gray-700">
      學生名單 ({{ students.length }} 人)
    </div>
    <div class="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
      <div
        v-for="(student, idx) in students"
        :key="student.student_id"
        class="flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-gray-50"
      >
        <div class="flex items-center gap-3">
          <span class="w-6 text-sm font-medium text-gray-400">{{ idx + 1 }}</span>
          <span class="text-sm font-medium text-gray-900">{{ student.chinese_name }}</span>
          <span v-if="student.is_trial" class="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
            試聽
          </span>
        </div>
        <div>
          <span
            v-if="student.attendance_status"
            class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="getAttendanceStatusClass(student.attendance_status)"
          >
            {{ getAttendanceStatusText(student.attendance_status) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Student {
  student_id: string
  chinese_name: string
  is_trial?: boolean
  attendance_status?: string | null
  enrollment_id?: string | null
}

defineProps<{
  students: Student[]
}>()

function getAttendanceStatusClass(status: string) {
  switch (status) {
    case 'present':
      return 'bg-green-100 text-green-700 border border-green-200'
    case 'absent':
      return 'bg-red-100 text-red-700 border border-red-200'
    case 'late':
      return 'bg-yellow-100 text-yellow-700 border border-yellow-200'
    case 'leave_early':
      return 'bg-orange-100 text-orange-700 border border-orange-200'
    default:
      return 'bg-gray-100 text-gray-600 border border-gray-200'
  }
}

function getAttendanceStatusText(status: string) {
  switch (status) {
    case 'present':
      return '出席'
    case 'absent':
      return '缺席'
    case 'late':
      return '遲到'
    case 'leave_early':
      return '早退'
    default:
      return '未點名'
  }
}
</script>
