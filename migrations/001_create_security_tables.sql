-- Create security events table for monitoring
CREATE TABLE IF NOT EXISTS public.security_events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    ip_address INET,
    user_id VARCHAR REFERENCES public.users(user_id),
    endpoint VARCHAR,
    method VARCHAR(10),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for quick queries
CREATE INDEX idx_security_events_created_at ON public.security_events(created_at DESC);
CREATE INDEX idx_security_events_event_type ON public.security_events(event_type);
CREATE INDEX idx_security_events_ip_address ON public.security_events(ip_address);
CREATE INDEX idx_security_events_user_id ON public.security_events(user_id);

-- Create rate limit tracking table
CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR NOT NULL,
    ip_address INET,
    user_id VARCHAR REFERENCES public.users(user_id),
    endpoint VARCHAR,
    method VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for rate limit queries
CREATE INDEX idx_rate_limit_key_created ON public.rate_limit_tracking(key, created_at DESC);
CREATE INDEX idx_rate_limit_created_at ON public.rate_limit_tracking(created_at);

-- Create API keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
    key_id VARCHAR PRIMARY KEY DEFAULT concat('KEY', to_char(now(), 'YYYYMMDDHH24MISS'), lpad((floor((random() * (1000)::double precision)))::text, 3, '0'::text)),
    api_key_hash VARCHAR NOT NULL UNIQUE,
    client_name VARCHAR NOT NULL,
    description TEXT,
    permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
    rate_limit_tier VARCHAR DEFAULT 'standard' CHECK (rate_limit_tier IN ('basic', 'standard', 'premium', 'unlimited')),
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR REFERENCES public.users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create blocked IPs table
CREATE TABLE IF NOT EXISTS public.blocked_ips (
    id BIGSERIAL PRIMARY KEY,
    ip_address INET NOT NULL UNIQUE,
    reason TEXT NOT NULL,
    blocked_until TIMESTAMP WITH TIME ZONE,
    is_permanent BOOLEAN DEFAULT false,
    blocked_by VARCHAR REFERENCES public.users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for blocked IPs
CREATE INDEX idx_blocked_ips_ip_address ON public.blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_blocked_until ON public.blocked_ips(blocked_until);

-- Create security alert rules table
CREATE TABLE IF NOT EXISTS public.security_alert_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR NOT NULL,
    event_type VARCHAR NOT NULL,
    threshold INTEGER NOT NULL,
    time_window_seconds INTEGER NOT NULL,
    action VARCHAR NOT NULL CHECK (action IN ('alert', 'block', 'alert_and_block')),
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default security alert rules
INSERT INTO public.security_alert_rules (rule_name, event_type, threshold, time_window_seconds, action, description) VALUES
('Excessive Failed Logins', 'invalid_login', 5, 300, 'alert_and_block', 'Block IP after 5 failed login attempts in 5 minutes'),
('Invalid API Key Abuse', 'invalid_api_key', 10, 600, 'block', 'Block IP after 10 invalid API key attempts in 10 minutes'),
('Rate Limit Violations', 'rate_limit_exceeded', 20, 600, 'alert', 'Alert after 20 rate limit violations in 10 minutes'),
('Suspicious Signatures', 'invalid_signature', 5, 300, 'alert_and_block', 'Block after 5 invalid signatures in 5 minutes');

-- Create function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_security_data()
RETURNS void AS $$
BEGIN
    -- Delete rate limit entries older than 1 day
    DELETE FROM public.rate_limit_tracking WHERE created_at < NOW() - INTERVAL '1 day';
    
    -- Delete security events older than 30 days (keep critical events for 90 days)
    DELETE FROM public.security_events 
    WHERE created_at < NOW() - INTERVAL '30 days' 
    AND severity != 'critical';
    
    DELETE FROM public.security_events 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Remove expired IP blocks
    DELETE FROM public.blocked_ips 
    WHERE blocked_until < NOW() 
    AND is_permanent = false;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alert_rules ENABLE ROW LEVEL SECURITY;

-- Security events policies (admin only)
CREATE POLICY "Admin can view all security events" ON public.security_events
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code = 'ADMIN'
    ));

CREATE POLICY "System can insert security events" ON public.security_events
    FOR INSERT WITH CHECK (true);

-- API keys policies (admin only)
CREATE POLICY "Admin can manage API keys" ON public.api_keys
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code = 'ADMIN'
    ));

-- Blocked IPs policies (admin only)
CREATE POLICY "Admin can manage blocked IPs" ON public.blocked_ips
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code = 'ADMIN'
    ));

-- Alert rules policies (admin only)
CREATE POLICY "Admin can manage alert rules" ON public.security_alert_rules
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code = 'ADMIN'
    ));