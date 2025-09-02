-- 新增 jamy@bonfieart.com 管理員帳號

-- 1. 確認 ADMIN 角色存在
INSERT INTO roles (id, role_code, role_name, permissions, is_active)
VALUES (1, 'ADMIN', '管理員', '{"all": true}'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- 2. 新增 jamy@bonfieart.com 到 public.users
-- 注意：auth_user_id 需要從 Supabase Dashboard > Authentication 取得
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
  'ADMIN_JAMY',          -- user_id
  'jamy',                -- username  
  'not_used',            -- password_hash (使用 Supabase Auth)
  'Jamy',                -- full_name
  1,                     -- role_id (ADMIN)
  'jamy@bonfieart.com',  -- email
  'active',              -- status
  NULL,                  -- auth_user_id (需要手動更新)
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET 
  email = EXCLUDED.email,
  updated_at = NOW();

-- 3. 顯示新增結果
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

-- 4. 提醒：需要更新 auth_user_id
SELECT '⚠️ 記得更新 auth_user_id：' as reminder,
       '1. 在 Supabase Dashboard > Authentication 創建 jamy@bonfieart.com' as step1,
       '2. 複製 User UID' as step2,
       '3. 執行: UPDATE users SET auth_user_id = ''YOUR-UUID'' WHERE email = ''jamy@bonfieart.com''' as step3;