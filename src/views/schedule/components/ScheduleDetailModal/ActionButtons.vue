<template>
  <div class="flex justify-between border-t border-gray-200 pt-4">
    <!-- 左側危險操作 -->
    <div class="flex space-x-2">
      <button
        @click="handleDelete"
        class="btn btn-danger-subtle"
      >
        <TrashIcon class="mr-1 size-4" />
        刪除課程
      </button>
    </div>

    <!-- 右側主要操作 -->
    <div class="flex space-x-3">
      <button
        @click="handleReschedule"
        class="btn btn-warning-subtle"
      >
        <ArrowPathIcon class="mr-1 size-4" />
        調課
      </button>
      <button
        @click="handleCancel"
        class="btn btn-info-subtle"
      >
        <PauseIcon class="mr-1 size-4" />
        停課
      </button>
      <button
        @click="$emit('close')"
        class="btn btn-secondary"
      >
        關閉
      </button>
      <button
        v-if="canMarkAttendance"
        @click="$emit('mark-attendance')"
        class="btn btn-primary"
      >
        點名
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TrashIcon, ArrowPathIcon, PauseIcon } from '@heroicons/vue/24/outline'

interface Props {
  canMarkAttendance: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
  'mark-attendance': []
  'delete': []
  'reschedule': []
  'cancel-class': []
}>()

function handleDelete() {
  if (confirm('確定要刪除這個課程安排嗎？\n\n⚠️ 此操作無法復原\n⚠️ 相關的出席記錄也會一併刪除\n⚠️ 請謹慎確認後再執行')) {
    emit('delete')
  }
}

function handleReschedule() {
  if (confirm('確定要調整這堂課的時間嗎？')) {
    emit('reschedule')
  }
}

function handleCancel() {
  if (confirm('確定要停課嗎？')) {
    emit('cancel-class')
  }
}
</script>

<style scoped>
.btn {
  @apply px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200;
}

.btn-primary {
  @apply text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500;
}

.btn-secondary {
  @apply text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-blue-500;
}

.btn-danger {
  @apply text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 flex items-center;
}

.btn-danger-subtle {
  @apply text-gray-400 bg-transparent hover:text-red-600 hover:bg-red-50 focus:ring-red-500 flex items-center transition-all duration-200;
}

.btn-warning {
  @apply text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 flex items-center;
}

.btn-warning-subtle {
  @apply text-gray-400 bg-transparent hover:text-yellow-600 hover:bg-yellow-50 focus:ring-yellow-500 flex items-center transition-all duration-200;
}

.btn-info {
  @apply text-white bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 flex items-center;
}

.btn-info-subtle {
  @apply text-gray-400 bg-transparent hover:text-gray-600 hover:bg-gray-50 focus:ring-gray-500 flex items-center transition-all duration-200;
}
</style>
