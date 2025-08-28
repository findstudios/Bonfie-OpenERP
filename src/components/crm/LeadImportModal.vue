<template>
  <TransitionRoot :show="show" as="template">
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
            <DialogPanel class="relative overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
              <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div class="sm:flex sm:items-start">
                  <div class="bg-primary-100 mx-auto flex size-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:size-10">
                    <DocumentArrowUpIcon class="size-6 text-primary-600" />
                  </div>
                  <div class="mt-3 flex-1 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <DialogTitle as="h3" class="text-lg font-semibold leading-6 text-gray-900">
                      批量匯入潛在客戶
                    </DialogTitle>

                    <!-- 步驟指示器 -->
                    <div class="mt-6">
                      <nav aria-label="Progress">
                        <ol class="flex items-center justify-between">
                          <li v-for="(step, idx) in steps" :key="step.name" class="relative flex-1">
                            <div class="group flex flex-col items-center" :class="idx !== steps.length - 1 ? 'pr-8' : ''">
                              <span class="flex items-center">
                                <span :class="[
                                  'flex size-10 items-center justify-center rounded-full border-2',
                                  currentStep > idx ? 'border-primary-600 bg-primary-600' : currentStep === idx ? 'border-primary-600 bg-primary-600' : 'border-gray-300 bg-white'
                                ]">
                                  <CheckIcon v-if="currentStep > idx" class="size-6 text-white" />
                                  <span v-else class="text-sm font-semibold" :class="currentStep >= idx ? 'text-white' : 'text-gray-500'">
                                    {{ idx + 1 }}
                                  </span>
                                </span>
                              </span>
                              <span class="mt-2 text-sm font-medium" :class="currentStep >= idx ? 'text-gray-900' : 'text-gray-500'">
                                {{ step.name }}
                              </span>
                              <div v-if="idx !== steps.length - 1" class="absolute left-10 top-5 -ml-px h-0.5 w-full" :class="currentStep > idx ? 'bg-primary-600' : 'bg-gray-300'"></div>
                            </div>
                          </li>
                        </ol>
                      </nav>
                    </div>

                    <!-- 步驟內容 -->
                    <div class="mt-6">
                      <!-- 步驟 1: 選擇檔案 -->
                      <div v-if="currentStep === 0">
                        <div class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                          <div class="flex">
                            <div class="shrink-0">
                              <InformationCircleIcon class="size-5 text-blue-400" />
                            </div>
                            <div class="ml-3">
                              <h3 class="text-sm font-medium text-blue-800">匯入說明</h3>
                              <div class="mt-2 text-sm text-blue-700">
                                <ul class="list-inside list-disc space-y-1">
                                  <li>請使用 CSV 格式檔案，編碼格式為 UTF-8</li>
                                  <li>必填欄位：學生姓名、聯絡人姓名、聯絡電話</li>
                                  <li>電話號碼將自動格式化，支援手機和市話</li>
                                  <li>每次最多匯入 1000 筆資料</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div class="mb-6 flex items-center justify-between">
                          <h4 class="text-sm font-medium text-gray-900">第一步：準備檔案</h4>
                          <button
                            @click="downloadTemplate"
                            type="button"
                            class="inline-flex items-center rounded-md border border-primary-600 bg-white px-3 py-2 text-sm font-medium text-primary-600 shadow-sm hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                          >
                            <DocumentArrowDownIcon class="-ml-0.5 mr-2 size-4" />
                            下載範本檔案
                          </button>
                        </div>

                        <div>
                          <label class="block">
                            <div class="hover:border-primary-400 relative flex cursor-pointer justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 transition-colors hover:bg-gray-100">
                              <div class="text-center">
                                <DocumentPlusIcon class="mx-auto size-12 text-gray-400" />
                                <div class="mt-4 flex text-sm text-gray-600">
                                  <label class="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500">
                                    <span>選擇檔案</span>
                                    <input
                                      type="file"
                                      accept=".csv"
                                      @change="handleFileSelect"
                                      class="sr-only"
                                    >
                                  </label>
                                  <p class="pl-1">或拖放到此處</p>
                                </div>
                                <p class="mt-2 text-xs text-gray-500">CSV 檔案，最大 5MB</p>
                              </div>
                            </div>
                          </label>

                          <div v-if="selectedFile" class="mt-4 rounded-lg bg-gray-50 p-4">
                            <div class="flex items-center">
                              <div class="shrink-0">
                                <DocumentTextIcon class="size-8 text-gray-400" />
                              </div>
                              <div class="ml-3 flex-1">
                                <p class="text-sm font-medium text-gray-900">{{ selectedFile.name }}</p>
                                <p class="text-sm text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
                              </div>
                              <button
                                @click="selectedFile = null"
                                type="button"
                                class="ml-4 shrink-0 text-sm font-medium text-red-600 hover:text-red-500"
                              >
                                移除
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- 步驟 2: 預覽資料 -->
                      <div v-else-if="currentStep === 1">
                        <div class="mb-4 flex items-center justify-between">
                          <div>
                            <h4 class="text-sm font-medium text-gray-900">資料預覽</h4>
                            <p class="mt-1 text-sm text-gray-500">
                              總共 {{ previewData.length }} 筆資料，有效 {{ selectedRows.length }} 筆
                            </p>
                          </div>
                          <div class="flex items-center space-x-2">
                            <span class="text-sm text-gray-500">顯示：</span>
                            <select v-model="previewFilter" class="rounded-md border-gray-300 text-sm">
                              <option value="all">全部</option>
                              <option value="valid">僅有效</option>
                              <option value="invalid">僅錯誤</option>
                            </select>
                          </div>
                        </div>

                        <div class="overflow-hidden rounded-lg shadow ring-1 ring-black ring-opacity-5">
                          <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-300">
                            <thead class="bg-gray-50">
                              <tr>
                                <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                  <input
                                    type="checkbox"
                                    v-model="selectAll"
                                    @change="toggleSelectAll"
                                    class="rounded border-gray-300"
                                  >
                                </th>
                                <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">學生姓名</th>
                                <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">聯絡人</th>
                                <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">電話</th>
                                <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">來源</th>
                                <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">狀態</th>
                              </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 bg-white">
                              <tr v-for="(row, idx) in filteredPreviewData" :key="idx">
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                  <input
                                    type="checkbox"
                                    v-model="selectedRows"
                                    :value="idx"
                                    class="rounded border-gray-300"
                                  >
                                </td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{{ row.full_name }}</td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{{ row.parent_name }}</td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{{ row.phone }}</td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ getSourceText(row.source) }}</td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm">
                                  <span v-if="row.error" class="text-red-600">{{ row.error }}</span>
                                  <span v-else class="text-green-600">有效</span>
                                </td>
                              </tr>
                            </tbody>
                            </table>
                          </div>
                        </div>

                        <div class="mt-4 flex items-center justify-between">
                          <div class="text-sm text-gray-700">
                            <span class="font-medium">已選擇 {{ selectedRows.length }} 筆</span>
                            <span class="text-gray-500">資料進行匯入</span>
                          </div>
                          <div v-if="invalidCount > 0" class="text-sm text-red-600">
                            <ExclamationTriangleIcon class="mr-1 inline size-4" />
                            {{ invalidCount }} 筆資料有錯誤
                          </div>
                        </div>
                      </div>

                      <!-- 步驟 3: 匯入結果 -->
                      <div v-else-if="currentStep === 2">
                        <div v-if="importing" class="py-8 text-center">
                          <div class="inline-flex items-center">
                            <svg class="-ml-1 mr-3 size-5 animate-spin text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            正在匯入資料...
                          </div>
                        </div>

                        <div v-else>
                          <div class="rounded-md p-4" :class="importResult.failedCount > 0 ? 'bg-yellow-50' : 'bg-green-50'">
                            <div class="flex">
                              <div class="shrink-0">
                                <CheckCircleIcon v-if="importResult.failedCount === 0" class="size-5 text-green-400" />
                                <ExclamationTriangleIcon v-else class="size-5 text-yellow-400" />
                              </div>
                              <div class="ml-3">
                                <h3 class="text-sm font-medium" :class="importResult.failedCount > 0 ? 'text-yellow-800' : 'text-green-800'">
                                  匯入完成
                                </h3>
                                <div class="mt-2 text-sm" :class="importResult.failedCount > 0 ? 'text-yellow-700' : 'text-green-700'">
                                  <p>成功匯入: {{ importResult.successCount }} 筆</p>
                                  <p v-if="importResult.failedCount > 0">失敗: {{ importResult.failedCount }} 筆</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div v-if="importResult.errors.length > 0" class="mt-4">
                            <h4 class="text-sm font-medium text-gray-900">錯誤詳情:</h4>
                            <ul class="mt-2 space-y-1 text-sm text-red-600">
                              <li v-for="(error, idx) in importResult.errors" :key="idx">
                                {{ error }}
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  v-if="currentStep < 2"
                  type="button"
                  @click="nextStep"
                  :disabled="!canProceed"
                  class="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50 sm:ml-3 sm:w-auto"
                >
                  {{ currentStep === 1 ? '開始匯入' : '下一步' }}
                </button>
                <button
                  v-if="currentStep === 2 && !importing"
                  type="button"
                  @click="finishImport"
                  class="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:ml-3 sm:w-auto"
                >
                  完成
                </button>
                <button
                  v-if="currentStep > 0 && currentStep < 2"
                  type="button"
                  @click="prevStep"
                  class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  上一步
                </button>
                <button
                  v-if="currentStep < 2"
                  type="button"
                  @click="$emit('close')"
                  class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  取消
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
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import {
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  DocumentPlusIcon,
  DocumentTextIcon,
  CheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'
import { crmService } from '@/services/crmService'
import {
  parseCSV,
  validateRequiredFields,
  validatePhoneNumber,
  formatPhoneNumber,
  mapRowToObject
} from '@/utils/fileImport'
import type { Lead, LeadSource } from '@/types/crm'

interface Props {
  show: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'imported', count: number): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

// 狀態
const step = ref(1)
const selectedFile = ref<File | null>(null)
const parsedData = ref<any[]>([])
const error = ref('')
const previewData = ref<any[]>([])
const selectedRows = ref<number[]>([])
const selectAll = ref(false)
const importing = ref(false)
const importResult = ref({
  success: [] as any[],
  failed: [] as any[]
})
const previewFilter = ref('all')

const steps = [
  { name: '選擇檔案' },
  { name: '預覽資料' },
  { name: '匯入結果' }
]

// Current step mapping for tests (1-indexed)
const currentStep = computed(() => step.value - 1)

// CSV 欄位對應
const fieldMapping = {
  '學生姓名': 'full_name',
  '聯絡人姓名': 'parent_name',
  '聯絡電話': 'phone',
  '電子郵件': 'email',
  '年齡': 'age',
  '就讀學校': 'school',
  '年級': 'grade',
  '來源': 'source',
  '預算範圍': 'budget_range',
  '偏好時段': 'preferred_schedule',
  '備註': 'notes'
}

// 來源對應
const sourceMapping: Record<string, LeadSource> = {
  '路過詢問': 'walk_in',
  '朋友介紹': 'referral',
  '網路查詢': 'online',
  '電話詢問': 'phone',
  '社群媒體': 'social_media',
  '傳單廣告': 'flyer',
  '活動推廣': 'event',
  '其他': 'other'
}

// 計算屬性
const canProceed = computed(() => {
  if (step.value === 1) {
    return selectedFile.value !== null
  } else if (step.value === 2) {
    return selectedRows.value.length > 0
  }
  return false
})

const invalidCount = computed(() => {
  return previewData.value.filter(row => row.error).length
})

const filteredPreviewData = computed(() => {
  if (previewFilter.value === 'valid') {
    return previewData.value.filter(row => !row.error)
  } else if (previewFilter.value === 'invalid') {
    return previewData.value.filter(row => row.error)
  }
  return previewData.value
})

// 方法
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // 檢查檔案類型
  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    alert('請選擇 CSV 格式的檔案')
    target.value = ''
    return
  }

  // 檢查檔案大小 (最大 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('檔案大小不能超過 5MB')
    target.value = ''
    return
  }

  selectedFile.value = file
}

async function nextStep() {
  if (step.value === 1) {
    await parseFile()
    if (parsedData.value.length > 0) {
      step.value = 2
    }
  } else if (step.value === 2) {
    await importData()
    step.value = 3
  }
}

function prevStep() {
  if (step.value > 1) {
    step.value--
  }
}

async function parseFile() {
  if (!selectedFile.value) return

  error.value = ''

  try {
    const rows = await parseCSV(selectedFile.value)
    if (rows.length < 2) {
      error.value = '檔案沒有資料'
      return
    }

    const headers = rows[0]
    const data = []

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const mapped = mapRowToObject(headers, row, fieldMapping)

      // 驗證必要欄位
      const validation = validateRequiredFields(mapped, ['full_name', 'parent_name', 'phone'])

      // 格式化和驗證資料
      if (mapped.phone) {
        mapped.phone = formatPhoneNumber(mapped.phone)
        if (!validatePhoneNumber(mapped.phone)) {
          validation.errors.push('電話號碼格式不正確')
        }
      }

      // 轉換來源
      if (mapped.source) {
        mapped.source = sourceMapping[mapped.source] || 'other'
      } else {
        mapped.source = 'other'
      }

      // 轉換年齡為數字
      if (mapped.age) {
        mapped.age = parseInt(mapped.age)
      }

      data.push({
        ...mapped,
        status: 'new',
        error: validation.errors.join(', ')
      })
    }

    previewData.value = data
    selectedRows.value = data
      .map((_, idx) => idx)
      .filter(idx => !data[idx].error)
    selectAll.value = selectedRows.value.length === data.length
  } catch (error) {
    console.error('解析檔案失敗:', error)
    alert('解析檔案失敗，請檢查檔案格式')
  }
}

async function importData() {
  importing.value = true
  importResult.value = {
    successCount: 0,
    failedCount: 0,
    errors: []
  }

  try {
    const dataToImport = selectedRows.value.map(idx => {
      const { error, ...data } = previewData.value[idx]
      return data
    })

    const result = await crmService.bulkImportLeads(dataToImport)

    importResult.value.successCount = result.success.length
    importResult.value.failedCount = result.failed.length

    result.failed.forEach(item => {
      importResult.value.errors.push(
        `${item.data.full_name} (${item.data.phone}): ${item.error}`
      )
    })

    if (result.success.length > 0) {
      emit('imported', result.success.length)
    }
  } catch (error) {
    console.error('匯入失敗:', error)
    importResult.value.errors.push('匯入過程發生錯誤')
  } finally {
    importing.value = false
  }
}

function toggleSelectAll() {
  if (selectAll.value) {
    selectedRows.value = previewData.value
      .map((_, idx) => idx)
      .filter(idx => !previewData.value[idx].error)
  } else {
    selectedRows.value = []
  }
}

function downloadTemplate() {
  // 直接下載預先建立好的範本檔案
  const link = document.createElement('a')
  link.href = '/templates/lead-import-template.csv'
  link.download = '潛在客戶匯入範本.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`
  else if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`
  else return `${Math.round(bytes / 1048576)} MB`
}

function getSourceText(source: string): string {
  const texts: Record<string, string> = {
    walk_in: '路過詢問',
    referral: '朋友介紹',
    online: '網路查詢',
    phone: '電話詢問',
    social_media: '社群媒體',
    flyer: '傳單廣告',
    event: '活動推廣',
    other: '其他'
  }
  return texts[source] || source
}

function close() {
  step.value = 1
  selectedFile.value = null
  parsedData.value = []
  error.value = ''
  importResult.value = { success: [], failed: [] }
  emit('close')
}

function finishImport() {
  emit('imported', importResult.value.success.length)
  close()
}

// Expose for testing
defineExpose({
  step,
  selectedFile,
  parsedData,
  error,
  importResult,
  close
})
</script>
