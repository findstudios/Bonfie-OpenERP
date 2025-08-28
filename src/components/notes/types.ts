/**
 * 學生備註歷史相關類型定義
 */

// 備註類型
export type NoteType = 'general' | 'academic' | 'behavioral' | 'family' | 'health' | 'attendance'

// 學生備註歷史記錄
export interface StudentNoteHistory {
  id: number
  student_id: string
  note_content: string
  note_type: NoteType
  is_important?: boolean
  is_sensitive?: boolean
  tags?: string[]
  metadata?: Record<string, any>
  created_by: string
  created_at: string
  created_by_name?: string  // Join 查詢時包含
}

// 創建備註資料
export interface CreateNoteData {
  content: string
  type?: NoteType
  isImportant?: boolean
  isSensitive?: boolean
  tags?: string[]
}

// 備註查詢選項
export interface NotesQueryOptions {
  limit?: number
  offset?: number
  types?: NoteType[]
  dateRange?: DateRange
  includeCreator?: boolean
  onlyImportant?: boolean
  excludeSensitive?: boolean
  orderBy?: 'created_at' | 'note_type' | 'is_important'
  orderDirection?: 'asc' | 'desc'
}

// 日期範圍
export interface DateRange {
  start: string  // YYYY-MM-DD
  end: string    // YYYY-MM-DD
}

// 搜尋選項
export interface SearchOptions {
  types?: NoteType[]
  dateRange?: DateRange
  onlyImportant?: boolean
  caseSensitive?: boolean
}

// 備註統計
export interface NotesStatistics {
  total: number
  byType: Record<NoteType, number>
  importantCount: number
  recentCount: number  // 最近7天
  monthlyCount: Record<string, number>  // 每月數量
}

// 備註儲存結果
export interface NoteSaveResult {
  success: boolean
  noteId?: number
  error?: string
}

// 備註篩選器
export interface NotesFilter {
  types: NoteType[]
  dateRange?: DateRange
  showImportantOnly: boolean
  searchKeyword?: string
}

// 備註顯示模式
export type NotesDisplayMode = 'timeline' | 'list' | 'cards'

// 組件狀態
export interface NotesComponentState {
  loading: boolean
  saving: boolean
  error?: string
  isDirty: boolean
}

// 備註編輯器設定
export interface NotesEditorConfig {
  placeholder: string
  supportMarkdown: boolean
  showTypeSelector: boolean
  showImportantToggle: boolean
  showSensitiveToggle: boolean
  autoSave: boolean
  autoSaveDelay: number
  maxLength: number
}

// 事件定義
export interface NotesUIEvents {
  'note-added': StudentNoteHistory
  'note-updated': StudentNoteHistory
  'notes-loaded': StudentNoteHistory[]
  'filter-changed': NotesFilter
  'search-performed': { keyword: string; results: StudentNoteHistory[] }
  'export-requested': { format: 'pdf' | 'excel' | 'csv'; data: StudentNoteHistory[] }
}

// 備註類型選項
export const NOTE_TYPE_OPTIONS: Array<{
  value: NoteType
  label: string
  icon: string
  color: string
}> = [
  { value: 'general', label: '一般', icon: '📝', color: 'gray' },
  { value: 'academic', label: '學業', icon: '📚', color: 'blue' },
  { value: 'behavioral', label: '行為', icon: '🎯', color: 'red' },
  { value: 'family', label: '家庭', icon: '👨‍👩‍👧‍👦', color: 'green' },
  { value: 'health', label: '健康', icon: '🏥', color: 'yellow' },
  { value: 'attendance', label: '出席', icon: '📅', color: 'purple' }
]

// 備註類型標籤
export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  general: '一般',
  academic: '學業',
  behavioral: '行為',
  family: '家庭',
  health: '健康',
  attendance: '出席'
}

// 預設設定
export const DEFAULT_NOTES_EDITOR_CONFIG: NotesEditorConfig = {
  placeholder: '輸入備註...',
  supportMarkdown: true,
  showTypeSelector: true,
  showImportantToggle: true,
  showSensitiveToggle: false,
  autoSave: true,
  autoSaveDelay: 3000,
  maxLength: 2000
}

export const DEFAULT_NOTES_QUERY_OPTIONS: NotesQueryOptions = {
  limit: 50,
  offset: 0,
  includeCreator: true,
  excludeSensitive: true,
  orderBy: 'created_at',
  orderDirection: 'desc'
}
