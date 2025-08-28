# 出席功能 RLS 測試指南

## 測試前準備
1. 確保已執行 RLS 修正 SQL：
   ```sql
   -- migrations/20250125_fix_attendance_rls_for_admin_staff.sql
   ```

2. 確保測試帳號存在且有正確的 auth_user_id

## 測試案例

### 1. 正常權限測試（ADMIN/STAFF）
**步驟：**
1. 使用 admin@vibe-erp.com 登入（密碼：Test123!）
2. 進入「課程點名」頁面
3. 選擇日期和課程
4. 標記學生出席狀態
5. 點擊「提交點名」

**預期結果：**
- ✅ 點名記錄成功創建
- ✅ 顯示「點名記錄提交成功」
- ✅ 自動跳轉到出席列表頁面

### 2. 權限不足測試（TEACHER）
**步驟：**
1. 使用 teacher1@vibe-erp.com 登入（密碼：Test123!）
2. 進入「課程點名」頁面
3. 選擇**非自己教授**的課程
4. 嘗試提交點名

**預期結果：**
- ❌ 點名失敗
- ✅ 顯示「您沒有權限執行此操作。請確認您的角色權限是否正確。」
- ✅ 不會重試其他 user_id

### 3. 未登入測試
**步驟：**
1. 清除瀏覽器 session
2. 直接訪問 /attendance/take 頁面
3. 嘗試提交點名

**預期結果：**
- ✅ 顯示「用戶資料錯誤，請重新登入」
- ✅ 自動跳轉到登入頁面

### 4. 資料完整性測試
**步驟：**
1. 使用 admin 登入
2. 提交點名時檢查 Network 面板

**檢查項目：**
- attendance 表的 marked_by 欄位應該是當前用戶的 user_id
- 不應該看到多次重試的請求
- 錯誤訊息應該清楚明確

## 測試後確認
1. 查詢資料庫確認 marked_by 正確：
   ```sql
   SELECT 
     a.id,
     a.student_id,
     a.marked_by,
     u.full_name as marked_by_name
   FROM attendance a
   JOIN users u ON a.marked_by = u.user_id
   ORDER BY a.created_at DESC
   LIMIT 10;
   ```

2. 確認沒有 'UNKNOWN_USER' 或其他備用 user_id