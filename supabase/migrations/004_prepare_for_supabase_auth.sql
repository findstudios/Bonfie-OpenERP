-- 準備遷移到 Supabase Auth
-- 步驟 1：為 users 表添加必要欄位

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

-- 6. 顯示現有使用者資訊（供手動連結）
DO $$
BEGIN
  RAISE NOTICE '=================================';
  RAISE NOTICE '現有使用者清單：';
  RAISE NOTICE '請在 Supabase Dashboard 建立對應的 Auth 使用者';
  RAISE NOTICE '=================================';
END $$;

-- 查看現有使用者
SELECT 
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