<template>
  <TransitionRoot appear :show="show" as="template">
    <Dialog as="div" @close="$emit('close')" class="relative z-10">
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
            <DialogPanel class="w-full max-w-2xl overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <DialogTitle
                as="h3"
                class="text-lg font-medium leading-6 text-gray-900"
              >
                編輯試聽課程
              </DialogTitle>

              <form @submit.prevent="handleSubmit" class="mt-6 space-y-6">
                <!-- 試聽日期時間 -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700">
                      試聽日期 <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="formData.scheduled_date"
                      type="date"
                      required
                      class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700">
                      試聽時間 <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="formData.scheduled_time"
                      type="time"
                      required
                      class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <!-- 選擇老師 -->
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700">
                    授課老師
                  </label>
                  <select
                    v-model="formData.teacher_id"
                    class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">請選擇老師（可選）</option>
                    <option
                      v-for="teacher in availableTeachers"
                      :key="teacher.user_id"
                      :value="teacher.user_id"
                    >
                      {{ teacher.full_name }}
                    </option>
                  </select>
                </div>

                <!-- 教室 -->
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700">
                    教室
                  </label>
                  <input
                    v-model="formData.classroom"
                    type="text"
                    placeholder="請輸入教室名稱或編號"
                    class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <!-- 狀態 -->
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700">
                    狀態
                  </label>
                  <select
                    v-model="formData.status"
                    class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="scheduled">已安排</option>
                    <option value="completed">已完成</option>
                    <option value="cancelled">已取消</option>
                    <option value="no_show">未出席</option>
                  </select>
                </div>

                <!-- 出席狀況 -->
                <div v-if="formData.status === 'completed'">
                  <label class="mb-2 block text-sm font-medium text-gray-700">
                    出席狀況
                  </label>
                  <div class="flex items-center space-x-4">
                    <label class="flex items-center">
                      <input
                        v-model="formData.attendance"
                        type="radio"
                        :value="true"
                        class="mr-2"
                      />
                      已出席
                    </label>
                    <label class="flex items-center">
                      <input
                        v-model="formData.attendance"
                        type="radio"
                        :value="false"
                        class="mr-2"
                      />
                      未出席
                    </label>
                  </div>
                </div>

                <!-- 滿意度評分 -->
                <div v-if="formData.status === 'completed' && formData.attendance">
                  <label class="mb-2 block text-sm font-medium text-gray-700">
                    滿意度評分
                  </label>
                  <div class="flex items-center space-x-2">
                    <button
                      v-for="n in 5"
                      :key="n"
                      type="button"
                      @click="formData.rating = n"
                      class="p-1"
                    >
                      <StarIcon
                        :class="[
                          'size-6',
                          n <= (formData.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                        ]"
                        fill="currentColor"
                      />
                    </button>
                    <span class="text-sm text-gray-600">{{ formData.rating || 0 }}/5</span>
                  </div>
                </div>

                <!-- 試聽回饋 -->
                <div v-if="formData.status === 'completed'">
                  <label class="mb-2 block text-sm font-medium text-gray-700">
                    試聽回饋
                  </label>
                  <textarea
                    v-model="formData.feedback"
                    rows="4"
                    placeholder="請輸入試聽回饋..."
                    class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <!-- 備註 -->
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700">
                    備註
                  </label>
                  <textarea
                    v-model="formData.follow_up_notes"
                    rows="3"
                    placeholder="請輸入相關備註..."
                    class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <!-- 按鈕 -->
                <div class="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    @click="$emit('close')"
                    class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    :disabled="submitting"
                    class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span v-if="submitting" class="mr-2">
                      <svg class="size-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                    {{ submitting ? '更新中...' : '確定更新' }}
                  </button>
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { StarIcon } from '@heroicons/vue/24/solid'
import { crmService } from '@/services/crmService'
import { supabase } from '@/services/supabase'
import type { TrialClass } from '@/types/crm'

interface Props {
  show: boolean
  trial: TrialClass | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  updated: []
}>()

const submitting = ref(false)
const availableTeachers = ref<any[]>([])

// 表單資料
const formData = ref({
  scheduled_date: '',
  scheduled_time: '',
  teacher_id: '',
  classroom: '',
  status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled' | 'no_show',
  attendance: undefined as boolean | undefined,
  rating: undefined as number | undefined,
  feedback: '',
  follow_up_notes: ''
})

// 載入老師列表
const loadTeachers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, full_name, role_id')
      .in('role_id', [1, 2, 3]) // ADMIN, STAFF, TEACHER
      .eq('status', 'active')

    if (error) throw error
    availableTeachers.value = data || []
  } catch (error) {
    console.error('載入老師失敗:', error)
  }
}

// 初始化表單資料
const initializeForm = () => {
  if (props.trial) {
    formData.value = {
      scheduled_date: props.trial.scheduled_date || '',
      scheduled_time: props.trial.scheduled_time || '',
      teacher_id: props.trial.teacher_id || '',
      classroom: props.trial.classroom || '',
      status: props.trial.status,
      attendance: props.trial.attendance,
      rating: props.trial.rating,
      feedback: props.trial.feedback || '',
      follow_up_notes: props.trial.follow_up_notes || ''
    }
  }
}

// 提交表單
const handleSubmit = async () => {
  if (!props.trial) return

  submitting.value = true
  try {
    await crmService.updateTrialClass(props.trial.trial_id, {
      scheduled_date: formData.value.scheduled_date,
      scheduled_time: formData.value.scheduled_time,
      teacher_id: formData.value.teacher_id || undefined,
      classroom: formData.value.classroom || undefined,
      status: formData.value.status,
      attendance: formData.value.attendance,
      rating: formData.value.rating,
      feedback: formData.value.feedback,
      follow_up_notes: formData.value.follow_up_notes
    })

    emit('updated')
    emit('close')
  } catch (error) {
    console.error('更新試聽課程失敗:', error)
    alert('更新失敗，請稍後再試')
  } finally {
    submitting.value = false
  }
}

// 監聽 Modal 顯示
watch(() => props.show, (newVal) => {
  if (newVal) {
    initializeForm()
    loadTeachers()
  }
})

onMounted(() => {
  if (props.show) {
    initializeForm()
    loadTeachers()
  }
})
</script>
