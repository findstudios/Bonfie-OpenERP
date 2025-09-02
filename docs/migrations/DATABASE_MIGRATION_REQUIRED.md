# 資料庫遷移需求

## 問題描述
日期：2025-01-25

在學生詳情頁面（/students/11）中，備註歷史功能無法正常運作，出現以下錯誤：
- 錯誤代碼：404 (Not Found)
- 錯誤訊息：`relation "public.student_notes_history" does not exist`

## 原因分析
`student_notes_history` 表在程式碼中被引用，但實際上不存在於資料庫中。這個表是用來儲存學生備註的歷史記錄，支援：
- 追蹤每個備註的創建時間
- 記錄誰創建了備註
- 保留完整的備註歷史，而不是只有最新的備註

## 解決方案
需要執行 SQL 遷移腳本來創建缺失的表。

### 執行步驟
1. 使用具有資料庫管理員權限的帳號連接到 Supabase 資料庫
2. 執行 `migrations/003_create_student_notes_history.sql` 中的 SQL 語句

### SQL 腳本位置
```
migrations/003_create_student_notes_history.sql
```

### 預期結果
執行後將創建：
- `student_notes_history` 表
- 相關的序列、索引和外鍵約束
- RLS 政策以確保資料安全

## 臨時解決方案
在等待資料庫遷移期間，備註功能將無法使用。建議：
1. 通知用戶備註功能暫時無法使用
2. 或修改程式碼使用 `students.notes` 欄位（但會失去歷史記錄功能）

## 聯絡資訊
如需協助執行此遷移，請聯繫：
- 資料庫管理員
- 或在 Supabase Dashboard 中執行 SQL