<template>
  <div class="notes-history">
    <!-- 標題和篩選器 -->
    <div class="mb-6 flex items-center justify-between">
      <h4 class="text-md font-medium text-gray-900">備註歷史</h4>

      <div class="flex items-center space-x-3">
        <!-- 搜尋框 -->
        <div class="relative">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜尋備註..."
            class="w-48 rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:ring-blue-500"
            @input="handleSearch"
          />
        </div>

        <!-- 篩選按鈕 -->
        <button
          type="button"
          @click="showFilters = !showFilters"
          class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <FunnelIcon class="mr-1 size-4" />
          篩選
          <span v-if="activeFiltersCount > 0" class="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800">
            {{ activeFiltersCount }}
          </span>
        </button>

        <!-- 顯示模式切換 -->
        <div class="flex items-center rounded-md border border-gray-300">
          <button
            v-for="mode in displayModes"
            :key="mode.value"
            type="button"
            @click="currentDisplayMode = mode.value"
            :class="[
              'px-3 py-2 text-sm font-medium focus:outline-none',
              currentDisplayMode === mode.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            ]"
            :title="mode.label"
          >
            <component :is="mode.icon" class="size-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- 篩選面板 -->
    <div v-if="showFilters" class="mb-6 rounded-lg bg-gray-50 p-4">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <!-- 備註類型篩選 -->
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700">備註類型</label>
          <div class="space-y-2">
            <label v-for="type in noteTypeOptions" :key="type.value" class="flex items-center">
              <input
                v-model="selectedTypes"
                type="checkbox"
                :value="type.value"
                class="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="ml-2 text-sm text-gray-700">
                {{ type.icon }} {{ type.label }}
              </span>
            </label>
          </div>
        </div>

        <!-- 日期範圍 -->
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700">日期範圍</label>
          <div class="space-y-2">
            <input
              v-model="dateRange.start"
              type="date"
              class="w-full rounded-md border border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <input
              v-model="dateRange.end"
              type="date"
              class="w-full rounded-md border border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <!-- 其他選項 -->
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700">其他選項</label>
          <div class="space-y-2">
            <label class="flex items-center">
              <input
                v-model="showImportantOnly"
                type="checkbox"
                class="size-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span class="ml-2 text-sm text-gray-700">📌 僅顯示重要備註</span>
            </label>
          </div>
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
        <button
          type="button"
          @click="clearFilters"
          class="text-sm text-gray-600 hover:text-gray-800"
        >
          清除篩選
        </button>
        <div class="text-sm text-gray-500">
          找到 {{ filteredNotes.length }} 筆記錄
        </div>
      </div>
    </div>

    <!-- 快速新增編輯器 -->
    <div v-if="showEditor" class="mb-6">
      <NotesEditor
        :student-id="studentId"
        placeholder="新增備註..."
        :auto-focus="false"
        @save-success="handleNoteAdded"
        @save-error="handleSaveError"
      />
    </div>

    <!-- 歷史記錄內容 -->
    <div class="notes-content">
      <!-- 載入狀態 -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="flex items-center space-x-2 text-gray-500">
          <svg class="size-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>載入中...</span>
        </div>
      </div>

      <!-- 空狀態 -->
      <div v-else-if="filteredNotes.length === 0" class="py-12 text-center">
        <DocumentTextIcon class="mx-auto mb-4 size-12 text-gray-400" />
        <h3 class="mb-2 text-lg font-medium text-gray-900">
          {{ searchKeyword || hasActiveFilters ? '找不到符合條件的備註' : '尚無備註記錄' }}
        </h3>
        <p class="text-gray-500">
          {{ searchKeyword || hasActiveFilters ? '請嘗試調整搜尋條件或篩選器' : '開始記錄學生的學習狀況和重要事項' }}
        </p>
      </div>

      <!-- 時間軸模式 -->
      <div v-else-if="currentDisplayMode === 'timeline'" class="space-y-6">
        <div v-for="group in groupedNotes" :key="group.date" class="timeline-group">
          <div class="sticky top-0 mb-4 border-b border-gray-200 bg-white py-2">
            <h5 class="text-sm font-medium text-gray-900">{{ group.dateLabel }}</h5>
          </div>

          <div class="space-y-4">
            <div
              v-for="note in group.notes"
              :key="note.id"
              class="timeline-item relative pb-6 pl-8"
            >
              <!-- 時間軸點 -->
              <div :class="[
                'absolute left-0 top-2 size-3 rounded-full',
                getTimelineColor(note)
              ]"></div>

              <!-- 時間軸線 -->
              <div class="absolute left-1.5 top-5 h-full w-0.5 bg-gray-200"></div>

              <!-- 備註卡片 -->
              <NoteCard :note="note" @click="selectNote(note)" />
            </div>
          </div>
        </div>
      </div>

      <!-- 列表模式 -->
      <div v-else-if="currentDisplayMode === 'list'" class="space-y-3">
        <NoteCard
          v-for="note in filteredNotes"
          :key="note.id"
          :note="note"
          :compact="true"
          @click="selectNote(note)"
        />
      </div>

      <!-- 卡片模式 -->
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <NoteCard
          v-for="note in filteredNotes"
          :key="note.id"
          :note="note"
          :card-mode="true"
          @click="selectNote(note)"
        />
      </div>
    </div>

    <!-- 載入更多按鈕 -->
    <div v-if="hasMore" class="mt-6 text-center">
      <button
        type="button"
        @click="loadMore"
        :disabled="loadingMore"
        class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <template v-if="loadingMore">
          <svg class="-ml-1 mr-2 size-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          載入中...
        </template>
        <template v-else>
          載入更多
        </template>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  Bars3Icon,
  RectangleGroupIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'

import NotesEditor from './NotesEditor.vue'
import NoteCard from './NoteCard.vue'
import { notesService } from './notesService'
import type {
  StudentNoteHistory,
  NotesFilter,
  NotesDisplayMode,
  NotesQueryOptions,
  DateRange
} from './types'
import { NOTE_TYPE_OPTIONS } from './types'

// Props
interface Props {
  studentId: string
  showEditor?: boolean
  filterTypes?: string[]
  maxItems?: number
  displayMode?: NotesDisplayMode
  groupByDate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showEditor: false,
  filterTypes: () => [],
  maxItems: 100,
  displayMode: 'timeline',
  groupByDate: true
})

// Emits
interface Emits {
  (e: 'note-added', note: StudentNoteHistory): void
  (e: 'filter-changed', filter: NotesFilter): void
  (e: 'statistics-updated', stats: any): void
}

const emit = defineEmits<Emits>()

// State
const loading = ref(false)
const loadingMore = ref(false)
const showFilters = ref(false)
const searchKeyword = ref('')
const selectedTypes = ref<string[]>([])
const showImportantOnly = ref(false)
const currentDisplayMode = ref<NotesDisplayMode>(props.displayMode)
const hasMore = ref(false)
const currentPage = ref(0)
const pageSize = 20

const dateRange = reactive<DateRange>({
  start: '',
  end: ''
})

const allNotes = ref<StudentNoteHistory[]>([])
const searchResults = ref<StudentNoteHistory[]>([])
const selectedNote = ref<StudentNoteHistory>()

// Computed
const noteTypeOptions = computed(() => NOTE_TYPE_OPTIONS)

const displayModes = computed(() => [
  { value: 'timeline' as NotesDisplayMode, label: '時間軸', icon: ClockIcon },
  { value: 'list' as NotesDisplayMode, label: '列表', icon: Bars3Icon },
  { value: 'cards' as NotesDisplayMode, label: '卡片', icon: RectangleGroupIcon }
])

const hasActiveFilters = computed(() => {
  return selectedTypes.value.length > 0 ||
         showImportantOnly.value ||
         dateRange.start ||
         dateRange.end
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (selectedTypes.value.length > 0) count++
  if (showImportantOnly.value) count++
  if (dateRange.start || dateRange.end) count++
  return count
})

const filteredNotes = computed(() => {
  let notes = searchKeyword.value ? searchResults.value : allNotes.value

  // 類型篩選
  if (selectedTypes.value.length > 0) {
    notes = notes.filter(note => selectedTypes.value.includes(note.note_type))
  }

  // 重要備註篩選
  if (showImportantOnly.value) {
    notes = notes.filter(note => note.is_important)
  }

  // 日期範圍篩選
  if (dateRange.start || dateRange.end) {
    notes = notes.filter(note => {
      const noteDate = new Date(note.created_at).toISOString().split('T')[0]
      const start = dateRange.start || '1900-01-01'
      const end = dateRange.end || '2100-12-31'
      return noteDate >= start && noteDate <= end
    })
  }

  return notes.slice(0, props.maxItems)
})

const groupedNotes = computed(() => {
  if (!props.groupByDate || currentDisplayMode.value !== 'timeline') {
    return [{ date: 'all', dateLabel: '全部', notes: filteredNotes.value }]
  }

  const groups: { [key: string]: StudentNoteHistory[] } = {}

  filteredNotes.value.forEach(note => {
    const date = new Date(note.created_at)
    const dateKey = date.toISOString().split('T')[0]

    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(note)
  })

  return Object.keys(groups)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .map(dateKey => ({
      date: dateKey,
      dateLabel: formatDateLabel(dateKey),
      notes: groups[dateKey]
    }))
})

// Methods
async function loadNotes() {
  if (!props.studentId) return

  loading.value = true

  try {
    const options: NotesQueryOptions = {
      limit: pageSize,
      offset: currentPage.value * pageSize,
      includeCreator: true,
      orderBy: 'created_at',
      orderDirection: 'desc'
    }

    const notes = await notesService.getStudentNotesHistory(props.studentId, options)

    if (currentPage.value === 0) {
      allNotes.value = notes
    } else {
      allNotes.value.push(...notes)
    }

    hasMore.value = notes.length === pageSize

    // 載入統計資料
    const stats = await notesService.getNotesStatistics(props.studentId)
    emit('statistics-updated', stats)

  } catch (error) {
    console.error('載入備註歷史失敗:', error)
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (loadingMore.value) return

  loadingMore.value = true
  currentPage.value++

  try {
    await loadNotes()
  } finally {
    loadingMore.value = false
  }
}

async function handleSearch() {
  if (!searchKeyword.value.trim()) {
    searchResults.value = []
    return
  }

  try {
    const results = await notesService.searchNotes(props.studentId, searchKeyword.value, {
      types: selectedTypes.value.length > 0 ? selectedTypes.value as any : undefined,
      onlyImportant: showImportantOnly.value
    })

    searchResults.value = results
  } catch (error) {
    console.error('搜尋備註失敗:', error)
  }
}

function handleNoteAdded(result: any) {
  // 重新載入第一頁
  currentPage.value = 0
  loadNotes()

  emit('note-added', result)
}

function handleSaveError(error: Error) {
  console.error('新增備註失敗:', error)
}

function clearFilters() {
  selectedTypes.value = []
  showImportantOnly.value = false
  dateRange.start = ''
  dateRange.end = ''
  searchKeyword.value = ''
  searchResults.value = []
}

function selectNote(note: StudentNoteHistory) {
  selectedNote.value = note
  // 這裡可以加入查看備註詳情的邏輯
}

function getTimelineColor(note: StudentNoteHistory): string {
  const colors = {
    general: 'bg-gray-400',
    academic: 'bg-blue-500',
    behavioral: 'bg-red-500',
    family: 'bg-green-500',
    health: 'bg-yellow-500',
    attendance: 'bg-purple-500'
  }

  if (note.is_important) {
    return 'bg-red-600 ring-2 ring-red-200'
  }

  return colors[note.note_type] || colors.general
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

  if (date.toDateString() === today.toDateString()) {
    return '今天'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '昨天'
  } else {
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }
}

// Watchers
watch([selectedTypes, showImportantOnly, dateRange], () => {
  const filter: NotesFilter = {
    types: selectedTypes.value as any,
    showImportantOnly: showImportantOnly.value,
    searchKeyword: searchKeyword.value,
    dateRange: (dateRange.start || dateRange.end) ? { ...dateRange } : undefined
  }

  emit('filter-changed', filter)
}, { deep: true })

// Lifecycle
onMounted(() => {
  loadNotes()
})
</script>

<style scoped>
.notes-history {
  @apply w-full;
}

.timeline-item:last-child .absolute.left-1\\.5 {
  @apply hidden;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
