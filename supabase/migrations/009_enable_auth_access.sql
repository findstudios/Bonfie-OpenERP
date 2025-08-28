-- ========================================
-- 啟用認證相關的基本 RLS 政策
-- ========================================

-- 1. 先移除舊的政策（如果存在）
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- 2. 啟用 users 表的 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. 建立新的政策
-- 允許所有人讀取 users 表（用於登入驗證和用戶查詢）
-- 注意：這是為了支援現有的應用程式邏輯
CREATE POLICY "Enable read access for all users" ON public.users
  FOR SELECT USING (true);

-- 允許已認證用戶更新自己的資料
CREATE POLICY "Enable users to update own profile" ON public.users
  FOR UPDATE 
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- 允許系統（透過觸發器）插入新用戶
CREATE POLICY "Enable insert for system" ON public.users
  FOR INSERT 
  WITH CHECK (true);

-- 4. 確保 roles 表也可以被讀取
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Roles are viewable by everyone" ON public.roles;

CREATE POLICY "Enable read access for roles" ON public.roles
  FOR SELECT USING (true);

-- 5. 授予必要的權限給 authenticated 和 anon 角色
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.users TO anon, authenticated;
GRANT SELECT ON public.roles TO anon, authenticated;
GRANT ALL ON public.users TO authenticated;

-- 6. 確保序列權限
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;