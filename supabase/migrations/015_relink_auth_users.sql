-- ========================================
-- 重新連結 Auth 用戶
-- ========================================

-- 自動連結相同 email 的用戶
UPDATE public.users p
SET auth_user_id = a.id,
    updated_at = NOW()
FROM auth.users a
WHERE p.email = a.email
AND p.auth_user_id IS NULL;

-- 驗證連結結果
SELECT 
  p.user_id,
  p.username,
  p.email,
  p.full_name,
  CASE 
    WHEN p.auth_user_id IS NOT NULL THEN '✅ 已連結'
    ELSE '❌ 未連結'
  END as status,
  a.id as auth_id,
  a.created_at as auth_created_at
FROM public.users p
LEFT JOIN auth.users a ON p.email = a.email
WHERE p.email LIKE '%@vibe-erp.com'
ORDER BY p.username;