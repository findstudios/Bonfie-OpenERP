-- ========================================
-- 手動建立 Auth 使用者（備用方案）
-- ========================================

-- 如果 Dashboard 建立失敗，使用這個方法

-- 1. 確保擴展已啟用
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 直接插入 auth.users（簡化版）
DO $$
DECLARE
  admin_id UUID := uuid_generate_v4();
  staff_id UUID := uuid_generate_v4();
  teacher_id UUID := uuid_generate_v4();
BEGIN
  -- 建立 admin
  INSERT INTO auth.users (
    id, 
    email, 
    email_confirmed_at,
    created_at,
    updated_at,
    aud,
    role
  ) VALUES (
    admin_id,
    'admin@vibe-erp.com',
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
  ) ON CONFLICT (email) DO NOTHING;

  -- 建立 staff1
  INSERT INTO auth.users (
    id, 
    email, 
    email_confirmed_at,
    created_at,
    updated_at,
    aud,
    role
  ) VALUES (
    staff_id,
    'staff1@vibe-erp.com',
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
  ) ON CONFLICT (email) DO NOTHING;

  -- 建立 teacher1
  INSERT INTO auth.users (
    id, 
    email, 
    email_confirmed_at,
    created_at,
    updated_at,
    aud,
    role
  ) VALUES (
    teacher_id,
    'teacher1@vibe-erp.com',
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
  ) ON CONFLICT (email) DO NOTHING;

  -- 更新連結
  UPDATE public.users SET auth_user_id = admin_id WHERE email = 'admin@vibe-erp.com';
  UPDATE public.users SET auth_user_id = staff_id WHERE email = 'staff1@vibe-erp.com';
  UPDATE public.users SET auth_user_id = teacher_id WHERE email = 'teacher1@vibe-erp.com';
END $$;

-- 3. 驗證結果
SELECT 
  p.username,
  p.email,
  p.auth_user_id,
  a.id as auth_id,
  CASE 
    WHEN p.auth_user_id = a.id THEN '✅ 連結成功'
    ELSE '❌ 連結失敗'
  END as status
FROM public.users p
LEFT JOIN auth.users a ON p.email = a.email
WHERE p.email IN ('admin@vibe-erp.com', 'staff1@vibe-erp.com', 'teacher1@vibe-erp.com')
ORDER BY p.username;

-- 注意：這個方法建立的用戶還需要設定密碼
-- 請在 Dashboard 使用 "Send password recovery" 功能來設定密碼