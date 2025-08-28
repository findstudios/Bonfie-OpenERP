-- ========================================
-- 重設 Auth 使用者密碼
-- ========================================

-- 方法 1: 使用 Supabase 的內建函數（如果可用）
-- 這個方法更安全且符合 Supabase 的標準

DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- 為每個用戶更新密碼
  FOR user_record IN 
    SELECT id, email FROM auth.users
  LOOP
    -- 更新密碼為 Test123!
    UPDATE auth.users 
    SET 
      encrypted_password = crypt('Test123!', gen_salt('bf')),
      updated_at = NOW()
    WHERE id = user_record.id;
    
    RAISE NOTICE '已更新密碼: %', user_record.email;
  END LOOP;
END $$;

-- 驗證更新
SELECT 
  u.email,
  u.encrypted_password IS NOT NULL as has_password,
  u.email_confirmed_at IS NOT NULL as is_confirmed,
  u.updated_at
FROM auth.users u
ORDER BY u.email;