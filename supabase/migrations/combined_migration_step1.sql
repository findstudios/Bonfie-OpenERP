-- ========================================
-- 步驟 1: 準備資料庫結構 (004_prepare_for_supabase_auth.sql)
-- 請在 Supabase Dashboard SQL Editor 執行
-- ========================================

-- 1. 添加 auth_user_id 欄位
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- 2. 確保 email 欄位存在且唯一
DO $$ 
BEGIN
  -- 如果 email 欄位不存在，從 username 生成
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.users ADD COLUMN email VARCHAR;
  END IF;
END $$;

-- 3. 更新現有使用者的 email（如果為空）
UPDATE public.users 
SET email = CASE 
  WHEN email IS NULL OR email = '' THEN username || '@vibe-erp.com'
  ELSE email
END
WHERE email IS NULL OR email = '';

-- 4. 建立 email 唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON public.users(email);

-- 5. 確保所有使用者都有 email
ALTER TABLE public.users 
ALTER COLUMN email SET NOT NULL;

-- 6. 查看現有使用者（確認 email 已設定）
SELECT 
  user_id,
  username,
  email,
  full_name,
  CASE role_id 
    WHEN 1 THEN 'ADMIN'
    WHEN 2 THEN 'STAFF'
    WHEN 3 THEN 'TEACHER'
  END as role
FROM public.users
ORDER BY username;