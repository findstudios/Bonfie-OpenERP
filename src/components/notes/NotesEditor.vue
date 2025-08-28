<template>
  <div class="notes-editor">
    <!-- 編輯器工具列 -->
    <div class="mb-3 flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <!-- 備註類型選擇器 -->
        <div v-if="showTypeSelector" class="flex items-center space-x-2">
          <label class="text-sm font-medium text-gray-700">類型:</label>
          <select
            v-model="selectedType"
            class="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option v-for="option in noteTypeOptions" :key="option.value" :value="option.value">
              {{ option.icon }} {{ option.label }}
            </option>
          </select>
        </div>

        <!-- 重要性標記 -->
        <div v-if="showImportantToggle">
          <label class="flex items-center">
            <input
              v-model="isImportant"
              type="checkbox"
              class="size-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span class="ml-2 text-sm text-gray-700">📌 重要</span>
          </label>
        </div>
      </div>

      <!-- 字數統計 -->
      <div class="text-xs text-gray-500">
        {{ currentLength }}/{{ maxLength }} 字
      </div>
    </div>

    <!-- 文字編輯區域 -->
    <div class="relative">
      <textarea
        ref="textareaRef"
        v-model="content"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxLength"
        :class="[
          'w-full resize-none rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500',
          disabled ? 'bg-gray-50 text-gray-500' : 'bg-white',
          hasError ? 'border-red-300 bg-red-50' : ''
        ]"
        :style="{ height: textareaHeight + 'px' }"
        @input="handleInput"
        @keydown="handleKeydown"
        @focus="handleFocus"
        @blur="handleBlur"
      />

      <!-- Markdown 提示 -->
      <div v-if="supportMarkdown && showMarkdownHint" class="absolute bottom-2 right-2">
        <div class="rounded bg-gray-800 px-2 py-1 text-xs text-white shadow-lg">
          支援 Markdown 格式
        </div>
      </div>
    </div>

    <!-- 快速插入按鈕 -->
    <div v-if="supportMarkdown" class="mt-2 flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <button
          v-for="quickInsert in quickInsertOptions"
          :key="quickInsert.name"
          type="button"
          @click="insertMarkdown(quickInsert)"
          class="rounded px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600"
          :title="quickInsert.description"
        >
          {{ quickInsert.display }}
        </button>
      </div>

      <!-- 預覽切換 -->
      <button
        v-if="content.length > 0"
        type="button"
        @click="showPreview = !showPreview"
        class="text-xs text-blue-600 hover:text-blue-800"
      >
        {{ showPreview ? '編輯' : '預覽' }}
      </button>
    </div>

    <!-- Markdown 預覽 -->
    <div
      v-if="showPreview && content.length > 0"
      class="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
    >
      <div class="prose prose-sm max-w-none" v-html="renderedMarkdown"></div>
    </div>

    <!-- 自動儲存狀態 -->
    <div v-if="autoSave" class="mt-2 flex items-center justify-between text-xs text-gray-500">
      <div class="flex items-center space-x-2">
        <div v-if="saveStatus === 'saving'" class="flex items-center">
          <svg class="mr-1 size-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          儲存中...
        </div>
        <div v-else-if="saveStatus === 'saved'" class="flex items-center text-green-600">
          <CheckIcon class="mr-1 size-3" />
          已儲存
        </div>
        <div v-else-if="saveStatus === 'error'" class="flex items-center text-red-600">
          <ExclamationTriangleIcon class="mr-1 size-3" />
          儲存失敗
        </div>
      </div>

      <div v-if="lastSavedAt">
        最後儲存: {{ formatTime(lastSavedAt) }}
      </div>
    </div>

    <!-- 錯誤訊息 -->
    <div v-if="errorMessage" class="mt-2 text-sm text-red-600">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { CheckIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

import { notesService } from './notesService'
import type { CreateNoteData, NoteType, NoteSaveResult } from './types'
import { NOTE_TYPE_OPTIONS, DEFAULT_NOTES_EDITOR_CONFIG } from './types'
import { sanitizers } from '@/utils/validation'

// Props
interface Props {
  studentId: string
  initialContent?: string
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
  supportMarkdown?: boolean
  showTypeSelector?: boolean
  showImportantToggle?: boolean
  autoSave?: boolean
  autoSaveDelay?: number
  maxLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialContent: '',
  placeholder: DEFAULT_NOTES_EDITOR_CONFIG.placeholder,
  disabled: false,
  autoFocus: false,
  supportMarkdown: DEFAULT_NOTES_EDITOR_CONFIG.supportMarkdown,
  showTypeSelector: DEFAULT_NOTES_EDITOR_CONFIG.showTypeSelector,
  showImportantToggle: DEFAULT_NOTES_EDITOR_CONFIG.showImportantToggle,
  autoSave: DEFAULT_NOTES_EDITOR_CONFIG.autoSave,
  autoSaveDelay: DEFAULT_NOTES_EDITOR_CONFIG.autoSaveDelay,
  maxLength: DEFAULT_NOTES_EDITOR_CONFIG.maxLength
})

// Emits
interface Emits {
  (e: 'content-changed', content: string): void
  (e: 'save-success', result: NoteSaveResult): void
  (e: 'save-error', error: Error): void
  (e: 'type-changed', type: NoteType): void
}

const emit = defineEmits<Emits>()

// State
const textareaRef = ref<HTMLTextAreaElement>()
const content = ref(props.initialContent)
const selectedType = ref<NoteType>('general')
const isImportant = ref(false)
const showPreview = ref(false)
const showMarkdownHint = ref(false)
const textareaHeight = ref(120)
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const lastSavedAt = ref<Date>()
const errorMessage = ref<string>()
const autoSaveTimer = ref<NodeJS.Timeout>()

// Computed
const currentLength = computed(() => content.value.length)
const hasError = computed(() => !!errorMessage.value)
const noteTypeOptions = computed(() => NOTE_TYPE_OPTIONS)

const renderedMarkdown = computed(() => {
  if (!props.supportMarkdown || !content.value) return ''

  // 先清理輸入的 Markdown 內容
  const sanitizedInput = sanitizers.data.markdownInput(content.value)

  // 簡單的 Markdown 轉換
  const htmlContent = sanitizedInput
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')

  // 使用 DOMPurify 清理最終的 HTML
  return sanitizers.html.markdown(htmlContent)
})

const quickInsertOptions = [
  { name: 'bold', display: '**粗體**', description: '粗體文字', markdown: '**文字**' },
  { name: 'italic', display: '*斜體*', description: '斜體文字', markdown: '*文字*' },
  { name: 'list', display: '• 清單', description: '項目清單', markdown: '- 項目' },
  { name: 'date', display: '📅 日期', description: '插入今日日期', markdown: '' }
]

// Methods
function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement

  // 檢查是否包含潛在的 XSS 攻擊
  if (sanitizers.security.detectXSS(target.value)) {
    errorMessage.value = '偵測到不安全的內容，請勿輸入 HTML 標籤或腳本'
    // 還原到之前的值
    target.value = content.value
    return
  }

  content.value = target.value
  emit('content-changed', content.value)
  adjustTextareaHeight()

  // 清除錯誤訊息
  if (errorMessage.value && !sanitizers.security.detectXSS(content.value)) {
    errorMessage.value = undefined
  }

  // 自動儲存
  if (props.autoSave) {
    scheduleAutoSave()
  }
}

function handleKeydown(event: KeyboardEvent) {
  // Ctrl/Cmd + Enter 快速儲存
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    saveNote()
  }

  // Tab 鍵插入縮排
  if (event.key === 'Tab') {
    event.preventDefault()
    insertAtCursor('  ')
  }
}

function handleFocus() {
  if (props.supportMarkdown) {
    showMarkdownHint.value = true
    setTimeout(() => {
      showMarkdownHint.value = false
    }, 3000)
  }
}

function handleBlur() {
  showMarkdownHint.value = false
}

function adjustTextareaHeight() {
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
      const newHeight = Math.max(120, Math.min(400, textareaRef.value.scrollHeight))
      textareaHeight.value = newHeight
    }
  })
}

function insertAtCursor(text: string) {
  if (!textareaRef.value) return

  const start = textareaRef.value.selectionStart
  const end = textareaRef.value.selectionEnd
  const newContent = content.value.substring(0, start) + text + content.value.substring(end)

  content.value = newContent

  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.setSelectionRange(start + text.length, start + text.length)
      textareaRef.value.focus()
    }
  })
}

function insertMarkdown(option: typeof quickInsertOptions[0]) {
  if (option.name === 'date') {
    const today = new Date().toLocaleDateString('zh-TW')
    insertAtCursor(`${today}: `)
  } else {
    insertAtCursor(option.markdown)
  }
}

function scheduleAutoSave() {
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
  }

  autoSaveTimer.value = setTimeout(() => {
    if (content.value.trim()) {
      saveNote()
    }
  }, props.autoSaveDelay)
}

async function saveNote() {
  if (!content.value.trim()) {
    return
  }

  saveStatus.value = 'saving'
  errorMessage.value = undefined

  try {
    // 清理內容
    const sanitizedContent = sanitizers.html.basic(content.value.trim())

    const noteData: CreateNoteData = {
      content: sanitizedContent,
      type: selectedType.value,
      isImportant: isImportant.value
    }

    // 驗證資料
    const validationErrors = notesService.validateNoteData(noteData)
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '))
    }

    // 儲存備註
    const savedNote = await notesService.addStudentNote(props.studentId, noteData)

    saveStatus.value = 'saved'
    lastSavedAt.value = new Date()

    // 清空編輯器
    content.value = ''
    isImportant.value = false
    selectedType.value = 'general'

    emit('save-success', { success: true, noteId: savedNote.id })

    // 3秒後重置狀態
    setTimeout(() => {
      if (saveStatus.value === 'saved') {
        saveStatus.value = 'idle'
      }
    }, 3000)

  } catch (error) {
    console.error('儲存備註失敗:', error)
    saveStatus.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : '儲存失敗'

    emit('save-error', error instanceof Error ? error : new Error('儲存失敗'))
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Lifecycle
onMounted(() => {
  if (props.autoFocus && textareaRef.value) {
    textareaRef.value.focus()
  }
  adjustTextareaHeight()
})

onUnmounted(() => {
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
  }
})

// Watchers
watch(() => props.initialContent, (newContent) => {
  content.value = newContent
  nextTick(() => adjustTextareaHeight())
})

watch(selectedType, (newType) => {
  emit('type-changed', newType)
})

watch(content, () => {
  nextTick(() => adjustTextareaHeight())
})
</script>

<style scoped>
.notes-editor {
  @apply w-full;
}

.prose {
  @apply text-gray-700;
}

.prose strong {
  @apply font-semibold text-gray-900;
}

.prose em {
  @apply italic text-gray-800;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 自訂 scrollbar 樣式 */
textarea::-webkit-scrollbar {
  width: 6px;
}

textarea::-webkit-scrollbar-track {
  @apply bg-gray-100 rounded;
}

textarea::-webkit-scrollbar-thumb {
  @apply bg-gray-400 rounded;
}

textarea::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-500;
}
</style>
