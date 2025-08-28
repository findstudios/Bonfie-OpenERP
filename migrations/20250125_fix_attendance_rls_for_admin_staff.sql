-- Fix attendance table RLS policies to allow ADMIN and STAFF to create attendance records
-- Date: 2025-01-25
-- Issue: Admin users getting "new row violates row-level security policy" error when creating attendance

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "staff_manage_attendance" ON public.attendance;
DROP POLICY IF EXISTS "admin_manage_attendance" ON public.attendance;
DROP POLICY IF EXISTS "staff_create_attendance" ON public.attendance;
DROP POLICY IF EXISTS "staff_update_attendance" ON public.attendance;
DROP POLICY IF EXISTS "staff_delete_attendance" ON public.attendance;

-- Create comprehensive policy for ADMIN and STAFF to manage attendance records
CREATE POLICY "staff_manage_attendance" ON public.attendance
    FOR ALL 
    USING (auth_user_role() IN ('ADMIN', 'STAFF'))
    WITH CHECK (auth_user_role() IN ('ADMIN', 'STAFF'));

-- Specifically create INSERT policy for clarity
CREATE POLICY "staff_create_attendance" ON public.attendance
    FOR INSERT
    WITH CHECK (auth_user_role() IN ('ADMIN', 'STAFF'));

-- Update policy for ADMIN and STAFF
CREATE POLICY "staff_update_attendance" ON public.attendance
    FOR UPDATE
    USING (auth_user_role() IN ('ADMIN', 'STAFF'))
    WITH CHECK (auth_user_role() IN ('ADMIN', 'STAFF'));

-- Delete policy (only ADMIN can delete)
CREATE POLICY "admin_delete_attendance" ON public.attendance
    FOR DELETE
    USING (auth_user_role() = 'ADMIN');

-- Verify the policies were created
SELECT 
    policyname,
    cmd,
    permissive,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'attendance'
ORDER BY policyname;