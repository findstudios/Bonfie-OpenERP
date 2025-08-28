<template>
  <div class="validity-display">
    <div :class="['rounded-lg p-4', statusClass]">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="font-medium text-gray-900">有效期限</h4>
          <p class="mt-1 text-sm">
            <span v-if="enrollment.valid_from">
              {{ formatDate(enrollment.valid_from) }} -
            </span>
            {{ formatDate(enrollment.valid_until) }}
          </p>
          <p :class="['mt-2 text-sm font-medium', statusTextClass]">
            {{ expiryStatus.displayText }}
          </p>
        </div>

        <div class="text-right">
          <div :class="['inline-flex items-center rounded-full px-3 py-1 text-sm font-medium', statusBadgeClass]">
            <svg v-if="expiryStatus.status === 'expired'" class="mr-1 size-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <svg v-else-if="expiryStatus.status === 'expiring'" class="mr-1 size-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <svg v-else class="mr-1 size-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            {{ statusText }}
          </div>

          <button
            v-if="showExtendButton && canExtend"
            @click="$emit('extend')"
            class="mt-3 block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            延長期限
          </button>
        </div>
      </div>

      <div v-if="enrollment.extended_times && enrollment.extended_times > 0" class="mt-3 border-t border-gray-200 pt-3">
        <p class="text-xs text-gray-600">
          已延長 {{ enrollment.extended_times }} 次
          <span v-if="enrollment.last_extended_at">
            （最後延長：{{ formatDate(enrollment.last_extended_at) }}）
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Enrollment } from '@/types'
import { creditManagementService } from '@/services/creditManagementService'

const props = defineProps<{
  enrollment: Enrollment
  showExtendButton?: boolean
}>()

defineEmits<{
  extend: []
}>()

const expiryStatus = computed(() => {
  if (!props.enrollment.valid_until) {
    return {
      status: 'active',
      remainingDays: 0,
      displayText: '無期限'
    }
  }
  return creditManagementService.getExpiryStatus(props.enrollment.valid_until)
})

const canExtend = computed(() => {
  return props.enrollment.status === 'active' &&
         props.enrollment.enrollment_category === 'regular' &&
         !props.enrollment.is_expired
})

const statusClass = computed(() => {
  switch (expiryStatus.value.status) {
    case 'expired':
      return 'bg-red-50 border border-red-200'
    case 'expiring':
      return 'bg-yellow-50 border border-yellow-200'
    default:
      return 'bg-green-50 border border-green-200'
  }
})

const statusTextClass = computed(() => {
  switch (expiryStatus.value.status) {
    case 'expired':
      return 'text-red-700'
    case 'expiring':
      return 'text-yellow-700'
    default:
      return 'text-green-700'
  }
})

const statusBadgeClass = computed(() => {
  switch (expiryStatus.value.status) {
    case 'expired':
      return 'bg-red-100 text-red-800'
    case 'expiring':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-green-100 text-green-800'
  }
})

const statusText = computed(() => {
  switch (expiryStatus.value.status) {
    case 'expired':
      return '已過期'
    case 'expiring':
      return '即將到期'
    default:
      return '有效'
  }
})

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW')
}
</script>

<style scoped>
.validity-display {
  @apply w-full;
}
</style>
