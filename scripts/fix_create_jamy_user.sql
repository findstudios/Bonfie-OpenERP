-- 修正版：為 jamy@bonfieart.com 創建 public.users 記錄

-- 1. 先檢查外鍵約束
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS foreign_table_name,
    a.attname AS column_name,
    af.attname AS foreign_column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE conrelid = 'public.users'::regclass
AND contype = 'f'
AND a.attname = 'auth_user_id';

-- 2. 檢查 auth.users 中是否存在該 ID
SELECT id, email, created_at 
FROM auth.users 
WHERE id = '5e088354-21e7-4d0b-9c8f-51c5026f2bc5';

-- 3. 如果上面的查詢沒有結果，查看所有 auth.users
SELECT id, email FROM auth.users;

-- 4. 確認角色存在
INSERT INTO roles (id, role_code, role_name, permissions, is_active)
VALUES (1, 'ADMIN', '管理員', '{"all": true}'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- 5. 創建 public.users 記錄（修正版）
-- 如果外鍵約束是指向 auth.users，這個應該可以工作
INSERT INTO public.users (
  user_id,
  username,
  password_hash,
  full_name,
  role_id,
  email,
  status,
  auth_user_id,
  created_at,
  updated_at
)
VALUES (
  'ADMIN001',            -- user_id
  'jamy',                -- username  
  'not_used',            -- password_hash (使用 Supabase Auth 不需要)
  'Jamy',                -- full_name
  1,                     -- role_id (ADMIN)
  'jamy@bonfieart.com',  -- email
  'active',              -- status
  '5e088354-21e7-4d0b-9c8f-51c5026f2bc5'::uuid,  -- auth_user_id
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET 
  email = EXCLUDED.email,
  auth_user_id = EXCLUDED.auth_user_id,
  updated_at = NOW();

-- 6. 如果上面還是失敗，試試不填 auth_user_id
/*
INSERT INTO public.users (
  user_id,
  username,
  password_hash,
  full_name,
  role_id,
  email,
  status,
  created_at,
  updated_at
)
VALUES (
  'ADMIN001',            -- user_id
  'jamy',                -- username  
  'not_used',            -- password_hash
  'Jamy',                -- full_name
  1,                     -- role_id (ADMIN)
  'jamy@bonfieart.com',  -- email
  'active',              -- status
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET 
  email = EXCLUDED.email,
  updated_at = NOW();

-- 然後再更新 auth_user_id
UPDATE public.users 
SET auth_user_id = '5e088354-21e7-4d0b-9c8f-51c5026f2bc5'::uuid
WHERE email = 'jamy@bonfieart.com';
*/