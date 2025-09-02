-- ============================================
-- 緊急回滾腳本：關閉所有 RLS
-- 只在系統出現嚴重問題時使用
-- ============================================

-- ⚠️ 警告：執行此腳本將關閉所有安全保護！

-- 確認要執行回滾嗎？取消註解下面的程式碼來執行：

/*
-- ============================================
-- 回滾所有 RLS 設定
-- ============================================
BEGIN;
    -- 核心業務表格
    ALTER TABLE students DISABLE ROW LEVEL SECURITY;
    ALTER TABLE student_contacts DISABLE ROW LEVEL SECURITY;
    ALTER TABLE student_notes_history DISABLE ROW LEVEL SECURITY;
    ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
    
    -- 課程教學模組
    ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
    ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
    ALTER TABLE enrollment_extensions DISABLE ROW LEVEL SECURITY;
    ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
    ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
    ALTER TABLE course_packages DISABLE ROW LEVEL SECURITY;
    
    -- 財務模組
    ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
    ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
    ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
    
    -- CRM 模組
    ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
    ALTER TABLE follow_ups DISABLE ROW LEVEL SECURITY;
    ALTER TABLE trial_classes DISABLE ROW LEVEL SECURITY;
    ALTER TABLE conversions DISABLE ROW LEVEL SECURITY;
    ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
    ALTER TABLE lead_tags DISABLE ROW LEVEL SECURITY;
    
    -- 系統管理
    ALTER TABLE users DISABLE ROW LEVEL SECURITY;
    ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE classrooms DISABLE ROW LEVEL SECURITY;
    ALTER TABLE tutoring_center_settings DISABLE ROW LEVEL SECURITY;
    
    -- 安全稽核
    ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
    ALTER TABLE security_events DISABLE ROW LEVEL SECURITY;
    ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;
    ALTER TABLE blocked_ips DISABLE ROW LEVEL SECURITY;
    ALTER TABLE security_alert_rules DISABLE ROW LEVEL SECURITY;
    ALTER TABLE rate_limit_tracking DISABLE ROW LEVEL SECURITY;
    ALTER TABLE handover_notes DISABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE '⚠️ 所有 RLS 已關閉 - 系統現在沒有安全保護！';
COMMIT;

-- 驗證回滾結果
SELECT 
    COUNT(*) as disabled_count,
    string_agg(tablename, ', ') as tables
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;
*/

-- ============================================
-- 部分回滾（只回滾有問題的表格）
-- ============================================

-- 如果只有特定表格有問題，使用以下範例：

-- 回滾學生相關表格
/*
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_contacts DISABLE ROW LEVEL SECURITY;
*/

-- 回滾用戶相關表格
/*
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
*/

-- 回滾財務相關表格
/*
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
*/

-- ============================================
-- 診斷問題
-- ============================================

-- 檢查哪些表格的 RLS 已啟用
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
AND rowsecurity = true
ORDER BY tablename;

-- 檢查最近的錯誤（需要在應用程式日誌中查看）
-- 常見錯誤訊息：
-- "new row violates row-level security policy"
-- "permission denied for table"

-- ============================================
-- 修復建議
-- ============================================
-- 1. 先嘗試部分回滾（只回滾有問題的表格）
-- 2. 檢查應用程式是否有正確的認證 token
-- 3. 確認 auth.uid() 有正確的值
-- 4. 檢查政策邏輯是否正確
-- 5. 如果全部失敗，才執行完整回滾