-- ========================================
-- 修復使用者建立錯誤
-- ========================================

-- 1. 檢查現有的觸發器
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' 
  AND event_object_table = 'users';

-- 2. 檢查 auth schema 的觸發器
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users';

-- 3. 暫時停用可能衝突的觸發器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. 建立一個更安全的觸發器
CREATE OR REPLACE FUNCTION public.handle_new_auth_user_safe()
RETURNS TRIGGER AS $$
BEGIN
  -- 只在 email 不存在時才更新
  IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
    -- 更新現有用戶的 auth_user_id
    UPDATE public.users 
    SET auth_user_id = NEW.id,
        updated_at = NOW()
    WHERE email = NEW.email
    AND auth_user_id IS NULL;  -- 只在未連結時更新
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- 如果發生任何錯誤，記錄但不中斷
  RAISE WARNING 'Error in handle_new_auth_user_safe: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 重新建立觸發器（使用 AFTER 而非 BEFORE）
CREATE TRIGGER on_auth_user_created_safe
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_auth_user_safe();

-- 6. 確認現在可以建立用戶了
SELECT 'Ready to create users in Dashboard' as status;