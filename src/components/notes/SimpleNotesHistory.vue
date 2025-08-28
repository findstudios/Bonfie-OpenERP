<template>
  <div class="notes-history">
    <!-- 標題和排序 -->
    <div class="mb-6 flex items-center justify-between border-b border-gray-200 pb-3">
      <h4 class="text-lg font-medium text-gray-900">學生備註</h4>

      <div class="flex items-center space-x-4">
        <label class="text-sm font-medium text-gray-600">排序：</label>
        <select
          v-model="sortOrder"
          class="h-11 min-w-[120px] rounded-md border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          @change="sortNotes"
        >
          <option value="desc">最新在前</option>
          <option value="asc">最舊在前</option>
        </select>
      </div>
    </div>

    <!-- 備註卡片網格 -->
    <div class="mb-6">
      <div v-if="loading" class="py-8 text-center">
        <div class="mx-auto size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p class="mt-2 text-sm text-gray-600">載入備註...</p>
      </div>

      <div v-else-if="sortedNotes.length === 0" class="py-8 text-center text-gray-500">
        <p>尚無備註記錄</p>
        <p class="mt-1 text-sm">請在下方新增第一則備註</p>
      </div>

      <div v-else class="notes-grid">
        <div
          v-for="note in sortedNotes"
          :key="note.id"
          @click="openNoteModal(note)"
          class="note-card group relative cursor-pointer rounded-lg border border-gray-200 bg-white p-3 transition-all duration-200 hover:border-blue-300 hover:shadow-md"
        >
          <!-- 重要標記 -->
          <div
            v-if="note.is_important"
            class="absolute right-2 top-2 size-2 rounded-full bg-red-500"
            title="重要備註"
          ></div>

          <!-- 內容預覽 -->
          <div class="note-content">
            <div class="mb-2 line-clamp-3 text-xs text-gray-900">
              {{ note.content }}
            </div>
          </div>

          <!-- 底部資訊 -->
          <div class="mt-auto">
            <div class="mb-1 truncate text-xs text-gray-500">
              {{ formatSmartDateTime(note.created_at) }}
            </div>
            <div class="truncate text-xs text-gray-600">
              {{ note.created_by_name }}
            </div>
          </div>

          <!-- 刪除按鈕 -->
          <button
            @click.stop="confirmDelete(note.id)"
            class="absolute bottom-2 right-2 flex size-6 items-center justify-center rounded-full text-gray-400 opacity-0 transition-all duration-200 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
            title="刪除備註"
          >
            <TrashIcon class="size-3" />
          </button>
        </div>
      </div>
    </div>

    <!-- 新增備註表單 -->
    <div class="rounded-lg bg-gray-50 p-4">
      <div class="space-y-4">
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700">新增備註</label>
          <textarea
            v-model="newNote.content"
            rows="3"
            placeholder="輸入備註內容..."
            class="w-full rounded-md border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div class="flex items-center justify-between">
          <label class="flex items-center">
            <input
              v-model="newNote.isImportant"
              type="checkbox"
              class="size-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span class="ml-2 text-sm text-gray-700">重要備註</span>
          </label>

          <button
            @click="saveNote"
            :disabled="!newNote.content.trim() || saving"
            class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span v-if="saving" class="mr-2">
              <svg class="size-4 animate-spin" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            儲存備註
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 備註詳情彈窗 -->
  <div
    v-if="selectedNote"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    @click="closeNoteModal"
  >
    <div
      class="modal-content max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white"
      @click.stop
    >
      <div class="p-6">
        <!-- 標題列 -->
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <h3 class="text-lg font-medium text-gray-900">備註詳情</h3>
            <span
              v-if="selectedNote.is_important"
              class="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800"
            >
              <ExclamationTriangleIcon class="mr-1 size-3" />
              重要
            </span>
          </div>
          <button
            @click="closeNoteModal"
            class="p-2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon class="size-5" />
          </button>
        </div>

        <!-- 備註內容 -->
        <div class="mb-4">
          <div class="whitespace-pre-wrap text-sm leading-relaxed text-gray-900">
            {{ selectedNote.content }}
          </div>
        </div>

        <!-- 底部資訊 -->
        <div class="border-t border-gray-200 pt-4">
          <div class="flex items-center justify-between text-sm text-gray-500">
            <div>
              建立時間：{{ formatSmartDateTime(selectedNote.created_at) }}
            </div>
            <div>
              建立者：{{ selectedNote.created_by_name }}
            </div>
          </div>
        </div>

        <!-- 操作按鈕 -->
        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="confirmDelete(selectedNote.id)"
            class="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <TrashIcon class="mr-2 size-4" />
            刪除備註
          </button>
          <button
            @click="closeNoteModal"
            class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authSupabase'
import { db, supabase } from '@/services/supabase'
import { ExclamationTriangleIcon, TrashIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { formatDateTime, formatRelativeTime, formatSmartDateTime, debugDateTime } from '@/utils/formatters'

interface Note {
  id: number
  student_id: string
  content: string
  is_important: boolean
  created_at: string
  created_by: string
  created_by_name: string
}

interface Props {
  studentId: string
}

const props = defineProps<Props>()
const authStore = useAuthStore()

// 狀態
const notes = ref<Note[]>([])
const loading = ref(true)
const saving = ref(false)
const sortOrder = ref<'asc' | 'desc'>('desc')
const selectedNote = ref<Note | null>(null)

// 新備註表單
const newNote = ref({
  content: '',
  isImportant: false
})

// 計算屬性
const sortedNotes = computed(() => {
  const sorted = [...notes.value]
  return sorted.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return sortOrder.value === 'desc' ? dateB - dateA : dateA - dateB
  })
})

// 載入備註
async function loadNotes() {
  try {
    loading.value = true

    const result = await db.findMany('student_notes_history', {
      columns: `
        id,
        student_id,
        note_content,
        note_type,
        created_at,
        created_by
      `,
      filters: { student_id: props.studentId },
      orderBy: 'created_at',
      ascending: false
    })

    // 獲取所有唯一的 created_by 用戶 ID
    const userIds = [...new Set(result.map(note => note.created_by).filter(Boolean))]

    // 批量查詢用戶資訊
    let userMap = {}
    if (userIds.length > 0) {
      try {
        // 使用 supabase 直接查詢，避免 db.findMany 的語法問題
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('user_id, full_name')
          .in('user_id', userIds)

        if (userError) throw userError

        userMap = users.reduce((acc, user) => {
          acc[user.user_id] = user.full_name
          return acc
        }, {})
      } catch (err) {
        console.warn('無法載入用戶資訊:', err)
      }
    }

    notes.value = result.map(note => ({
      ...note,
      content: note.note_content, // 映射欄位名
      is_important: note.note_type === 'important', // 根據 note_type 判斷是否重要
      created_by_name: userMap[note.created_by] || '未知用戶'
    }))
  } catch (error) {
    console.error('載入備註失敗:', error)
  } finally {
    loading.value = false
  }
}

// 儲存備註
async function saveNote() {
  if (!newNote.value.content.trim()) return

  try {
    saving.value = true

    const noteData = {
      student_id: props.studentId,
      note_content: newNote.value.content.trim(),
      note_type: newNote.value.isImportant ? 'important' : 'general',
      created_by: authStore.user?.user_id
    }

    await db.create('student_notes_history', noteData)

    // 重新載入備註
    await loadNotes()

    // 清空表單
    newNote.value = {
      content: '',
      isImportant: false
    }
  } catch (error) {
    console.error('儲存備註失敗:', error)
    alert('儲存失敗，請重試')
  } finally {
    saving.value = false
  }
}


// 確認刪除備註
function confirmDelete(noteId: number) {
  if (confirm('確定要刪除這則備註嗎？此操作無法復原。')) {
    deleteNote(noteId)
  }
}

// 刪除備註
async function deleteNote(noteId: number) {
  try {
    await db.delete('student_notes_history', noteId)
    await loadNotes()
  } catch (error) {
    console.error('刪除備註失敗:', error)
    alert('刪除失敗，請重試')
  }
}

// 排序
function sortNotes() {
  // 觸發重新計算 sortedNotes
}

// 開啟備註詳情彈窗
function openNoteModal(note: Note) {
  selectedNote.value = note
}

// 關閉備註詳情彈窗
function closeNoteModal() {
  selectedNote.value = null
}

// 組件掛載時載入資料
onMounted(() => {
  loadNotes()
})
</script>

<style scoped>
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

/* 自適應網格佈局 */
.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  width: 100%;
}

/* 備註卡片樣式 */
.note-card {
  height: 110px;
  display: flex;
  flex-direction: column;
  width: 100%; /* 填滿網格單元格 */
}

.note-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 文字截斷樣式 */
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

/* 響應式調整 */
@media (max-width: 768px) {
  .notes-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 0.75rem;
  }

  .note-card {
    height: 100px;
  }
}

@media (max-width: 480px) {
  .notes-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.5rem;
  }

  .note-card {
    height: 90px;
  }
}

/* 模態框樣式調整 */
.modal-content {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
</style>
