-- ====================================================
-- 偵錯認證問題
-- 日期：2025-01-25
-- 目的：檢查為什麼會出現 406 錯誤
-- ====================================================

-- 1. 檢查當前的認證用戶
SELECT 
    auth.uid() as current_auth_uid,
    auth.email() as current_email,
    auth.role() as current_role,
    auth.jwt() as current_jwt;

-- 2. 檢查 auth_user_role 函數的返回值
SELECT auth_user_role() as user_role;

-- 3. 檢查用戶對應關係
SELECT 
    u.user_id,
    u.username,
    u.email,
    u.auth_user_id,
    u.status,
    r.role_code,
    r.role_name,
    CASE 
        WHEN u.auth_user_id = auth.uid() THEN '✓ 當前用戶'
        WHEN u.auth_user_id IS NOT NULL THEN '已對應其他'
        ELSE '未對應'
    END as auth_status
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.email IN ('admin@vibe-erp.com', 'staff1@vibe-erp.com', 'teacher1@vibe-erp.com')
ORDER BY r.role_code;

-- 4. 測試 RLS 政策
-- 測試是否能查詢 tutoring_center_settings
SELECT 
    setting_key,
    jsonb_pretty(setting_value) as setting_value,
    description
FROM tutoring_center_settings
LIMIT 5;

-- 5. 檢查所有 RLS 政策
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'tutoring_center_settings'
ORDER BY policyname;