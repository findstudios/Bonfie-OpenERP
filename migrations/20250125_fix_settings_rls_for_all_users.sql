-- 修復 tutoring_center_settings 的 RLS 政策
-- 允許所有已登入用戶讀取基本設定

-- 檢查並創建更寬鬆的讀取政策
DO $$
BEGIN
    -- 刪除可能過於嚴格的舊政策
    DROP POLICY IF EXISTS "authenticated_users_view_settings" ON tutoring_center_settings;
    DROP POLICY IF EXISTS "users_view_settings" ON tutoring_center_settings;
    
    -- 創建新的讀取政策：允許所有已登入用戶讀取所有設定
    CREATE POLICY "all_authenticated_users_can_read_settings" 
    ON tutoring_center_settings 
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);
    
    -- 保留原有的修改政策（只有 admin 可以修改）
    -- 這個政策應該已經存在，但為了安全起見檢查一下
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tutoring_center_settings' 
        AND policyname = 'admin_manage_settings'
    ) THEN
        CREATE POLICY "admin_manage_settings" 
        ON tutoring_center_settings 
        FOR ALL 
        USING (
            auth.uid() IN (
                SELECT auth_user_id 
                FROM users 
                WHERE role_id = (SELECT id FROM roles WHERE role_code = 'ADMIN')
            )
        );
    END IF;
END $$;

-- 確保 basic_info 設定存在（如果不存在則創建預設值）
INSERT INTO tutoring_center_settings (setting_key, setting_value, description)
VALUES (
    'basic_info',
    '{
        "centerName": "補習班名稱",
        "address": "補習班地址",
        "phone": "補習班電話",
        "email": "contact@example.com"
    }'::jsonb,
    '補習班基本資訊'
)
ON CONFLICT (setting_key) DO NOTHING;

-- 檢查其他常用設定是否存在
INSERT INTO tutoring_center_settings (setting_key, setting_value, description)
VALUES 
    ('course_categories', '["國文", "英文", "數學", "自然", "社會"]'::jsonb, '課程分類'),
    ('class_time_slots', '["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"]'::jsonb, '上課時段'),
    ('receipt_settings', '{"prefix": "RC", "startNumber": 1000}'::jsonb, '收據設定')
ON CONFLICT (setting_key) DO NOTHING;