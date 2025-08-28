-- ====================================================
-- 修復 tutoring_center_settings 表的 RLS 政策
-- 日期：2025-01-25
-- 目的：修復 406 錯誤 - 允許所有已認證用戶查看設定
-- ====================================================

-- 1. 刪除現有的政策
DROP POLICY IF EXISTS "admin_only_settings" ON tutoring_center_settings;

-- 2. 創建新的 RLS 政策
-- ====================================================

-- 2.1 允許所有已認證用戶查看設定
CREATE POLICY "authenticated_users_view_settings" ON tutoring_center_settings
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- 2.2 只有管理員可以新增設定
CREATE POLICY "admin_insert_settings" ON tutoring_center_settings
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.auth_user_id = auth.uid()
      AND r.role_code = 'ADMIN'
      AND u.status = 'active'
    )
  );

-- 2.3 只有管理員可以更新設定
CREATE POLICY "admin_update_settings" ON tutoring_center_settings
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.auth_user_id = auth.uid()
      AND r.role_code = 'ADMIN'
      AND u.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.auth_user_id = auth.uid()
      AND r.role_code = 'ADMIN'
      AND u.status = 'active'
    )
  );

-- 2.4 只有管理員可以刪除設定
CREATE POLICY "admin_delete_settings" ON tutoring_center_settings
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.auth_user_id = auth.uid()
      AND r.role_code = 'ADMIN'
      AND u.status = 'active'
    )
  );

-- 3. 確保表格有預設的基本設定
-- ====================================================
INSERT INTO tutoring_center_settings (setting_key, setting_value, description)
VALUES 
  ('basic_info', '{"name": "補習班管理系統", "phone": "", "address": "", "email": ""}', '基本資訊設定'),
  ('receipt_config', '{"prefix": "RC", "starting_number": 1, "show_logo": true}', '收據設定'),
  ('system_config', '{"timezone": "Asia/Taipei", "date_format": "YYYY-MM-DD", "currency": "TWD"}', '系統設定'),
  ('course_categories', '[{"name": "數學", "description": "各年級數學課程", "color": "#3B82F6", "is_active": true}, {"name": "英文", "description": "英語聽說讀寫課程", "color": "#10B981", "is_active": true}, {"name": "程式設計", "description": "程式語言與邏輯思維", "color": "#8B5CF6", "is_active": true}, {"name": "繪畫", "description": "美術創作與技法", "color": "#F59E0B", "is_active": true}, {"name": "音樂", "description": "樂器演奏與音樂理論", "color": "#EF4444", "is_active": true}, {"name": "其他", "description": "其他類型課程", "color": "#6B7280", "is_active": true}]', '課程分類設定')
ON CONFLICT (setting_key) DO NOTHING;