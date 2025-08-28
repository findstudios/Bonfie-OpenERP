-- ====================================================
-- 更新 auth_user_id 對應關係
-- 日期：2025-01-25
-- 目的：確保 public.users 表與 Supabase Auth 用戶正確對應
-- ====================================================

-- 注意：執行此腳本前，請先確認您的 Supabase Auth 用戶
-- 您可以在 Supabase Dashboard > Authentication > Users 查看

-- 1. 查看現有的 Auth 用戶
-- 方法一：在 Supabase Dashboard 執行以下查詢
SELECT 
    id as auth_user_id,
    email,
    created_at
FROM auth.users
ORDER BY created_at;

-- 方法二：在 Supabase Dashboard 的 Authentication > Users 頁面查看
-- 您可以直接看到每個用戶的 UUID

-- 2. 更新 users 表的 auth_user_id
-- 請根據上面查詢的結果，更新對應的 auth_user_id
-- 以下是範例，請根據實際的 auth.users 表中的 ID 進行更新：

-- 範例：假設您在 auth.users 查詢中看到：
-- admin@vibe-erp.com 的 ID 是 'e6760159-3c31-4f5d-8cc4-8d62b5f9dee3'
-- staff1@vibe-erp.com 的 ID 是 'a8bdf2a1-f1d1-4e6e-8aa7-4a4e0f564514'
-- teacher1@vibe-erp.com 的 ID 是 '2b88ed51-1ec7-4349-85a3-5dbf0347a88c'

-- 則執行以下更新：
UPDATE users 
SET auth_user_id = 'e6760159-3c31-4f5d-8cc4-8d62b5f9dee3'  -- 請替換為實際的 UUID
WHERE email = 'admin@vibe-erp.com';

UPDATE users 
SET auth_user_id = 'a8bdf2a1-f1d1-4e6e-8aa7-4a4e0f564514'  -- 請替換為實際的 UUID
WHERE email = 'staff1@vibe-erp.com';

UPDATE users 
SET auth_user_id = '2b88ed51-1ec7-4349-85a3-5dbf0347a88c'  -- 請替換為實際的 UUID
WHERE email = 'teacher1@vibe-erp.com';

-- 3. 驗證更新結果
-- 執行以下查詢來確認對應關係：
SELECT 
    u.user_id,
    u.username,
    u.email,
    u.auth_user_id,
    r.role_code,
    CASE 
        WHEN u.auth_user_id IS NOT NULL THEN '✓ 已對應'
        ELSE '✗ 未對應'
    END as mapping_status
FROM users u
JOIN roles r ON u.role_id = r.id
ORDER BY r.role_code, u.username;