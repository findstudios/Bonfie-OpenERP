<template>
  <div class="space-y-6">
    <h3 class="text-lg font-semibold text-gray-900">收據設定</h3>

    <!-- 當前選擇的模板 -->
    <div v-if="currentTemplate" class="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="text-sm font-medium text-blue-900">當前使用的模板</h4>
          <p class="mt-1 text-sm text-blue-700">{{ currentTemplate.name }}</p>
        </div>
        <CheckCircleIcon class="size-6 text-blue-600" />
      </div>
    </div>

    <!-- 模板管理區域 -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-base font-medium text-gray-900">收據模板管理</h4>
        <div class="flex gap-2">
          <button
            @click="$emit('reset-templates')"
            class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            重置模板
          </button>
          <button
            @click="$emit('show-template-form')"
            class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <CloudArrowUpIcon class="mr-2 size-4" />
            上傳模板
          </button>
        </div>
      </div>

      <!-- 模板預覽列表 -->
      <div class="space-y-4">

        <!-- 空狀態 -->
        <div v-if="!templates || templates.length === 0" class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-8 text-center text-gray-500">
          <DocumentTextIcon class="mx-auto mb-4 size-12 text-gray-300" />
          <p class="mb-1 text-sm font-medium text-gray-900">尚未有任何模板</p>
          <p class="text-sm text-gray-500">點擊「重置模板」來載入預設模板，或上傳自定義模板</p>
          <button
            @click="$emit('reset-templates')"
            class="mt-4 inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            載入預設模板
          </button>
        </div>

        <!-- 模板列表 -->
        <div v-else>
          <div
            v-for="(template, index) in templates"
            :key="template.id || index"
            class="mb-4 overflow-hidden rounded-lg border border-gray-200 bg-white"
          >
            <!-- 模板信息頭部 -->
            <div class="border-b border-gray-200 px-4 py-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <span class="text-sm font-medium text-gray-900">{{ template.name }}</span>
                  <span :class="[
                    'rounded-full px-2 py-1 text-xs font-medium',
                    template.type === 'built_in' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  ]">
                    {{ template.type === 'built_in' ? '內建' : '自定義' }}
                  </span>
                </div>
                <div class="flex space-x-2">
                  <button
                    v-if="template.type === 'custom'"
                    @click="$emit('delete-template', template.id)"
                    class="rounded-md bg-red-100 px-3 py-1 text-xs text-red-700 transition-colors hover:bg-red-200"
                  >
                    刪除
                  </button>
                </div>
              </div>
              <p class="mt-1 text-sm text-gray-600">{{ template.description }}</p>
            </div>

            <!-- 模板預覽區域 -->
            <div class="p-6">
              <div class="flex flex-col space-y-6 xl:flex-row xl:items-start xl:space-x-6 xl:space-y-0">
                <!-- 預覽內容 -->
                <div class="min-w-0 flex-1">
                  <div
                    class="template-preview-container flex items-center justify-center rounded-lg border border-gray-200 bg-white"
                    v-html="getTemplatePreview(template)"
                  ></div>
                </div>

                <!-- 模板配置信息 -->
                <div class="w-full shrink-0 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 xl:w-64">
                  <div>
                    <h5 class="mb-3 text-sm font-medium text-gray-700">配置選項</h5>
                    <div class="space-y-2">
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600">風格:</span>
                        <span class="text-sm font-medium text-gray-900">{{ getLayoutTypeName(template.template_data?.layout_type) }}</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600">類型:</span>
                        <span class="text-sm font-medium text-gray-900">{{ template.category === 'receipt' ? '收據' : '發票' }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="border-t border-gray-200 pt-3">
                    <button
                      v-if="currentTemplate?.id !== template.id"
                      @click="selectTemplate(template)"
                      class="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      使用此模板
                    </button>
                    <div v-else class="flex items-center justify-center text-sm font-medium text-green-600">
                      <CheckCircleIcon class="mr-2 size-5" />
                      當前使用中
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CloudArrowUpIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import { generateTemplatePreview } from '@/services/templatePreviewService'
import { sanitizers } from '@/utils/validation'

interface Props {
  templates: any[]
  basicSettings: any
}

const props = defineProps<Props>()

// Debug logging
console.log('ReceiptSettings mounted, templates:', props.templates)
console.log('ReceiptSettings mounted, basicSettings:', props.basicSettings)

// Watch for changes
import { watch } from 'vue'
watch(() => props.templates, (newTemplates) => {
  console.log('Templates changed:', newTemplates)
}, { immediate: true, deep: true })

const emit = defineEmits<{
  'show-template-form': []
  'delete-template': [id: string]
  'select-template': [template: any]
  'reset-templates': []
}>()

// 當前選擇的模板
const currentTemplate = ref<any>(null)

// 載入當前選擇的模板
onMounted(() => {
  // 從 localStorage 載入當前模板
  const cached = localStorage.getItem('current_receipt_template_cache')
  if (cached) {
    try {
      currentTemplate.value = JSON.parse(cached)
    } catch (e) {
      console.error('解析當前模板失敗:', e)
    }
  }
})

// 選擇模板
const selectTemplate = (template: any) => {
  currentTemplate.value = template
  emit('select-template', template)
}

// 獲取模板預覽HTML
const getTemplatePreview = (template: any) => {
  try {
    console.log('生成預覽 for template:', template.name)
    const previewHtml = generateTemplatePreview(template, props.basicSettings)
    console.log('生成的預覽HTML長度:', previewHtml?.length)

    // 檢查是否有內容
    if (!previewHtml || previewHtml.length === 0) {
      console.warn('generateTemplatePreview 返回空內容')
      return '<div class="text-center text-gray-500 p-8">模板預覽內容為空</div>'
    }

    // 暫時直接返回原始 HTML 以進行測試
    console.log('返回原始HTML（未清理）')
    return previewHtml

    // 如果上面的測試有效，再嘗試使用較寬鬆的清理器
    // const sanitized = sanitizers.html.basic(previewHtml)
    // console.log('清理後的HTML長度:', sanitized?.length)
    // return sanitized
  } catch (error) {
    console.error('生成模板預覽失敗:', error, 'template:', template)
    return '<div class="text-center text-gray-500 p-8">預覽生成失敗</div>'
  }
}

// 獲取版面風格名稱
const getLayoutTypeName = (type: string) => {
  const names = {
    modern: '現代',
    minimal: '簡約'
  }
  return names[type as keyof typeof names] || type
}
</script>

<style scoped>
/* 模板預覽容器樣式 */
.template-preview-container {
  min-height: 300px;
  max-height: 500px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 16px;
}

.template-preview-container::-webkit-scrollbar {
  width: 8px;
}

.template-preview-container::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.template-preview-container::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.template-preview-container::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* 預覽內容的響應式調整 - 增大縮放比例 */
.template-preview-container :deep(.template-preview) {
  transform: scale(0.9);
  transform-origin: top center;
  width: 100%;
  margin: 0 auto;
  display: block;
}

/* 修復預覽容器內的文字大小 - 增大字體 */
.template-preview-container :deep(.template-preview) * {
  font-size: inherit !important;
  line-height: 1.5 !important;
}

/* 特別針對小字體元素進行調整 */
.template-preview-container :deep(.template-preview) .company-info,
.template-preview-container :deep(.template-preview) .footer,
.template-preview-container :deep(.template-preview) .items-table,
.template-preview-container :deep(.template-preview) .payment-table {
  font-size: 12px !important;
}

.template-preview-container :deep(.template-preview) .document-title {
  font-size: 16px !important;
  font-weight: bold !important;
}

.template-preview-container :deep(.template-preview) .company-name {
  font-size: 18px !important;
  font-weight: bold !important;
}

/* 簡化按鈕樣式 */
button {
  transition: background-color 0.2s ease;
}

/* 自定義模板iframe隔離樣式 */
.template-preview-container :deep(.custom-style) {
  background: white !important;
  border-radius: 8px !important;
  overflow: hidden !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
}

.template-preview-container :deep(.custom-style iframe) {
  background: white !important;
  border-radius: 8px !important;
}

/* 響應式調整 */
@media (max-width: 1280px) {
  .template-preview-container :deep(.template-preview:not(.custom-style)) {
    transform: scale(0.85);
  }

  .template-preview-container :deep(.custom-style) {
    height: 400px !important;
  }
}

@media (max-width: 1024px) {
  .template-preview-container :deep(.template-preview:not(.custom-style)) {
    transform: scale(0.8);
  }

  .template-preview-container :deep(.custom-style) {
    height: 350px !important;
  }

  .template-preview-container {
    min-height: 280px;
  }
}

@media (max-width: 768px) {
  .template-preview-container :deep(.template-preview:not(.custom-style)) {
    transform: scale(0.75);
  }

  .template-preview-container :deep(.custom-style) {
    height: 300px !important;
  }

  .template-preview-container {
    min-height: 250px;
    padding: 12px;
  }
}

@media (max-width: 640px) {
  .template-preview-container :deep(.template-preview:not(.custom-style)) {
    transform: scale(0.7);
  }

  .template-preview-container :deep(.custom-style) {
    height: 250px !important;
  }

  .template-preview-container {
    min-height: 220px;
    padding: 10px;
  }
}
</style>
