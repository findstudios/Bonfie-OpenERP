-- 在正確的 Supabase 專案 (jmupkvdtrkvwhpqbzhhz) 執行此 SQL
-- 用於設定 jamy@bonfieart.com 帳號

-- 1. 先檢查 public.users 表是否有資料
SELECT 'Checking existing users in public.users:' as info;
SELECT * FROM public.users;

-- 2. 檢查 auth.users 表
SELECT 'Checking auth.users:' as info;
SELECT id, email, created_at FROM auth.users;

-- 3. 如果 public.users 是空的，創建必要的角色
INSERT INTO roles (id, role_code, role_name, permissions, is_active)
VALUES 
  (1, 'ADMIN', '管理員', '{"all": true}'::jsonb, true),
  (2, 'STAFF', '行政人員', '{"students": true, "orders": true}'::jsonb, true),
  (3, 'TEACHER', '老師', '{"students": "read", "courses": true}'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- 4. 如果你已經在 Authentication 創建了 jamy@bonfieart.com
-- 從 auth.users 找出該用戶的 ID
SELECT 'Finding jamy@bonfieart.com in auth.users:' as info;
SELECT id, email FROM auth.users WHERE email = 'jamy@bonfieart.com';

-- 5. 創建對應的 public.users 記錄
-- 請將下面的 'YOUR-AUTH-USER-ID' 替換成上面查詢到的 ID
/*
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
  'not_used',            -- password_hash (使用 Supabase Auth)
  'Jamy',                -- full_name
  1,                     -- role_id (ADMIN)
  'jamy@bonfieart.com',  -- email
  'active',              -- status
  'YOUR-AUTH-USER-ID'::uuid,  -- 替換成實際的 UUID
  NOW(),
  NOW()
);
*/

-- 6. 確認設定成功
SELECT 'Final check - all users:' as info;
SELECT 
  u.user_id,
  u.username,
  u.email,
  u.full_name,
  r.role_code,
  u.auth_user_id
FROM public.users u
LEFT JOIN roles r ON u.role_id = r.id;