-- 更新現有使用者連結到 Auth
-- 請先在 Supabase Dashboard 建立對應的 Auth 使用者
-- 然後將下面的 UUID 替換為實際的值

-- 範例：從 Authentication > Users 頁面複製 UUID
/*
UPDATE public.users 
SET auth_user_id = '請貼上admin的UUID'
WHERE email = 'admin@vibe-erp.com';

UPDATE public.users 
SET auth_user_id = '請貼上staff1的UUID'
WHERE email = 'staff1@vibe-erp.com';

UPDATE public.users 
SET auth_user_id = '請貼上teacher1的UUID'
WHERE email = 'teacher1@vibe-erp.com';
*/

-- 執行後檢查連結狀態
SELECT 
  username,
  email,
  full_name,
  CASE 
    WHEN auth_user_id IS NOT NULL THEN '✅ 已連結'
    ELSE '❌ 未連結'
  END as auth_status,
  auth_user_id
FROM public.users
ORDER BY username;