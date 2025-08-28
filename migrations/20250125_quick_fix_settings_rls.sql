-- 快速修復設定頁面的 RLS 問題
-- 這是一個簡化版本，直接解決 406 錯誤

-- 1. 對 tutoring_center_settings 表禁用 RLS（如果設定不敏感）
ALTER TABLE tutoring_center_settings DISABLE ROW LEVEL SECURITY;

-- 或者，如果你想保留 RLS，使用以下方式：
-- ALTER TABLE tutoring_center_settings ENABLE ROW LEVEL SECURITY;
-- 
-- -- 允許所有人讀取
-- DROP POLICY IF EXISTS "public_read_settings" ON tutoring_center_settings;
-- CREATE POLICY "public_read_settings" 
-- ON tutoring_center_settings 
-- FOR SELECT 
-- USING (true);
-- 
-- -- 只有管理員可以修改
-- DROP POLICY IF EXISTS "admin_write_settings" ON tutoring_center_settings;
-- CREATE POLICY "admin_write_settings" 
-- ON tutoring_center_settings 
-- FOR INSERT OR UPDATE OR DELETE 
-- USING (
--     auth.uid() IN (
--         SELECT auth_user_id FROM users WHERE role_id = 1
--     )
-- );

-- 2. 確保教室表可以被讀取
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_classrooms" ON classrooms;
CREATE POLICY "public_read_classrooms" 
ON classrooms 
FOR SELECT 
USING (true);  -- 允許所有人讀取

-- 3. 插入測試資料
INSERT INTO tutoring_center_settings (setting_key, setting_value, description)
VALUES 
    ('basic_info', '{"centerName": "測試補習班"}'::jsonb, '基本資訊'),
    ('course_categories', '["國文", "英文", "數學"]'::jsonb, '課程分類')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO classrooms (classroom_id, classroom_name, capacity)
VALUES 
    ('ROOM001', '教室 A', 20),
    ('ROOM002', '教室 B', 15)
ON CONFLICT (classroom_id) DO NOTHING;