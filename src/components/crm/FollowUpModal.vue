<template>
  <TransitionRoot :show="true" as="template">
    <Dialog as="div" class="relative z-10" @close="$emit('close')">
      <TransitionChild
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <TransitionChild
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel class="relative overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
              <!-- Modal Header -->
              <div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h3 class="text-xl font-semibold text-gray-900">
                  新增跟進記錄
                </h3>
              </div>

              <!-- Modal Body -->
              <div class="px-6 py-4">
                <form @submit.prevent="createFollowUp" class="space-y-5">
                  <!-- 第一行：跟進類型 -->
                  <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">跟進類型 <span class="text-red-500">*</span></label>
                    <select
                      v-model="formData.type"
                      required
                      class="block w-full rounded-md border-gray-300 py-2.5 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    >
                      <option value="">請選擇類型</option>
                      <option value="phone_call">電話聯絡</option>
                      <option value="message">簡訊/Line</option>
                      <option value="email">電子郵件</option>
                      <option value="visit">到場參觀</option>
                      <option value="trial_class">試聽課程</option>
                      <option value="meeting">面談</option>
                      <option value="other">其他</option>
                    </select>
                  </div>

                  <!-- 第二行：主題 -->
                  <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">主題 <span class="text-red-500">*</span></label>
                    <input
                      v-model="formData.subject"
                      type="text"
                      required
                      placeholder="請輸入跟進主題"
                      class="block w-full rounded-md border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    >
                  </div>

                  <!-- 第三行：內容記錄 -->
                  <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">內容記錄 <span class="text-red-500">*</span></label>
                    <textarea
                      v-model="formData.content"
                      rows="6"
                      required
                      placeholder="請詳細記錄跟進內容..."
                      class="block w-full resize-none rounded-md border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    ></textarea>
                  </div>

                  <!-- 第四行：跟進結果和下次跟進日期 -->
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label class="mb-1 block text-sm font-medium text-gray-700">跟進結果 <span class="text-red-500">*</span></label>
                      <select
                        v-model="formData.result"
                        required
                        class="block w-full rounded-md border-gray-300 py-2.5 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                      >
                        <option value="">請選擇結果</option>
                        <option value="positive">正面回應</option>
                        <option value="neutral">中性回應</option>
                        <option value="negative">負面回應</option>
                        <option value="no_response">未回應</option>
                        <option value="converted">已轉換</option>
                        <option value="lost">已流失</option>
                      </select>
                    </div>

                    <div>
                      <label class="mb-1 block text-sm font-medium text-gray-700">下次跟進日期</label>
                      <input
                        v-model="formData.next_follow_up"
                        type="date"
                        class="block w-full rounded-md border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                      >
                    </div>
                  </div>
                </form>
              </div>

              <!-- Modal Footer -->
              <div class="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
                  <button
                    type="button"
                    @click="$emit('close')"
                    class="mt-3 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:mt-0"
                  >
                    取消
                  </button>
                  <button
                    @click="createFollowUp"
                    :disabled="saving"
                    class="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg v-if="saving" class="-ml-1 mr-2 size-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ saving ? '儲存中...' : '儲存' }}
                  </button>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Dialog, DialogPanel, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { crmService } from '@/services/crmService'
import { useAuthStore } from '@/stores/authSupabase'
import type { FollowUpType, FollowUpResult } from '@/types/crm'

interface Props {
  leadId: string
}

interface Emits {
  (e: 'close'): void
  (e: 'saved'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const authStore = useAuthStore()
const saving = ref(false)
const formData = ref({
  type: '' as FollowUpType | '',
  subject: '',
  content: '',
  result: '' as FollowUpResult | '',
  next_follow_up: ''
})

async function createFollowUp() {
  saving.value = true
  try {
    await crmService.createFollowUp({
      lead_id: props.leadId,
      type: formData.value.type as FollowUpType,
      subject: formData.value.subject,
      content: formData.value.content,
      result: formData.value.result as FollowUpResult,
      next_follow_up: formData.value.next_follow_up || undefined,
      created_by: authStore.user?.user_id || ''
    })

    emit('saved')
  } catch (error) {
    console.error('新增跟進失敗:', error)
    alert('新增跟進失敗')
  } finally {
    saving.value = false
  }
}
</script>
