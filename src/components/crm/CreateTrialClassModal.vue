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
                安排試聽課程
              </DialogTitle>

              <form @submit.prevent="handleSubmit" class="mt-6 space-y-6">
                <!-- 選擇潛在客戶 -->
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700">
                    潛在客戶 <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="formData.lead_id"
                    required
                    class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">請選擇潛在客戶</option>
                    <option
                      v-for="lead in availableLeads"
                      :key="lead.lead_id"
                      :value="lead.lead_id"
                    >
                      {{ lead.full_name }} - {{ lead.phone }}
                    </option>
                  </select>
                </div>

                <!-- 選擇課程 -->
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700">
                    試聽課程
                  </label>
                  <select
                    v-model="formData.course_id"
                    class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">請選擇課程（可選）</option>
                    <option
                      v-for="course in availableCourses"
                      :key="course.course_id"
                      :value="course.course_id"
                    >
                      {{ course.course_name }}
                    </option>
                  </select>
                </div>

                <!-- 選擇試聽時段 -->
                <div v-if="formData.course_id">
                  <label class="mb-2 block text-sm font-medium text-gray-700">
                    可試聽時段 <span class="text-red-500">*</span>
                  </label>
                  <div v-if="availableSchedules.length > 0" class="space-y-2">
                    <label
                      v-for="schedule in availableSchedules"
                      :key="schedule.schedule_id"
                      class="flex cursor-pointer items-center rounded-lg border p-3 hover:bg-gray-50"
                      :class="{ 'border-blue-500 bg-blue-50': selectedSchedule?.schedule_id === schedule.schedule_id }"
                    >
                      <input
                        type="radio"
                        :value="schedule.schedule_id"
                        v-model="selectedScheduleId"
                        class="sr-only"
                      />
                      <div class="flex-1">
                        <div class="font-medium">
                          {{ formatScheduleDate(schedule.class_datetime) }}
                        </div>
                        <div class="text-sm text-gray-500">
                          {{ formatScheduleTime(schedule.class_datetime) }} - {{ formatScheduleTime(schedule.end_datetime) }}
                        </div>
                        <div class="text-sm text-gray-500">
                          老師：{{ schedule.course?.instructor?.full_name || '未指定' }} |
                          教室：{{ schedule.classroom || '未指定' }}
                        </div>
                      </div>
                    </label>
                  </div>
                  <div v-else class="rounded-lg border bg-gray-50 p-4 text-sm text-gray-500">
                    此課程近期沒有可試聽的時段
                  </div>
                </div>

                <!-- 沒有選擇課程時，顯示日期時間選擇 -->
                <div v-else>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="mb-2 block text-sm font-medium text-gray-700">
                        試聽日期 <span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="formData.scheduled_date"
                        type="date"
                        required
                        :min="today"
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
                    {{ submitting ? '安排中...' : '確定安排' }}
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
import { ref, computed, onMounted, watch } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { crmService } from '@/services/crmService'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/authSupabase'
import type { Lead, TrialClass } from '@/types/crm'
import type { Course } from '@/types'

interface Props {
  show: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  created: []
}>()

const authStore = useAuthStore()
const submitting = ref(false)

// 表單資料
const formData = ref({
  lead_id: '',
  course_id: '',
  scheduled_date: '',
  scheduled_time: '',
  teacher_id: '',
  classroom: '',
  follow_up_notes: ''
})

// 可選資料
const availableLeads = ref<Lead[]>([])
const availableCourses = ref<Course[]>([])
const availableTeachers = ref<any[]>([])
const availableSchedules = ref<any[]>([])
const selectedScheduleId = ref('')
const selectedSchedule = computed(() =>
  availableSchedules.value.find(s => s.schedule_id === selectedScheduleId.value)
)

// 今天的日期（用於限制最小日期）
const today = computed(() => {
  const date = new Date()
  return date.toISOString().split('T')[0]
})

// 載入可選的潛在客戶（只顯示未轉換的）
const loadLeads = async () => {
  try {
    const leads = await crmService.getLeads({
      status: 'new' as any // 只顯示新客戶或有興趣的客戶
    })
    availableLeads.value = leads.filter(lead =>
      ['new', 'contacted', 'interested', 'trial_scheduled'].includes(lead.status as string)
    )
  } catch (error) {
    console.error('載入潛在客戶失敗:', error)
  }
}

// 載入可選的課程
const loadCourses = async () => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('status', 'active')
      .order('course_name')

    if (error) throw error
    availableCourses.value = data || []
  } catch (error) {
    console.error('載入課程失敗:', error)
  }
}

// 載入可選的老師
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

// 載入課程的排課時段
const loadCourseSchedules = async (courseId: string) => {
  try {
    const today = new Date()
    const endDate = new Date()
    endDate.setDate(today.getDate() + 14) // 顯示未來兩週的課表

    const { data, error } = await supabase
      .from('schedules')
      .select(`
        *,
        course:courses(
          course_id,
          course_name,
          instructor:users!courses_instructor_id_fkey(user_id, full_name)
        )
      `)
      .eq('course_id', courseId)
      .eq('status', 'scheduled')
      .gte('class_datetime', today.toISOString())
      .lte('class_datetime', endDate.toISOString())
      .order('class_datetime')

    if (error) throw error
    availableSchedules.value = data || []
  } catch (error) {
    console.error('載入課程時段失敗:', error)
    availableSchedules.value = []
  }
}

// 格式化日期顯示
const formatScheduleDate = (datetime: string) => {
  const date = new Date(datetime)
  const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
  return `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`
}

// 格式化時間顯示
const formatScheduleTime = (datetime: string) => {
  const date = new Date(datetime)
  return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
}

// 提交表單
const handleSubmit = async () => {
  // 檢查必填欄位
  if (!formData.value.lead_id) {
    alert('請選擇潛在客戶')
    return
  }

  // 如果選了課程，必須選擇時段
  if (formData.value.course_id && !selectedSchedule.value) {
    alert('請選擇試聽時段')
    return
  }

  // 如果沒選課程，必須填日期時間
  if (!formData.value.course_id && (!formData.value.scheduled_date || !formData.value.scheduled_time)) {
    alert('請填寫試聽日期和時間')
    return
  }

  submitting.value = true
  try {
    let trialData: Partial<TrialClass>

    if (selectedSchedule.value) {
      // 從選擇的排程取得資訊
      const schedule = selectedSchedule.value
      const scheduleDate = new Date(schedule.class_datetime)

      trialData = {
        lead_id: formData.value.lead_id,
        course_id: formData.value.course_id,
        scheduled_date: scheduleDate.toISOString().split('T')[0],
        scheduled_time: formatScheduleTime(schedule.class_datetime),
        teacher_id: schedule.course?.instructor?.user_id || '',
        classroom: schedule.classroom || '',
        follow_up_notes: formData.value.follow_up_notes,
        created_by: authStore.user?.user_id || ''
      }
    } else {
      // 使用手動輸入的資訊
      trialData = {
        ...formData.value,
        created_by: authStore.user?.user_id || ''
      }
    }

    await crmService.createTrialClass(trialData)

    // 更新潛在客戶狀態為「已安排試聽」
    await crmService.updateLead(formData.value.lead_id, {
      status: 'trial_scheduled'
    })

    emit('created')
    emit('close')

    // 重置表單
    formData.value = {
      lead_id: '',
      course_id: '',
      scheduled_date: '',
      scheduled_time: '',
      teacher_id: '',
      classroom: '',
      follow_up_notes: ''
    }
  } catch (error) {
    console.error('安排試聽課程失敗:', error)
    alert('安排試聽課程失敗，請稍後再試')
  } finally {
    submitting.value = false
  }
}

// 監聽課程選擇變化
watch(() => formData.value.course_id, (newCourseId) => {
  if (newCourseId) {
    loadCourseSchedules(newCourseId)
  } else {
    availableSchedules.value = []
    selectedScheduleId.value = ''
  }
})

// 當 Modal 顯示時載入資料
watch(() => props.show, (newVal) => {
  if (newVal) {
    loadLeads()
    loadCourses()
    loadTeachers()
    // 重置選擇
    availableSchedules.value = []
    selectedScheduleId.value = ''
  }
})

onMounted(() => {
  if (props.show) {
    loadLeads()
    loadCourses()
    loadTeachers()
  }
})
</script>
