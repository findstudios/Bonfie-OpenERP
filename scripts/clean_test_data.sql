-- 清理測試資料 SQL
-- ⚠️ 警告：這會刪除所有現有的使用者資料！

-- 1. 先備份現有資料（檢視用）
SELECT 'Backing up users...' as status;
SELECT * FROM public.users;
SELECT * FROM auth.users;

-- 2. 刪除 public.users 中的測試資料
DELETE FROM public.users 
WHERE email IN (
  'lily@artclass.com',
  'sunny@artclass.com', 
  'rainbow@artclass.com',
  'brush@artclass.com',
  'palette@artclass.com',
  'admin@bonfie.com',
  'admin@artclass.com'
);

-- 3. 刪除 auth.users 中的測試資料（如果需要）
-- 注意：這會永久刪除這些認證帳號
/*
DELETE FROM auth.users 
WHERE email IN (
  'lily@artclass.com',
  'sunny@artclass.com', 
  'rainbow@artclass.com',
  'brush@artclass.com',
  'palette@artclass.com',
  'admin@bonfie.com',
  'admin@artclass.com'
);
*/

-- 4. 確認清理結果
SELECT 'After cleanup:' as status;
SELECT * FROM public.users;