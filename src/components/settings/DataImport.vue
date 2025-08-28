<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="rounded-lg bg-white p-6 shadow-sm">
      <h3 class="mb-4 text-lg font-semibold text-gray-900">
        資料匯入
      </h3>
      <p class="text-sm text-gray-600">
        支援從 Excel (.xlsx) 或 CSV 檔案匯入學生、聯絡人、課程等資料
      </p>
    </div>

    <!-- Import Type Selection -->
    <div class="rounded-lg bg-white p-6 shadow-sm">
      <h4 class="mb-4 text-base font-medium text-gray-900">選擇匯入類型</h4>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="importType in importTypes"
          :key="importType.key"
          @click="selectedType = importType.key"
          :class="[
            'rounded-lg border-2 p-4 transition-all duration-200',
            selectedType === importType.key
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-200 hover:border-gray-300'
          ]"
        >
          <component :is="importType.icon" class="mx-auto mb-2 size-8"
            :class="selectedType === importType.key ? 'text-indigo-600' : 'text-gray-400'"
          />
          <div class="text-sm font-medium"
            :class="selectedType === importType.key ? 'text-indigo-900' : 'text-gray-900'"
          >
            {{ importType.name }}
          </div>
          <div class="mt-1 text-xs text-gray-500">
            {{ importType.description }}
          </div>
        </button>
      </div>
    </div>

    <!-- File Upload Area -->
    <div v-if="selectedType" class="rounded-lg bg-white p-6 shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <h4 class="text-base font-medium text-gray-900">
          上傳 {{ getImportTypeName(selectedType) }} 檔案
        </h4>
        <button
          @click="downloadTemplate"
          class="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
        >
          <DocumentArrowDownIcon class="size-4" />
          下載範本
        </button>
      </div>

      <!-- Drop Zone -->
      <div
        @drop.prevent="handleDrop"
        @dragover.prevent
        @dragenter.prevent
        class="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-gray-400"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".xlsx,.xls,.csv"
          @change="handleFileSelect"
          class="hidden"
        />

        <DocumentTextIcon class="mx-auto mb-3 size-12 text-gray-400" />

        <p class="mb-2 text-sm text-gray-600">
          拖放檔案到此處，或
          <button
            @click="$refs.fileInput.click()"
            class="font-medium text-indigo-600 hover:text-indigo-700"
          >
            點擊選擇檔案
          </button>
        </p>

        <p class="text-xs text-gray-500">
          支援 .xlsx, .xls, .csv 格式，檔案大小限制 10MB
        </p>
      </div>

      <!-- Selected File Info -->
      <div v-if="selectedFile" class="mt-4 rounded-lg bg-gray-50 p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <DocumentIcon class="size-8 text-gray-400" />
            <div>
              <p class="text-sm font-medium text-gray-900">{{ selectedFile.name }}</p>
              <p class="text-xs text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
            </div>
          </div>
          <button
            @click="removeFile"
            class="text-red-600 hover:text-red-700"
          >
            <XMarkIcon class="size-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Preview & Validation -->
    <div v-if="previewData.length > 0" class="rounded-lg bg-white p-6 shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <h4 class="text-base font-medium text-gray-900">
          資料預覽 (前 5 筆)
        </h4>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">
            共 {{ totalRows }} 筆資料
          </span>
          <span v-if="validRows < totalRows" class="text-sm text-red-600">
            ({{ totalRows - validRows }} 筆錯誤)
          </span>
        </div>
      </div>

      <!-- Preview Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                狀態
              </th>
              <th v-for="column in previewColumns" :key="column"
                class="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500"
              >
                {{ column }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="(row, index) in previewData.slice(0, 5)" :key="index"
              :class="row.isValid ? '' : 'bg-red-50'"
            >
              <td class="px-3 py-2">
                <CheckCircleIcon v-if="row.isValid" class="size-5 text-green-500" />
                <XCircleIcon v-else class="size-5 text-red-500" />
              </td>
              <td v-for="column in previewColumns" :key="column"
                class="px-3 py-2 text-sm text-gray-900"
              >
                {{ row[column] || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Validation Errors -->
      <div v-if="validationErrors.length > 0" class="mt-4 rounded-lg bg-red-50 p-4">
        <h5 class="mb-2 text-sm font-medium text-red-800">驗證錯誤</h5>
        <ul class="list-inside list-disc space-y-1 text-sm text-red-700">
          <li v-for="(error, index) in validationErrors.slice(0, 5)" :key="index">
            第 {{ error.row }} 行：{{ error.message }}
          </li>
          <li v-if="validationErrors.length > 5" class="text-red-600">
            ... 還有 {{ validationErrors.length - 5 }} 個錯誤
          </li>
        </ul>
      </div>
    </div>

    <!-- Import Actions -->
    <div v-if="selectedFile && previewData.length > 0" class="rounded-lg bg-white p-6 shadow-sm">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2">
            <input
              v-model="importOptions.skipErrors"
              type="checkbox"
              class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span class="text-sm text-gray-700">跳過錯誤資料</span>
          </label>
          <label class="flex items-center gap-2">
            <input
              v-model="importOptions.updateExisting"
              type="checkbox"
              class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span class="text-sm text-gray-700">更新現有資料</span>
          </label>
        </div>

        <div class="flex gap-3">
          <button
            @click="cancelImport"
            class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            @click="startImport"
            :disabled="importing || (validRows === 0 && !importOptions.skipErrors)"
            class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ importing ? '匯入中...' : `匯入 ${validRows} 筆資料` }}
          </button>
        </div>
      </div>
    </div>

    <!-- Import Progress -->
    <div v-if="importing" class="rounded-lg bg-white p-6 shadow-sm">
      <h4 class="mb-4 text-base font-medium text-gray-900">匯入進度</h4>
      <div class="space-y-4">
        <div>
          <div class="mb-1 flex justify-between text-sm">
            <span class="text-gray-600">進度</span>
            <span class="text-gray-900">{{ importProgress }}%</span>
          </div>
          <div class="h-2 w-full rounded-full bg-gray-200">
            <div
              class="h-2 rounded-full bg-indigo-600 transition-all duration-300"
              :style="{ width: importProgress + '%' }"
            />
          </div>
        </div>
        <div class="text-sm text-gray-600">
          正在匯入第 {{ currentRow }} / {{ totalRows }} 筆資料...
        </div>
      </div>
    </div>

    <!-- Import Results -->
    <div v-if="importResults" class="rounded-lg bg-white p-6 shadow-sm">
      <div class="flex items-start gap-4">
        <CheckCircleIcon v-if="importResults.success" class="size-8 shrink-0 text-green-500" />
        <XCircleIcon v-else class="size-8 shrink-0 text-red-500" />

        <div class="flex-1">
          <h4 class="mb-2 text-base font-medium text-gray-900">
            {{ importResults.success ? '匯入完成' : '匯入失敗' }}
          </h4>
          <div class="space-y-1 text-sm text-gray-600">
            <p>成功匯入：{{ importResults.imported }} 筆</p>
            <p v-if="importResults.updated > 0">更新：{{ importResults.updated }} 筆</p>
            <p v-if="importResults.skipped > 0">跳過：{{ importResults.skipped }} 筆</p>
            <p v-if="importResults.failed > 0" class="text-red-600">
              失敗：{{ importResults.failed }} 筆
            </p>
          </div>

          <button
            @click="resetImport"
            class="mt-4 text-sm text-indigo-600 hover:text-indigo-700"
          >
            進行新的匯入
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { importService } from '@/services/importService'
import {
  UserGroupIcon,
  PhoneIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  DocumentIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/vue/24/outline'

// Types
interface ImportType {
  key: string
  name: string
  description: string
  icon: any
  template: string[]
  validator: (row: any) => { isValid: boolean; errors: string[] }
}

interface ValidationError {
  row: number
  message: string
}

// State
const selectedType = ref<string>('')
const selectedFile = ref<File | null>(null)
const previewData = ref<any[]>([])
const previewColumns = ref<string[]>([])
const totalRows = ref(0)
const validRows = ref(0)
const validationErrors = ref<ValidationError[]>([])
const importing = ref(false)
const importProgress = ref(0)
const currentRow = ref(0)
const importResults = ref<any>(null)

const importOptions = ref({
  skipErrors: true,
  updateExisting: false
})

// Import Types Configuration
const importTypes: ImportType[] = [
  {
    key: 'students',
    name: '學生資料',
    description: '匯入學生基本資料',
    icon: UserGroupIcon,
    template: ['學生姓名(中文)', '學生姓名(英文)', '出生日期', '聯絡人姓名', '聯絡電話', '電子郵件', '地址', '備註'],
    validator: (row) => {
      const errors = []
      if (!row['學生姓名(中文)']) errors.push('學生中文姓名為必填')
      if (!row['聯絡人姓名']) errors.push('聯絡人姓名為必填')
      if (!row['聯絡電話']) errors.push('聯絡電話為必填')
      return { isValid: errors.length === 0, errors }
    }
  },
  {
    key: 'contacts',
    name: '聯絡人資料',
    description: '匯入聯絡人資訊',
    icon: PhoneIcon,
    template: ['姓名', '電話', '電子郵件', '地址', '備註'],
    validator: (row) => {
      const errors = []
      if (!row['姓名']) errors.push('姓名為必填')
      if (!row['電話'] && !row['電子郵件']) errors.push('電話或電子郵件至少需填寫一項')
      return { isValid: errors.length === 0, errors }
    }
  },
  {
    key: 'courses',
    name: '課程資料',
    description: '匯入課程設定',
    icon: AcademicCapIcon,
    template: ['課程名稱', '教師姓名', '課程類型', '總堂數', '每堂價格', '最大人數', '課程說明'],
    validator: (row) => {
      const errors = []
      if (!row['課程名稱']) errors.push('課程名稱為必填')
      if (!row['教師姓名']) errors.push('教師姓名為必填')
      if (!row['總堂數'] || isNaN(Number(row['總堂數']))) errors.push('總堂數必須為數字')
      if (!row['每堂價格'] || isNaN(Number(row['每堂價格']))) errors.push('每堂價格必須為數字')
      return { isValid: errors.length === 0, errors }
    }
  }
]

// Computed
const getImportTypeName = computed(() => (key: string) => {
  return importTypes.find(t => t.key === key)?.name || ''
})

// Methods
const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    processFile(input.files[0])
  }
}

const handleDrop = (event: DragEvent) => {
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    processFile(event.dataTransfer.files[0])
  }
}

const processFile = async (file: File) => {
  // Validate file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    alert('檔案大小超過 10MB 限制')
    return
  }

  // Validate file type
  const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel', 'text/csv']
  if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
    alert('請上傳 Excel (.xlsx, .xls) 或 CSV 檔案')
    return
  }

  selectedFile.value = file
  await parseFile(file)
}

const parseFile = async (file: File) => {
  try {
    const text = await file.text()
    const { headers, data: parsedData } = importService.parseCSV(text)

    if (parsedData.length === 0) {
      alert('檔案內容為空或格式錯誤')
      return
    }

    previewColumns.value = headers

    // Validate data rows
    const validatedData = []
    const errors: ValidationError[] = []

    const importType = importTypes.find(t => t.key === selectedType.value)

    parsedData.forEach((row, index) => {
      if (importType) {
        const validation = importType.validator(row)
        row.isValid = validation.isValid

        if (!validation.isValid) {
          validation.errors.forEach(error => {
            errors.push({ row: index + 2, message: error }) // +2 because of header row and 0-based index
          })
        }
      }

      validatedData.push(row)
    })

    previewData.value = validatedData
    totalRows.value = validatedData.length
    validRows.value = validatedData.filter(row => row.isValid).length
    validationErrors.value = errors
  } catch (error) {
    alert('檔案解析失敗，請確認檔案格式')
    console.error('Parse error:', error)
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} bytes`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const removeFile = () => {
  selectedFile.value = null
  previewData.value = []
  previewColumns.value = []
  totalRows.value = 0
  validRows.value = 0
  validationErrors.value = []
  importResults.value = null
}

const downloadTemplate = () => {
  const importType = importTypes.find(t => t.key === selectedType.value)
  if (!importType) return

  // Create CSV content
  const csvContent = `${importType.template.join(',')}\n`

  // Create and download file
  const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${importType.name}_範本.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const cancelImport = () => {
  removeFile()
  selectedType.value = ''
}

const startImport = async () => {
  importing.value = true
  importProgress.value = 0
  currentRow.value = 0

  try {
    const dataToImport = importOptions.value.skipErrors
      ? previewData.value.filter(row => row.isValid)
      : previewData.value

    let results

    // Call appropriate import service method based on type
    switch (selectedType.value) {
      case 'students':
        results = await importService.importStudents(dataToImport)
        break
      case 'contacts':
        results = await importService.importContacts(dataToImport)
        break
      case 'courses':
        results = await importService.importCourses(dataToImport)
        break
      default:
        throw new Error('未知的匯入類型')
    }

    // Update progress during import (simulated)
    const updateInterval = setInterval(() => {
      if (importProgress.value < 90) {
        importProgress.value += 10
        currentRow.value = Math.floor((importProgress.value / 100) * dataToImport.length)
      }
    }, 200)

    // Wait for import to complete
    await new Promise(resolve => setTimeout(resolve, 1000))

    clearInterval(updateInterval)
    importProgress.value = 100
    currentRow.value = dataToImport.length

    importResults.value = results
  } catch (error) {
    importResults.value = {
      success: false,
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: previewData.value.length,
      errors: [error.message]
    }
    console.error('Import failed:', error)
  }

  importing.value = false
}

const importRow = async (row: any, type: string) => {
  // This is handled in bulk by the import service
  // Individual row import is simulated for progress display
}

const resetImport = () => {
  removeFile()
  importResults.value = null
  importProgress.value = 0
  currentRow.value = 0
}
</script>
