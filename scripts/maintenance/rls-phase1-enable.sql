-- ============================================
-- RLS 第一階段：啟用核心表格 RLS
-- 執行時間：立即
-- 風險等級：中（有回滾方案）
-- ============================================

-- ============================================
-- 步驟 0：測試 RLS 功能
-- ============================================
DO $$
BEGIN
    -- 創建測試表
    CREATE TEMP TABLE test_rls_check (id int, test_data text);
    ALTER TABLE test_rls_check ENABLE ROW LEVEL SECURITY;
    CREATE POLICY test_block ON test_rls_check FOR ALL TO PUBLIC USING (false);
    
    -- 測試查詢（應該返回 0 筆）
    IF EXISTS (SELECT 1 FROM test_rls_check) THEN
        RAISE EXCEPTION 'RLS 測試失敗：政策未生效';
    END IF;
    
    DROP TABLE test_rls_check;
    RAISE NOTICE '✅ RLS 功能測試通過';
END $$;

-- ============================================
-- 步驟 1A：啟用學生管理模組 RLS（最重要，有資料）
-- ============================================
BEGIN;
    -- 啟用 RLS
    ALTER TABLE students ENABLE ROW LEVEL SECURITY;
    ALTER TABLE student_contacts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE student_notes_history ENABLE ROW LEVEL SECURITY;
    
    -- 驗證政策存在
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'students' 
            AND policyname = 'staff_manage_students'
        ) THEN
            RAISE EXCEPTION '❌ students 表缺少必要政策';
        END IF;
        RAISE NOTICE '✅ 學生管理模組 RLS 已啟用';
    END $$;
COMMIT;

-- 等待應用程式測試（建議等待 5 分鐘）
-- 如果有問題，執行以下回滾：
-- ALTER TABLE students DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE student_contacts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE student_notes_history DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 步驟 1B：啟用課程教學模組 RLS
-- ============================================
BEGIN;
    ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
    ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
    ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
    ALTER TABLE course_packages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE enrollment_extensions ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE '✅ 課程教學模組 RLS 已啟用';
COMMIT;

-- ============================================
-- 步驟 1C：啟用財務模組 RLS
-- ============================================
BEGIN;
    ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
    ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE '✅ 財務模組 RLS 已啟用';
COMMIT;

-- ============================================
-- 步驟 1D：啟用系統權限模組 RLS
-- ============================================
BEGIN;
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
    ALTER TABLE tutoring_center_settings ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE '✅ 系統權限模組 RLS 已啟用';
COMMIT;

-- ============================================
-- 步驟 1E：啟用 CRM 模組 RLS
-- ============================================
BEGIN;
    ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
    ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
    ALTER TABLE trial_classes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
    ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE '✅ CRM 模組 RLS 已啟用';
COMMIT;

-- ============================================
-- 步驟 1F：啟用安全稽核模組 RLS
-- ============================================
BEGIN;
    ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
    ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
    ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;
    ALTER TABLE security_alert_rules ENABLE ROW LEVEL SECURITY;
    ALTER TABLE rate_limit_tracking ENABLE ROW LEVEL SECURITY;
    ALTER TABLE handover_notes ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE '✅ 安全稽核模組 RLS 已啟用';
COMMIT;

-- ============================================
-- 驗證結果
-- ============================================
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ 已啟用'
        ELSE '❌ 未啟用'
    END as rls_status,
    (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY 
    rowsecurity DESC,
    tablename;

-- ============================================
-- 功能測試查詢（確認應用程式仍可存取）
-- ============================================
-- 測試管理員查詢
SELECT '測試學生查詢' as test, COUNT(*) as count FROM students;
SELECT '測試用戶查詢' as test, COUNT(*) as count FROM users;
SELECT '測試課程查詢' as test, COUNT(*) as count FROM courses;