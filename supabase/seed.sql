-- 測試資料種子檔案
-- 此檔案會在 supabase db reset 時自動執行

-- 1. 插入角色
INSERT INTO roles (id, role_code, role_name, permissions, is_active) VALUES
(1, 'ADMIN', '管理員', '{"all": true}', true),
(2, 'STAFF', '行政人員', '{"contacts": true, "students": true, "courses": true, "orders": true, "enrollments": true, "attendance": true, "payments": true}', true),
(3, 'TEACHER', '老師', '{"courses": true, "students": true, "attendance": true, "schedules": true}', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入測試使用者（暫時使用舊密碼格式，等安全 migration 執行後會更新）
INSERT INTO users (user_id, username, password_hash, full_name, role_id, email, phone, status) VALUES
('USR001', 'admin', 'hashed_password', '系統管理員', 1, 'admin@vibe-erp.com', '0912345678', 'active'),
('USR002', 'staff1', 'hashed_password', '陳小美', 2, 'staff1@vibe-erp.com', '0923456789', 'active'),
('USR003', 'staff2', 'hashed_password', '李大明', 2, 'staff2@vibe-erp.com', '0934567890', 'active'),
('USR004', 'teacher1', 'hashed_password', '王老師', 3, 'teacher1@vibe-erp.com', '0945678901', 'active'),
('USR005', 'teacher2', 'hashed_password', '張老師', 3, 'teacher2@vibe-erp.com', '0956789012', 'active')
ON CONFLICT (user_id) DO NOTHING;

-- 3. 插入聯絡人
INSERT INTO contacts (contact_id, full_name, phone, email, address, is_active) VALUES
('CON001', '林媽媽', '0911111111', 'lin@example.com', '台北市大安區信義路100號', true),
('CON002', '陳爸爸', '0922222222', 'chen@example.com', '台北市中山區民生東路50號', true),
('CON003', '黃家長', '0933333333', 'huang@example.com', '台北市信義區松仁路200號', true)
ON CONFLICT (contact_id) DO NOTHING;

-- 4. 插入學生
INSERT INTO students (student_id, chinese_name, english_name, birth_date, notes, is_active) VALUES
('STU001', '林小明', 'Tom Lin', '2015-03-15', '數學能力優秀，英文需要加強', true),
('STU002', '陳小華', 'Amy Chen', '2014-07-22', '對科學很有興趣', true),
('STU003', '黃小美', 'Emma Huang', '2016-01-08', '喜歡藝術和音樂', true)
ON CONFLICT (student_id) DO NOTHING;

-- 5. 建立學生與聯絡人關係
INSERT INTO student_contacts (student_id, contact_id, relationship, is_primary, is_emergency, is_billing) VALUES
('STU001', 'CON001', '母親', true, true, true),
('STU002', 'CON002', '父親', true, true, true),
('STU003', 'CON003', '母親', true, true, true)
ON CONFLICT DO NOTHING;

-- 6. 插入教室
INSERT INTO classrooms (classroom_id, classroom_name, capacity, is_active) VALUES
('ROOM001', '101教室', 15, true),
('ROOM002', '102教室', 20, true),
('ROOM003', '103教室', 10, true)
ON CONFLICT (classroom_id) DO NOTHING;

-- 7. 插入課程
INSERT INTO courses (course_id, course_name, instructor_id, course_type, category, total_sessions, price_per_session, max_students, status) VALUES
('CRS001', '國小數學班', 'USR004', 'regular', '數學', 48, 600, 10, 'active'),
('CRS002', '國中英文班', 'USR005', 'regular', '英文', 48, 700, 12, 'active'),
('CRS003', '科學實驗班', 'USR004', 'theme', '科學', 12, 800, 8, 'active')
ON CONFLICT (course_id) DO NOTHING;

-- 8. 插入課程套餐
INSERT INTO course_packages (package_id, course_id, package_name, session_count, price, validity_days, is_active) VALUES
('PKG001', 'CRS001', '數學月卡', 8, 4500, 30, true),
('PKG002', 'CRS001', '數學季卡', 24, 12000, 90, true),
('PKG003', 'CRS002', '英文月卡', 8, 5200, 30, true)
ON CONFLICT (package_id) DO NOTHING;

-- 9. 插入測試訂單
INSERT INTO orders (order_id, student_id, contact_id, item_type, original_amount, discount_amount, final_amount, status, created_by) VALUES
('ORD001', 'STU001', 'CON001', 'enrollment', 4500, 0, 4500, 'completed', 'USR002'),
('ORD002', 'STU002', 'CON002', 'enrollment', 5200, 0, 5200, 'completed', 'USR002')
ON CONFLICT (order_id) DO NOTHING;

-- 10. 插入訂單項目
INSERT INTO order_items (order_id, item_type, item_id, item_name, quantity, unit_price, total_price, discount_amount, final_price, package_id) VALUES
('ORD001', 'package', 'PKG001', '數學月卡', 1, 4500, 4500, 0, 4500, 'PKG001'),
('ORD002', 'package', 'PKG003', '英文月卡', 1, 5200, 5200, 0, 5200, 'PKG003')
ON CONFLICT DO NOTHING;

-- 11. 插入報名紀錄
INSERT INTO enrollments (enrollment_id, student_id, course_id, purchased_sessions, remaining_sessions, status, package_id, valid_from, valid_until) VALUES
('ENR001', 'STU001', 'CRS001', 8, 8, 'active', 'PKG001', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),
('ENR002', 'STU002', 'CRS002', 8, 8, 'active', 'PKG003', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days')
ON CONFLICT (enrollment_id) DO NOTHING;

-- 12. 插入系統設定
INSERT INTO tutoring_center_settings (setting_key, setting_value, description, updated_by) VALUES
('business_hours', '{"monday": {"open": "09:00", "close": "21:00"}, "tuesday": {"open": "09:00", "close": "21:00"}}', '營業時間設定', 'USR001'),
('payment_methods', '["cash", "transfer", "credit_card"]', '支付方式設定', 'USR001'),
('session_duration', '{"default": 90, "min": 60, "max": 120}', '課程時長設定（分鐘）', 'USR001')
ON CONFLICT (setting_key) DO NOTHING;

-- 重置序列
SELECT setval('roles_id_seq', COALESCE((SELECT MAX(id) FROM roles), 1), true);
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1), true);
SELECT setval('contacts_id_seq', COALESCE((SELECT MAX(id) FROM contacts), 1), true);
SELECT setval('students_id_seq', COALESCE((SELECT MAX(id) FROM students), 1), true);
SELECT setval('courses_id_seq', COALESCE((SELECT MAX(id) FROM courses), 1), true);
SELECT setval('orders_id_seq', COALESCE((SELECT MAX(id) FROM orders), 1), true);
SELECT setval('enrollments_id_seq', COALESCE((SELECT MAX(id) FROM enrollments), 1), true);