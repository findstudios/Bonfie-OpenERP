-- 全面資料庫優化
-- 在實施 Supabase Auth 的同時進行

-- ========================================
-- 1. 資料清理與去重
-- ========================================

-- 1.1 清理重複的聯絡人（保留最新的）
WITH duplicate_contacts AS (
  SELECT 
    phone,
    MAX(id) as keep_id,
    COUNT(*) as dup_count
  FROM public.contacts
  WHERE phone IS NOT NULL AND phone != ''
  GROUP BY phone
  HAVING COUNT(*) > 1
)
DELETE FROM public.contacts c
USING duplicate_contacts dc
WHERE c.phone = dc.phone 
  AND c.id != dc.keep_id;

-- 1.2 清理重複的學生（基於姓名和生日）
WITH duplicate_students AS (
  SELECT 
    chinese_name,
    birth_date,
    MAX(id) as keep_id
  FROM public.students
  WHERE chinese_name IS NOT NULL
  GROUP BY chinese_name, birth_date
  HAVING COUNT(*) > 1
)
UPDATE public.student_contacts sc
SET student_id = (
  SELECT s1.student_id 
  FROM students s1
  JOIN duplicate_students ds ON s1.chinese_name = ds.chinese_name 
    AND (s1.birth_date = ds.birth_date OR (s1.birth_date IS NULL AND ds.birth_date IS NULL))
  WHERE s1.id = ds.keep_id
)
WHERE sc.student_id IN (
  SELECT s2.student_id 
  FROM students s2
  JOIN duplicate_students ds ON s2.chinese_name = ds.chinese_name 
    AND (s2.birth_date = ds.birth_date OR (s2.birth_date IS NULL AND ds.birth_date IS NULL))
  WHERE s2.id != ds.keep_id
);

-- 刪除重複學生
DELETE FROM public.students s
USING duplicate_students ds
WHERE s.chinese_name = ds.chinese_name 
  AND (s.birth_date = ds.birth_date OR (s.birth_date IS NULL AND ds.birth_date IS NULL))
  AND s.id != ds.keep_id;

-- ========================================
-- 2. 加強資料完整性
-- ========================================

-- 2.1 加入缺失的唯一約束
ALTER TABLE public.contacts 
ADD CONSTRAINT unique_contact_phone 
UNIQUE (phone) 
WHERE phone IS NOT NULL AND phone != '';

ALTER TABLE public.students 
ADD CONSTRAINT unique_student_name_birth 
UNIQUE (chinese_name, birth_date);

-- 2.2 加入級聯刪除（避免孤兒資料）
ALTER TABLE public.student_contacts
DROP CONSTRAINT IF EXISTS student_contacts_student_id_fkey,
ADD CONSTRAINT student_contacts_student_id_fkey 
  FOREIGN KEY (student_id) 
  REFERENCES public.students(student_id) 
  ON DELETE CASCADE;

ALTER TABLE public.enrollments
DROP CONSTRAINT IF EXISTS enrollments_student_id_fkey,
ADD CONSTRAINT enrollments_student_id_fkey 
  FOREIGN KEY (student_id) 
  REFERENCES public.students(student_id) 
  ON DELETE CASCADE;

ALTER TABLE public.attendance
DROP CONSTRAINT IF EXISTS attendance_student_id_fkey,
ADD CONSTRAINT attendance_student_id_fkey 
  FOREIGN KEY (student_id) 
  REFERENCES public.students(student_id) 
  ON DELETE CASCADE;

-- ========================================
-- 3. 效能優化索引
-- ========================================

-- 3.1 常用查詢索引
CREATE INDEX IF NOT EXISTS idx_enrollments_status_student 
ON public.enrollments(status, student_id) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_enrollments_valid_until 
ON public.enrollments(valid_until) 
WHERE status = 'active' AND valid_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_date 
ON public.attendance(marked_at);

CREATE INDEX IF NOT EXISTS idx_schedules_datetime 
ON public.schedules(class_datetime) 
WHERE status = 'scheduled';

-- 3.2 外鍵索引（加速 JOIN）
CREATE INDEX IF NOT EXISTS idx_student_contacts_contact_id 
ON public.student_contacts(contact_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_course_id 
ON public.enrollments(course_id);

CREATE INDEX IF NOT EXISTS idx_orders_student_id 
ON public.orders(student_id);

-- ========================================
-- 4. 資料表結構優化
-- ========================================

-- 4.1 新增有用的計算欄位
ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS days_until_expiry INTEGER 
GENERATED ALWAYS AS (
  CASE 
    WHEN valid_until IS NOT NULL THEN 
      EXTRACT(DAY FROM valid_until - CURRENT_DATE)::INTEGER
    ELSE NULL
  END
) STORED;

-- 4.2 新增審計欄位
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS created_by VARCHAR REFERENCES public.users(user_id);

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS created_by VARCHAR REFERENCES public.users(user_id);

-- ========================================
-- 5. 新的 RLS 政策（配合 Supabase Auth）
-- ========================================

-- 5.1 Contacts 表
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contacts_select_policy" ON public.contacts;
CREATE POLICY "contacts_select_policy" ON public.contacts
  FOR SELECT USING (
    is_staff_or_admin() OR
    -- 教師只能看到自己學生的聯絡人
    contact_id IN (
      SELECT DISTINCT sc.contact_id
      FROM student_contacts sc
      JOIN enrollments e ON e.student_id = sc.student_id
      JOIN courses c ON c.course_id = e.course_id
      WHERE c.instructor_id = auth_user_id()
    )
  );

DROP POLICY IF EXISTS "contacts_insert_policy" ON public.contacts;
CREATE POLICY "contacts_insert_policy" ON public.contacts
  FOR INSERT WITH CHECK (is_staff_or_admin());

DROP POLICY IF EXISTS "contacts_update_policy" ON public.contacts;
CREATE POLICY "contacts_update_policy" ON public.contacts
  FOR UPDATE USING (is_staff_or_admin());

DROP POLICY IF EXISTS "contacts_delete_policy" ON public.contacts;
CREATE POLICY "contacts_delete_policy" ON public.contacts
  FOR DELETE USING (is_admin());

-- 5.2 Students 表
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_select_policy" ON public.students;
CREATE POLICY "students_select_policy" ON public.students
  FOR SELECT USING (
    is_staff_or_admin() OR
    -- 教師只能看到自己的學生
    student_id IN (
      SELECT DISTINCT e.student_id
      FROM enrollments e
      JOIN courses c ON c.course_id = e.course_id
      WHERE c.instructor_id = auth_user_id()
      AND e.status = 'active'
    )
  );

DROP POLICY IF EXISTS "students_modify_policy" ON public.students;
CREATE POLICY "students_modify_policy" ON public.students
  FOR ALL USING (is_staff_or_admin());

-- 5.3 Orders 表（財務相關 - 教師無權限）
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_policy" ON public.orders;
CREATE POLICY "orders_policy" ON public.orders
  FOR ALL USING (is_staff_or_admin());

-- 5.4 Courses 表
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "courses_select_policy" ON public.courses;
CREATE POLICY "courses_select_policy" ON public.courses
  FOR SELECT USING (true); -- 所有人都可以看課程

DROP POLICY IF EXISTS "courses_modify_policy" ON public.courses;
CREATE POLICY "courses_modify_policy" ON public.courses
  FOR INSERT WITH CHECK (is_staff_or_admin());

CREATE POLICY "courses_update_policy" ON public.courses
  FOR UPDATE USING (
    is_staff_or_admin() OR 
    (instructor_id = auth_user_id() AND auth_user_role() = 'TEACHER')
  );

-- ========================================
-- 6. 資料遷移輔助
-- ========================================

-- 6.1 創建資料健康檢查視圖
CREATE OR REPLACE VIEW public.data_health_check AS
SELECT 
  'contacts_without_phone' as issue,
  COUNT(*) as count
FROM contacts
WHERE phone IS NULL OR phone = ''
UNION ALL
SELECT 
  'students_without_contact' as issue,
  COUNT(*) as count
FROM students s
WHERE NOT EXISTS (
  SELECT 1 FROM student_contacts sc WHERE sc.student_id = s.student_id
)
UNION ALL
SELECT 
  'active_enrollments_expired' as issue,
  COUNT(*) as count
FROM enrollments
WHERE status = 'active' 
  AND valid_until < CURRENT_DATE
UNION ALL
SELECT 
  'orders_without_payment' as issue,
  COUNT(*) as count
FROM orders o
WHERE status = 'completed'
  AND NOT EXISTS (
    SELECT 1 FROM payments p WHERE p.order_id = o.order_id
  );

-- 檢查資料健康狀態
SELECT * FROM data_health_check WHERE count > 0;

-- ========================================
-- 7. 完成訊息
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '資料庫優化完成！';
  RAISE NOTICE '1. 已清理重複資料';
  RAISE NOTICE '2. 已加強資料完整性';
  RAISE NOTICE '3. 已建立效能索引';
  RAISE NOTICE '4. 已實施新的 RLS 政策';
  RAISE NOTICE '請檢查 data_health_check 視圖確認資料狀態';
  RAISE NOTICE '========================================';
END $$;