-- 正確版本：為 admin@bonfie.com 確認/更新 public.users 記錄

-- 1. 檢查現有的 admin 帳號
SELECT 'Current admin account in public.users:' as info;
SELECT 
  u.user_id,
  u.username,
  u.email,
  u.full_name,
  u.auth_user_id,
  r.role_code
FROM public.users u
JOIN roles r ON u.role_id = r.id
WHERE u.email = 'admin@bonfie.com';

-- 2. 如果您想要使用 jamy@bonfieart.com，需要先在 Supabase Authentication 中創建該帳號
-- 然後再執行以下步驟

-- 3. 如果要創建新的 ADMIN 用戶 (jamy)，可以：
-- 選項 A: 更新現有的 A001 記錄
UPDATE public.users
SET 
  username = 'jamy',
  full_name = 'Jamy',
  email = 'jamy@bonfieart.com'
WHERE user_id = 'A001';

-- 選項 B: 創建新的 ADMIN 記錄（如果 jamy@bonfieart.com 已經在 Authentication 中創建）
-- 首先需要在 Supabase Dashboard > Authentication 中創建 jamy@bonfieart.com 帳號
-- 然後獲取該帳號的 UUID，再執行以下 SQL

/*
-- 確認角色存在
INSERT INTO roles (id, role_code, role_name, permissions, is_active)
VALUES (1, 'ADMIN', '管理員', '{"all": true}'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- 創建新的 admin 用戶
INSERT INTO public.users (
  user_id,
  username,
  password_hash,
  full_name,
  role_id,
  email,
  status,
  auth_user_id,  -- 需要替換成實際的 UUID
  created_at,
  updated_at
)
VALUES (
  'ADMIN001',            
  'jamy',                
  'not_used',            
  'Jamy',                
  1,                     
  'jamy@bonfieart.com',  
  'active',              
  'YOUR-NEW-AUTH-UUID'::uuid,  -- 從 Supabase Authentication 獲取
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET 
  email = EXCLUDED.email,
  auth_user_id = EXCLUDED.auth_user_id,
  updated_at = NOW();
*/

-- 4. 驗證結果
SELECT 'All admin users:' as info;
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
WHERE r.role_code = 'ADMIN';