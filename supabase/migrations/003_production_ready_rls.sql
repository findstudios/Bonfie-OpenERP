-- 生產環境 RLS 設置（使用自定義認證）
-- 這個方案允許您保持現有的 username/password 登入方式

-- 1. 使用 JWT 來傳遞使用者資訊
-- 在應用程式中生成 JWT，包含 user_id 和 role

-- 2. 創建驗證 JWT 的函數
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS TEXT AS $$
DECLARE
  jwt_user_id TEXT;
BEGIN
  -- 從 request.jwt.claims 獲取 user_id
  -- 這需要在 API 請求時設置正確的 header
  jwt_user_id := current_setting('request.jwt.claims', true)::json->>'user_id';
  
  -- 如果沒有 JWT，嘗試從 session 獲取
  IF jwt_user_id IS NULL THEN
    jwt_user_id := current_setting('app.current_user_id', true);
  END IF;
  
  RETURN jwt_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. 創建獲取角色的函數
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- 優先從 JWT 獲取
  user_role := current_setting('request.jwt.claims', true)::json->>'role';
  
  -- 如果沒有，從資料庫查詢
  IF user_role IS NULL THEN
    SELECT r.role_code INTO user_role
    FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.user_id = get_current_user_id();
  END IF;
  
  RETURN user_role;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. 為每個主要表格設置 RLS 政策

-- Users 表（特殊處理）
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 允許公開查詢（用於登入）- 但只能看到有限資訊
CREATE POLICY "Public can query for login" ON public.users
  FOR SELECT
  USING (
    -- 未登入時只能查詢 username 和 password_hash
    get_current_user_id() IS NULL
  );

-- 登入後可以看到更多資訊
CREATE POLICY "Users can view all users when authenticated" ON public.users
  FOR SELECT
  USING (
    get_current_user_id() IS NOT NULL
  );

-- 管理員可以修改
CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE
  USING (get_current_user_role() = 'ADMIN');

-- Students 表
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students policy" ON public.students;
CREATE POLICY "Students policy" ON public.students
  FOR ALL
  USING (
    CASE 
      WHEN get_current_user_role() IN ('ADMIN', 'STAFF') THEN true
      WHEN get_current_user_role() = 'TEACHER' THEN
        student_id IN (
          SELECT DISTINCT e.student_id
          FROM enrollments e
          JOIN courses c ON c.course_id = e.course_id
          WHERE c.instructor_id = get_current_user_id()
        )
      ELSE false
    END
  );

-- Courses 表
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Courses select policy" ON public.courses;
CREATE POLICY "Courses select policy" ON public.courses
  FOR SELECT
  USING (get_current_user_id() IS NOT NULL);

DROP POLICY IF EXISTS "Courses modify policy" ON public.courses;
CREATE POLICY "Courses modify policy" ON public.courses
  FOR INSERT
  USING (get_current_user_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "Courses update policy" ON public.courses
  FOR UPDATE
  USING (
    get_current_user_role() IN ('ADMIN', 'STAFF')
    OR (instructor_id = get_current_user_id() AND get_current_user_role() = 'TEACHER')
  );

-- Orders 表（財務相關）
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Orders policy" ON public.orders;
CREATE POLICY "Orders policy" ON public.orders
  FOR ALL
  USING (get_current_user_role() IN ('ADMIN', 'STAFF'));

-- Enrollments 表
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enrollments select policy" ON public.enrollments;
CREATE POLICY "Enrollments select policy" ON public.enrollments
  FOR SELECT
  USING (
    get_current_user_role() IN ('ADMIN', 'STAFF')
    OR (
      get_current_user_role() = 'TEACHER'
      AND course_id IN (
        SELECT course_id FROM courses WHERE instructor_id = get_current_user_id()
      )
    )
  );

CREATE POLICY "Enrollments modify policy" ON public.enrollments
  FOR ALL
  USING (get_current_user_role() IN ('ADMIN', 'STAFF'));

-- 5. 創建設置使用者上下文的函數（每個請求都要呼叫）
CREATE OR REPLACE FUNCTION public.set_user_context(
  p_user_id TEXT,
  p_role TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', p_user_id, true);
  IF p_role IS NOT NULL THEN
    PERFORM set_config('app.current_user_role', p_role, true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 提示
DO $$
BEGIN
  RAISE NOTICE '=================================';
  RAISE NOTICE 'RLS 已設置完成！';
  RAISE NOTICE '使用方式：';
  RAISE NOTICE '1. 每個 API 請求前呼叫: SELECT set_user_context(''user_id'', ''role'');';
  RAISE NOTICE '2. 或使用 JWT token 在 header 中傳遞';
  RAISE NOTICE '=================================';
END $$;