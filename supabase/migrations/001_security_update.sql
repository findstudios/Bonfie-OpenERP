-- 安全性更新 Migration
-- 這個檔案包含所有安全性相關的更新

-- 1. 建立 auth_user_id 關聯（如果使用 Supabase Auth）
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- 2. 更新密碼（暫時保持簡單驗證模式）
-- 在開發環境中，我們暫時保持原有的驗證方式

-- 3. 建立 Sessions 表（為未來升級準備）
CREATE TABLE IF NOT EXISTS public.sessions (
  id BIGSERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL UNIQUE,
  user_id VARCHAR(255) NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  csrf_token VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  last_activity_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON public.sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);

-- 4. 建立安全相關表（簡化版本）
CREATE TABLE IF NOT EXISTS public.security_events (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  user_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON public.security_events(created_at);

-- 5. 為開發環境暫時關閉 RLS（等系統穩定後再啟用）
-- 這樣可以避免開發時的權限問題
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('ALTER TABLE IF EXISTS public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- 6. 建立基本的權限檢查函數（為未來 RLS 準備）
CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param TEXT)
RETURNS TEXT AS $$
DECLARE
    role_code TEXT;
BEGIN
    SELECT r.role_code INTO role_code
    FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.user_id = user_id_param;
    
    RETURN COALESCE(role_code, 'UNKNOWN');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 建立版本追蹤表
CREATE TABLE IF NOT EXISTS public.migration_history (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) NOT NULL,
  description TEXT,
  applied_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  applied_by VARCHAR(255)
);

-- 記錄這次遷移
INSERT INTO public.migration_history (version, description) 
VALUES ('001', '初始安全性設定 - 開發環境');

-- 提示訊息
DO $$
BEGIN
    RAISE NOTICE '安全性更新已完成。開發環境中 RLS 已暫時關閉。';
END $$;