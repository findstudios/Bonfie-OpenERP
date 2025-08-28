# 時間格式化工具 (Time Formatters)

本模組提供了一套完整的時間格式化工具函數，專門處理從 Supabase 資料庫返回的時間資料，並正確轉換為台北時區顯示。

## 核心問題解決

### 時區處理問題
- **資料庫儲存**: UTC 時間，格式如 `2025-07-22T16:02:01.453753` (無時區標記)
- **JavaScript 解析問題**: `new Date()` 會將無時區標記的時間當作本地時間解析，造成 8 小時偏移
- **解決方案**: 直接進行字串解析和數學計算，完全繞過 JavaScript 的 Date 時區轉換

### 修復前後對比
```javascript
// 修復前 (錯誤)
"2025-07-22T16:02:01" → 顯示為 "2025/07/22 下午04:02"

// 修復後 (正確)  
"2025-07-22T16:02:01" → 顯示為 "2025/07/23 上午12:02"
```

## 主要函數

### `formatDateTime(dateString: string): string`
**用途**: 將 UTC 時間字串轉換為台北時區的完整日期時間格式

**輸入格式**: 
- `2025-07-22T16:02:01.453753`
- `2025-07-22T16:02:01`

**輸出格式**: `2025/07/23 上午12:02`

**核心邏輯**:
1. 使用正規表達式解析時間字串
2. UTC 時間 + 8 小時 = 台北時間
3. 處理跨日、跨月、跨年邏輯
4. 格式化為中文時間格式 (上午/下午)

```javascript
import { formatDateTime } from '@/utils/formatters'

// 範例使用
const utcTime = "2025-07-22T16:02:01.453753"
const taiwanTime = formatDateTime(utcTime)  // "2025/07/23 上午12:02"
```

### `formatSmartDateTime(dateString: string): string`
**用途**: 智能時間格式化，目前直接調用 `formatDateTime`

**特點**: 統一顯示完整時間格式，不使用相對時間 ("幾小時前")

### `formatRelativeTime(dateString: string): string`
**用途**: 相對時間格式化，目前直接調用 `formatDateTime`

**設計理念**: 為了避免時區混淆，統一使用完整時間格式而非相對時間

### `debugDateTime(dateString: string): string`
**用途**: 調試專用，顯示時間解析的詳細資訊

**輸出範例**:
```
原始: 2025-07-22T16:02:01.453753
UTC解析: Tue Jul 22 2025 16:02:01 GMT+0800
解析為ISO: 2025-07-22T08:02:01.453Z
台北時間: 2025/7/22 下午4:02:01
現在本地: Wed Jul 23 2025 00:07:09 GMT+0800
時差(小時): 8.085530833333333
```

## 使用範例

### 在 Vue 組件中使用
```vue
<template>
  <div>
    <span>創建時間: {{ formatDateTime(note.created_at) }}</span>
    <span>更新時間: {{ formatSmartDateTime(note.updated_at) }}</span>
  </div>
</template>

<script setup>
import { formatDateTime, formatSmartDateTime } from '@/utils/formatters'
</script>
```

### 在服務層使用
```javascript
import { formatDateTime } from '@/utils/formatters'

// 處理從 Supabase 返回的資料
const notes = await db.findMany('student_notes_history')
const formattedNotes = notes.map(note => ({
  ...note,
  displayTime: formatDateTime(note.created_at)
}))
```

## 技術細節

### 時間轉換邏輯
```javascript
// 核心轉換邏輯
let taipeiHour = parseInt(hour) + 8  // UTC + 8 = 台北時間
let taipeiDay = parseInt(day)

// 處理跨日
if (taipeiHour >= 24) {
  taipeiHour -= 24
  taipeiDay += 1
  // ... 處理跨月跨年
}

// 12小時制轉換
const period = taipeiHour < 12 ? '上午' : '下午'
const displayHour = taipeiHour === 0 ? 12 : taipeiHour > 12 ? taipeiHour - 12 : taipeiHour
```

### 跨日處理
- **UTC 16:00** → **台北時間 00:00** (隔日上午12點)
- **UTC 23:59** → **台北時間 07:59** (隔日上午7點59分)

### 月份處理
使用 JavaScript 原生方法獲取每月天數：
```javascript
const daysInMonth = new Date(taipeiYear, taipeiMonth, 0).getDate()
```

## 相關檔案位置

- **主要工具**: `src/utils/formatters.ts`
- **使用範例**: `src/components/notes/SimpleNotesHistory.vue`
- **型別定義**: `src/types/` 

## 注意事項

1. **不要使用 JavaScript Date 直接解析無時區標記的時間字串**
2. **所有顯示時間的地方都應該使用這套工具函數**
3. **調試時使用 `debugDateTime` 確認時間轉換是否正確**
4. **如果需要其他時區，修改 `+8` 的偏移量**

## 測試建議

```javascript
// 測試用例
console.log(formatDateTime("2025-07-22T16:02:01"))  // 應顯示: 2025/07/23 上午12:02
console.log(formatDateTime("2025-07-22T08:00:00"))  // 應顯示: 2025/07/22 下午04:00
console.log(formatDateTime("2025-07-22T23:30:00"))  // 應顯示: 2025/07/23 上午07:30
```

## 未來改進

- [ ] 支援其他時區配置
- [ ] 支援夏令時間處理
- [ ] 增加更多時間格式選項
- [ ] 效能最佳化 (快取常用轉換)