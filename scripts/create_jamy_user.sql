-- 為 jamy@bonfieart.com 創建 public.users 記錄

-- 1. 確認角色存在
INSERT INTO roles (id, role_code, role_name, permissions, is_active)
VALUES (1, 'ADMIN', '管理員', '{"all": true}'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- 2. 創建 public.users 記錄
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

-- 3. 確認創建成功
SELECT 
  u.user_id,
  u.username,
  u.email,
  u.full_name,
  r.role_code,
  u.auth_user_id,
  u.status
FROM public.users u
JOIN roles r ON u.role_id = r.id
WHERE u.email = 'jamy@bonfieart.com';