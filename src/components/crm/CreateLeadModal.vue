<template>
  <TransitionRoot as="template" :show="show">
    <Dialog as="div" class="relative z-10" @close="handleClose">
      <TransitionChild
        as="template"
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
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel class="relative overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
              <form @submit.prevent="handleSubmit">
                <div class="bg-white p-6">
                  <div class="mb-6 flex items-center justify-between">
                    <DialogTitle as="h3" class="text-lg font-semibold leading-6 text-gray-900">
                      新增潛在客戶
                    </DialogTitle>
                    <button
                      type="button"
                      @click="handleClose"
                      class="text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon class="size-6" />
                    </button>
                  </div>

                  <div class="space-y-6">
                    <!-- 基本資訊 -->
                    <div class="border-b border-gray-200 pb-6">
                      <h4 class="mb-4 text-sm font-medium text-gray-900">基本資訊</h4>
                      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label class="mb-1 block text-sm font-medium text-gray-700">
                            學生姓名 *
                          </label>
                          <input
                            v-model="form.full_name"
                            type="text"
                            required
                            class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            placeholder="請輸入學生姓名"
                          />
                        </div>

                        <div>
                          <label class="mb-1 block text-sm font-medium text-gray-700">
                            聯絡人姓名 *
                          </label>
                          <div class="relative">
                            <input
                              v-model="form.parent_name"
                              @focus="handleContactNameFocus"
                              @blur="contactNameFocused = false"
                              type="text"
                              required
                              class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                              :placeholder="contactNamePlaceholder"
                              :class="{ 'text-gray-400': isShowingDefault && !contactNameFocused }"
                            />
                            <span
                              v-if="isShowingDefault && !contactNameFocused"
                              class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400"
                            >
                              (預設)
                            </span>
                          </div>
                        </div>

                        <div>
                          <label class="mb-1 block text-sm font-medium text-gray-700">
                            聯絡電話 *
                          </label>
                          <input
                            v-model="form.phone"
                            type="tel"
                            required
                            class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            placeholder="請輸入聯絡電話"
                          />
                        </div>

                        <div>
                          <label class="mb-1 block text-sm font-medium text-gray-700">
                            電子郵件
                          </label>
                          <input
                            v-model="form.email"
                            type="email"
                            class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            placeholder="請輸入電子郵件"
                          />
                        </div>

                        <div>
                          <label class="mb-1 block text-sm font-medium text-gray-700">
                            學生年齡
                          </label>
                          <input
                            v-model.number="form.age"
                            type="number"
                            min="3"
                            max="99"
                            class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            placeholder="請輸入年齡"
                          />
                        </div>

                        <div>
                          <label class="mb-1 block text-sm font-medium text-gray-700">
                            就讀學校
                          </label>
                          <input
                            v-model="form.school"
                            type="text"
                            class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            placeholder="請輸入學校名稱"
                          />
                        </div>

                        <div>
                          <label class="mb-1 block text-sm font-medium text-gray-700">
                            年級/階段
                          </label>
                          <select
                            v-model="form.grade"
                            class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          >
                            <option value="">請選擇年級/階段</option>
                            <optgroup label="學齡前">
                              <option value="幼兒班">幼兒班 (3-4歲)</option>
                              <option value="幼稚園小班">幼稚園小班</option>
                              <option value="幼稚園中班">幼稚園中班</option>
                              <option value="幼稚園大班">幼稚園大班</option>
                            </optgroup>
                            <optgroup label="國小">
                              <option value="小一">小一</option>
                              <option value="小二">小二</option>
                              <option value="小三">小三</option>
                              <option value="小四">小四</option>
                              <option value="小五">小五</option>
                              <option value="小六">小六</option>
                            </optgroup>
                            <optgroup label="國中">
                              <option value="國一">國一</option>
                              <option value="國二">國二</option>
                              <option value="國三">國三</option>
                            </optgroup>
                            <optgroup label="高中">
                              <option value="高一">高一</option>
                              <option value="高二">高二</option>
                              <option value="高三">高三</option>
                            </optgroup>
                            <optgroup label="其他">
                              <option value="大學生">大學生</option>
                              <option value="成人">成人</option>
                              <option value="社會人士">社會人士</option>
                              <option value="樂齡">樂齡 (65歲以上)</option>
                              <option value="不適用">不適用</option>
                            </optgroup>
                          </select>
                        </div>

                        <div>
                          <label class="mb-1 block text-sm font-medium text-gray-700">
                            客戶來源 *
                          </label>
                          <select
                            v-model="form.source"
                            required
                            class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          >
                            <option value="">請選擇來源</option>
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
                      </div>
                    </div>

                    <!-- 需求資訊 -->
                    <div class="border-b border-gray-200 pb-6">
                      <h4 class="mb-4 text-sm font-medium text-gray-900">需求資訊</h4>
                      <div class="space-y-4">
                        <div>
                          <label class="mb-2 block text-sm font-medium text-gray-700">
                            感興趣的課程
                          </label>
                          <div class="grid grid-cols-2 gap-2">
                            <label
                              v-for="subject in availableSubjects"
                              :key="subject.value"
                              class="flex items-center"
                            >
                              <input
                                v-model="form.interest_subjects"
                                :value="subject.value"
                                type="checkbox"
                                class="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span class="ml-2 text-sm text-gray-700">{{ subject.label }}</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label class="mb-1 block text-sm font-medium text-gray-700">
                            預算範圍
                          </label>
                          <select
                            v-model="form.budget_range"
                            class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          >
                            <option value="">請選擇預算範圍</option>
                            <option value="3000以下">3000以下</option>
                            <option value="3000-5000">3000-5000</option>
                            <option value="5000-8000">5000-8000</option>
                            <option value="8000-12000">8000-12000</option>
                            <option value="12000以上">12000以上</option>
                          </select>
                        </div>

                        <div>
                          <label class="mb-1 block text-sm font-medium text-gray-700">
                            偏好時段
                          </label>
                          <input
                            v-model="form.preferred_schedule"
                            type="text"
                            class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            placeholder="例：週六下午、平日晚上"
                          />
                        </div>
                      </div>
                    </div>

                    <!-- 備註 -->
                    <div>
                      <label class="mb-1 block text-sm font-medium text-gray-700">
                        備註
                      </label>
                      <textarea
                        v-model="form.notes"
                        rows="3"
                        class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder="請輸入相關備註資訊..."
                      />
                    </div>
                  </div>
                </div>

                <div class="flex justify-end space-x-3 bg-gray-50 px-6 py-4">
                  <button
                    type="button"
                    @click="handleClose"
                    class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    :disabled="submitting"
                    class="rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {{ submitting ? '新增中...' : '新增客戶' }}
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
import { ref, watch, computed } from 'vue'
import { useAuthStore } from '@/stores/authSupabase'
import { crmService } from '@/services/crmService'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import type { LeadSource, InterestType } from '@/types/crm'

// Props 和 Emits
interface Props {
  show: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'created'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const authStore = useAuthStore()

// 狀態定義
const submitting = ref(false)
const contactNameFocused = ref(false)
const isDefaultValue = ref(true)

// 表單數據
const form = ref({
  full_name: '',
  parent_name: '',
  phone: '',
  email: '',
  age: undefined as number | undefined,
  school: '',
  grade: '',
  source: '' as LeadSource | '',
  interest_subjects: [] as InterestType[],
  budget_range: '',
  preferred_schedule: '',
  notes: ''
})

// 可選科目
const availableSubjects = [
  { value: 'english' as InterestType, label: '英語' },
  { value: 'math' as InterestType, label: '數學' },
  { value: 'chinese' as InterestType, label: '國語' },
  { value: 'science' as InterestType, label: '自然' },
  { value: 'social' as InterestType, label: '社會' },
  { value: 'art' as InterestType, label: '美術繪畫' },
  { value: 'music' as InterestType, label: '音樂樂器' },
  { value: 'other' as InterestType, label: '其他才藝' }
]

// 計算屬性
const contactNamePlaceholder = computed(() => {
  if (form.value.full_name && isDefaultValue.value) {
    return form.value.full_name
  }
  return '請輸入聯絡人姓名'
})

const isShowingDefault = computed(() => {
  return form.value.full_name &&
         form.value.parent_name === form.value.full_name &&
         isDefaultValue.value
})

// 方法定義
const resetForm = () => {
  form.value = {
    full_name: '',
    parent_name: '',
    phone: '',
    email: '',
    age: undefined,
    school: '',
    grade: '',
    source: '' as LeadSource | '',
    interest_subjects: [],
    budget_range: '',
    preferred_schedule: '',
    notes: ''
  }
  isDefaultValue.value = true
  contactNameFocused.value = false
}

const handleClose = () => {
  resetForm()
  emit('close')
}

const handleSubmit = async () => {
  if (!form.value.full_name || !form.value.parent_name || !form.value.phone || !form.value.source) {
    return
  }

  submitting.value = true
  try {
    await crmService.createLead({
      ...form.value,
      source: form.value.source as LeadSource,
      assigned_to: authStore.user?.user_id
    })

    emit('created')
    resetForm()
  } catch (error) {
    console.error('新增潛在客戶失敗:', error)
    alert('新增失敗，請稍後再試')
  } finally {
    submitting.value = false
  }
}

// 處理聯絡人姓名欄位聚焦
const handleContactNameFocus = () => {
  contactNameFocused.value = true
  // 如果是預設值，清空欄位讓使用者輸入
  if (isDefaultValue.value && form.value.parent_name === form.value.full_name) {
    form.value.parent_name = ''
    isDefaultValue.value = false
  }
}

// 監聽學生姓名變化，智慧同步到聯絡人姓名
watch(
  () => form.value.full_name,
  (newName) => {
    // 如果聯絡人姓名是空的或還是預設值，就同步
    if (!form.value.parent_name || isDefaultValue.value) {
      form.value.parent_name = newName
      isDefaultValue.value = true
    }
  }
)

// 監聽聯絡人姓名失焦
watch(contactNameFocused, (focused) => {
  if (!focused) {
    // 失焦時，如果欄位是空的，恢復預設值
    if (!form.value.parent_name && form.value.full_name) {
      form.value.parent_name = form.value.full_name
      isDefaultValue.value = true
    }
  }
})

// 監聽 show 變化，重置表單
watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      resetForm()
    }
  }
)
</script>
