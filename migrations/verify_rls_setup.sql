-- 驗證 RLS 設置是否正確
-- 執行這個 SQL 來檢查你的設置

-- 1. 檢查 attendance 表的 RLS 是否啟用
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'attendance';

-- 2. 檢查 attendance 表的所有政策
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'attendance'
ORDER BY policyname;

-- 3. 測試當前登入用戶的函數返回值
SELECT 
    auth.uid() as current_auth_uid,
    auth_user_id() as current_user_id,
    auth_user_role() as current_user_role;

-- 4. 檢查是否有匹配的用戶記錄
SELECT 
    u.user_id,
    u.email,
    u.auth_user_id,
    r.role_code,
    CASE 
        WHEN u.auth_user_id = auth.uid() THEN '✓ 匹配'
        ELSE '✗ 不匹配'
    END as auth_match
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.status = 'active'
AND u.auth_user_id IS NOT NULL
ORDER BY u.email;