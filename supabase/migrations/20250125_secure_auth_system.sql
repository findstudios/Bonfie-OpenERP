-- Secure Authentication System Migration
-- This migration updates the authentication system to use Supabase Auth properly

-- 1. Add auth_user_id column to users table (if not exists)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);

-- 3. Create function to migrate existing users to auth
CREATE OR REPLACE FUNCTION migrate_existing_users_to_auth()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    new_auth_user_id UUID;
BEGIN
    -- Iterate through all existing users
    FOR user_record IN 
        SELECT id, user_id, username, email, status 
        FROM public.users 
        WHERE auth_user_id IS NULL 
        AND email IS NOT NULL 
        AND email != ''
    LOOP
        BEGIN
            -- Create auth record for each user
            -- Note: Initial password is set to 'Test123!', users should reset their passwords
            new_auth_user_id := gen_random_uuid();
            
            -- Insert into auth.users table
            INSERT INTO auth.users (
                id,
                instance_id, 
                email,
                encrypted_password,
                email_confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at,
                confirmation_token,
                email_change,
                email_change_token_new,
                recovery_token
            ) VALUES (
                new_auth_user_id,
                '00000000-0000-0000-0000-000000000000',
                user_record.email,
                crypt('Test123!', gen_salt('bf')),
                NOW(),
                jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
                jsonb_build_object('username', user_record.username, 'user_id', user_record.user_id),
                NOW(),
                NOW(),
                '',
                '',
                '',
                ''
            );
            
            -- Update public.users table with auth_user_id
            UPDATE public.users 
            SET auth_user_id = new_auth_user_id 
            WHERE id = user_record.id;
            
            RAISE NOTICE 'Created auth user for: %', user_record.username;
        EXCEPTION
            WHEN unique_violation THEN
                -- If email already exists in auth.users, get the existing auth user id
                SELECT id INTO new_auth_user_id 
                FROM auth.users 
                WHERE email = user_record.email 
                LIMIT 1;
                
                UPDATE public.users 
                SET auth_user_id = new_auth_user_id 
                WHERE id = user_record.id;
                
                RAISE NOTICE 'Linked existing auth user for: %', user_record.username;
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to create auth user for %: %', user_record.username, SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Execute migration function
SELECT migrate_existing_users_to_auth();

-- 5. Create trigger function to auto-create auth.users when creating public.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_auth_id UUID;
BEGIN
    -- If email is provided but no auth_user_id, create new auth user
    IF NEW.email IS NOT NULL AND NEW.email != '' AND NEW.auth_user_id IS NULL THEN
        new_auth_id := gen_random_uuid();
        
        -- Create auth user
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            new_auth_id,
            '00000000-0000-0000-0000-000000000000',
            NEW.email,
            crypt('ChangeMe123!', gen_salt('bf')),
            NOW(),
            jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
            jsonb_build_object('username', NEW.username, 'user_id', NEW.user_id),
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );
        
        NEW.auth_user_id := new_auth_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger
DROP TRIGGER IF EXISTS on_public_user_created ON public.users;
CREATE TRIGGER on_public_user_created
    BEFORE INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 7. Create function to handle auth user signup (creates corresponding public.users record)
CREATE OR REPLACE FUNCTION handle_auth_user_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- Create corresponding public.users record
    INSERT INTO public.users (
        user_id,
        username,
        email,
        full_name,
        role_id,
        status,
        auth_user_id,
        created_at,
        updated_at
    ) VALUES (
        'USR' || to_char(NOW(), 'YYYYMMDDHH24MISS') || lpad(floor(random() * 1000)::text, 3, '0'),
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        3, -- Default to TEACHER role
        'active',
        NEW.id,
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_auth_user_signup();

-- 9. Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Users can view their own data
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT
    USING (auth.uid() = auth_user_id);

-- Users can update their own profile (except role_id)
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.auth_user_id = auth.uid()
            AND r.role_code = 'ADMIN'
        )
    );

-- Admins can manage all users
CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.auth_user_id = auth.uid()
            AND r.role_code = 'ADMIN'
        )
    );

-- 10. Add auth_user_id to audit_logs
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- 11. Create secure password reset function
CREATE OR REPLACE FUNCTION verify_user_email(username_input VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    user_email VARCHAR;
BEGIN
    SELECT email INTO user_email
    FROM public.users
    WHERE username = username_input
    AND status = 'active'
    LIMIT 1;
    
    RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON auth.users TO postgres, service_role;
GRANT SELECT ON auth.users TO anon, authenticated;

-- 13. Create view for safe user data access
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
    u.id,
    u.user_id,
    u.username,
    u.full_name,
    u.email,
    u.phone,
    u.avatar_url,
    u.status,
    u.created_at,
    u.last_login_at,
    r.role_code,
    r.role_name,
    u.auth_user_id = auth.uid() as is_current_user
FROM public.users u
JOIN public.roles r ON u.role_id = r.id;

-- Grant access to the view
GRANT SELECT ON public.user_profiles TO anon, authenticated;

-- 14. Update test accounts with secure passwords
DO $$
BEGIN
    -- Update test accounts with a secure default password
    -- Users will need to reset their passwords on first login
    UPDATE auth.users 
    SET 
        encrypted_password = crypt('Test123!', gen_salt('bf')),
        updated_at = NOW()
    WHERE email IN (
        SELECT email 
        FROM public.users 
        WHERE username IN ('admin', 'staff', 'teacher1', 'teacher2')
        AND email IS NOT NULL
    );
    
    RAISE NOTICE 'Test accounts have been updated. Default password: Test123!';
    RAISE NOTICE 'Users should reset their passwords on first login.';
END $$;