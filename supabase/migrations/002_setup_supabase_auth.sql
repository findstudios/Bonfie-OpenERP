-- 設置 Supabase Auth 認證系統
-- 這個 migration 會將現有使用者遷移到 Supabase Auth

-- 1. 在 users 表新增 auth_user_id 欄位（如果不存在）
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- 2. 為現有使用者創建 Supabase Auth 帳號
-- 注意：這需要在 Supabase Dashboard 執行，因為需要管理員權限
-- 或使用 Supabase Admin API

/*
-- 手動在 Supabase Dashboard > Authentication > Users 創建使用者：
-- 1. admin@vibe-erp.com / Test123!
-- 2. staff1@vibe-erp.com / Test123!
-- 3. staff2@vibe-erp.com / Test123!
-- 4. teacher1@vibe-erp.com / Test123!
-- 5. teacher2@vibe-erp.com / Test123!
*/

-- 3. 創建觸發器，自動同步 auth.users 到 public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- 檢查是否已存在
  IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
    -- 更新現有使用者的 auth_user_id
    UPDATE public.users 
    SET auth_user_id = NEW.id,
        updated_at = NOW()
    WHERE email = NEW.email;
  ELSE
    -- 創建新使用者
    INSERT INTO public.users (
      user_id,
      username,
      password_hash,
      full_name,
      email,
      role_id,
      status,
      auth_user_id
    ) VALUES (
      'USR' || LPAD(NEXTVAL('users_id_seq')::TEXT, 3, '0'),
      SPLIT_PART(NEW.email, '@', 1),
      'supabase_auth', -- 標記為使用 Supabase Auth
      COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
      NEW.email,
      COALESCE((NEW.raw_user_meta_data->>'role_id')::INTEGER, 3), -- 預設為教師
      'active',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 移除舊的觸發器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 創建新的觸發器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. 創建 RLS 政策所需的輔助函數
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT user_id 
    FROM public.users 
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT r.role_code
    FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 啟用 RLS 並建立基本政策
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 允許使用者查看自己的資料
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth_user_id = auth.uid());

-- 允許使用者更新自己的資料
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth_user_id = auth.uid());

-- 管理員可以查看所有使用者
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.auth_user_id = auth.uid() AND r.role_code = 'ADMIN'
    )
  );

-- 6. 更新其他表的 RLS 政策
-- 學生表
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Staff can manage students" ON public.students
  FOR ALL USING (
    get_current_user_role() IN ('ADMIN', 'STAFF')
  );

CREATE POLICY "Teachers can view their students" ON public.students
  FOR SELECT USING (
    get_current_user_role() = 'TEACHER' AND
    student_id IN (
      SELECT DISTINCT e.student_id
      FROM enrollments e
      JOIN courses c ON c.course_id = e.course_id
      WHERE c.instructor_id = get_current_user_id()
    )
  );

-- 課程表
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view courses" ON public.courses
  FOR SELECT USING (true);

CREATE POLICY "Admins and Staff can manage courses" ON public.courses
  FOR INSERT USING (get_current_user_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "Admins and Staff can update courses" ON public.courses
  FOR UPDATE USING (get_current_user_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "Teachers can update own courses" ON public.courses
  FOR UPDATE USING (instructor_id = get_current_user_id());

-- 7. 提示訊息
DO $$
BEGIN
  RAISE NOTICE '請在 Supabase Dashboard 創建對應的 Auth 使用者';
  RAISE NOTICE 'Email: admin@vibe-erp.com, Password: Test123!';
  RAISE NOTICE 'Email: staff1@vibe-erp.com, Password: Test123!';
  RAISE NOTICE 'Email: teacher1@vibe-erp.com, Password: Test123!';
END $$;