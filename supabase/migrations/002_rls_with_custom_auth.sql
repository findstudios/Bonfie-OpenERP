-- RLS 政策（使用自定義認證）
-- 這是一個過渡方案，允許您測試 RLS 而不需要立即切換到 Supabase Auth

-- 1. 創建一個 session 表來追蹤登入狀態
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id SERIAL PRIMARY KEY,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(255) NOT NULL REFERENCES public.users(user_id),
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 創建一個函數來獲取當前使用者（基於 session token）
CREATE OR REPLACE FUNCTION public.get_session_user_id(token TEXT)
RETURNS TEXT AS $$
DECLARE
  session_user_id TEXT;
BEGIN
  SELECT user_id INTO session_user_id
  FROM public.user_sessions
  WHERE session_token = token
    AND expires_at > NOW();
  
  RETURN session_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 創建一個函數來設置當前 session（供應用程式使用）
CREATE OR REPLACE FUNCTION public.set_config_token(token TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_token', token, true);
END;
$$ LANGUAGE plpgsql;

-- 4. 創建輔助函數
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN get_session_user_id(current_setting('app.current_token', true));
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
DECLARE
  role_code TEXT;
BEGIN
  SELECT r.role_code INTO role_code
  FROM public.users u
  JOIN public.roles r ON u.role_id = r.id
  WHERE u.user_id = current_user_id();
  
  RETURN role_code;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. 為 users 表創建特殊的 RLS 政策（允許登入查詢）
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 允許未認證的查詢（僅用於登入驗證）
CREATE POLICY "Allow login queries" ON public.users
  FOR SELECT 
  USING (
    -- 如果沒有 token（登入時），只允許查詢基本資料
    current_setting('app.current_token', true) IS NULL 
    OR current_setting('app.current_token', true) = ''
  );

-- 允許已認證使用者查看資料
CREATE POLICY "Authenticated users can view users" ON public.users
  FOR SELECT
  USING (
    current_user_id() IS NOT NULL
  );

-- 管理員可以管理所有使用者
CREATE POLICY "Admins can manage users" ON public.users
  FOR ALL
  USING (
    current_user_role() = 'ADMIN'
  );

-- 6. 為其他表設置 RLS
-- 學生表
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff and Admin can manage students" ON public.students
  FOR ALL
  USING (
    current_user_role() IN ('ADMIN', 'STAFF')
  );

CREATE POLICY "Teachers can view their students" ON public.students
  FOR SELECT
  USING (
    current_user_role() = 'TEACHER'
    AND student_id IN (
      SELECT DISTINCT e.student_id
      FROM enrollments e
      JOIN courses c ON c.course_id = e.course_id
      WHERE c.instructor_id = current_user_id()
    )
  );

-- 課程表
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view courses" ON public.courses
  FOR SELECT USING (current_user_id() IS NOT NULL);

CREATE POLICY "Admin and Staff can manage courses" ON public.courses
  FOR INSERT USING (current_user_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "Admin and Staff can update any course" ON public.courses
  FOR UPDATE USING (current_user_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "Teachers can update own courses" ON public.courses
  FOR UPDATE USING (
    instructor_id = current_user_id()
    AND current_user_role() = 'TEACHER'
  );

-- 訂單表
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and Staff can manage orders" ON public.orders
  FOR ALL USING (current_user_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "Teachers cannot access orders" ON public.orders
  FOR SELECT USING (false)
  WITH CHECK (false);

-- 7. 創建登入函數（供應用程式呼叫）
CREATE OR REPLACE FUNCTION public.create_session(
  p_user_id TEXT,
  p_token TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
BEGIN
  -- 清理過期的 sessions
  DELETE FROM public.user_sessions WHERE expires_at < NOW();
  
  -- 創建新 session
  INSERT INTO public.user_sessions (session_token, user_id, ip_address, user_agent, expires_at)
  VALUES (p_token, p_user_id, p_ip_address::INET, p_user_agent, NOW() + INTERVAL '8 hours');
  
  RETURN QUERY SELECT true, 'Session created successfully';
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 創建登出函數
CREATE OR REPLACE FUNCTION public.destroy_session(p_token TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM public.user_sessions WHERE session_token = p_token;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 提示
DO $$
BEGIN
  RAISE NOTICE 'RLS with custom auth has been set up.';
  RAISE NOTICE 'Remember to call set_config_token() with the session token for each request.';
END $$;