-- 完整設定 jamy@bonfieart.com 帳號的步驟

-- ====================================
-- 步驟 1: 在 Supabase Dashboard 創建帳號
-- ====================================
-- 1. 登入 Supabase Dashboard: https://supabase.com/dashboard
-- 2. 選擇您的專案 (jmupkvdtrkvwhpqbzhhz)
-- 3. 進入 Authentication → Users
-- 4. 點擊 "Add user" → "Create new user"
-- 5. 輸入:
--    Email: jamy@bonfieart.com
--    Password: (設定您想要的密碼)
-- 6. 點擊 "Create user"
-- 7. 複製生成的 User UID (UUID)

-- ====================================
-- 步驟 2: 執行以下 SQL (替換 YOUR-AUTH-UUID)
-- ====================================

-- 確認角色存在
INSERT INTO roles (id, role_code, role_name, permissions, is_active)
VALUES (1, 'ADMIN', '管理員', '{"all": true}'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- 創建 public.users 記錄
-- 重要: 將 'YOUR-AUTH-UUID' 替換成步驟 1 中獲得的 UUID
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
  'ADMIN002',                     -- 使用不同的 user_id 避免衝突
  'jamy',                         -- username  
  'not_used',                     -- password_hash (使用 Supabase Auth)
  'Jamy',                         -- full_name
  1,                              -- role_id (ADMIN)
  'jamy@bonfieart.com',           -- email
  'active',                       -- status
  'YOUR-AUTH-UUID'::uuid,         -- 替換成實際的 UUID！
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET 
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  auth_user_id = EXCLUDED.auth_user_id,
  updated_at = NOW();

-- ====================================
-- 步驟 3: 驗證設定
-- ====================================

-- 檢查 auth.users 中的帳號
SELECT 'Checking auth.users:' as info;
SELECT id, email, created_at 
FROM auth.users 
WHERE email IN ('jamy@bonfieart.com', 'admin@bonfie.com')
ORDER BY created_at DESC;

-- 檢查 public.users 中的帳號
SELECT 'Checking public.users:' as info;
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
WHERE r.role_code = 'ADMIN'
ORDER BY u.created_at DESC;

-- ====================================
-- 如果遇到問題
-- ====================================

-- 如果出現 foreign key 錯誤:
-- 1. 確認您已經在 Supabase Authentication 創建了帳號
-- 2. 確認 UUID 複製正確
-- 3. 執行以下查詢確認 UUID 存在:
/*
SELECT id, email 
FROM auth.users 
WHERE id = 'YOUR-AUTH-UUID';
*/

-- 如果需要刪除測試記錄:
/*
DELETE FROM public.users 
WHERE email = 'jamy@bonfieart.com' 
AND user_id != 'A001';
*/