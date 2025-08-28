-- Fix attendance table for simple auth system (without Supabase Auth)
-- Date: 2025-01-25
-- Issue: System uses simplified auth without Supabase Auth, so auth.uid() is null

-- Since your system doesn't use Supabase Auth, we need to disable RLS on attendance table
-- or create policies that don't rely on auth.uid()

-- Option 1: Disable RLS (simplest solution for your case)
ALTER TABLE public.attendance DISABLE ROW LEVEL SECURITY;

-- Option 2: If you must keep RLS, create a permissive policy
-- First drop all existing policies
DROP POLICY IF EXISTS "admin_delete_attendance" ON public.attendance;
DROP POLICY IF EXISTS "staff_create_attendance" ON public.attendance;
DROP POLICY IF EXISTS "staff_manage_attendance" ON public.attendance;
DROP POLICY IF EXISTS "staff_update_attendance" ON public.attendance;
DROP POLICY IF EXISTS "admin_staff_full_access" ON public.attendance;
DROP POLICY IF EXISTS "teacher_manage_own_classes" ON public.attendance;

-- Create a permissive policy that allows all authenticated operations
-- Since you're not using Supabase Auth, this will allow all operations
CREATE POLICY "allow_all_attendance_operations" ON public.attendance
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Make sure the marked_by column can accept any user_id value
ALTER TABLE public.attendance 
ALTER COLUMN marked_by DROP NOT NULL;

-- Grant permissions
GRANT ALL ON public.attendance TO anon, authenticated;
GRANT USAGE ON SEQUENCE attendance_id_seq TO anon, authenticated;