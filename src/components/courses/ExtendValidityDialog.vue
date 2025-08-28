<template>
  <TransitionRoot appear :show="show" as="template">
    <Dialog as="div" @close="$emit('cancel')" class="relative z-10">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-25" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900">
                延長有效期限
              </DialogTitle>

              <div class="mt-4">
                <div class="mb-4 rounded-lg bg-gray-50 p-3">
                  <p class="text-sm text-gray-600">
                    <span class="font-medium">學生：</span>
                    {{ enrollment.student?.chinese_name || '-' }}
                  </p>
                  <p class="mt-1 text-sm text-gray-600">
                    <span class="font-medium">課程：</span>
                    {{ enrollment.course?.course_name || '-' }}
                  </p>
                  <p class="mt-1 text-sm text-gray-600">
                    <span class="font-medium">目前到期日：</span>
                    {{ formatDate(enrollment.valid_until) }}
                  </p>
                  <p class="mt-1 text-sm text-gray-600">
                    <span class="font-medium">剩餘堂數：</span>
                    {{ enrollment.remaining_sessions }} 堂
                  </p>
                </div>

                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">
                      延長天數
                    </label>
                    <select
                      v-model="extendDays"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option :value="30">30 天</option>
                      <option :value="60">60 天</option>
                      <option :value="90">90 天</option>
                      <option :value="180">180 天</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700">
                      延長原因 <span class="text-red-500">*</span>
                    </label>
                    <textarea
                      v-model="reason"
                      rows="3"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="請輸入延長原因..."
                    ></textarea>
                  </div>

                  <div v-if="newExpiryDate" class="rounded-lg bg-blue-50 p-3">
                    <p class="text-sm font-medium text-blue-900">
                      新到期日：{{ formatDate(newExpiryDate) }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  class="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  @click="$emit('cancel')"
                >
                  取消
                </button>
                <button
                  type="button"
                  :disabled="!canConfirm || loading"
                  :class="[
                    'inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    canConfirm && !loading
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'cursor-not-allowed bg-gray-300'
                  ]"
                  @click="handleConfirm"
                >
                  <svg v-if="loading" class="-ml-1 mr-2 size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ loading ? '處理中...' : '確認延長' }}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/vue'
import type { Enrollment } from '@/types'
import { creditManagementService } from '@/services/creditManagementService'
import { useAuthStore } from '@/stores/authSupabase'

const props = defineProps<{
  show: boolean
  enrollment: Enrollment
}>()

const emit = defineEmits<{
  cancel: []
  confirm: [data: { days: number; reason: string }]
}>()

const authStore = useAuthStore()
const extendDays = ref(30)
const reason = ref('')
const loading = ref(false)

const newExpiryDate = computed(() => {
  if (!props.enrollment.valid_until) return null
  const date = new Date(props.enrollment.valid_until)
  date.setDate(date.getDate() + extendDays.value)
  return date.toISOString().split('T')[0]
})

const canConfirm = computed(() => {
  return reason.value.trim().length > 0
})

const handleConfirm = async () => {
  if (!canConfirm.value || loading.value) return

  loading.value = true
  try {
    await creditManagementService.extendEnrollmentValidity(
      props.enrollment.enrollment_id,
      extendDays.value,
      reason.value.trim(),
      authStore.user?.user_id || '',
      authStore.user?.user_id || ''
    )

    emit('confirm', {
      days: extendDays.value,
      reason: reason.value.trim()
    })

    // Reset form
    extendDays.value = 30
    reason.value = ''
  } catch (error) {
    console.error('Failed to extend validity:', error)
    alert('延長失敗，請稍後重試')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW')
}
</script>
