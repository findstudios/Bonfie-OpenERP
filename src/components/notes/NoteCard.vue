<template>
  <div
    :class="[
      'note-card cursor-pointer transition-all duration-200',
      compact ? 'p-3' : 'p-4',
      cardMode ? 'rounded-lg border border-gray-200 hover:shadow-md' : 'rounded-lg border border-gray-200 bg-white hover:shadow-sm',
      note.is_important ? 'border-red-300 ring-2 ring-red-200' : '',
      selected ? 'border-blue-300 ring-2 ring-blue-500' : ''
    ]"
    @click="$emit('click', note)"
  >
    <!-- 備註頭部 -->
    <div class="mb-2 flex items-start justify-between">
      <div class="flex items-center space-x-2">
        <!-- 類型標籤 -->
        <span :class="[
          'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
          getTypeColorClass(note.note_type)
        ]">
          {{ getTypeIcon(note.note_type) }} {{ getTypeLabel(note.note_type) }}
        </span>

        <!-- 重要標記 -->
        <span v-if="note.is_important" class="text-sm text-red-500" title="重要備註">
          📌
        </span>

        <!-- 敏感標記 -->
        <span v-if="note.is_sensitive" class="text-sm text-orange-500" title="敏感資訊">
          🔒
        </span>
      </div>

      <!-- 時間戳記 -->
      <div class="shrink-0 text-xs text-gray-500">
        {{ formatTime(note.created_at) }}
      </div>
    </div>

    <!-- 備註內容 -->
    <div :class="[
      'mb-3 text-gray-900',
      compact ? 'text-sm' : 'text-base',
      compact && note.note_content.length > 100 ? 'line-clamp-2' : ''
    ]">
      <div v-if="supportMarkdown && hasMarkdown" class="prose prose-sm max-w-none" v-html="renderedContent"></div>
      <div v-else class="whitespace-pre-wrap">{{ displayContent }}</div>
    </div>

    <!-- 標籤 -->
    <div v-if="note.tags && note.tags.length > 0" class="mb-2 flex flex-wrap gap-1">
      <span
        v-for="tag in note.tags"
        :key="tag"
        class="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"
      >
        #{{ tag }}
      </span>
    </div>

    <!-- 底部資訊 -->
    <div class="flex items-center justify-between text-xs text-gray-500">
      <div class="flex items-center space-x-3">
        <!-- 建立者 -->
        <div class="flex items-center space-x-1">
          <UserIcon class="size-3" />
          <span>{{ note.created_by_name || note.created_by }}</span>
        </div>

        <!-- 完整時間 -->
        <div class="flex items-center space-x-1">
          <ClockIcon class="size-3" />
          <span>{{ formatFullTime(note.created_at) }}</span>
        </div>
      </div>

      <!-- 操作按鈕 -->
      <div v-if="showActions" class="flex items-center space-x-1">
        <button
          type="button"
          @click.stop="copyContent"
          class="rounded p-1 text-gray-400 hover:text-gray-600"
          title="複製內容"
        >
          <ClipboardIcon class="size-3" />
        </button>

        <button
          v-if="canEdit"
          type="button"
          @click.stop="editNote"
          class="rounded p-1 text-gray-400 hover:text-blue-600"
          title="編輯備註"
        >
          <PencilIcon class="size-3" />
        </button>

        <button
          v-if="canDelete"
          type="button"
          @click.stop="deleteNote"
          class="rounded p-1 text-gray-400 hover:text-red-600"
          title="刪除備註"
        >
          <TrashIcon class="size-3" />
        </button>
      </div>
    </div>

    <!-- 展開/收合按鈕 (長內容) -->
    <div v-if="compact && note.note_content.length > 100" class="mt-2">
      <button
        type="button"
        @click.stop="expanded = !expanded"
        class="text-xs text-blue-600 hover:text-blue-800"
      >
        {{ expanded ? '收合' : '展開更多' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  UserIcon,
  ClockIcon,
  ClipboardIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

import type { StudentNoteHistory, NoteType } from './types'
import { NOTE_TYPE_OPTIONS, NOTE_TYPE_LABELS } from './types'
import { sanitizers } from '@/utils/validation'

// Props
interface Props {
  note: StudentNoteHistory
  compact?: boolean
  cardMode?: boolean
  selected?: boolean
  showActions?: boolean
  supportMarkdown?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  cardMode: false,
  selected: false,
  showActions: true,
  supportMarkdown: true,
  canEdit: false,
  canDelete: false
})

// Emits
interface Emits {
  (e: 'click', note: StudentNoteHistory): void
  (e: 'edit', note: StudentNoteHistory): void
  (e: 'delete', note: StudentNoteHistory): void
  (e: 'copy', content: string): void
}

const emit = defineEmits<Emits>()

// State
const expanded = ref(false)

// Computed
const displayContent = computed(() => {
  if (!props.compact || expanded.value) {
    return props.note.note_content
  }

  if (props.note.note_content.length > 100) {
    return `${props.note.note_content.substring(0, 100)}...`
  }

  return props.note.note_content
})

const hasMarkdown = computed(() => {
  return props.note.note_content.includes('**') ||
         props.note.note_content.includes('*') ||
         props.note.note_content.includes('- ') ||
         props.note.note_content.includes('# ')
})

const renderedContent = computed(() => {
  // 先清理輸入的內容
  const sanitizedInput = sanitizers.data.markdownInput(displayContent.value)

  if (!props.supportMarkdown || !hasMarkdown.value) {
    const htmlContent = sanitizedInput.replace(/\n/g, '<br>')
    return sanitizers.html.basic(htmlContent)
  }

  // 簡單的 Markdown 渲染
  const htmlContent = sanitizedInput
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/^# (.+)/gm, '<h3>$1</h3>')
    .replace(/^## (.+)/gm, '<h4>$1</h4>')
    .replace(/\n/g, '<br>')

  // 使用 DOMPurify 清理最終的 HTML
  return sanitizers.html.markdown(htmlContent)
})

// Methods
function getTypeIcon(type: NoteType): string {
  const option = NOTE_TYPE_OPTIONS.find(opt => opt.value === type)
  return option?.icon || '📝'
}

function getTypeLabel(type: NoteType): string {
  return NOTE_TYPE_LABELS[type] || type
}

function getTypeColorClass(type: NoteType): string {
  const colorMap = {
    general: 'bg-gray-100 text-gray-800',
    academic: 'bg-blue-100 text-blue-800',
    behavioral: 'bg-red-100 text-red-800',
    family: 'bg-green-100 text-green-800',
    health: 'bg-yellow-100 text-yellow-800',
    attendance: 'bg-purple-100 text-purple-800'
  }

  return colorMap[type] || colorMap.general
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 1) {
    const minutes = Math.floor(diffInHours * 60)
    return minutes <= 0 ? '剛剛' : `${minutes}分鐘前`
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}小時前`
  } else if (diffInHours < 48) {
    return '昨天'
  } else {
    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric'
    })
  }
}

function formatFullTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function copyContent() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(props.note.note_content)
      .then(() => {
        // 可以加入成功提示
        emit('copy', props.note.note_content)
      })
      .catch(err => {
        console.error('複製失敗:', err)
      })
  }
}

function editNote() {
  emit('edit', props.note)
}

function deleteNote() {
  if (confirm('確定要刪除這筆備註嗎？此操作無法復原。')) {
    emit('delete', props.note)
  }
}
</script>

<style scoped>
.note-card {
  @apply transition-all duration-200;
}

.note-card:hover {
  @apply transform -translate-y-0.5;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.prose {
  @apply text-sm;
}

.prose h3 {
  @apply text-base font-semibold mt-2 mb-1;
}

.prose h4 {
  @apply text-sm font-medium mt-1 mb-1;
}

.prose ul {
  @apply list-disc list-inside my-1;
}

.prose li {
  @apply text-sm;
}

.prose strong {
  @apply font-semibold text-gray-900;
}

.prose em {
  @apply italic text-gray-800;
}
</style>
