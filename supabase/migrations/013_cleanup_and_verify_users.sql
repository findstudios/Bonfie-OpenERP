-- ========================================
-- 清理重複用戶並驗證連結
-- ========================================

-- 1. 檢查 auth.users 和 public.users 的對應關係
SELECT 
  'Auth Users' as source,
  a.id as auth_id,
  a.email,
  a.created_at,
  'Check if linked' as note
FROM auth.users a
ORDER BY a.email;

-- 2. 檢查 public.users 的連結狀態
SELECT 
  'Public Users' as source,
  p.user_id,
  p.email,
  p.auth_user_id,
  CASE 
    WHEN p.auth_user_id IS NULL THEN '❌ 未連結'
    WHEN EXISTS (SELECT 1 FROM auth.users a WHERE a.id = p.auth_user_id) THEN '✅ 已連結'
    ELSE '⚠️ 連結失效'
  END as status
FROM public.users p
ORDER BY p.email;

-- 3. 檢查並修復連結
-- 更新 public.users 以連結正確的 auth.users
UPDATE public.users p
SET auth_user_id = a.id
FROM auth.users a
WHERE p.email = a.email
AND p.auth_user_id IS NULL;

-- 4. 最終驗證
SELECT 
  p.user_id,
  p.username,
  p.email,
  p.full_name,
  p.role_id,
  a.id as auth_id,
  a.email as auth_email,
  CASE 
    WHEN p.auth_user_id = a.id THEN '✅ 正確連結'
    ELSE '❌ 連結錯誤'
  END as link_status
FROM public.users p
LEFT JOIN auth.users a ON p.email = a.email
WHERE p.email LIKE '%@vibe-erp.com'
ORDER BY p.username;

-- 5. 如果需要，刪除 @example.com 的測試用戶
-- DELETE FROM auth.users WHERE email LIKE '%@example.com';