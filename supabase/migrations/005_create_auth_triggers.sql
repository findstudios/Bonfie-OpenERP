-- 建立 Auth 觸發器和輔助函數
-- 這些函數會自動同步 auth.users 和 public.users

-- 1. 處理新註冊使用者
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id VARCHAR;
BEGIN
  -- 生成新的 user_id
  new_user_id := 'USR' || LPAD(NEXTVAL('users_id_seq')::TEXT, 3, '0');
  
  -- 檢查是否已存在（by email）
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
      auth_user_id,
      phone
    ) VALUES (
      new_user_id,
      SPLIT_PART(NEW.email, '@', 1),
      'supabase_auth', -- 標記使用 Supabase Auth
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        SPLIT_PART(NEW.email, '@', 1)
      ),
      NEW.email,
      COALESCE(
        (NEW.raw_user_meta_data->>'role_id')::INTEGER,
        3 -- 預設為教師
      ),
      'active',
      NEW.id,
      NEW.raw_user_meta_data->>'phone'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 移除舊觸發器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 建立新觸發器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 2. 輔助函數：獲取當前使用者ID
CREATE OR REPLACE FUNCTION public.auth_user_id()
RETURNS TEXT AS $$
  SELECT user_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. 輔助函數：獲取當前使用者角色
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS TEXT AS $$
  SELECT r.role_code
  FROM public.users u
  JOIN public.roles r ON u.role_id = r.id
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. 輔助函數：檢查是否為管理員
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

-- 5. 輔助函數：檢查是否為員工或管理員
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

-- 6. 更新 last_login_at 的函數
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET last_login_at = NOW()
  WHERE auth_user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 建立登入觸發器
CREATE OR REPLACE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at)
  EXECUTE FUNCTION public.update_last_login();