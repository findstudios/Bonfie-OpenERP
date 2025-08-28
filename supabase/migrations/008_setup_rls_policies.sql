-- ========================================
-- 設定 RLS 政策以支援 Supabase Auth
-- ========================================

-- 1. 啟用所有表格的 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- 2. Users 表格政策
-- 允許已登入用戶查看所有用戶（用於登入驗證）
CREATE POLICY "Users can view all users" ON public.users
  FOR SELECT USING (true);

-- 允許用戶更新自己的資料
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth_user_id = auth.uid());

-- 3. Roles 表格政策（公開讀取）
CREATE POLICY "Roles are viewable by everyone" ON public.roles
  FOR SELECT USING (true);

-- 4. 基於角色的政策函數
-- 檢查當前用戶是否為管理員
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.role_code = 'ADMIN'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 檢查當前用戶是否為員工或管理員
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.role_code IN ('ADMIN', 'STAFF')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. Students 表格政策
CREATE POLICY "Staff can view all students" ON public.students
  FOR SELECT USING (is_staff_or_admin());

CREATE POLICY "Staff can create students" ON public.students
  FOR INSERT WITH CHECK (is_staff_or_admin());

CREATE POLICY "Staff can update students" ON public.students
  FOR UPDATE USING (is_staff_or_admin());

CREATE POLICY "Only admin can delete students" ON public.students
  FOR DELETE USING (is_admin());

-- 6. Contacts 表格政策
CREATE POLICY "Staff can view contacts" ON public.contacts
  FOR SELECT USING (is_staff_or_admin());

CREATE POLICY "Staff can manage contacts" ON public.contacts
  FOR ALL USING (is_staff_or_admin());

-- 7. Courses 表格政策
CREATE POLICY "All users can view courses" ON public.courses
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage courses" ON public.courses
  FOR INSERT WITH CHECK (is_staff_or_admin());

CREATE POLICY "Staff can update courses" ON public.courses
  FOR UPDATE USING (is_staff_or_admin());

CREATE POLICY "Admin can delete courses" ON public.courses
  FOR DELETE USING (is_admin());

-- 8. Enrollments 表格政策
CREATE POLICY "Staff can view enrollments" ON public.enrollments
  FOR SELECT USING (is_staff_or_admin());

CREATE POLICY "Staff can manage enrollments" ON public.enrollments
  FOR ALL USING (is_staff_or_admin());

-- 9. Orders 表格政策
CREATE POLICY "Staff can view orders" ON public.orders
  FOR SELECT USING (is_staff_or_admin());

CREATE POLICY "Staff can manage orders" ON public.orders
  FOR ALL USING (is_staff_or_admin());

-- 10. Schedules 表格政策
CREATE POLICY "All users can view schedules" ON public.schedules
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage schedules" ON public.schedules
  FOR ALL USING (is_staff_or_admin());

-- 11. Attendance 表格政策
CREATE POLICY "Teachers can view relevant attendance" ON public.attendance
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      is_staff_or_admin() OR
      EXISTS (
        SELECT 1 FROM public.schedules s
        JOIN public.courses c ON s.course_id = c.course_id
        WHERE s.schedule_id = attendance.schedule_id
        AND c.instructor_id = auth_user_id()
      )
    )
  );

CREATE POLICY "Teachers can manage attendance" ON public.attendance
  FOR ALL USING (
    is_staff_or_admin() OR
    EXISTS (
      SELECT 1 FROM public.schedules s
      JOIN public.courses c ON s.course_id = c.course_id
      WHERE s.schedule_id = attendance.schedule_id
      AND c.instructor_id = auth_user_id()
    )
  );

-- 12. 為 supabase_auth_admin 授予必要權限
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO supabase_auth_admin;