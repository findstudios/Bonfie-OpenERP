-- Fix attendance table RLS policies to properly handle ADMIN and STAFF access
-- Date: 2025-01-25
-- Issue: Admin users getting RLS errors when creating attendance records

-- First, make sure RLS is enabled
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "admin_delete_attendance" ON public.attendance;
DROP POLICY IF EXISTS "staff_create_attendance" ON public.attendance;
DROP POLICY IF EXISTS "staff_manage_attendance" ON public.attendance;
DROP POLICY IF EXISTS "staff_update_attendance" ON public.attendance;
DROP POLICY IF EXISTS "admin_manage_attendance" ON public.attendance;
DROP POLICY IF EXISTS "teacher_view_own_attendance" ON public.attendance;
DROP POLICY IF EXISTS "teacher_manage_own_attendance" ON public.attendance;

-- Create a comprehensive policy for ADMIN and STAFF to manage all attendance records
CREATE POLICY "admin_staff_full_access" ON public.attendance
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.auth_user_id = auth.uid()
            AND u.status = 'active'
            AND r.role_code IN ('ADMIN', 'STAFF')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.auth_user_id = auth.uid()
            AND u.status = 'active'
            AND r.role_code IN ('ADMIN', 'STAFF')
        )
    );

-- Create policy for TEACHER to view and manage their own classes' attendance
CREATE POLICY "teacher_manage_own_classes" ON public.attendance
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            JOIN public.schedules s ON s.schedule_id = attendance.schedule_id
            JOIN public.courses c ON c.course_id = s.course_id
            WHERE u.auth_user_id = auth.uid()
            AND u.status = 'active'
            AND r.role_code = 'TEACHER'
            AND c.instructor_id = u.user_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            JOIN public.schedules s ON s.schedule_id = attendance.schedule_id
            JOIN public.courses c ON c.course_id = s.course_id
            WHERE u.auth_user_id = auth.uid()
            AND u.status = 'active'
            AND r.role_code = 'TEACHER'
            AND c.instructor_id = u.user_id
        )
    );

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT USAGE ON SEQUENCE attendance_id_seq TO authenticated;

-- Also ensure the auth_user_role function works correctly
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT r.role_code 
  FROM users u
  JOIN roles r ON u.role_id = r.id
  WHERE u.auth_user_id = auth.uid()
  AND u.status = 'active'
  LIMIT 1;
$$;

-- Ensure auth_user_id function works correctly
CREATE OR REPLACE FUNCTION public.auth_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT user_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Test the functions (you can run these queries to verify)
-- SELECT auth_user_role(); -- Should return your role when logged in
-- SELECT auth_user_id();   -- Should return your user_id when logged in