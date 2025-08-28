-- ========================================
-- 恢復完整的 Auth 觸發器
-- ========================================

-- 1. 移除臨時的安全觸發器
DROP TRIGGER IF EXISTS on_auth_user_created_safe ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user_safe();

-- 2. 恢復完整的觸發器函數（來自 combined_migration_step2.sql）
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

-- 3. 重新建立觸發器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 4. 確認登入時間更新觸發器存在
CREATE OR REPLACE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at)
  EXECUTE FUNCTION public.update_last_login();

-- 5. 驗證觸發器狀態
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema IN ('auth', 'public')
  AND trigger_name IN ('on_auth_user_created', 'on_auth_user_login')
ORDER BY trigger_name;

-- 6. 確認所有輔助函數存在
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'handle_new_auth_user',
    'update_last_login',
    'auth_user_id',
    'auth_user_role',
    'is_admin',
    'is_staff_or_admin'
  )
ORDER BY routine_name;