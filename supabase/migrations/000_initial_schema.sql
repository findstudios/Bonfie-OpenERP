-- 初始資料庫結構
-- 適用於新的開發環境

-- 1. 建立角色表
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

-- 2. 建立使用者表
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL UNIQUE,
  username VARCHAR NOT NULL UNIQUE,
  password_hash VARCHAR NOT NULL,
  full_name VARCHAR NOT NULL,
  role_id INTEGER NOT NULL REFERENCES public.roles(id),
  phone VARCHAR,
  email VARCHAR,
  status VARCHAR DEFAULT 'active',
  last_login_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  avatar_url TEXT
);

-- 3. 建立聯絡人表
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

-- 4. 建立學生表
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

-- 5. 建立學生聯絡人關聯表
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

-- 6. 建立教室表
CREATE TABLE IF NOT EXISTS public.classrooms (
  id SERIAL PRIMARY KEY,
  classroom_id VARCHAR NOT NULL UNIQUE,
  classroom_name VARCHAR NOT NULL,
  capacity INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- 7. 建立課程表
CREATE TABLE IF NOT EXISTS public.courses (
  id SERIAL PRIMARY KEY,
  course_id VARCHAR NOT NULL UNIQUE,
  course_name VARCHAR NOT NULL,
  instructor_id VARCHAR NOT NULL REFERENCES public.users(user_id),
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

-- 8. 建立課程套餐表
CREATE TABLE IF NOT EXISTS public.course_packages (
  id SERIAL PRIMARY KEY,
  package_id VARCHAR NOT NULL UNIQUE DEFAULT concat('PKG', to_char(now(), 'YYYYMMDDHH24MISS'), lpad((floor((random() * 1000)))::text, 3, '0')),
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

-- 9. 建立訂單表
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
  created_by VARCHAR REFERENCES public.users(user_id),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. 建立訂單項目表
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

-- 11. 建立報名表
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
  last_extended_by VARCHAR REFERENCES public.users(user_id)
);

-- 12. 建立課程時間表
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

-- 13. 建立出席表
CREATE TABLE IF NOT EXISTS public.attendance (
  id SERIAL PRIMARY KEY,
  schedule_id VARCHAR NOT NULL REFERENCES public.schedules(schedule_id),
  student_id VARCHAR NOT NULL REFERENCES public.students(student_id),
  enrollment_id VARCHAR NOT NULL REFERENCES public.enrollments(enrollment_id),
  status VARCHAR DEFAULT 'present',
  session_deducted BOOLEAN DEFAULT true,
  teacher_notes TEXT,
  marked_at TIMESTAMP WITHOUT TIME ZONE,
  marked_by VARCHAR REFERENCES public.users(user_id),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. 建立付款表
CREATE TABLE IF NOT EXISTS public.payments (
  id SERIAL PRIMARY KEY,
  payment_id VARCHAR NOT NULL UNIQUE,
  order_id VARCHAR NOT NULL REFERENCES public.orders(order_id),
  amount_paid NUMERIC NOT NULL,
  payment_method VARCHAR DEFAULT 'cash',
  payment_date DATE NOT NULL,
  receipt_number VARCHAR,
  notes TEXT,
  created_by VARCHAR REFERENCES public.users(user_id),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. 建立稽核日誌表
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES public.users(user_id),
  action VARCHAR NOT NULL,
  table_name VARCHAR,
  record_id VARCHAR,
  old_values JSONB,
  new_values JSONB,
  old_amount NUMERIC,
  new_amount NUMERIC,
  old_status VARCHAR,
  new_status VARCHAR,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. 建立系統設定表
CREATE TABLE IF NOT EXISTS public.tutoring_center_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by VARCHAR REFERENCES public.users(user_id),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 建立索引
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_user_id ON public.users(user_id);
CREATE INDEX idx_students_student_id ON public.students(student_id);
CREATE INDEX idx_contacts_contact_id ON public.contacts(contact_id);
CREATE INDEX idx_orders_order_id ON public.orders(order_id);
CREATE INDEX idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX idx_attendance_schedule_id ON public.attendance(schedule_id);
CREATE INDEX idx_schedules_course_id ON public.schedules(course_id);
CREATE INDEX idx_schedules_class_datetime ON public.schedules(class_datetime);

-- 建立更新時間的觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為需要的表建立觸發器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON public.enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();