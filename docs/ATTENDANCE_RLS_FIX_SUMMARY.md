# Attendance RLS (Row Level Security) 錯誤修復總結

## 問題描述

Admin 用戶在創建 attendance 記錄時遇到以下錯誤：
- **錯誤代碼**: `42501`
- **錯誤訊息**: `new row violates row-level security policy for table "attendance"`

## 根本原因

1. **缺少 INSERT 政策**: `attendance` 表只有以下兩個 RLS 政策：
   - `staff_view_attendance` - 只允許 ADMIN 和 STAFF 查看 (SELECT)
   - `teacher_manage_own_attendance` - 只允許教師管理自己課程的出席記錄 (ALL)
   
   但沒有明確的政策允許 ADMIN 或 STAFF 創建（INSERT）出席記錄。

2. **marked_by 欄位設置不當**: `AttendanceQuickAction.vue` 中設置 `marked_by` 為字符串 `'current_user'` 而不是實際的用戶 ID。

## 解決方案

### 1. 數據庫層面 - 添加 RLS 政策

創建了 migration 文件：`migrations/20250125_fix_attendance_rls_for_admin_staff.sql`

添加了以下政策：
- `staff_manage_attendance` - 允許 ADMIN 和 STAFF 進行所有操作
- `staff_create_attendance` - 明確允許 ADMIN 和 STAFF 創建記錄
- `staff_update_attendance` - 允許 ADMIN 和 STAFF 更新記錄
- `admin_delete_attendance` - 只允許 ADMIN 刪除記錄

### 2. 應用層面 - 修復 marked_by 設置

修改了 `AttendanceQuickAction.vue`：
- 導入 `useAuthStore` 來獲取當前用戶信息
- 在創建出席記錄時，使用 `authStore.user?.user_id` 作為 `marked_by` 的值
- 添加了錯誤檢查，確保用戶已登入

## 實施步驟

1. **應用數據庫 migration**:
   ```sql
   -- 在 Supabase SQL Editor 中執行
   -- migrations/20250125_fix_attendance_rls_for_admin_staff.sql
   ```

2. **部署應用更新**:
   - `AttendanceQuickAction.vue` 的更改會在下次部署時生效

3. **驗證修復**:
   - 使用 `test_attendance_rls.sql` 中的查詢來驗證 RLS 政策
   - 測試 admin 用戶是否能成功創建出席記錄

## 預防措施

1. **RLS 政策完整性檢查**:
   - 確保每個表都有完整的 CRUD 政策
   - 特別注意 INSERT 政策，不要遺漏

2. **外鍵約束驗證**:
   - 確保所有外鍵欄位都設置正確的值
   - 不要使用佔位符字符串（如 'current_user'）

3. **測試覆蓋**:
   - 為每個角色測試所有 CRUD 操作
   - 確保 RLS 政策符合業務邏輯

## 相關文件

- `/migrations/20250125_fix_attendance_rls_for_admin_staff.sql` - RLS 修復 SQL
- `/src/views/schedule/components/ScheduleDetailModal/AttendanceQuickAction.vue` - 修復的組件
- `/test_attendance_rls.sql` - 測試腳本