-- ========================================
-- 驗證和同步 Auth 使用者
-- ========================================

-- 1. 檢查現有的 public.users
SELECT 
  user_id,
  username,
  email,
  full_name,
  role_id,
  auth_user_id,
  CASE 
    WHEN auth_user_id IS NULL THEN '❌ 未連結'
    ELSE '✅ 已連結'
  END as auth_status
FROM public.users
ORDER BY username;

-- 2. 檢查 auth.users
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY email;

-- 3. 檢查未連結的用戶
SELECT 
  u.user_id,
  u.username,
  u.email,
  u.full_name,
  '需要在 Auth 建立此使用者' as action
FROM public.users u
WHERE u.auth_user_id IS NULL
ORDER BY u.username;

-- 4. 手動連結指引
-- 如果您已經在 Supabase Dashboard 建立了 Auth 使用者，
-- 請執行以下 SQL 來手動連結（替換實際的 auth.users.id）：

/*
-- 範例：連結 admin 用戶
UPDATE public.users 
SET auth_user_id = '從auth.users查詢到的id'
WHERE email = 'admin@vibe-erp.com';

-- 範例：連結 staff1 用戶
UPDATE public.users 
SET auth_user_id = '從auth.users查詢到的id'
WHERE email = 'staff1@vibe-erp.com';

-- 範例：連結 teacher1 用戶
UPDATE public.users 
SET auth_user_id = '從auth.users查詢到的id'
WHERE email = 'teacher1@vibe-erp.com';
*/