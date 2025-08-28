<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75 p-4">
    <div class="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl">
      <!-- Modal Header -->
      <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div class="flex items-center justify-between">
          <h3 class="flex items-center text-xl font-semibold text-white">
            <CloudArrowUpIcon class="mr-2 size-6" />
            上傳模板
          </h3>
          <button
            @click="$emit('close')"
            class="text-white transition-colors hover:text-gray-200"
          >
            <XMarkIcon class="size-6" />
          </button>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- 範例文件下載區塊 -->
          <div class="rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-blue-50 p-4">
            <h4 class="mb-3 flex items-center text-base font-medium text-gray-900">
              <DocumentIcon class="mr-2 size-5 text-green-600" />
              範例模板文件
            </h4>
            <p class="mb-3 text-sm text-gray-600">
              下載範例文件來瞭解模板格式和可用變數，然後基於此範例修改成您需要的模板。
            </p>
            <a
              href="/template-sample.html"
              download="收據模板範例.html"
              class="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              <CloudArrowUpIcon class="mr-2 size-4" />
              下載範例文件
            </a>
          </div>

          <!-- 基本資訊區塊 -->
          <div class="rounded-lg bg-gray-50 p-4">
            <h4 class="mb-4 flex items-center text-base font-medium text-gray-900">
              <InformationCircleIcon class="mr-2 size-5 text-blue-600" />
              模板資訊
            </h4>

            <div class="space-y-4">
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700">
                  模板名稱 <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="例：我的收據模板"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700">
                  模板描述
                </label>
                <textarea
                  v-model="form.description"
                  rows="2"
                  class="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="簡要描述這個模板的用途..."
                />
              </div>
            </div>
          </div>

          <!-- HTML模板上傳區塊 -->
          <div class="rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 p-4">
            <h4 class="mb-4 flex items-center text-base font-medium text-gray-900">
              <CodeBracketIcon class="mr-2 size-5 text-orange-600" />
              上傳HTML模板 <span class="text-red-500">*</span>
            </h4>

            <div class="space-y-3">
              <div class="flex items-center space-x-3">
                <label class="inline-flex cursor-pointer items-center rounded-lg border-2 border-dashed border-orange-300 bg-white px-4 py-3 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-50">
                  <CloudArrowUpIcon class="mr-2 size-5" />
                  選擇HTML檔案
                  <input
                    type="file"
                    accept=".html,.htm"
                    @change="handleFileChange"
                    class="hidden"
                    required
                  />
                </label>
                <span v-if="file" class="flex items-center text-sm text-gray-600">
                  <DocumentIcon class="mr-1 size-4" />
                  {{ file.name }}
                </span>
              </div>
              <div class="rounded-lg bg-orange-100 p-3">
                <p class="text-xs leading-relaxed text-orange-800">
                  💡 <strong>提示：</strong>請先下載上方的範例文件，瞭解模板變數和格式後再進行修改。支援完整的HTML和CSS語法。
                </p>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end space-x-3 border-t border-gray-200 pt-6">
            <button
              type="button"
              @click="$emit('close')"
              class="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              class="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-medium text-white shadow-md transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg"
            >
              上傳模板
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  CloudArrowUpIcon,
  XMarkIcon,
  DocumentIcon,
  InformationCircleIcon,
  CodeBracketIcon
} from '@heroicons/vue/24/outline'

interface Props {
  show: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
  submit: [data: { name: string; description: string; file: File }]
}>()

const form = ref({
  name: '',
  description: ''
})

const file = ref<File | null>(null)

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const selectedFile = target.files?.[0]

  if (selectedFile) {
    if (selectedFile.size > 1024 * 1024) { // 1MB限制
      alert('檔案大小不能超過 1MB')
      return
    }

    if (!selectedFile.type.includes('text/html') && !selectedFile.name.endsWith('.html') && !selectedFile.name.endsWith('.htm')) {
      alert('請選擇HTML檔案')
      return
    }

    file.value = selectedFile
  }
}

const handleSubmit = () => {
  if (!file.value) {
    alert('請選擇要上傳的HTML模板檔案')
    return
  }

  emit('submit', {
    name: form.value.name,
    description: form.value.description,
    file: file.value
  })

  // Reset form
  form.value = { name: '', description: '' }
  file.value = null
}
</script>
