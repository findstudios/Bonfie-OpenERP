-- 修復設定頁面的 RLS 問題
-- 1. 修復 tutoring_center_settings 的讀取權限
-- 2. 修復 classrooms 表的讀取權限

-- ========================================
-- 1. 修復 tutoring_center_settings
-- ========================================

-- 先檢查現有政策
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    -- 計算現有政策數量
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' 
    AND tablename = 'tutoring_center_settings';
    
    RAISE NOTICE '現有 tutoring_center_settings 政策數量: %', policy_count;
END $$;

-- 刪除所有現有政策（重新開始）
DROP POLICY IF EXISTS "admin_manage_settings" ON tutoring_center_settings;
DROP POLICY IF EXISTS "authenticated_users_view_settings" ON tutoring_center_settings;
DROP POLICY IF EXISTS "users_view_settings" ON tutoring_center_settings;
DROP POLICY IF EXISTS "all_authenticated_users_can_read_settings" ON tutoring_center_settings;

-- 創建新的政策
-- 1. 所有已登入用戶都可以讀取設定
CREATE POLICY "anyone_can_read_settings" 
ON tutoring_center_settings 
FOR SELECT 
USING (true);  -- 允許所有人讀取（包括未登入用戶）

-- 2. 只有管理員可以修改設定
CREATE POLICY "only_admin_can_modify_settings" 
ON tutoring_center_settings 
FOR INSERT 
USING (
    EXISTS (
        SELECT 1 FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.auth_user_id = auth.uid()
        AND r.role_code = 'ADMIN'
    )
);

CREATE POLICY "only_admin_can_update_settings" 
ON tutoring_center_settings 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.auth_user_id = auth.uid()
        AND r.role_code = 'ADMIN'
    )
);

CREATE POLICY "only_admin_can_delete_settings" 
ON tutoring_center_settings 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.auth_user_id = auth.uid()
        AND r.role_code = 'ADMIN'
    )
);

-- ========================================
-- 2. 修復 classrooms 表
-- ========================================

-- 檢查 classrooms 表是否有 RLS 啟用
DO $$
DECLARE
    rls_enabled BOOLEAN;
BEGIN
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = 'classrooms' 
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    IF NOT rls_enabled THEN
        ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS 已為 classrooms 表啟用';
    END IF;
END $$;

-- 刪除現有政策
DROP POLICY IF EXISTS "classrooms_read_policy" ON classrooms;
DROP POLICY IF EXISTS "classrooms_write_policy" ON classrooms;

-- 創建新政策
-- 所有已登入用戶可以讀取教室
CREATE POLICY "authenticated_users_read_classrooms" 
ON classrooms 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 只有管理員可以管理教室
CREATE POLICY "admin_manage_classrooms" 
ON classrooms 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.auth_user_id = auth.uid()
        AND r.role_code = 'ADMIN'
    )
);

-- ========================================
-- 3. 確保必要的設定資料存在
-- ========================================

-- 插入預設設定（如果不存在）
INSERT INTO tutoring_center_settings (setting_key, setting_value, description, updated_by)
VALUES 
    (
        'basic_info',
        '{
            "centerName": "Vibe 補習班",
            "address": "台北市中正區",
            "phone": "02-12345678",
            "email": "contact@vibe-erp.com",
            "description": "專業的教育機構"
        }'::jsonb,
        '補習班基本資訊',
        'SYSTEM'
    ),
    (
        'course_categories',
        '["國文", "英文", "數學", "理化", "社會", "其他"]'::jsonb,
        '課程分類',
        'SYSTEM'
    ),
    (
        'class_time_slots',
        '[
            "09:00", "10:00", "11:00", 
            "13:00", "14:00", "15:00", "16:00", 
            "17:00", "18:00", "19:00", "20:00"
        ]'::jsonb,
        '上課時段',
        'SYSTEM'
    ),
    (
        'receipt_settings',
        '{
            "prefix": "RC",
            "startNumber": 1000,
            "format": "RCYYYYMM-NNNN"
        }'::jsonb,
        '收據設定',
        'SYSTEM'
    )
ON CONFLICT (setting_key) DO NOTHING;

-- 插入預設教室（如果沒有教室）
INSERT INTO classrooms (classroom_id, classroom_name, capacity, is_active)
SELECT 
    'ROOM' || LPAD(n::text, 3, '0'),
    '教室 ' || n,
    CASE 
        WHEN n <= 3 THEN 15
        WHEN n <= 5 THEN 20
        ELSE 10
    END,
    true
FROM generate_series(1, 5) n
WHERE NOT EXISTS (SELECT 1 FROM classrooms LIMIT 1);

-- ========================================
-- 4. 驗證設定
-- ========================================

-- 顯示結果
DO $$
DECLARE
    settings_count INTEGER;
    classrooms_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO settings_count FROM tutoring_center_settings;
    SELECT COUNT(*) INTO classrooms_count FROM classrooms;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '設定數量: %', settings_count;
    RAISE NOTICE '教室數量: %', classrooms_count;
    RAISE NOTICE '========================================';
END $$;