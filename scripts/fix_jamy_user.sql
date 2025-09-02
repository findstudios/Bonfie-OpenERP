-- 修正 jamy@bonfieart.com 使用者設定
-- 請先從 Supabase Dashboard > Authentication > Users 取得 jamy@bonfieart.com 的 User UID
-- 然後將下面的 'YOUR-AUTH-USER-ID-HERE' 替換成實際的 UUID

-- 1. 先檢查是否已有 ADMIN 角色
SELECT * FROM roles WHERE role_code = 'ADMIN';

-- 2. 如果沒有 ADMIN 角色，創建一個
INSERT INTO roles (role_code, role_name, permissions, is_active)
VALUES ('ADMIN', '管理員', '{"all": true}'::jsonb, true)
ON CONFLICT (role_code) DO NOTHING;

-- 3. 創建 public.users 記錄
-- 請將 'YOUR-AUTH-USER-ID-HERE' 替換成從 Supabase Dashboard 取得的實際 UUID
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
  'ADMIN_JAMY',  -- user_id
  'jamy',        -- username
  'not_used',    -- password_hash (使用 Supabase Auth 不需要)
  'Jamy',        -- full_name
  (SELECT id FROM roles WHERE role_code = 'ADMIN'),  -- role_id
  'jamy@bonfieart.com',  -- email
  'active',      -- status
  'YOUR-AUTH-USER-ID-HERE'::uuid,  -- auth_user_id (請替換！)
  NOW(),
  NOW()
)
ON CONFLICT (username) DO UPDATE
SET 
  email = EXCLUDED.email,
  auth_user_id = EXCLUDED.auth_user_id,
  updated_at = NOW();

-- 4. 確認設定正確
SELECT 
  u.user_id,
  u.username,
  u.email,
  u.full_name,
  r.role_code,
  u.auth_user_id,
  u.status
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.email = 'jamy@bonfieart.com';