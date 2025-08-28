<template>
  <div class="student-notes-manager">
    <!-- 標題和控制區域 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h3 class="text-lg font-medium text-gray-900">學生備註</h3>
        <p class="mt-1 text-sm text-gray-500">
          記錄學生的學習狀況、行為表現和重要事項
        </p>
      </div>

      <div class="flex items-center space-x-2">
        <!-- 統計資訊 -->
        <div v-if="statistics" class="text-sm text-gray-500">
          共 {{ statistics.total }} 筆記錄
          <span v-if="statistics.importantCount > 0" class="ml-2 text-red-600">
            📌 {{ statistics.importantCount }} 筆重要
          </span>
        </div>

        <!-- 切換歷史記錄顯示 -->
        <button
          v-if="showHistoryToggle"
          type="button"
          @click="showHistory = !showHistory"
          class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ClockIcon class="mr-1 size-4" />
          {{ showHistory ? '隱藏歷史' : '顯示歷史' }}
        </button>
      </div>
    </div>

    <!-- 當前備註編輯器 -->
    <div v-if="!readonly" class="mb-6">
      <NotesEditor
        :student-id="studentId"
        :initial-content="currentNotes"
        :placeholder="editorConfig.placeholder"
        :support-markdown="editorConfig.supportMarkdown"
        :show-type-selector="editorConfig.showTypeSelector"
        :auto-save="editorConfig.autoSave"
        :auto-save-delay="editorConfig.autoSaveDelay"
        @content-changed="handleNotesChanged"
        @save-success="handleSaveSuccess"
        @save-error="handleSaveError"
      />
    </div>

    <!-- 唯讀模式顯示當前備註 -->
    <div v-else-if="currentNotes" class="mb-6">
      <div class="rounded-lg bg-gray-50 p-4">
        <h4 class="mb-2 text-sm font-medium text-gray-900">目前備註</h4>
        <div class="whitespace-pre-wrap text-sm text-gray-700">{{ currentNotes }}</div>
      </div>
    </div>

    <!-- 備註歷史 -->
    <div v-if="showHistory">
      <NotesHistory
        :student-id="studentId"
        :show-editor="!readonly"
        :filter-types="historyFilter.types"
        :max-items="maxHistoryItems"
        :display-mode="displayMode"
        @note-added="handleNoteAdded"
        @filter-changed="handleFilterChanged"
        @statistics-updated="statistics = $event"
      />
    </div>

    <!-- 載入中狀態 -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="flex items-center space-x-2 text-gray-500">
        <svg class="size-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>載入中...</span>
      </div>
    </div>

    <!-- 錯誤提示 -->
    <div v-if="error" class="mb-4">
      <div class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <ExclamationTriangleIcon class="size-5 text-red-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">發生錯誤</h3>
            <div class="mt-1 text-sm text-red-700">{{ error }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 成功提示 -->
    <div v-if="successMessage" class="mb-4">
      <div class="rounded-md bg-green-50 p-4">
        <div class="flex">
          <CheckCircleIcon class="size-5 text-green-400" />
          <div class="ml-3">
            <div class="text-sm text-green-700">{{ successMessage }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import {
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'

import NotesEditor from './NotesEditor.vue'
import NotesHistory from './NotesHistory.vue'
import { notesService } from './notesService'
import type {
  StudentNoteHistory,
  NotesStatistics,
  NotesFilter,
  NotesEditorConfig,
  NotesDisplayMode,
  NoteSaveResult
} from './types'
import { DEFAULT_NOTES_EDITOR_CONFIG } from './types'

// Props
interface Props {
  studentId: string
  currentNotes?: string
  readonly?: boolean
  autoSave?: boolean
  autoSaveDelay?: number
  showHistory?: boolean
  showHistoryToggle?: boolean
  maxHistoryItems?: number
  displayMode?: NotesDisplayMode
  editorConfig?: Partial<NotesEditorConfig>
}

const props = withDefaults(defineProps<Props>(), {
  currentNotes: '',
  readonly: false,
  autoSave: true,
  autoSaveDelay: 3000,
  showHistory: true,
  showHistoryToggle: true,
  maxHistoryItems: 50,
  displayMode: 'timeline',
  editorConfig: () => ({})
})

// Emits
interface Emits {
  (e: 'notes-updated', notes: string): void
  (e: 'save-success', result: NoteSaveResult): void
  (e: 'save-error', error: Error): void
  (e: 'history-loaded', history: StudentNoteHistory[]): void
}

const emit = defineEmits<Emits>()

// State
const loading = ref(false)
const error = ref<string>()
const successMessage = ref<string>()
const showHistory = ref(props.showHistory)
const statistics = ref<NotesStatistics>()

const historyFilter = reactive<NotesFilter>({
  types: [],
  showImportantOnly: false
})

// Computed
const editorConfig = computed(() => ({
  ...DEFAULT_NOTES_EDITOR_CONFIG,
  autoSave: props.autoSave,
  autoSaveDelay: props.autoSaveDelay,
  ...props.editorConfig
}))

// Methods
function handleNotesChanged(newNotes: string) {
  emit('notes-updated', newNotes)
}

function handleSaveSuccess(result: NoteSaveResult) {
  error.value = undefined
  successMessage.value = '備註儲存成功'

  // 自動清除成功訊息
  setTimeout(() => {
    successMessage.value = undefined
  }, 3000)

  emit('save-success', result)

  // 重新載入統計資料
  loadStatistics()
}

function handleSaveError(saveError: Error) {
  error.value = saveError.message
  successMessage.value = undefined
  emit('save-error', saveError)
}

function handleNoteAdded(note: StudentNoteHistory) {
  error.value = undefined
  successMessage.value = '備註新增成功'

  setTimeout(() => {
    successMessage.value = undefined
  }, 3000)

  // 重新載入統計資料
  loadStatistics()
}

function handleFilterChanged(filter: NotesFilter) {
  historyFilter.types = filter.types
  historyFilter.showImportantOnly = filter.showImportantOnly
  historyFilter.searchKeyword = filter.searchKeyword
}

async function loadStatistics() {
  if (!props.studentId) return

  try {
    statistics.value = await notesService.getNotesStatistics(props.studentId)
  } catch (err) {
    console.error('載入統計資料失敗:', err)
  }
}

// Lifecycle
onMounted(() => {
  loadStatistics()
})

// Watchers
watch(() => props.studentId, () => {
  if (props.studentId) {
    loadStatistics()
  }
})
</script>

<style scoped>
.student-notes-manager {
  @apply w-full;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
