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
            <DialogPanel class="relative overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
              <div>
                <h3 class="mb-4 text-lg font-medium leading-6 text-gray-900">
                  編輯潛在客戶
                </h3>

                <form @submit.prevent="updateLead" class="space-y-4">
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <!-- 基本資訊 -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700">學生姓名 *</label>
                      <input
                        v-model="formData.full_name"
                        type="text"
                        required
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      >
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700">聯絡人姓名 *</label>
                      <input
                        v-model="formData.parent_name"
                        type="text"
                        required
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      >
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700">聯絡電話 *</label>
                      <input
                        v-model="formData.phone"
                        type="tel"
                        required
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      >
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700">電子郵件</label>
                      <input
                        v-model="formData.email"
                        type="email"
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      >
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700">年齡</label>
                      <input
                        v-model.number="formData.age"
                        type="number"
                        min="0"
                        max="100"
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      >
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700">就讀學校</label>
                      <input
                        v-model="formData.school"
                        type="text"
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      >
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700">年級</label>
                      <input
                        v-model="formData.grade"
                        type="text"
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      >
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700">狀態</label>
                      <select
                        v-model="formData.status"
                        class="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="new">新客戶</option>
                        <option value="contacted">已聯絡</option>
                        <option value="interested">有興趣</option>
                        <option value="trial_scheduled">已安排試聽</option>
                        <option value="trial_completed">已試聽</option>
                        <option value="converted">已轉換</option>
                        <option value="lost">已流失</option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700">來源</label>
                      <select
                        v-model="formData.source"
                        class="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="walk_in">路過詢問</option>
                        <option value="referral">朋友介紹</option>
                        <option value="online">網路查詢</option>
                        <option value="phone">電話詢問</option>
                        <option value="social_media">社群媒體</option>
                        <option value="flyer">傳單廣告</option>
                        <option value="event">活動推廣</option>
                        <option value="other">其他</option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700">預算範圍</label>
                      <input
                        v-model="formData.budget_range"
                        type="text"
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      >
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700">偏好時段</label>
                      <input
                        v-model="formData.preferred_schedule"
                        type="text"
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      >
                    </div>
                  </div>

                  <!-- 興趣課程 -->
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700">興趣課程</label>
                    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <label
                        v-for="subject in interestOptions"
                        :key="subject.value"
                        class="inline-flex items-center"
                      >
                        <input
                          type="checkbox"
                          :value="subject.value"
                          v-model="formData.interest_subjects"
                          class="focus:border-primary-300 focus:ring-primary-200 rounded border-gray-300 text-primary-600 shadow-sm focus:ring focus:ring-opacity-50"
                        >
                        <span class="ml-2 text-sm text-gray-700">{{ subject.label }}</span>
                      </label>
                    </div>
                  </div>

                  <!-- 備註 -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700">備註</label>
                    <textarea
                      v-model="formData.notes"
                      rows="3"
                      class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                    ></textarea>
                  </div>

                  <!-- 按鈕 -->
                  <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="submit"
                      :disabled="saving"
                      class="inline-flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 sm:col-start-2 sm:text-sm"
                    >
                      {{ saving ? '儲存中...' : '儲存' }}
                    </button>
                    <button
                      type="button"
                      @click="$emit('close')"
                      class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                    >
                      取消
                    </button>
                  </div>
                </form>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Dialog, DialogPanel, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { crmService } from '@/services/crmService'
import type { Lead } from '@/types/crm'

interface Props {
  lead: Lead | null
}

interface Emits {
  (e: 'close'): void
  (e: 'saved'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const saving = ref(false)
const formData = ref({
  full_name: '',
  parent_name: '',
  phone: '',
  email: '',
  age: null as number | null,
  school: '',
  grade: '',
  status: 'new',
  source: 'walk_in',
  interest_subjects: [] as string[],
  budget_range: '',
  preferred_schedule: '',
  notes: ''
})

const interestOptions = [
  { value: 'english', label: '英語' },
  { value: 'math', label: '數學' },
  { value: 'chinese', label: '國語' },
  { value: 'science', label: '自然' },
  { value: 'social', label: '社會' },
  { value: 'art', label: '藝術' },
  { value: 'music', label: '音樂' },
  { value: 'other', label: '其他' }
]

// 監聽 lead 變化，初始化表單數據
watch(() => props.lead, (newLead) => {
  if (newLead) {
    formData.value = {
      full_name: newLead.full_name,
      parent_name: newLead.parent_name,
      phone: newLead.phone,
      email: newLead.email || '',
      age: newLead.age || null,
      school: newLead.school || '',
      grade: newLead.grade || '',
      status: newLead.status,
      source: newLead.source,
      interest_subjects: newLead.interest_subjects || [],
      budget_range: newLead.budget_range || '',
      preferred_schedule: newLead.preferred_schedule || '',
      notes: newLead.notes || ''
    }
  }
}, { immediate: true })

async function updateLead() {
  if (!props.lead) return

  saving.value = true
  try {
    await crmService.updateLead(props.lead.lead_id, formData.value)
    emit('saved')
  } catch (error) {
    console.error('更新客戶資料失敗:', error)
    alert('更新客戶資料失敗')
  } finally {
    saving.value = false
  }
}
</script>
