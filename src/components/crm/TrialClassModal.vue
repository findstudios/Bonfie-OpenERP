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
                  安排試聽課程
                </h3>
              </div>

              <!-- Modal Body -->
              <div class="px-6 py-4">
                <form @submit.prevent="createTrialClass" class="space-y-5">
                  <!-- 第一行：選擇課程 -->
                  <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">選擇課程</label>
                    <select
                      v-model="formData.course_id"
                      class="block w-full rounded-md border-gray-300 py-2.5 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    >
                      <option value="">請選擇課程</option>
                      <option v-for="course in availableCourses" :key="course.course_id" :value="course.course_id">
                        {{ course.course_name }} - {{ course.instructor_name }}
                      </option>
                    </select>
                  </div>

                  <!-- 第二行：日期和時間 -->
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label class="mb-1 block text-sm font-medium text-gray-700">試聽日期 <span class="text-red-500">*</span></label>
                      <input
                        v-model="formData.scheduled_date"
                        type="date"
                        required
                        :min="minDate"
                        class="block w-full rounded-md border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                      >
                    </div>

                    <div>
                      <label class="mb-1 block text-sm font-medium text-gray-700">試聽時間 <span class="text-red-500">*</span></label>
                      <input
                        v-model="formData.scheduled_time"
                        type="time"
                        required
                        class="block w-full rounded-md border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                      >
                    </div>
                  </div>

                  <!-- 第三行：老師和教室 -->
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label class="mb-1 block text-sm font-medium text-gray-700">授課老師</label>
                      <select
                        v-model="formData.teacher_id"
                        class="block w-full rounded-md border-gray-300 py-2.5 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                      >
                        <option value="">請選擇老師</option>
                        <option v-for="teacher in availableTeachers" :key="teacher.user_id" :value="teacher.user_id">
                          {{ teacher.full_name }}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label class="mb-1 block text-sm font-medium text-gray-700">教室</label>
                      <input
                        v-model="formData.classroom"
                        type="text"
                        placeholder="例如: A101"
                        class="block w-full rounded-md border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                      >
                    </div>
                  </div>

                  <!-- 第四行：備註 -->
                  <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">備註</label>
                    <textarea
                      v-model="formData.notes"
                      rows="4"
                      placeholder="請輸入試聽相關備註..."
                      class="block w-full resize-none rounded-md border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    ></textarea>
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
                    @click="createTrialClass"
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
import { ref, computed, onMounted } from 'vue'
import { Dialog, DialogPanel, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { crmService } from '@/services/crmService'
import { courseService } from '@/services/courseService'
import { useAuthStore } from '@/stores/authSupabase'

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
const availableCourses = ref<any[]>([])
const availableTeachers = ref<any[]>([])

const formData = ref({
  course_id: '',
  scheduled_date: '',
  scheduled_time: '',
  teacher_id: '',
  classroom: '',
  notes: ''
})

// 計算最小日期（今天）
const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

// 載入可用課程和老師
async function loadOptions() {
  try {
    // 載入課程列表
    const courses = await courseService.getCourses()
    availableCourses.value = courses.filter(c => c.status === 'active')

    // 這裡應該載入老師列表，暫時使用模擬數據
    availableTeachers.value = [
      { user_id: 'T001', full_name: '張老師' },
      { user_id: 'T002', full_name: '李老師' },
      { user_id: 'T003', full_name: '王老師' }
    ]
  } catch (error) {
    console.error('載入選項失敗:', error)
  }
}

async function createTrialClass() {
  saving.value = true
  try {
    await crmService.createTrialClass({
      lead_id: props.leadId,
      course_id: formData.value.course_id || undefined,
      scheduled_date: formData.value.scheduled_date,
      scheduled_time: formData.value.scheduled_time,
      teacher_id: formData.value.teacher_id || undefined,
      classroom: formData.value.classroom || undefined,
      created_by: authStore.user?.user_id || ''
    })

    emit('saved')
  } catch (error) {
    console.error('安排試聽失敗:', error)
    alert('安排試聽失敗')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadOptions()
})
</script>
