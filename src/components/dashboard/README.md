# HandoverNotes 組件使用說明

## 功能概述

HandoverNotes 組件提供交班記錄功能，支援：
- 新增交班記錄
- @mention 功能（提及特定用戶）
- 搜尋記錄
- 標記已讀/未讀
- 優先級設定（一般/緊急）

## @mention 功能

### 特性
1. **自動補全**：輸入 `@` 後會顯示用戶列表供選擇
2. **資料庫驗證**：只有存在於 `users` 表中的用戶才會被認為是有效的 mention
3. **中文姓名支援**：支援中文姓名的 mention，例如 `@陳老師`、`@林美華`
4. **角色顯示**：自動補全時會顯示用戶的角色（教師、職員等）

### 使用方式

1. **輸入**：在記錄內容中輸入 `@` 符號
2. **選擇**：從自動補全列表中選擇用戶，或繼續輸入用戶姓名
3. **驗證**：提交時系統會驗證所有 @mentions 是否對應到真實用戶
4. **錯誤處理**：如果提及了不存在的用戶，會顯示錯誤訊息

### 範例

```
請 @陳老師 注意明天的課程調整，@林老師 也需要知道這個變更。
```

上述內容會：
- 提取 `@陳老師` 和 `@林老師` 兩個 mentions
- 驗證這兩個用戶是否存在於資料庫
- 如果存在，將其標記為藍色標籤
- 如果不存在，顯示錯誤並阻止提交

## 技術實現

### 服務層 (handoverNotesService.ts)
- `validateAndExtractMentions()`: 驗證並提取有效的 mentions
- `searchUsersByName()`: 根據姓名搜尋用戶（用於自動補全）
- `getAvailableMentions()`: 獲取所有可提及的用戶
- 快取機制：避免重複查詢相同用戶

### 組件層 (HandoverNotes.vue)
- 自動補全下拉選單
- 鍵盤導航支援（上下箭頭、Enter、Tab、Escape）
- 即時輸入驗證
- 標籤顏色區分（@mentions 藍色，一般標籤灰色）

### 資料結構

```typescript
interface HandoverNote {
  id: string
  content: string
  author: { user_id: string; full_name: string }
  created_at: string
  priority: 'normal' | 'urgent'
  tags: string[]              // 包含 @mentions 和其他標籤
  mentioned_users: string[]   // 被提及用戶的 user_id 陣列
  read_by: string[]          // 已讀用戶的 user_id 陣列
  is_active: boolean
}
```

## 資料庫需求

確保以下資料表包含正確的用戶資料：
- `users`: 包含 `user_id`, `full_name`, `status`, `role_id`
- `roles`: 包含角色資訊，用於顯示用戶職務

## 使用場景

1. **班級管理**：`明天 @王老師 的數學課改到教室 B`
2. **設備通知**：`@張老師 請檢查投影機是否正常`  
3. **緊急事項**：`@所有老師 明天停電，請準備備用教具`

## 注意事項

- 只有 `status = 'active'` 的用戶才能被提及
- @mention 功能支援中英文姓名
- 系統會快取用戶查詢結果以提升效能
- 無效的 @mention 會在提交時被阻止並顯示錯誤訊息