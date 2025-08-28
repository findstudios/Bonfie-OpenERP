-- ========================================
-- 使用 Supabase 官方方法重設密碼
-- ========================================

-- 方法 1: 刪除並重新建立用戶（最可靠）
-- 這會清除舊的密碼並允許您重新設定

-- 1. 先備份用戶資訊
CREATE TEMP TABLE temp_user_backup AS
SELECT 
  p.user_id,
  p.username,
  p.email,
  p.full_name,
  p.role_id,
  p.auth_user_id
FROM public.users p
WHERE p.email LIKE '%@vibe-erp.com';

-- 2. 清除 auth_user_id 連結
UPDATE public.users 
SET auth_user_id = NULL
WHERE email LIKE '%@vibe-erp.com';

-- 3. 刪除 auth.users 中的用戶
DELETE FROM auth.users 
WHERE email LIKE '%@vibe-erp.com';

-- 4. 顯示結果
SELECT 
  '已刪除 Auth 用戶，請在 Dashboard 重新建立' as message,
  email,
  '建議密碼: Test123!' as suggested_password
FROM temp_user_backup
ORDER BY email;

-- ========================================
-- 請在 Supabase Dashboard 重新建立用戶：
-- 1. Authentication → Users
-- 2. 點擊 "Add user" → "Create new user"
-- 3. 輸入 email 和密碼 (Test123!)
-- 4. 勾選 "Auto Confirm User"
-- ========================================