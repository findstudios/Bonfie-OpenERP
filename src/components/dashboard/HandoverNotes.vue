<template>
  <div class="flex h-full flex-col">
    <!-- 標題區 -->
    <div class="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
      <div>
        <h3 class="text-xl font-bold text-gray-900">注意事項</h3>
        <p class="mt-1 text-sm text-gray-500">預設顯示 3 天內記錄</p>
      </div>
      <button
        data-testid="add-note-button"
        @click="showAddNote = !showAddNote"
        class="flex items-center text-sm text-blue-600 hover:text-blue-800"
      >
        <PlusIcon class="mr-1 size-4" />
        新增記錄
      </button>
    </div>

    <!-- 搜尋欄 -->
    <div class="mb-3">
      <input
        data-testid="search-input"
        v-model="searchQuery"
        type="text"
        placeholder="搜尋記錄（可搜尋所有歷史記錄）"
        class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <!-- 新增記錄表單 -->
    <div v-if="showAddNote" class="relative mb-3 rounded-lg bg-gray-50 p-4">
      <div class="relative">
        <textarea
          ref="textareaRef"
          data-testid="note-input"
          v-model="newNote.content"
          placeholder="請輸入注意事項...(可以使用 @學生姓名 加入學生資訊)"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          rows="3"
          @input="handleTextareaInput"
          @keydown="handleTextareaKeydown"
        ></textarea>

        <!-- Mention autocomplete dropdown -->
        <div
          v-if="showMentionDropdown"
          class="absolute z-10 mt-1 max-h-48 min-w-64 overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg"
          :style="{ top: '100%', left: '0' }"
        >
          <div
            v-for="(user, index) in mentionSuggestions"
            :key="user.user_id"
            class="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-blue-50"
            :class="{ 'bg-blue-50': index === selectedSuggestionIndex }"
            @click="selectMention(user)"
          >
            <div>
              <div class="text-sm font-medium">{{ user.full_name }}</div>
            </div>
            <div class="text-xs text-gray-400">@{{ user.full_name }}</div>
          </div>
          <div v-if="mentionSuggestions.length === 0" class="px-3 py-2 text-sm text-gray-500">
            找不到匹配的學生
          </div>
        </div>
      </div>

      <div class="mt-2 flex items-center justify-between">
        <!-- 優先級按鈕 -->
        <div class="flex items-center">
          <div class="flex rounded-full bg-gray-100 p-0.5">
            <button
              type="button"
              @click="newNote.priority = 'normal'"
              class="rounded-full px-3 py-1 text-xs font-medium transition-all duration-200"
              :class="newNote.priority === 'normal'
                ? 'bg-white text-gray-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'"
            >
              一般
            </button>
            <button
              type="button"
              @click="newNote.priority = 'urgent'"
              class="rounded-full px-3 py-1 text-xs font-medium transition-all duration-200"
              :class="newNote.priority === 'urgent'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'"
            >
              緊急
            </button>
          </div>
        </div>

        <!-- 操作按鈕 -->
        <div class="flex items-center gap-2">
          <button
            @click="cancelAddNote"
            class="px-4 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
          >
            取消
          </button>
          <button
            data-testid="submit-note-button"
            @click="submitNote"
            class="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow"
          >
            發布
          </button>
        </div>
      </div>
    </div>

    <!-- 記錄列表 -->
    <div class="max-h-[30rem] min-h-[30rem] space-y-2 overflow-y-auto pr-2">
      <div
        v-for="note in filteredNotes"
        :key="note.id"
        :data-testid="`note-item-${note.id}`"
        class="relative overflow-hidden rounded-lg p-4 transition-all"
        :class="getNoteClass(note)"
      >
        <!-- 頭部資訊 -->
        <div class="mb-2 flex items-center gap-3">
          <div class="size-10 shrink-0 overflow-hidden rounded-full">
            <img
              v-if="note.author.avatar_url"
              :src="note.author.avatar_url"
              :alt="note.author.full_name"
              class="size-full object-cover"
            />
            <div
              v-else
              class="flex size-full items-center justify-center"
              :style="{ backgroundColor: getUserColor(note.author.user_id) }"
            >
              <span class="text-sm font-medium text-white">
                {{ note.author.full_name.charAt(0) }}
              </span>
            </div>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900">{{ note.author.full_name }}</span>
              <span v-if="note.priority === 'urgent'" class="text-xs font-medium text-red-600">緊急</span>
            </div>
            <p class="text-xs text-gray-500">{{ formatTime(note.created_at) }}</p>
          </div>
          <!-- 刪除按鈕 -->
          <button
            v-if="canDelete(note)"
            @click="handleDelete(note.id)"
            class="absolute -right-2 -top-1 text-gray-400 transition-colors hover:text-red-600"
            title="刪除此記錄"
          >
            <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 內容 -->
        <div
          class="text-sm leading-relaxed text-gray-700"
          v-html="renderContentWithMentions(note.content)"
          @click="handleContentClick"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
import { handoverNotesService, type UserMention } from '@/services/handoverNotesService'
import { sanitizers } from '@/utils/validation'

interface HandoverNote {
  id: string
  content: string
  author: {
    user_id: string
    full_name: string
    avatar_url?: string
  }
  created_at: string
  priority: 'normal' | 'urgent'
  tags?: string[]
  read_by: string[]
}

interface User {
  user_id: string
  full_name: string
}

const props = defineProps<{
  notes: HandoverNote[]
  currentUser: User
}>()

const emit = defineEmits<{
  'add-note': [note: {
    content: string
    priority: 'normal' | 'urgent'
    tags: string[]
  }]
  'mark-read': [noteId: string]
  'delete-note': [noteId: string]
  'mention-clicked': [studentName: string]
}>()

// 狀態
const showAddNote = ref(false)
const searchQuery = ref('')
const newNote = ref({
  content: '',
  priority: 'normal' as 'normal' | 'urgent'
})

// Mention autocomplete
const showMentionDropdown = ref(false)
const mentionSuggestions = ref<UserMention[]>([])
const currentMentionQuery = ref('')
const cursorPosition = ref(0)
const textareaRef = ref<HTMLTextAreaElement>()
const selectedSuggestionIndex = ref(-1)

// 過濾後的記錄
const filteredNotes = computed(() => {
  let notes = props.notes

  // 如果沒有搜尋，只顯示 3 天內的記錄
  if (!searchQuery.value) {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    notes = notes.filter(note => new Date(note.created_at) >= threeDaysAgo)
  } else {
    // 有搜尋時，搜尋所有記錄
    const query = searchQuery.value.toLowerCase()
    notes = notes.filter(note =>
      note.content.toLowerCase().includes(query) ||
      note.author.full_name.toLowerCase().includes(query) ||
      note.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }

  return notes
})

// 判斷是否已讀
function isRead(note: HandoverNote): boolean {
  return note.read_by.includes(props.currentUser.user_id)
}

// 根據用戶 ID 生成顏色
function getUserColor(userId: string): string {
  const colors = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#8B5CF6', // violet-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#EC4899', // pink-500
    '#6366F1', // indigo-500
    '#14B8A6', // teal-500
  ]

  // 使用 userId 的 hash 來選擇顏色
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

// 獲取記錄樣式
function getNoteClass(note: HandoverNote): string {
  const classes = ['border']

  if (note.priority === 'urgent') {
    classes.push('bg-red-50 border-red-200')
  } else {
    classes.push('bg-gray-50 border-gray-200')
  }

  return classes.join(' ')
}

// 格式化時間
function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()

  // 如果是今天，只顯示時間
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 否則顯示日期和時間
  return date.toLocaleDateString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 提交新記錄
async function submitNote() {
  if (!newNote.value.content.trim()) return

  try {
    // 驗證並提取有效的 @mentions
    const { validMentions, invalidMentions } =
      await handoverNotesService.validateAndExtractMentions(newNote.value.content)

    if (invalidMentions.length > 0) {
      alert(`以下 @mentions 無效（找不到對應學生）：\n${invalidMentions.join(', ')}`)
      return
    }

    emit('add-note', {
      content: newNote.value.content,
      priority: newNote.value.priority,
      tags: validMentions
    })

    // 重置表單
    newNote.value = {
      content: '',
      priority: 'normal'
    }
    showAddNote.value = false
    showMentionDropdown.value = false
  } catch (error) {
    console.error('Error submitting note:', error)
    alert('提交失敗，請稍後再試')
  }
}

// Mention autocomplete functions
async function handleTextareaInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  const text = target.value
  const position = target.selectionStart || 0

  cursorPosition.value = position

  // Check if we're typing after an @
  const beforeCursor = text.substring(0, position)
  const mentionMatch = beforeCursor.match(/@([\u4e00-\u9fa5\w]*)$/)

  if (mentionMatch) {
    const query = mentionMatch[1]
    currentMentionQuery.value = query

    if (query.length >= 0) {
      const suggestions = await handoverNotesService.searchUsersByName(query)
      mentionSuggestions.value = suggestions
      showMentionDropdown.value = suggestions.length > 0
      selectedSuggestionIndex.value = -1
    }
  } else {
    showMentionDropdown.value = false
    mentionSuggestions.value = []
  }
}

function handleTextareaKeydown(event: KeyboardEvent) {
  if (!showMentionDropdown.value) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedSuggestionIndex.value = Math.min(
        selectedSuggestionIndex.value + 1,
        mentionSuggestions.value.length - 1
      )
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedSuggestionIndex.value = Math.max(
        selectedSuggestionIndex.value - 1,
        -1
      )
      break
    case 'Enter':
    case 'Tab':
      if (selectedSuggestionIndex.value >= 0) {
        event.preventDefault()
        selectMention(mentionSuggestions.value[selectedSuggestionIndex.value])
      }
      break
    case 'Escape':
      showMentionDropdown.value = false
      break
  }
}

function selectMention(user: UserMention) {
  const textarea = textareaRef.value
  if (!textarea) return

  const text = newNote.value.content
  const beforeCursor = text.substring(0, cursorPosition.value)
  const afterCursor = text.substring(cursorPosition.value)

  // Find the @ symbol position
  const atIndex = beforeCursor.lastIndexOf('@')
  if (atIndex === -1) return

  // Replace the @query with @fullname
  const newText =
    `${text.substring(0, atIndex)
    }@${user.full_name} ${
      afterCursor}`

  newNote.value.content = newText
  showMentionDropdown.value = false

  // Set cursor position after the mention
  nextTick(() => {
    const newPosition = atIndex + user.full_name.length + 2
    textarea.focus()
    textarea.setSelectionRange(newPosition, newPosition)
  })
}

function getMentionDropdownStyle() {
  const textarea = textareaRef.value
  if (!textarea) return {}

  const rect = textarea.getBoundingClientRect()
  return {
    position: 'absolute',
    top: `${rect.bottom + 5}px`,
    left: `${rect.left}px`,
    zIndex: 1000
  }
}

// 取消新增
function cancelAddNote() {
  newNote.value = {
    content: '',
    priority: 'normal'
  }
  showAddNote.value = false
  showMentionDropdown.value = false
}

// 渲染帶有 @mention 的內容
function renderContentWithMentions(content: string): string {
  // 檢查是否為 JSON 格式的系統通知（調課、停課等）
  try {
    const parsed = JSON.parse(content)
    if (parsed.type && (parsed.type === 'class_rescheduled' || parsed.type === 'class_cancelled')) {
      // 格式化系統通知
      if (parsed.type === 'class_rescheduled') {
        // 獲取聯絡人資訊
        const contactInfo = parsed.contact_info ? `${parsed.contact_info.name} ${parsed.contact_info.phone}` : '聯絡人資訊'

        return `<div class="space-y-2">
          <div class="text-sm">
            <span class="text-indigo-600 font-semibold">調課通知</span>
            <span class="text-gray-700 ml-2">${parsed.student_name}</span>
            <span class="text-gray-500 ml-1">•</span>
            <span class="text-gray-700 ml-1">${parsed.course_name}</span>
          </div>
          <div class="bg-yellow-50 rounded px-2 py-1 inline-block">
            <span class="text-sm text-gray-600">${parsed.original_time}</span>
            <span class="text-indigo-600 font-bold mx-2">→</span>
            <span class="text-sm text-gray-900 font-medium">${parsed.new_date} ${parsed.new_time}</span>
          </div>
          <div class="text-sm text-orange-600 font-medium">
            📞 需通知家長：${contactInfo}
          </div>
        </div>`
      } else if (parsed.type === 'class_cancelled') {
        // 獲取聯絡人資訊
        const contactInfo = parsed.contact_info ? `${parsed.contact_info.name} ${parsed.contact_info.phone}` : '聯絡人資訊'

        return `<div class="space-y-2">
          <div class="text-sm">
            <span class="text-orange-600 font-semibold">停課通知</span>
            <span class="text-gray-700 ml-2">${parsed.student_name}</span>
            <span class="text-gray-500 ml-1">•</span>
            <span class="text-gray-700 ml-1">${parsed.course_name}</span>
          </div>
          <div class="text-sm text-gray-600">
            時間：${parsed.original_time}
          </div>
          <div class="text-sm text-red-600 font-medium">
            📞 需通知家長：${contactInfo}
          </div>
        </div>`
      }
    }
  } catch (e) {
    // 不是 JSON 格式，繼續正常處理
  }

  // 先清理輸入內容
  const sanitizedContent = sanitizers.html.strip(content)

  // 將 @mentions 替換為彩色文字（不使用 onclick 以避免 XSS）
  const htmlContent = sanitizedContent.replace(/@[\u4e00-\u9fa5\w]+/g, (match) => {
    const name = sanitizers.html.strip(match.substring(1)) // 移除 @ 符號並清理
    return `<span class="text-blue-600 font-medium cursor-pointer hover:underline" data-mention="${name}">${match}</span>`
  })

  // 使用基礎 HTML 清理
  return sanitizers.html.basic(htmlContent)
}

// 處理內容點擊事件
function handleContentClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.tagName === 'SPAN' && target.dataset.mention) {
    emit('mention-clicked', target.dataset.mention)
  }
}

// 判斷是否可以刪除
function canDelete(note: HandoverNote): boolean {
  // 只有作者本人可以刪除
  return note.author.user_id === props.currentUser.user_id
}

// 處理刪除
function handleDelete(noteId: string) {
  if (confirm('確定要刪除這條記錄嗎？')) {
    emit('delete-note', noteId)
  }
}
// 處理 mention 點擊
function handleMentionClick(studentId: string) {
  emit('mention-clicked', studentId)
}

// Close dropdown when clicking outside
function handleClickOutside(event: Event) {
  const target = event.target as Element
  if (!target.closest('.relative')) {
    showMentionDropdown.value = false
  }
}

// 設置全局函數供 onclick 使用
if (typeof window !== 'undefined') {
  (window as any).handleMentionClick = handleMentionClick
}

watch(showAddNote, (isVisible) => {
  if (isVisible) {
    document.addEventListener('click', handleClickOutside)
    nextTick(() => {
      textareaRef.value?.focus()
    })
  } else {
    document.removeEventListener('click', handleClickOutside)
    showMentionDropdown.value = false
  }
})
</script>

<style scoped>
/* Styles handled by parent component */
</style>
