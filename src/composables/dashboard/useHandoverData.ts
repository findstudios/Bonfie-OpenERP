import { ref } from 'vue'
import { handoverNotesService } from '@/services/handoverNotesService'
import { studentSearchService } from '@/services/studentSearchService'
import { useAuthStore } from '@/stores/authSupabase'
import { useRouter } from 'vue-router'

export function useHandoverData() {
  const authStore = useAuthStore()
  const router = useRouter()

  // 資料狀態
  const handoverNotes = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 載入交班記錄
  async function loadHandoverNotes() {
    loading.value = true
    error.value = null

    try {
      const notes = await handoverNotesService.getNotes()
      handoverNotes.value = notes
    } catch (err) {
      console.error('載入交班記錄失敗:', err)
      error.value = err instanceof Error ? err.message : '載入失敗'
      handoverNotes.value = []
    } finally {
      loading.value = false
    }
  }

  // 新增交班記錄
  async function handleAddNote(note: { content: string; priority: 'normal' | 'urgent'; tags: string[] }) {
    try {
      if (!authStore.user?.user_id) {
        console.error('No user logged in')
        throw new Error('請先登入')
      }

      const newNote = await handoverNotesService.createNote({
        content: note.content,
        priority: note.priority,
        author_id: authStore.user.user_id,
        tags: note.tags
      })

      handoverNotes.value.unshift(newNote)
    } catch (err) {
      console.error('新增交班記錄失敗:', err)
      error.value = err instanceof Error ? err.message : '新增失敗'
      throw err
    }
  }

  // 標記已讀
  async function handleMarkRead(noteId: string) {
    try {
      const note = handoverNotes.value.find(n => n.id === noteId)
      if (note && authStore.user?.user_id) {
        if (!note.read_by.includes(authStore.user.user_id)) {
          note.read_by.push(authStore.user.user_id)
          await handoverNotesService.markAsRead(noteId, authStore.user.user_id)
        }
      }
    } catch (err) {
      console.error('標記已讀失敗:', err)
      error.value = err instanceof Error ? err.message : '標記失敗'
    }
  }

  // 刪除記錄
  async function handleDeleteNote(noteId: string) {
    try {
      await handoverNotesService.deleteNote(noteId)
      handoverNotes.value = handoverNotes.value.filter(note => note.id !== noteId)
    } catch (err) {
      console.error('刪除記錄失敗:', err)
      error.value = err instanceof Error ? err.message : '刪除失敗'
      throw err
    }
  }

  // 處理提及點擊
  async function handleMentionClicked(studentName: string) {
    try {
      // 使用學生搜尋服務找學生
      const student = await studentSearchService.getStudentByName(studentName)
      if (student) {
        router.push(`/students/${student.student_id}`)
      } else {
        alert(`找不到學生: ${studentName}`)
      }
    } catch (err) {
      console.error('搜尋學生失敗:', err)
      alert('搜尋學生時發生錯誤')
    }
  }

  return {
    // 狀態
    handoverNotes,
    loading,
    error,
    // 方法
    loadHandoverNotes,
    handleAddNote,
    handleMarkRead,
    handleDeleteNote,
    handleMentionClicked
  }
}
