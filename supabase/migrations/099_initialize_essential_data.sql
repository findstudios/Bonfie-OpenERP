-- 初始化必要資料
-- 此檔案應在 Supabase SQL Editor 中以管理員身份執行
-- 可以繞過 RLS 限制來建立初始資料

-- 臨時停用 RLS 進行資料初始化
-- 注意：這只能由 Supabase 管理員執行

-- 1. 插入角色資料 (如果不存在)
INSERT INTO public.roles (id, role_code, role_name, permissions, description, is_active) 
VALUES 
  (1, 'ADMIN', '管理員', '{"all": true}', '系統管理員，擁有所有權限', true),
  (2, 'STAFF', '行政人員', '{"contacts": true, "students": true, "courses": true, "orders": true, "enrollments": true, "attendance": true, "payments": true, "leads": true, "trial_classes": true}', '行政人員，負責日常營運管理', true),
  (3, 'TEACHER', '老師', '{"courses": true, "students": true, "attendance": true, "schedules": true}', '授課老師，負責教學和出勤管理', true)
ON CONFLICT (id) DO UPDATE SET
  role_name = EXCLUDED.role_name,
  permissions = EXCLUDED.permissions,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- 2. 插入教室資料 (如果不存在)
INSERT INTO public.classrooms (classroom_id, classroom_name, capacity, is_active) 
VALUES 
  ('ROOM001', '101教室', 15, true),
  ('ROOM002', '102教室', 20, true),
  ('ROOM003', '小會議室', 8, true),
  ('ROOM004', '大講堂', 50, true)
ON CONFLICT (classroom_id) DO UPDATE SET
  classroom_name = EXCLUDED.classroom_name,
  capacity = EXCLUDED.capacity,
  updated_at = CURRENT_TIMESTAMP;

-- 3. 插入系統設定 (如果不存在)
INSERT INTO public.tutoring_center_settings (setting_key, setting_value, description, updated_by) 
VALUES 
  ('business_hours', '{"monday": {"open": "09:00", "close": "21:00"}, "tuesday": {"open": "09:00", "close": "21:00"}, "wednesday": {"open": "09:00", "close": "21:00"}, "thursday": {"open": "09:00", "close": "21:00"}, "friday": {"open": "09:00", "close": "21:00"}, "saturday": {"open": "09:00", "close": "18:00"}, "sunday": {"open": "13:00", "close": "18:00"}}', '補習班營業時間設定', 'USR001'),
  ('payment_methods', '["cash", "transfer", "credit_card", "line_pay"]', '支援的付款方式', 'USR001'),
  ('session_duration', '{"default": 90, "min": 60, "max": 120}', '課程時長設定（分鐘）', 'USR001'),
  ('center_info', '{"name": "學習教育中心", "address": "台北市大安區復興南路100號", "phone": "02-2345-6789", "email": "info@tutoring-center.com", "website": "https://tutoring-center.com"}', '補習班基本資訊', 'USR001')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- 4. 重設序列以確保正確的 ID 生成
SELECT setval('roles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM roles), true);
SELECT setval('classrooms_id_seq', (SELECT COALESCE(MAX(id), 1) FROM classrooms), true);
SELECT setval('tutoring_center_settings_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tutoring_center_settings), true);

-- 5. 建立預設的 public.users 記錄，準備與 auth.users 連結
-- 注意：password_hash 是占位符，實際認證將透過 Supabase Auth
INSERT INTO public.users (user_id, username, password_hash, full_name, role_id, email, phone, status) 
VALUES 
  ('USR001', 'admin', 'supabase_auth', '系統管理員', 1, 'admin@tutoring-center.com', '0912345678', 'active'),
  ('USR002', 'staff1', 'supabase_auth', '陳小美', 2, 'staff1@tutoring-center.com', '0923456789', 'active'),
  ('USR003', 'teacher1', 'supabase_auth', '王老師', 3, 'teacher1@tutoring-center.com', '0945678901', 'active')
ON CONFLICT (user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role_id = EXCLUDED.role_id,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  updated_at = CURRENT_TIMESTAMP;

-- 6. 更新 users 序列
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users), true);

-- 7. 顯示完成訊息和下一步指示
DO $$
BEGIN
  RAISE NOTICE '===============================================';
  RAISE NOTICE '🎉 資料庫初始化完成！';
  RAISE NOTICE '===============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 接下來請在 Supabase Authentication 建立使用者：';
  RAISE NOTICE '';
  RAISE NOTICE '1. 管理員帳號:';
  RAISE NOTICE '   Email: jamy@bonfieart.com';
  RAISE NOTICE '   Password: Jamy1206';
  RAISE NOTICE '   Metadata: {"role_id": 1, "full_name": "Jamy"}';
  RAISE NOTICE '';
  RAISE NOTICE '2. 行政人員帳號:';
  RAISE NOTICE '   Email: staff1@tutoring-center.com';
  RAISE NOTICE '   Password: Staff123!';
  RAISE NOTICE '   Metadata: {"role_id": 2, "full_name": "陳小美"}';
  RAISE NOTICE '';
  RAISE NOTICE '3. 教師帳號:';
  RAISE NOTICE '   Email: teacher1@tutoring-center.com';
  RAISE NOTICE '   Password: Teacher123!';
  RAISE NOTICE '   Metadata: {"role_id": 3, "full_name": "王老師"}';
  RAISE NOTICE '';
  RAISE NOTICE '建立完成後，執行 npm run test:db 驗證設定';
  RAISE NOTICE '===============================================';
END $$;

-- 8. 驗證資料是否正確建立
DO $$
DECLARE
  role_count INTEGER;
  user_count INTEGER;
  classroom_count INTEGER;
  setting_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO role_count FROM roles;
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO classroom_count FROM classrooms;
  SELECT COUNT(*) INTO setting_count FROM tutoring_center_settings;
  
  RAISE NOTICE '資料統計:';
  RAISE NOTICE '- 角色數量: %', role_count;
  RAISE NOTICE '- 使用者數量: %', user_count;
  RAISE NOTICE '- 教室數量: %', classroom_count;
  RAISE NOTICE '- 系統設定數量: %', setting_count;
END $$;