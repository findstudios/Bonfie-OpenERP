<template>
  <div class="space-y-6">
    <h3 class="text-lg font-semibold text-gray-900">基本資訊</h3>

    <!-- LOGO上傳區域 -->
    <div class="space-y-4">
      <h4 class="text-base font-medium text-gray-900">系統LOGO</h4>

      <!-- 已有 LOGO 時的顯示 -->
      <div v-if="(logoPreview || modelValue.logo_url) && !uploading" class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
        <div class="flex items-center space-x-4">
          <div class="flex size-16 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            <img
              :src="logoPreview || modelValue.logo_url"
              alt="系統LOGO"
              class="size-full object-contain"
            />
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <label class="inline-flex cursor-pointer items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50">
            <PencilIcon class="mr-1 size-3" />
            更換LOGO
            <input
              type="file"
              accept="image/*"
              @change="handleLogoChange"
              class="hidden"
            />
          </label>
          <button
            @click="removeLogo"
            class="inline-flex items-center rounded-md px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <TrashIcon class="mr-1 size-3" />
            移除
          </button>
        </div>
      </div>

      <!-- 拖拽上傳區域 (沒有LOGO或上傳中時顯示) -->
      <div
        v-else
        @click="triggerFileInput"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
        :class="[
          'relative cursor-pointer rounded-lg border-2 border-dashed p-8 transition-all duration-200',
          isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50',
          uploading ? 'pointer-events-none' : 'hover:border-blue-400 hover:bg-blue-50'
        ]"
      >
        <!-- 上傳動畫 -->
        <div v-if="uploading" class="text-center">
          <div class="mx-auto mb-4 size-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p class="text-sm font-medium text-blue-600">正在上傳LOGO...</p>
          <p class="mt-1 text-xs text-gray-500">請稍候，檔案上傳中</p>
        </div>

        <!-- 正常上傳狀態 -->
        <div v-else class="text-center">
          <CloudArrowUpIcon class="mx-auto mb-4 size-12 text-gray-400" />
          <div class="space-y-2">
            <p class="text-sm font-medium text-gray-900">
              點擊上傳或拖拽檔案到此區域
            </p>
            <p class="text-xs text-gray-500">
              支援 JPG、PNG 格式，建議尺寸 200x200px，檔案大小不超過 2MB
            </p>
          </div>

          <!-- 隱藏的檔案輸入 -->
          <input
            ref="logoFileInput"
            type="file"
            accept="image/*"
            @change="handleLogoChange"
            class="hidden"
          />
        </div>
      </div>

      <!-- 成功/失敗提示 -->
      <div v-if="uploadMessage.show" :class="[
        'flex items-center space-x-2 rounded-lg p-3 text-sm',
        uploadMessage.type === 'success' ? 'border border-green-200 bg-green-50 text-green-800' : 'border border-red-200 bg-red-50 text-red-800'
      ]">
        <CheckIcon v-if="uploadMessage.type === 'success'" class="size-4 shrink-0" />
        <XMarkIcon v-else class="size-4 shrink-0" />
        <span>{{ uploadMessage.text }}</span>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div>
        <label class="mb-2 block text-sm font-medium text-gray-700">
          名稱/登記名稱 *
        </label>
        <input
          :value="modelValue.name"
          @input="updateField('name', $event.target.value)"
          type="text"
          class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          placeholder="請輸入機構名稱"
        />
      </div>

      <div>
        <label class="mb-2 block text-sm font-medium text-gray-700">
          統一編號
        </label>
        <input
          :value="modelValue.tax_id"
          @input="updateField('tax_id', $event.target.value)"
          type="text"
          class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          placeholder="請輸入統一編號"
        />
      </div>

      <div class="md:col-span-2">
        <label class="mb-2 block text-sm font-medium text-gray-700">
          地址
        </label>
        <input
          :value="modelValue.address"
          @input="updateField('address', $event.target.value)"
          type="text"
          class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          placeholder="請輸入機構地址"
        />
      </div>

      <div>
        <label class="mb-2 block text-sm font-medium text-gray-700">
          電話
        </label>
        <input
          :value="modelValue.phone"
          @input="updateField('phone', $event.target.value)"
          type="tel"
          class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          placeholder="請輸入聯絡電話"
        />
      </div>

      <div>
        <label class="mb-2 block text-sm font-medium text-gray-700">
          電子郵件
        </label>
        <input
          :value="modelValue.email"
          @input="updateField('email', $event.target.value)"
          type="email"
          class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          placeholder="請輸入電子郵件"
        />
      </div>

      <div>
        <label class="mb-2 block text-sm font-medium text-gray-700">
          負責人
        </label>
        <input
          :value="modelValue.director"
          @input="updateField('director', $event.target.value)"
          type="text"
          class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          placeholder="請輸入負責人姓名"
        />
      </div>

      <div>
        <label class="mb-2 block text-sm font-medium text-gray-700">
          營業時間
        </label>
        <input
          :value="modelValue.business_hours"
          @input="updateField('business_hours', $event.target.value)"
          type="text"
          class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          placeholder="例：週一至週六 09:00-21:00"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  CloudArrowUpIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

interface BasicSettings {
  name: string
  tax_id: string
  address: string
  phone: string
  email: string
  director: string
  business_hours: string
  logo_url: string
}

interface Props {
  modelValue: BasicSettings
  logoFile: File | null
  logoPreview: string
  uploading: boolean
  uploadMessage: {
    show: boolean
    type: 'success' | 'error'
    text: string
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: BasicSettings]
  'update:logoFile': [file: File | null]
  'update:logoPreview': [preview: string]
  'handle-logo-change': [event: Event]
  'remove-logo': []
  'trigger-file-input': []
}>()

const logoFileInput = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)

const updateField = (field: keyof BasicSettings, value: string) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}

const handleLogoChange = (event: Event) => {
  emit('handle-logo-change', event)
}

const removeLogo = () => {
  emit('remove-logo')
}

const triggerFileInput = () => {
  logoFileInput.value?.click()
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false

  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    // Create a synthetic event with the dropped file
    const syntheticEvent = new Event('change') as any
    Object.defineProperty(syntheticEvent, 'target', {
      value: { files },
      enumerable: true
    })
    handleLogoChange(syntheticEvent)
  }
}
</script>
