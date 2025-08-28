-- ========================================
-- 修復 Auth 使用者建立問題
-- ========================================

-- 1. 先暫時停用觸發器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. 檢查並修復可能的問題
-- 確保 roles 表有正確的資料
SELECT * FROM public.roles;

-- 確保 users_id_seq 序列存在
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'users_id_seq') THEN
    CREATE SEQUENCE public.users_id_seq;
    -- 設定起始值，避免與現有資料衝突
    SELECT setval('users_id_seq', COALESCE(MAX(CAST(SUBSTRING(user_id FROM 4) AS INTEGER)), 0) + 1)
    FROM public.users
    WHERE user_id LIKE 'USR%';
  END IF;
END $$;

-- 3. 確認現有使用者資料
SELECT 
  user_id,
  username,
  email,
  full_name,
  role_id,
  auth_user_id
FROM public.users
ORDER BY username;

-- 4. 建立一個簡化版的觸發器函數（只更新現有使用者）
CREATE OR REPLACE FUNCTION public.handle_new_auth_user_simple()
RETURNS TRIGGER AS $$
BEGIN
  -- 只更新現有使用者的 auth_user_id
  UPDATE public.users 
  SET auth_user_id = NEW.id,
      updated_at = NOW()
  WHERE email = NEW.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 現在您可以在 Dashboard 建立 Auth 使用者了
-- 建立成功後，執行下面的 SQL 來重新啟用完整的觸發器