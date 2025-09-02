# RLS 政策衝突修復指南

## 問題診斷

### 1. 認證機制不一致
- 舊政策使用 `auth.uid()` (Supabase Auth)
- 新政策使用 `current_user_id()` (應用層)
- 兩者不相容，導致權限失效

### 2. 政策重複
- 125 個政策中約 40% 重複
- 同一權限有多個版本實現

### 3. Helper Functions 失效
- `is_admin()`, `is_staff()`, `is_teacher()` 依賴錯誤的認證源

## 修復步驟

### Phase 1: 修復認證機制 (緊急)

```sql
-- 1. 修改 current_user_id() 函數，使其能正確獲取 Supabase Auth 用戶
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- 優先使用 Supabase Auth
  IF auth.uid() IS NOT NULL THEN
    RETURN (SELECT user_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1);
  END IF;
  
  -- 備用：應用層設定（用於測試或特殊情況）
  BEGIN
    RETURN current_setting('app.current_user_id', false);
  EXCEPTION
    WHEN others THEN
      RETURN NULL;
  END;
END;
$$;
```

### Phase 2: 清理重複政策

```sql
-- 刪除舊版重複政策（保留使用 helper functions 的版本）

-- Users 表
DROP POLICY IF EXISTS "Admin can manage users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Attendance 表
DROP POLICY IF EXISTS "Staff can update attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers can mark attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers can view relevant attendance" ON attendance;

-- 其他表格類似處理...
```

### Phase 3: 統一政策標準

每個表格應該只有這些政策：
1. `admin_*` - 管理員權限
2. `staff_*` - 員工權限
3. `teacher_*` - 教師權限
4. `self_*` - 用戶自身權限

### Phase 4: 驗證修復

```sql
-- 驗證政策數量
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
HAVING COUNT(*) > 4
ORDER BY policy_count DESC;

-- 測試權限
-- 以管理員身份測試
SET app.current_user_id = 'USR001';
SELECT * FROM users LIMIT 1;

-- 以教師身份測試
SET app.current_user_id = 'USR003';
SELECT * FROM attendance LIMIT 1;
```

## 長期建議

1. **選擇單一認證源**
   - 建議統一使用 Supabase Auth (`auth.uid()`)
   - 所有 helper functions 應該基於 auth.uid()

2. **政策命名規範**
   - 使用一致的命名：`{role}_{action}_{table}`
   - 例如：`admin_manage_users`, `teacher_view_attendance`

3. **定期審查**
   - 每月檢查重複政策
   - 使用自動化腳本監控政策衝突

4. **文檔化**
   - 記錄每個表格的預期權限矩陣
   - 維護政策變更日誌

## 緊急行動項目

1. ⚡ **立即**：修復 `current_user_id()` 函數
2. 🔧 **今天**：清理重複政策
3. 📝 **本週**：建立政策管理流程
4. 🔍 **持續**：監控權限正確性