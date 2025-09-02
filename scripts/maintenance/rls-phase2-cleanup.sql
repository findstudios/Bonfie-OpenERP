-- ============================================
-- RLS 第二階段：清理重複政策
-- 執行時間：確認第一階段穩定後
-- 風險等級：低（只是清理重複）
-- ============================================

-- ============================================
-- 清理 users 表（10個政策→4個）
-- ============================================
BEGIN;
    -- 移除舊的重複政策
    DROP POLICY IF EXISTS "Admin can manage users" ON users;
    DROP POLICY IF EXISTS "Admins can manage all users" ON users;
    DROP POLICY IF EXISTS "Admins can view all users" ON users;
    DROP POLICY IF EXISTS "Users can view own data" ON users;
    DROP POLICY IF EXISTS "Users can update own profile" ON users;
    DROP POLICY IF EXISTS "Users can view their own profile" ON users;
    
    -- 驗證保留的政策
    DO $$
    DECLARE
        policy_count INT;
    BEGIN
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies
        WHERE tablename = 'users';
        
        IF policy_count != 4 THEN
            RAISE WARNING 'users 表政策數量異常: % (預期: 4)', policy_count;
        ELSE
            RAISE NOTICE '✅ users 表政策清理完成';
        END IF;
    END $$;
COMMIT;

-- ============================================
-- 清理 attendance 表（8個政策→3個）
-- ============================================
BEGIN;
    DROP POLICY IF EXISTS "Staff can update attendance" ON attendance;
    DROP POLICY IF EXISTS "Teachers can mark attendance" ON attendance;
    DROP POLICY IF EXISTS "Teachers can view relevant attendance" ON attendance;
    DROP POLICY IF EXISTS "teacher_manage_own_attendance" ON attendance;
    DROP POLICY IF EXISTS "teacher_update_own_attendance" ON attendance;
    
    DO $$
    DECLARE
        policy_count INT;
    BEGIN
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies
        WHERE tablename = 'attendance';
        
        IF policy_count != 3 THEN
            RAISE WARNING 'attendance 表政策數量異常: % (預期: 3)', policy_count;
        ELSE
            RAISE NOTICE '✅ attendance 表政策清理完成';
        END IF;
    END $$;
COMMIT;

-- ============================================
-- 清理 courses 表（7個政策→4個）
-- ============================================
BEGIN;
    DROP POLICY IF EXISTS "All authenticated users can view courses" ON courses;
    DROP POLICY IF EXISTS "Staff can manage courses" ON courses;
    DROP POLICY IF EXISTS "course_update_policy" ON courses;
    
    RAISE NOTICE '✅ courses 表政策清理完成';
COMMIT;

-- ============================================
-- 清理 schedules 表（6個政策→4個）
-- ============================================
BEGIN;
    DROP POLICY IF EXISTS "All authenticated users can view schedules" ON schedules;
    DROP POLICY IF EXISTS "Staff can manage schedules" ON schedules;
    
    RAISE NOTICE '✅ schedules 表政策清理完成';
COMMIT;

-- ============================================
-- 清理 contacts 表（5個政策→3個）
-- ============================================
BEGIN;
    DROP POLICY IF EXISTS "Staff can manage contacts" ON contacts;
    DROP POLICY IF EXISTS "Staff can view all contacts" ON contacts;
    
    RAISE NOTICE '✅ contacts 表政策清理完成';
COMMIT;

-- ============================================
-- 清理 enrollments 表（5個政策→3個）
-- ============================================
BEGIN;
    DROP POLICY IF EXISTS "Staff can manage enrollments" ON enrollments;
    DROP POLICY IF EXISTS "Staff can view all enrollments" ON enrollments;
    
    RAISE NOTICE '✅ enrollments 表政策清理完成';
COMMIT;

-- ============================================
-- 清理 payments 表（6個政策→4個）
-- ============================================
BEGIN;
    DROP POLICY IF EXISTS "Staff can manage payments" ON payments;
    DROP POLICY IF EXISTS "Staff can view all payments" ON payments;
    
    RAISE NOTICE '✅ payments 表政策清理完成';
COMMIT;

-- ============================================
-- 清理其他重複政策
-- ============================================
BEGIN;
    -- audit_logs
    DROP POLICY IF EXISTS "Admin can view audit logs" ON audit_logs;
    DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
    
    -- roles
    DROP POLICY IF EXISTS "Admin can manage roles" ON roles;
    DROP POLICY IF EXISTS "All authenticated users can view roles" ON roles;
    
    -- classrooms
    DROP POLICY IF EXISTS "Admin can manage classrooms" ON classrooms;
    DROP POLICY IF EXISTS "All authenticated users can view classrooms" ON classrooms;
    
    -- orders
    DROP POLICY IF EXISTS "Staff can manage orders" ON orders;
    DROP POLICY IF EXISTS "Staff can view all orders" ON orders;
    
    -- course_packages
    DROP POLICY IF EXISTS "All authenticated users can view course packages" ON course_packages;
    DROP POLICY IF EXISTS "Staff can manage course packages" ON course_packages;
    
    RAISE NOTICE '✅ 其他表格政策清理完成';
COMMIT;

-- ============================================
-- 最終驗證
-- ============================================
WITH policy_summary AS (
    SELECT 
        tablename,
        COUNT(*) as policy_count,
        string_agg(policyname, ', ' ORDER BY policyname) as policies
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename
)
SELECT 
    tablename,
    policy_count,
    CASE 
        WHEN policy_count > 5 THEN '⚠️ 過多'
        WHEN policy_count = 0 THEN '❌ 無政策'
        ELSE '✅ 正常'
    END as status,
    policies
FROM policy_summary
WHERE policy_count > 4 OR policy_count = 0
ORDER BY policy_count DESC;

-- 顯示清理後的統計
SELECT 
    '清理前' as stage,
    127 as total_policies
UNION ALL
SELECT 
    '清理後' as stage,
    COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';

RAISE NOTICE '✅ 第二階段政策清理完成';