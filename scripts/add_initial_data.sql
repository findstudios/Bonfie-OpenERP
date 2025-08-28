-- ================================================
-- 初始資料插入腳本
-- 在執行完 COMPLETE_SCHEMA_FIXED.sql 後執行此檔案
-- ================================================

-- 重置序列（確保從 1 開始）
ALTER SEQUENCE roles_id_seq RESTART WITH 1;

-- 插入角色
INSERT INTO public.roles (id, role_code, role_name, permissions, description, is_active)
VALUES 
  (1, 'ADMIN', '管理員', '{"all": true}', '系統管理員，擁有所有權限', true),
  (2, 'STAFF', '行政人員', '{"students": true, "courses": true, "orders": true, "reports": true}', '行政人員，管理日常營運', true),
  (3, 'TEACHER', '教師', '{"attendance": true, "students": ["read"], "courses": ["read"]}', '教師，管理課堂和出席', true)
ON CONFLICT (id) DO UPDATE SET
  permissions = EXCLUDED.permissions,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- 確保序列值正確
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));

-- 插入預設教室
INSERT INTO public.classrooms (classroom_id, classroom_name, capacity, is_active)
VALUES 
  ('ROOM001', '教室 A', 15, true),
  ('ROOM002', '教室 B', 12, true),
  
ON CONFLICT (classroom_id) DO NOTHING;

-- 插入系統設定
INSERT INTO public.tutoring_center_settings (setting_key, setting_value, description)
VALUES 
  ('business_info', '{"name": "邦飛藝舍 Bonfie Art", "phone": "", "address": "", "email": "jamy@bonfieart.com"}', '營業資訊'),
  ('receipt_settings', '{"prefix": "RC", "show_logo": true, "footer_text": "感謝您的支持"}', '收據設定'),
  ('system_config', '{"timezone": "Asia/Taipei", "language": "zh-TW", "currency": "TWD"}', '系統設定'),
  ('class_settings', '{"default_duration": 90, "break_time": 10, "advance_booking_days": 30}', '課程設定'),
  ('notification_settings', '{"email_enabled": true, "sms_enabled": false, "reminder_hours": 24}', '通知設定')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = CURRENT_TIMESTAMP;

-- 插入預設標籤
INSERT INTO public.tags (tag_id, name, color, description)
VALUES 
  ('TAG001', '重點關注', '#FF0000', '需要特別關注的潛在客戶'),
  ('TAG002', '已聯繫', '#00FF00', '已經成功聯繫的潛在客戶'),
  ('TAG003', '待跟進', '#FFFF00', '需要後續跟進的潛在客戶'),
  ('TAG004', 'VIP', '#800080', '重要客戶')
ON CONFLICT (tag_id) DO NOTHING;

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===============================================';
  RAISE NOTICE '✅ 初始資料插入完成！';
  RAISE NOTICE '===============================================';
  RAISE NOTICE '';
  RAISE NOTICE '已插入：';
  RAISE NOTICE '  - 3 個角色（管理員、行政人員、教師）';
  RAISE NOTICE '  - 4 個教室';
  RAISE NOTICE '  - 5 個系統設定';
  RAISE NOTICE '  - 4 個預設標籤';
  RAISE NOTICE '';
  RAISE NOTICE '下一步：執行 create-admin-simple.sql 建立管理員帳號';
  RAISE NOTICE '';
END $$;