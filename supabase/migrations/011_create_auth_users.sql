-- ========================================
-- 批量建立 Auth 使用者
-- ========================================

-- 注意：這個腳本需要 service_role 權限執行
-- 在 Supabase Dashboard 的 SQL Editor 中執行

-- 1. 建立測試用戶的函數
CREATE OR REPLACE FUNCTION create_test_auth_users()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  new_auth_id UUID;
BEGIN
  -- 為每個現有的 public.users 建立對應的 auth.users
  FOR user_record IN 
    SELECT user_id, username, email, full_name, role_id
    FROM public.users
    WHERE auth_user_id IS NULL
    ORDER BY username
  LOOP
    -- 建立 Auth 使用者
    -- 注意：密碼統一設為 'Test123!'
    new_auth_id := extensions.uuid_generate_v4();
    
    -- 插入到 auth.users
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      new_auth_id,
      user_record.email,
      crypt('Test123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      jsonb_build_object(
        'full_name', user_record.full_name,
        'role_id', user_record.role_id
      ),
      false,
      'authenticated'
    );
    
    -- 更新 public.users 的 auth_user_id
    UPDATE public.users 
    SET auth_user_id = new_auth_id,
        updated_at = NOW()
    WHERE user_id = user_record.user_id;
    
    RAISE NOTICE '已建立用戶: % (%)', user_record.email, user_record.full_name;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 執行函數
SELECT create_test_auth_users();

-- 3. 驗證結果
SELECT 
  u.user_id,
  u.username,
  u.email,
  u.full_name,
  CASE 
    WHEN u.auth_user_id IS NULL THEN '❌ 建立失敗'
    ELSE '✅ 建立成功'
  END as status,
  a.email as auth_email,
  a.created_at as auth_created_at
FROM public.users u
LEFT JOIN auth.users a ON u.auth_user_id = a.id
ORDER BY u.username;

-- 4. 清理函數
DROP FUNCTION IF EXISTS create_test_auth_users();

-- ========================================
-- 所有用戶的預設密碼都是: Test123!
-- ========================================