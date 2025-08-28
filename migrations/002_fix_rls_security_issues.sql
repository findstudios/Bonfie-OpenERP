-- Fix Row Level Security Issues
-- This script addresses the critical security issues found in the audit

-- 1. Enable RLS on all public tables
ALTER TABLE public.handover_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for each table

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (user_id = auth.uid()::text OR EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code IN ('ADMIN', 'STAFF')
    ));

CREATE POLICY "Admin can manage users" ON public.users
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code = 'ADMIN'
    ));

-- Students table policies
CREATE POLICY "Staff can view all students" ON public.students
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code IN ('ADMIN', 'STAFF', 'TEACHER')
    ));

CREATE POLICY "Staff can manage students" ON public.students
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code IN ('ADMIN', 'STAFF')
    ));

-- Contacts table policies
CREATE POLICY "Staff can view all contacts" ON public.contacts
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code IN ('ADMIN', 'STAFF', 'TEACHER')
    ));

CREATE POLICY "Staff can manage contacts" ON public.contacts
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code IN ('ADMIN', 'STAFF')
    ));

-- Courses table policies
CREATE POLICY "All authenticated users can view courses" ON public.courses
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage courses" ON public.courses
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code IN ('ADMIN', 'STAFF')
    ));

-- Enrollments table policies
CREATE POLICY "Staff can view all enrollments" ON public.enrollments
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code IN ('ADMIN', 'STAFF', 'TEACHER')
    ));

CREATE POLICY "Staff can manage enrollments" ON public.enrollments
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code IN ('ADMIN', 'STAFF')
    ));

-- Orders table policies
CREATE POLICY "Staff can view all orders" ON public.orders
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code IN ('ADMIN', 'STAFF')
    ));

CREATE POLICY "Staff can manage orders" ON public.orders
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code IN ('ADMIN', 'STAFF')
    ));

-- Payments table policies (already has RLS enabled)
CREATE POLICY "Staff can view all payments" ON public.payments
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code IN ('ADMIN', 'STAFF')
    ));

CREATE POLICY "Staff can manage payments" ON public.payments
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code IN ('ADMIN', 'STAFF')
    ));

-- Attendance table policies
CREATE POLICY "Teachers can view relevant attendance" ON public.attendance
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code IN ('ADMIN', 'STAFF', 'TEACHER')
    ));

CREATE POLICY "Teachers can mark attendance" ON public.attendance
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code IN ('ADMIN', 'STAFF', 'TEACHER')
    ));

CREATE POLICY "Staff can update attendance" ON public.attendance
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code IN ('ADMIN', 'STAFF')
    ));

-- Schedules table policies
CREATE POLICY "All authenticated users can view schedules" ON public.schedules
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage schedules" ON public.schedules
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code IN ('ADMIN', 'STAFF')
    ));

-- Classrooms table policies
CREATE POLICY "All authenticated users can view classrooms" ON public.classrooms
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage classrooms" ON public.classrooms
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code = 'ADMIN'
    ));

-- Roles table policies
CREATE POLICY "All authenticated users can view roles" ON public.roles
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage roles" ON public.roles
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code = 'ADMIN'
    ));

-- Audit logs policies
CREATE POLICY "Admin can view audit logs" ON public.audit_logs
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code = 'ADMIN'
    ));

CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- Other table policies
CREATE POLICY "Staff can manage order items" ON public.order_items
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code IN ('ADMIN', 'STAFF')
    ));

CREATE POLICY "Staff can manage student contacts" ON public.student_contacts
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code IN ('ADMIN', 'STAFF')
    ));

CREATE POLICY "Staff can manage enrollment extensions" ON public.enrollment_extensions
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code IN ('ADMIN', 'STAFF')
    ));

CREATE POLICY "All authenticated users can view course packages" ON public.course_packages
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage course packages" ON public.course_packages
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code IN ('ADMIN', 'STAFF')
    ));

CREATE POLICY "Staff can manage student notes history" ON public.student_notes_history
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code IN ('ADMIN', 'STAFF')
    ));

CREATE POLICY "Staff can manage handover notes" ON public.handover_notes
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.user_id = auth.uid()::text AND r.role_code IN ('ADMIN', 'STAFF')
    ));

-- 3. Fix SECURITY DEFINER views (先刪除再重新創建)
DROP VIEW IF EXISTS public.expiring_enrollments;
DROP VIEW IF EXISTS public.student_valid_credits;

CREATE VIEW public.expiring_enrollments AS
SELECT 
    e.enrollment_id,
    e.student_id,
    s.chinese_name,
    s.english_name,
    e.course_id,
    c.course_name,
    e.remaining_sessions,
    e.valid_until,
    e.is_expired,
    CASE 
        WHEN e.is_expired THEN 'expired'
        WHEN e.valid_until <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_soon'
        WHEN e.valid_until <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring'
        ELSE 'active'
    END as status
FROM enrollments e
JOIN students s ON e.student_id = s.student_id
JOIN courses c ON e.course_id = c.course_id
WHERE e.status = 'active';

CREATE VIEW public.student_valid_credits AS
SELECT 
    e.student_id,
    s.chinese_name,
    s.english_name,
    e.course_id,
    c.course_name,
    e.remaining_sessions,
    e.valid_until,
    e.is_expired
FROM enrollments e
JOIN students s ON e.student_id = s.student_id
JOIN courses c ON e.course_id = c.course_id
WHERE e.status = 'active' 
AND e.remaining_sessions > 0
AND (e.is_expired = false OR e.valid_until IS NULL);

-- 4. Fix function search paths (修正參數類型)
ALTER FUNCTION public.get_leads_by_status() SET search_path = public, pg_catalog;
ALTER FUNCTION public.manage_lead_lifecycle() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_version_and_timestamp() SET search_path = public, pg_catalog;
ALTER FUNCTION public.current_user_id() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_lead_status_on_conversion() SET search_path = public, pg_catalog;
ALTER FUNCTION public.log_student_notes_change() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_lead_status() SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_leads_by_source() SET search_path = public, pg_catalog;
ALTER FUNCTION public.check_user_permission(text, text[]) SET search_path = public, pg_catalog;
ALTER FUNCTION public.secure_get_students(text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.secure_insert_student(text, jsonb) SET search_path = public, pg_catalog;
ALTER FUNCTION public.secure_update_student(text, uuid, jsonb) SET search_path = public, pg_catalog;
ALTER FUNCTION public.secure_delete_student(text, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.secure_get_courses(text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.secure_get_orders(text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.check_enrollment_expiry() SET search_path = public, pg_catalog;
ALTER FUNCTION public.handle_attendance_insert() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_catalog;
ALTER FUNCTION public.notify_enrollment_change() SET search_path = public, pg_catalog;