-- ================================================
-- 新資料庫初始化腳本 (ERP-Bonfie)
-- 執行順序：在 Supabase Dashboard SQL Editor 執行
-- ================================================

-- =====================================
-- PART 1: 基礎表結構
-- =====================================

-- 1. 角色表
CREATE TABLE IF NOT EXISTS public.roles (
  id SERIAL PRIMARY KEY,
  role_code VARCHAR NOT NULL UNIQUE,
  role_name VARCHAR NOT NULL,
  permissions JSONB,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 使用者表 (支援 Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL UNIQUE,
  username VARCHAR NOT NULL UNIQUE,
  password_hash VARCHAR NOT NULL DEFAULT '$2b$10$dummy',
  full_name VARCHAR NOT NULL,
  role_id INTEGER NOT NULL REFERENCES public.roles(id),
  phone VARCHAR,
  email VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'active',
  last_login_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  avatar_url TEXT,
  auth_user_id UUID -- 關聯 Supabase Auth
);

-- 3. 聯絡人表
CREATE TABLE IF NOT EXISTS public.contacts (
  id SERIAL PRIMARY KEY,
  contact_id VARCHAR NOT NULL UNIQUE,
  full_name VARCHAR NOT NULL,
  phone VARCHAR,
  email VARCHAR,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1,
  last_modified_by VARCHAR
);

-- 4. 學生表
CREATE TABLE IF NOT EXISTS public.students (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR NOT NULL UNIQUE,
  chinese_name VARCHAR NOT NULL,
  english_name VARCHAR,
  birth_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. 學生聯絡人關聯表
CREATE TABLE IF NOT EXISTS public.student_contacts (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR NOT NULL REFERENCES public.students(student_id),
  contact_id VARCHAR NOT NULL REFERENCES public.contacts(contact_id),
  relationship VARCHAR NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  is_emergency BOOLEAN DEFAULT false,
  is_billing BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1,
  last_modified_by VARCHAR
);

-- 6. 教室表
CREATE TABLE IF NOT EXISTS public.classrooms (
  id SERIAL PRIMARY KEY,
  classroom_id VARCHAR NOT NULL UNIQUE,
  classroom_name VARCHAR NOT NULL,
  capacity INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 7. 課程表
CREATE TABLE IF NOT EXISTS public.courses (
  id SERIAL PRIMARY KEY,
  course_id VARCHAR NOT NULL UNIQUE,
  course_name VARCHAR NOT NULL,
  instructor_id VARCHAR NOT NULL,
  course_type VARCHAR DEFAULT 'regular',
  category VARCHAR,
  total_sessions INTEGER NOT NULL,
  price_per_session NUMERIC,
  max_students INTEGER DEFAULT 10,
  status VARCHAR DEFAULT 'planning',
  schedule_pattern JSONB,
  description TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  course_category VARCHAR CHECK (course_category IN ('theme', 'regular')),
  duration_weeks INTEGER,
  start_date DATE,
  end_date DATE,
  allow_package_purchase BOOLEAN DEFAULT false,
  default_validity_days INTEGER DEFAULT 180
);

-- 8. 課程套餐表
CREATE TABLE IF NOT EXISTS public.course_packages (
  id SERIAL PRIMARY KEY,
  package_id VARCHAR NOT NULL UNIQUE DEFAULT CONCAT('PKG', TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'), LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0')),
  course_id VARCHAR REFERENCES public.courses(course_id),
  package_name VARCHAR NOT NULL,
  session_count INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  discount_percentage NUMERIC DEFAULT 0,
  validity_days INTEGER DEFAULT 180,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. 註冊表
CREATE TABLE IF NOT EXISTS public.enrollments (
  id SERIAL PRIMARY KEY,
  enrollment_id VARCHAR NOT NULL UNIQUE,
  student_id VARCHAR NOT NULL REFERENCES public.students(student_id),
  course_id VARCHAR NOT NULL REFERENCES public.courses(course_id),
  purchased_sessions INTEGER NOT NULL,
  remaining_sessions INTEGER NOT NULL,
  bonus_sessions INTEGER DEFAULT 0,
  status VARCHAR DEFAULT 'active',
  source VARCHAR DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  enrollment_category VARCHAR DEFAULT 'regular' CHECK (enrollment_category IN ('theme', 'regular')),
  package_id VARCHAR REFERENCES public.course_packages(package_id),
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  is_expired BOOLEAN DEFAULT false,
  extended_times INTEGER DEFAULT 0,
  last_extended_at TIMESTAMP WITHOUT TIME ZONE,
  last_extended_by VARCHAR
);

-- 10. 課表表
CREATE TABLE IF NOT EXISTS public.schedules (
  id SERIAL PRIMARY KEY,
  schedule_id VARCHAR NOT NULL UNIQUE,
  course_id VARCHAR NOT NULL REFERENCES public.courses(course_id),
  class_datetime TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  session_number INTEGER,
  classroom VARCHAR,
  status VARCHAR DEFAULT 'scheduled',
  is_makeup BOOLEAN DEFAULT false,
  makeup_for_schedule_id VARCHAR REFERENCES public.schedules(schedule_id),
  notes TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. 出席表
CREATE TABLE IF NOT EXISTS public.attendance (
  id SERIAL PRIMARY KEY,
  schedule_id VARCHAR NOT NULL REFERENCES public.schedules(schedule_id),
  student_id VARCHAR NOT NULL REFERENCES public.students(student_id),
  enrollment_id VARCHAR NOT NULL REFERENCES public.enrollments(enrollment_id),
  status VARCHAR DEFAULT 'present',
  session_deducted BOOLEAN DEFAULT true,
  teacher_notes TEXT,
  marked_at TIMESTAMP WITHOUT TIME ZONE,
  marked_by VARCHAR,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. 訂單表
CREATE TABLE IF NOT EXISTS public.orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR NOT NULL UNIQUE,
  student_id VARCHAR NOT NULL REFERENCES public.students(student_id),
  contact_id VARCHAR NOT NULL REFERENCES public.contacts(contact_id),
  item_type VARCHAR DEFAULT 'enrollment',
  original_amount NUMERIC NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  final_amount NUMERIC NOT NULL,
  status VARCHAR DEFAULT 'pending',
  discount_reason TEXT,
  created_by VARCHAR,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. 訂單項目表
CREATE TABLE IF NOT EXISTS public.order_items (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR NOT NULL REFERENCES public.orders(order_id),
  item_type VARCHAR NOT NULL,
  item_id VARCHAR,
  item_name VARCHAR NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  final_price NUMERIC NOT NULL,
  notes TEXT,
  package_id VARCHAR REFERENCES public.course_packages(package_id),
  validity_days INTEGER
);

-- 14. 付款表
CREATE TABLE IF NOT EXISTS public.payments (
  id SERIAL PRIMARY KEY,
  payment_id VARCHAR NOT NULL UNIQUE,
  order_id VARCHAR NOT NULL REFERENCES public.orders(order_id),
  amount_paid NUMERIC NOT NULL,
  payment_method VARCHAR DEFAULT 'cash',
  payment_date DATE NOT NULL,
  receipt_number VARCHAR,
  notes TEXT,
  created_by VARCHAR,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. CRM - 潛在客戶表
CREATE TABLE IF NOT EXISTS public.leads (
  id SERIAL PRIMARY KEY,
  lead_id VARCHAR NOT NULL UNIQUE,
  full_name VARCHAR NOT NULL,
  parent_name VARCHAR,
  phone VARCHAR NOT NULL,
  email VARCHAR,
  age INTEGER,
  school VARCHAR,
  grade VARCHAR,
  status VARCHAR DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'trial_scheduled', 'trial_completed', 'converted', 'lost')),
  source VARCHAR NOT NULL CHECK (source IN ('walk_in', 'referral', 'online', 'phone', 'social_media', 'flyer', 'event', 'other')),
  interest_subjects TEXT[],
  budget_range VARCHAR,
  preferred_schedule VARCHAR,
  notes TEXT,
  assigned_to VARCHAR,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. 系統設定表
CREATE TABLE IF NOT EXISTS public.tutoring_center_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by VARCHAR,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- PART 2: 初始資料
-- =====================================

-- 插入角色
INSERT INTO public.roles (role_code, role_name, permissions, description, is_active)
VALUES 
  ('ADMIN', '管理員', '{"all": true}', '系統管理員，擁有所有權限', true),
  ('STAFF', '行政人員', '{"students": true, "courses": true, "orders": true, "reports": true}', '行政人員，管理日常營運', true),
  ('TEACHER', '教師', '{"attendance": true, "students": ["read"], "courses": ["read"]}', '教師，管理課堂和出席', true)
ON CONFLICT (role_code) DO NOTHING;

-- 插入預設教室
INSERT INTO public.classrooms (classroom_id, classroom_name, capacity, is_active)
VALUES 
  ('ROOM001', '教室 A', 15, true),
  ('ROOM002', '教室 B', 12, true),
  ('ROOM003', '教室 C', 10, true),
  ('ROOM004', '教室 D', 8, true)
ON CONFLICT (classroom_id) DO NOTHING;

-- 插入系統設定
INSERT INTO public.tutoring_center_settings (setting_key, setting_value, description)
VALUES 
  ('business_info', '{"name": "邦妃美術 Bonfie Art", "phone": "", "address": "", "email": "hi@inception-x.com"}', '營業資訊'),
  ('receipt_settings', '{"prefix": "RC", "show_logo": true, "footer_text": "感謝您的支持"}', '收據設定'),
  ('system_config', '{"timezone": "Asia/Taipei", "language": "zh-TW", "currency": "TWD"}', '系統設定')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================
-- PART 3: Row Level Security (RLS)
-- =====================================

-- 啟用 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 基本 RLS 政策 (允許所有認證用戶讀取)
CREATE POLICY "Enable read for authenticated users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Enable read for authenticated users" ON public.students
  FOR SELECT USING (true);

CREATE POLICY "Enable read for authenticated users" ON public.courses
  FOR SELECT USING (true);

-- =====================================
-- PART 4: 創建索引優化效能
-- =====================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON public.students(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_course ON public.enrollments(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_schedules_course_datetime ON public.schedules(course_id, class_datetime);
CREATE INDEX IF NOT EXISTS idx_attendance_schedule_student ON public.attendance(schedule_id, student_id);

-- =====================================
-- 完成提示
-- =====================================
DO $$
BEGIN
  RAISE NOTICE '===============================================';
  RAISE NOTICE '✅ 資料庫初始化完成！';
  RAISE NOTICE '===============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 下一步：在 Supabase Authentication 創建用戶';
  RAISE NOTICE '';
  RAISE NOTICE '1. 前往 Authentication > Users';
  RAISE NOTICE '2. 點擊 Add user > Create new user';
  RAISE NOTICE '3. 創建管理員：';
  RAISE NOTICE '   Email: admin@bonfieart.com';
  RAISE NOTICE '   Password: (自訂密碼)';
  RAISE NOTICE '   User Metadata: {"role_id": 1, "full_name": "系統管理員"}';
  RAISE NOTICE '';
  RAISE NOTICE '4. 複製生成的 User ID';
  RAISE NOTICE '5. 執行以下 SQL 創建對應的 public.users 記錄：';
  RAISE NOTICE '';
  RAISE NOTICE 'INSERT INTO public.users (user_id, username, email, password_hash, full_name, role_id, status, auth_user_id)';
  RAISE NOTICE 'VALUES (''ADMIN001'', ''admin'', ''admin@bonfieart.com'', ''$2b$10$dummy'', ''系統管理員'', 1, ''active'', ''貼上User ID''::uuid);';
END $$;