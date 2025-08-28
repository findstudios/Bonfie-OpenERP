# 📝 學生備註歷史管理組件

這個模組提供完整的學生備註管理功能，包含備註編輯、歷史記錄查看和時間軸顯示功能。

## 📦 組件結構

```
src/components/notes/
├── README.md                    # 📖 本文檔
├── StudentNotesManager.vue      # 🎛️ 學生備註管理主組件
├── NotesHistory.vue            # 📜 備註歷史時間軸組件  
├── NotesEditor.vue             # ✏️ 備註編輯器組件
├── types.ts                    # 📄 備註相關類型定義
└── notesService.ts             # 🛠️ 備註 API 服務
```

## 🎯 功能特色

### ✨ 智能備註管理系統
- 📝 **即時編輯**: 支援 Markdown 格式的備註編輯
- 💾 **自動儲存**: 可設定自動儲存延遲時間
- 🔍 **全文搜尋**: 快速搜尋歷史備註內容
- 🏷️ **類型分類**: 支援學業、行為、家庭、健康等分類

### 📚 完整歷史追蹤
- ⏰ **時間軸顯示**: 清楚的時間順序排列
- 👤 **操作記錄**: 記錄誰在什麼時候做了什麼變更
- 🎨 **視覺差異**: 高亮顯示備註變更內容
- 📊 **統計分析**: 備註數量、類型分布統計

### 🛡️ 資料安全保護
- 🔒 **永久保存**: 歷史記錄永不刪除
- 📋 **版本控制**: 每次變更都有完整記錄
- 👥 **權限控制**: 不同角色有不同的查看權限
- 🔐 **敏感資訊**: 支援標記敏感備註

## 🚀 快速開始

### 在學生編輯頁面使用

```vue
<template>
  <!-- 學生基本資料表單... -->
  
  <!-- 備註管理組件 -->
  <div class="card p-6">
    <StudentNotesManager
      :student-id="studentId"
      :current-notes="form.notes"
      :readonly="false"
      @notes-updated="form.notes = $event"
      @save-success="handleNotesSaveSuccess"
      @save-error="handleNotesSaveError"
    />
  </div>
</template>

<script setup>
import StudentNotesManager from '@/components/notes/StudentNotesManager.vue'

const studentId = 'S0001'
const form = reactive({ notes: '' })

function handleNotesSaveSuccess(result) {
  console.log('備註儲存成功:', result)
}

function handleNotesSaveError(error) {
  console.error('備註儲存失敗:', error)
}
</script>
```

### 在學生詳情頁面使用

```vue
<template>
  <!-- 學生資料顯示... -->
  
  <!-- 備註歷史查看 -->
  <div class="card p-6">
    <NotesHistory
      :student-id="studentId"
      :show-editor="canEdit"
      :filter-types="['academic', 'behavioral']"
      @note-added="refreshStudentData"
    />
  </div>
</template>

<script setup>
import NotesHistory from '@/components/notes/NotesHistory.vue'
</script>
```

### 直接使用服務

```typescript
import { notesService } from '@/components/notes/notesService'

// 獲取學生備註歷史
const history = await notesService.getStudentNotesHistory('S0001')

// 新增備註
await notesService.addStudentNote('S0001', {
  content: '今日表現優良，數學進步明顯',
  type: 'academic',
  isImportant: true
})

// 搜尋備註
const results = await notesService.searchNotes('S0001', '數學', {
  types: ['academic'],
  dateRange: { start: '2024-01-01', end: '2024-12-31' }
})
```

## 📝 組件 API

### StudentNotesManager.vue

#### Props
| 參數 | 類型 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| `studentId` | `string` | ✅ | - | 學生 ID |
| `currentNotes` | `string` | ❌ | `''` | 目前的備註內容 |
| `readonly` | `boolean` | ❌ | `false` | 是否為唯讀模式 |
| `autoSave` | `boolean` | ❌ | `true` | 是否開啟自動儲存 |
| `autoSaveDelay` | `number` | ❌ | `3000` | 自動儲存延遲(毫秒) |
| `showHistory` | `boolean` | ❌ | `true` | 是否顯示歷史記錄 |
| `maxHistoryItems` | `number` | ❌ | `50` | 最大顯示歷史項目數 |

#### Events
| 事件名 | 參數 | 說明 |
|--------|------|------|
| `notes-updated` | `string` | 備註內容更新時觸發 |
| `save-success` | `NoteSaveResult` | 儲存成功時觸發 |
| `save-error` | `Error` | 儲存失敗時觸發 |
| `history-loaded` | `StudentNoteHistory[]` | 歷史記錄載入時觸發 |

### NotesHistory.vue

#### Props
| 參數 | 類型 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| `studentId` | `string` | ✅ | - | 學生 ID |
| `showEditor` | `boolean` | ❌ | `false` | 是否顯示編輯器 |
| `filterTypes` | `NoteType[]` | ❌ | `[]` | 篩選的備註類型 |
| `maxItems` | `number` | ❌ | `100` | 最大顯示項目數 |
| `groupByDate` | `boolean` | ❌ | `true` | 是否按日期分組 |

#### Events
| 事件名 | 參數 | 說明 |
|--------|------|------|
| `note-added` | `StudentNoteHistory` | 新增備註時觸發 |
| `filter-changed` | `NotesFilter` | 篩選條件變更時觸發 |

### NotesEditor.vue

#### Props
| 參數 | 類型 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| `studentId` | `string` | ✅ | - | 學生 ID |
| `placeholder` | `string` | ❌ | `'輸入備註...'` | 輸入框提示文字 |
| `supportMarkdown` | `boolean` | ❌ | `true` | 是否支援 Markdown |
| `showTypeSelector` | `boolean` | ❌ | `true` | 是否顯示類型選擇器 |
| `autoFocus` | `boolean` | ❌ | `false` | 是否自動聚焦 |

## 🔧 服務 API

### notesService

```typescript
// 獲取學生備註歷史
getStudentNotesHistory(studentId: string, options?: NotesQueryOptions): Promise<StudentNoteHistory[]>

// 新增學生備註
addStudentNote(studentId: string, noteData: CreateNoteData): Promise<StudentNoteHistory>

// 更新學生當前備註(觸發歷史記錄)
updateStudentCurrentNotes(studentId: string, newNotes: string, userId?: string): Promise<void>

// 搜尋備註內容
searchNotes(studentId: string, keyword: string, options?: SearchOptions): Promise<StudentNoteHistory[]>

// 獲取備註統計
getNotesStatistics(studentId: string, dateRange?: DateRange): Promise<NotesStatistics>

// 匯出備註歷史
exportNotesHistory(studentId: string, format: 'pdf' | 'excel' | 'csv'): Promise<Blob>
```

## 📄 資料類型

### StudentNoteHistory
```typescript
interface StudentNoteHistory {
  id: number                    // 歷史記錄 ID
  student_id: string           // 學生 ID
  note_content: string         // 備註內容
  note_type: NoteType          // 備註類型
  is_important: boolean        // 是否重要
  created_by: string          // 建立者 ID
  created_at: string          // 建立時間
  created_by_name?: string    // 建立者姓名 (join 查詢)
}
```

### CreateNoteData
```typescript
interface CreateNoteData {
  content: string             // 備註內容
  type?: NoteType            // 備註類型
  isImportant?: boolean      // 是否重要
}
```

### NotesQueryOptions
```typescript
interface NotesQueryOptions {
  limit?: number             // 限制筆數
  offset?: number           // 偏移量
  types?: NoteType[]        // 篩選類型
  dateRange?: DateRange     // 日期範圍
  includeCreator?: boolean  // 是否包含建立者資訊
  orderBy?: 'created_at' | 'note_type' | 'is_important'
  orderDirection?: 'asc' | 'desc'
}
```

### NoteType
```typescript
type NoteType = 'general' | 'academic' | 'behavioral' | 'family' | 'health' | 'attendance'
```

## 🎨 使用案例

### 1. 學生編輯頁面整合

```vue
<!-- StudentFormView.vue -->
<template>
  <form @submit.prevent="saveStudent">
    <!-- 基本資料... -->
    
    <!-- 備註管理 -->
    <div class="card p-6">
      <StudentNotesManager
        :student-id="route.params.id"
        :current-notes="form.notes"
        :readonly="loading"
        @notes-updated="form.notes = $event"
      />
    </div>
    
    <!-- 表單按鈕... -->
  </form>
</template>
```

### 2. 學生詳情頁面查看

```vue
<!-- StudentDetailView.vue -->
<template>
  <div class="student-detail">
    <!-- 學生資訊... -->
    
    <!-- 備註歷史 -->
    <div class="card p-6">
      <h3 class="text-lg font-semibold mb-4">備註歷史</h3>
      <NotesHistory
        :student-id="student.student_id"
        :show-editor="canEdit"
        @note-added="refreshStudent"
      />
    </div>
  </div>
</template>
```

### 3. 教師端快速記錄

```vue
<!-- TeacherNotesQuickAdd.vue -->
<template>
  <div class="quick-notes">
    <h4>快速記錄</h4>
    <NotesEditor
      :student-id="selectedStudentId"
      :auto-focus="true"
      :show-type-selector="true"
      placeholder="記錄今日上課狀況..."
      @note-saved="handleNoteSaved"
    />
  </div>
</template>
```

## 🎭 視覺設計

### 備註類型顏色配置
```css
.note-type-general { @apply bg-gray-100 text-gray-800; }
.note-type-academic { @apply bg-blue-100 text-blue-800; }
.note-type-behavioral { @apply bg-red-100 text-red-800; }
.note-type-family { @apply bg-green-100 text-green-800; }
.note-type-health { @apply bg-yellow-100 text-yellow-800; }
.note-type-attendance { @apply bg-purple-100 text-purple-800; }
```

### 時間軸樣式
```css
.timeline-item {
  @apply relative pl-6 pb-8;
}
.timeline-item::before {
  @apply absolute left-0 top-2 w-3 h-3 bg-blue-600 rounded-full;
}
.timeline-item::after {
  @apply absolute left-1.5 top-5 w-0.5 h-full bg-gray-300;
}
```

## 📊 資料庫整合

### 已創建的表結構
```sql
CREATE TABLE student_notes_history (
  id BIGSERIAL PRIMARY KEY,
  student_id VARCHAR REFERENCES students(student_id),
  note_content TEXT NOT NULL,
  note_type VARCHAR DEFAULT 'general',
  created_by VARCHAR REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 建議的擴展欄位
```sql
-- 建議加入的欄位
ALTER TABLE student_notes_history 
ADD COLUMN is_important BOOLEAN DEFAULT FALSE,
ADD COLUMN is_sensitive BOOLEAN DEFAULT FALSE,
ADD COLUMN tags JSONB,
ADD COLUMN metadata JSONB;

-- 建立索引提升查詢效能
CREATE INDEX idx_student_notes_history_student_id ON student_notes_history(student_id);
CREATE INDEX idx_student_notes_history_created_at ON student_notes_history(created_at);
CREATE INDEX idx_student_notes_history_note_type ON student_notes_history(note_type);
CREATE INDEX idx_student_notes_history_search ON student_notes_history 
USING gin(to_tsvector('chinese', note_content));
```

## ⚠️ 重要注意事項

### 🔒 資料安全
- 歷史記錄永不刪除，確保資料完整性
- 敏感備註需要特殊權限才能查看
- 所有操作都有完整的審計記錄

### 📏 權限控制
```typescript
// 權限檢查範例
const canViewNotes = checkPermission(user, 'student:notes:view')
const canEditNotes = checkPermission(user, 'student:notes:edit')
const canViewSensitive = checkPermission(user, 'student:notes:sensitive')
```

### 🎭 使用者體驗
- 自動儲存功能避免資料遺失
- Markdown 支援讓備註更豐富
- 搜尋功能快速找到相關記錄

## 🔄 版本歷史

### v1.0.0 (目前版本)
- ✅ 基礎備註歷史記錄功能
- ✅ 時間軸顯示介面
- ✅ 自動觸發器記錄變更
- ✅ 完整的 TypeScript 支援

### 🚧 規劃中功能
- 📱 行動版優化介面
- 🤖 AI 備註內容建議
- 📊 備註統計和分析
- 🔔 重要備註提醒功能
- 📤 備註匯出和列印

---

**💡 提示**: 使用這個組件前，請確保你的資料庫已經建立了 `student_notes_history` 表和相關的觸發器。如果有任何問題，請查看組件實作檔案中的詳細說明。