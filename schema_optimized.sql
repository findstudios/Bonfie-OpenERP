SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
COMMENT ON SCHEMA "public" IS 'standard public schema';
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
CREATE OR REPLACE FUNCTION "public"."auth_user_id"() RETURNS text
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" TO 'public', 'auth'
AS $$
SELECT user_id
FROM public.users
WHERE auth_user_id = auth.uid()
LIMIT 1;
$$;
ALTER FUNCTION "public"."auth_user_id"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."auth_user_role"() RETURNS text
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public', 'auth'
AS $$
BEGIN
RETURN (
SELECT r.role_code 
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.auth_user_id = auth.uid()
AND u.status = 'active'
LIMIT 1
);
END;
$$;
ALTER FUNCTION "public"."auth_user_role"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."can_access_financial_data"() RETURNS boolean
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public', 'auth'
AS $$
BEGIN
RETURN auth_user_role() IN ('ADMIN', 'STAFF');
END;
$$;
ALTER FUNCTION "public"."can_access_financial_data"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."can_access_student_data"() RETURNS boolean
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public', 'auth'
AS $$
BEGIN
RETURN auth_user_role() IN ('ADMIN', 'STAFF', 'TEACHER');
END;
$$;
ALTER FUNCTION "public"."can_access_student_data"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."can_manage_system"() RETURNS boolean
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public', 'auth'
AS $$
BEGIN
RETURN auth_user_role() = 'ADMIN';
END;
$$;
ALTER FUNCTION "public"."can_manage_system"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."current_user_role"() RETURNS text
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public', 'auth'
AS $$
BEGIN
RETURN auth_user_role();
END;
$$;
ALTER FUNCTION "public"."current_user_role"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."get_user_role"(user_id_param text) RETURNS text
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
DECLARE
role_code TEXT;
BEGIN
SELECT r.role_code INTO role_code
FROM public.users u
JOIN public.roles r ON u.role_id = r.id
WHERE u.user_id = user_id_param;
RETURN COALESCE(role_code, 'UNKNOWN');
END;
$$;
ALTER FUNCTION "public"."get_user_role"(user_id_param text) OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."handle_new_auth_user"() RETURNS trigger
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public', 'auth'
AS $$
DECLARE
new_user_id VARCHAR;
BEGIN
-- 生成新的 user_id
new_user_id := 'USR' || LPAD(NEXTVAL('users_id_seq')::TEXT, 3, '0');
-- 檢查是否已存在（by email）
IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
-- 更新現有使用者的 auth_user_id
UPDATE public.users 
SET auth_user_id = NEW.id,
updated_at = NOW()
WHERE email = NEW.email;
ELSE
-- 創建新使用者
INSERT INTO public.users (
user_id,
username,
password_hash,
full_name,
email,
role_id,
status,
auth_user_id,
phone
) VALUES (
new_user_id,
SPLIT_PART(NEW.email, '@', 1),
'supabase_auth', -- 標記使用 Supabase Auth
COALESCE(
NEW.raw_user_meta_data->>'full_name',
SPLIT_PART(NEW.email, '@', 1)
),
NEW.email,
COALESCE(
(NEW.raw_user_meta_data->>'role_id')::INTEGER,
3 -- 預設為教師
),
'active',
NEW.id,
NEW.raw_user_meta_data->>'phone'
);
END IF;
RETURN NEW;
END;
$$;
ALTER FUNCTION "public"."handle_new_auth_user"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."handle_new_auth_user_simple"() RETURNS trigger
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public', 'auth'
AS $$
BEGIN
-- 只更新現有使用者的 auth_user_id
UPDATE public.users 
SET auth_user_id = NEW.id,
updated_at = NOW()
WHERE email = NEW.email;
RETURN NEW;
END;
$$;
ALTER FUNCTION "public"."handle_new_auth_user_simple"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" TO 'public', 'auth'
AS $$
SELECT EXISTS (
SELECT 1
FROM public.users u
JOIN public.roles r ON u.role_id = r.id
WHERE u.auth_user_id = auth.uid()
AND r.role_code = 'ADMIN'
);
$$;
ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."is_staff_or_admin"() RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" TO 'public', 'auth'
AS $$
SELECT EXISTS (
SELECT 1
FROM public.users u
JOIN public.roles r ON u.role_id = r.id
WHERE u.auth_user_id = auth.uid()
AND r.role_code IN ('ADMIN', 'STAFF')
);
$$;
ALTER FUNCTION "public"."is_staff_or_admin"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."update_last_login"() RETURNS trigger
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
BEGIN
UPDATE public.users
SET last_login_at = NOW()
WHERE auth_user_id = NEW.id;
RETURN NEW;
END;
$$;
ALTER FUNCTION "public"."update_last_login"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS trigger
LANGUAGE "plpgsql"
AS $$
BEGIN
NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$;
ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";
SET default_tablespace = '';
SET default_table_access_method = "heap";
CREATE TABLE IF NOT EXISTS "public"."attendance" (
"id" integer NOT NULL,
"schedule_id" character varying NOT NULL,
"student_id" character varying NOT NULL,
"enrollment_id" character varying NOT NULL,
"status" character varying DEFAULT 'present'::character varying,
"session_deducted" boolean DEFAULT true,
"teacher_notes" text,
"marked_at" timestamp without time zone,
"marked_by" character varying,
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "public"."attendance" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."attendance_id_seq"
AS integer
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."attendance_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."attendance_id_seq" OWNED BY "public"."attendance"."id";
CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
"id" bigint NOT NULL,
"user_id" character varying NOT NULL,
"action" character varying NOT NULL,
"table_name" character varying,
"record_id" character varying,
"old_values" jsonb,
"new_values" jsonb,
"old_amount" numeric,
"new_amount" numeric,
"old_status" character varying,
"new_status" character varying,
"ip_address" inet,
"user_agent" text,
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "public"."audit_logs" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."audit_logs_id_seq"
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."audit_logs_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."audit_logs_id_seq" OWNED BY "public"."audit_logs"."id";
CREATE TABLE IF NOT EXISTS "public"."classrooms" (
"id" integer NOT NULL,
"classroom_id" character varying NOT NULL,
"classroom_name" character varying NOT NULL,
"capacity" integer DEFAULT 10,
"is_active" boolean DEFAULT true,
"created_at" timestamp without time zone DEFAULT now(),
"updated_at" timestamp without time zone DEFAULT now()
);
ALTER TABLE "public"."classrooms" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."classrooms_id_seq"
AS integer
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."classrooms_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."classrooms_id_seq" OWNED BY "public"."classrooms"."id";
CREATE TABLE IF NOT EXISTS "public"."contacts" (
"id" integer NOT NULL,
"contact_id" character varying NOT NULL,
"full_name" character varying NOT NULL,
"phone" character varying,
"email" character varying,
"address" text,
"notes" text,
"is_active" boolean DEFAULT true,
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"version" integer DEFAULT 1,
"last_modified_by" character varying
);
ALTER TABLE "public"."contacts" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."contacts_id_seq"
AS integer
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."contacts_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."contacts_id_seq" OWNED BY "public"."contacts"."id";
CREATE SEQUENCE IF NOT EXISTS "public"."conversions_id_seq"
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."conversions_id_seq" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."conversions" (
"id" integer DEFAULT nextval('public.conversions_id_seq'::regclass) NOT NULL,
"conversion_id" character varying NOT NULL,
"lead_id" character varying NOT NULL,
"student_id" character varying NOT NULL,
"order_id" character varying,
"enrollment_date" date NOT NULL,
"total_amount" numeric NOT NULL,
"conversion_days" integer,
"converted_by" character varying NOT NULL,
"notes" text,
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "public"."conversions" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."course_packages" (
"id" integer NOT NULL,
"package_id" character varying DEFAULT concat('PKG', to_char(now(), 'YYYYMMDDHH24MISS'::text), lpad((floor((random() * (1000)::double precision)))::text, 3, '0'::text)) NOT NULL,
"course_id" character varying,
"package_name" character varying NOT NULL,
"session_count" integer NOT NULL,
"price" numeric NOT NULL,
"discount_percentage" numeric DEFAULT 0,
"validity_days" integer DEFAULT 180,
"sort_order" integer DEFAULT 0,
"is_active" boolean DEFAULT true,
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "public"."course_packages" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."course_packages_id_seq"
AS integer
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."course_packages_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."course_packages_id_seq" OWNED BY "public"."course_packages"."id";
CREATE TABLE IF NOT EXISTS "public"."courses" (
"id" integer NOT NULL,
"course_id" character varying NOT NULL,
"course_name" character varying NOT NULL,
"instructor_id" character varying NOT NULL,
"course_type" character varying DEFAULT 'regular'::character varying,
"category" character varying,
"total_sessions" integer NOT NULL,
"price_per_session" numeric,
"max_students" integer DEFAULT 10,
"status" character varying DEFAULT 'planning'::character varying,
"schedule_pattern" jsonb,
"description" text,
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"course_category" character varying,
"duration_weeks" integer,
"start_date" date,
"end_date" date,
"allow_package_purchase" boolean DEFAULT false,
"default_validity_days" integer DEFAULT 180,
CONSTRAINT "courses_course_category_check" CHECK (((course_category)::text = ANY ((ARRAY['theme'::character varying, 'regular'::character varying])::text[])))
);
ALTER TABLE "public"."courses" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."courses_id_seq"
AS integer
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."courses_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."courses_id_seq" OWNED BY "public"."courses"."id";
CREATE TABLE IF NOT EXISTS "public"."enrollments" (
"id" integer NOT NULL,
"enrollment_id" character varying NOT NULL,
"student_id" character varying NOT NULL,
"course_id" character varying NOT NULL,
"purchased_sessions" integer NOT NULL,
"remaining_sessions" integer NOT NULL,
"bonus_sessions" integer DEFAULT 0,
"status" character varying DEFAULT 'active'::character varying,
"source" character varying DEFAULT 'manual'::character varying,
"notes" text,
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"enrollment_category" character varying DEFAULT 'regular'::character varying,
"package_id" character varying,
"valid_from" date DEFAULT CURRENT_DATE,
"valid_until" date,
"is_expired" boolean DEFAULT false,
"extended_times" integer DEFAULT 0,
"last_extended_at" timestamp without time zone,
"last_extended_by" character varying,
CONSTRAINT "enrollments_enrollment_category_check" CHECK (((enrollment_category)::text = ANY ((ARRAY['theme'::character varying, 'regular'::character varying])::text[])))
);
ALTER TABLE "public"."enrollments" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."enrollments_id_seq"
AS integer
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."enrollments_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."enrollments_id_seq" OWNED BY "public"."enrollments"."id";
CREATE SEQUENCE IF NOT EXISTS "public"."follow_ups_id_seq"
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."follow_ups_id_seq" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."follow_ups" (
"id" integer DEFAULT nextval('public.follow_ups_id_seq'::regclass) NOT NULL,
"follow_up_id" character varying NOT NULL,
"lead_id" character varying NOT NULL,
"type" character varying NOT NULL,
"subject" character varying NOT NULL,
"content" text NOT NULL,
"result" character varying NOT NULL,
"next_follow_up" date,
"created_by" character varying NOT NULL,
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "follow_ups_result_check" CHECK (((result)::text = ANY (ARRAY[('positive'::character varying)::text, ('neutral'::character varying)::text, ('negative'::character varying)::text, ('no_response'::character varying)::text, ('converted'::character varying)::text, ('lost'::character varying)::text]))),
CONSTRAINT "follow_ups_type_check" CHECK (((type)::text = ANY (ARRAY[('phone_call'::character varying)::text, ('message'::character varying)::text, ('email'::character varying)::text, ('visit'::character varying)::text, ('trial_class'::character varying)::text, ('meeting'::character varying)::text, ('other'::character varying)::text])))
);
ALTER TABLE "public"."follow_ups" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."handover_notes_id_seq"
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."handover_notes_id_seq" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."handover_notes" (
"id" integer DEFAULT nextval('public.handover_notes_id_seq'::regclass) NOT NULL,
"content" text NOT NULL,
"author_id" character varying NOT NULL,
"priority" character varying DEFAULT 'normal'::character varying,
"tags" text[],
"mentioned_users" character varying[],
"read_by" character varying[],
"is_active" boolean DEFAULT true,
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "handover_notes_priority_check" CHECK (((priority)::text = ANY (ARRAY[('high'::character varying)::text, ('normal'::character varying)::text, ('low'::character varying)::text])))
);
ALTER TABLE "public"."handover_notes" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."lead_tags" (
"lead_id" character varying NOT NULL,
"tag_id" character varying NOT NULL
);
ALTER TABLE "public"."lead_tags" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."leads_id_seq"
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."leads_id_seq" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."leads" (
"id" integer DEFAULT nextval('public.leads_id_seq'::regclass) NOT NULL,
"lead_id" character varying NOT NULL,
"full_name" character varying NOT NULL,
"parent_name" character varying,
"phone" character varying NOT NULL,
"email" character varying,
"age" integer,
"school" character varying,
"grade" character varying,
"status" character varying DEFAULT 'new'::character varying,
"source" character varying NOT NULL,
"interest_subjects" text[],
"budget_range" character varying,
"preferred_schedule" character varying,
"notes" text,
"assigned_to" character varying,
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "leads_source_check" CHECK (((source)::text = ANY (ARRAY[('walk_in'::character varying)::text, ('referral'::character varying)::text, ('online'::character varying)::text, ('phone'::character varying)::text, ('social_media'::character varying)::text, ('flyer'::character varying)::text, ('event'::character varying)::text, ('other'::character varying)::text]))),
CONSTRAINT "leads_status_check" CHECK (((status)::text = ANY (ARRAY[('new'::character varying)::text, ('contacted'::character varying)::text, ('interested'::character varying)::text, ('trial_scheduled'::character varying)::text, ('trial_completed'::character varying)::text, ('converted'::character varying)::text, ('lost'::character varying)::text])))
);
ALTER TABLE "public"."leads" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."migration_history" (
"id" integer NOT NULL,
"version" character varying(50) NOT NULL,
"description" text,
"applied_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"applied_by" character varying(255)
);
ALTER TABLE "public"."migration_history" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."migration_history_id_seq"
AS integer
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."migration_history_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."migration_history_id_seq" OWNED BY "public"."migration_history"."id";
CREATE TABLE IF NOT EXISTS "public"."order_items" (
"id" integer NOT NULL,
"order_id" character varying NOT NULL,
"item_type" character varying NOT NULL,
"item_id" character varying,
"item_name" character varying NOT NULL,
"quantity" integer DEFAULT 1,
"unit_price" numeric NOT NULL,
"total_price" numeric NOT NULL,
"discount_amount" numeric DEFAULT 0,
"final_price" numeric NOT NULL,
"notes" text,
"package_id" character varying,
"validity_days" integer
);
ALTER TABLE "public"."order_items" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."order_items_id_seq"
AS integer
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."order_items_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."order_items_id_seq" OWNED BY "public"."order_items"."id";
CREATE TABLE IF NOT EXISTS "public"."orders" (
"id" integer NOT NULL,
"order_id" character varying NOT NULL,
"student_id" character varying NOT NULL,
"contact_id" character varying NOT NULL,
"item_type" character varying DEFAULT 'enrollment'::character varying,
"original_amount" numeric NOT NULL,
"discount_amount" numeric DEFAULT 0,
"final_amount" numeric NOT NULL,
"status" character varying DEFAULT 'pending'::character varying,
"discount_reason" text,
"created_by" character varying,
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "public"."orders" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."orders_id_seq"
AS integer
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."orders_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."orders_id_seq" OWNED BY "public"."orders"."id";
CREATE TABLE IF NOT EXISTS "public"."payments" (
"id" integer NOT NULL,
"payment_id" character varying NOT NULL,
"order_id" character varying NOT NULL,
"amount_paid" numeric NOT NULL,
"payment_method" character varying DEFAULT 'cash'::character varying,
"payment_date" date NOT NULL,
"receipt_number" character varying,
"notes" text,
"created_by" character varying,
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "public"."payments" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."payments_id_seq"
AS integer
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."payments_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."payments_id_seq" OWNED BY "public"."payments"."id";
CREATE TABLE IF NOT EXISTS "public"."roles" (
"id" integer NOT NULL,
"role_code" character varying NOT NULL,
"role_name" character varying NOT NULL,
"permissions" jsonb,
"description" text,
"is_active" boolean DEFAULT true,
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "public"."roles" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."roles_id_seq"
AS integer
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."roles_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."roles_id_seq" OWNED BY "public"."roles"."id";
CREATE TABLE IF NOT EXISTS "public"."schedules" (
"id" integer NOT NULL,
"schedule_id" character varying NOT NULL,
"course_id" character varying NOT NULL,
"class_datetime" timestamp without time zone NOT NULL,
"end_datetime" timestamp without time zone NOT NULL,
"session_number" integer,
"classroom" character varying,
"status" character varying DEFAULT 'scheduled'::character varying,
"is_makeup" boolean DEFAULT false,
"makeup_for_schedule_id" character varying,
"notes" text,
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "public"."schedules" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."schedules_id_seq"
AS integer
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."schedules_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."schedules_id_seq" OWNED BY "public"."schedules"."id";
CREATE TABLE IF NOT EXISTS "public"."security_events" (
"id" bigint NOT NULL,
"event_type" character varying(50) NOT NULL,
"severity" character varying(20) NOT NULL,
"user_id" character varying(255),
"ip_address" inet,
"user_agent" text,
"details" jsonb,
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "public"."security_events" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."security_events_id_seq"
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."security_events_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."security_events_id_seq" OWNED BY "public"."security_events"."id";
CREATE TABLE IF NOT EXISTS "public"."sessions" (
"id" bigint NOT NULL,
"session_id" character varying(255) NOT NULL,
"user_id" character varying(255) NOT NULL,
"token_hash" character varying(255) NOT NULL,
"csrf_token" character varying(255) NOT NULL,
"ip_address" inet,
"user_agent" text,
"expires_at" timestamp without time zone NOT NULL,
"last_activity_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"is_active" boolean DEFAULT true,
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "public"."sessions" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."sessions_id_seq"
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."sessions_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."sessions_id_seq" OWNED BY "public"."sessions"."id";
CREATE TABLE IF NOT EXISTS "public"."student_contacts" (
"id" integer NOT NULL,
"student_id" character varying NOT NULL,
"contact_id" character varying NOT NULL,
"relationship" character varying NOT NULL,
"is_primary" boolean DEFAULT false,
"is_emergency" boolean DEFAULT false,
"is_billing" boolean DEFAULT false,
"notes" text,
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"version" integer DEFAULT 1,
"last_modified_by" character varying
);
ALTER TABLE "public"."student_contacts" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."student_contacts_id_seq"
AS integer
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."student_contacts_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."student_contacts_id_seq" OWNED BY "public"."student_contacts"."id";
CREATE SEQUENCE IF NOT EXISTS "public"."student_notes_history_id_seq"
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."student_notes_history_id_seq" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."student_notes_history" (
"id" bigint DEFAULT nextval('public.student_notes_history_id_seq'::regclass) NOT NULL,
"student_id" character varying,
"note_content" text NOT NULL,
"note_type" character varying DEFAULT 'general'::character varying,
"created_by" character varying,
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "public"."student_notes_history" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."students" (
"id" integer NOT NULL,
"student_id" character varying NOT NULL,
"chinese_name" character varying NOT NULL,
"english_name" character varying,
"birth_date" date,
"notes" text,
"is_active" boolean DEFAULT true,
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "public"."students" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."students_id_seq"
AS integer
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."students_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."students_id_seq" OWNED BY "public"."students"."id";
CREATE SEQUENCE IF NOT EXISTS "public"."tags_id_seq"
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."tags_id_seq" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."tags" (
"id" integer DEFAULT nextval('public.tags_id_seq'::regclass) NOT NULL,
"tag_id" character varying NOT NULL,
"name" character varying NOT NULL,
"color" character varying NOT NULL,
"description" text,
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "public"."tags" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."trial_classes_id_seq"
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."trial_classes_id_seq" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."trial_classes" (
"id" integer DEFAULT nextval('public.trial_classes_id_seq'::regclass) NOT NULL,
"trial_id" character varying NOT NULL,
"lead_id" character varying NOT NULL,
"course_id" character varying,
"scheduled_date" date NOT NULL,
"scheduled_time" time without time zone NOT NULL,
"teacher_id" character varying,
"classroom" character varying,
"status" character varying DEFAULT 'scheduled'::character varying,
"attendance" boolean,
"feedback" text,
"rating" integer,
"follow_up_notes" text,
"created_by" character varying NOT NULL,
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "trial_classes_rating_check" CHECK (((rating >= 1) AND (rating <= 5))),
CONSTRAINT "trial_classes_status_check" CHECK (((status)::text = ANY (ARRAY[('scheduled'::character varying)::text, ('completed'::character varying)::text, ('cancelled'::character varying)::text, ('no_show'::character varying)::text])))
);
ALTER TABLE "public"."trial_classes" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."tutoring_center_settings" (
"id" integer NOT NULL,
"setting_key" character varying NOT NULL,
"setting_value" jsonb NOT NULL,
"description" text,
"updated_by" character varying,
"updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "public"."tutoring_center_settings" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."tutoring_center_settings_id_seq"
AS integer
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."tutoring_center_settings_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."tutoring_center_settings_id_seq" OWNED BY "public"."tutoring_center_settings"."id";
CREATE TABLE IF NOT EXISTS "public"."users" (
"id" integer NOT NULL,
"user_id" character varying NOT NULL,
"username" character varying NOT NULL,
"password_hash" character varying NOT NULL,
"full_name" character varying NOT NULL,
"role_id" integer NOT NULL,
"phone" character varying,
"email" character varying NOT NULL,
"status" character varying DEFAULT 'active'::character varying,
"last_login_at" timestamp without time zone,
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
"avatar_url" text,
"auth_user_id" uuid
);
ALTER TABLE "public"."users" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."users_id_seq"
AS integer
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
ALTER SEQUENCE "public"."users_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."users_id_seq" OWNED BY "public"."users"."id";
ALTER TABLE ONLY "public"."attendance" ALTER COLUMN "id" SET DEFAULT nextval('public.attendance_id_seq'::regclass);
ALTER TABLE ONLY "public"."audit_logs" ALTER COLUMN "id" SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);
ALTER TABLE ONLY "public"."classrooms" ALTER COLUMN "id" SET DEFAULT nextval('public.classrooms_id_seq'::regclass);
ALTER TABLE ONLY "public"."contacts" ALTER COLUMN "id" SET DEFAULT nextval('public.contacts_id_seq'::regclass);
ALTER TABLE ONLY "public"."course_packages" ALTER COLUMN "id" SET DEFAULT nextval('public.course_packages_id_seq'::regclass);
ALTER TABLE ONLY "public"."courses" ALTER COLUMN "id" SET DEFAULT nextval('public.courses_id_seq'::regclass);
ALTER TABLE ONLY "public"."enrollments" ALTER COLUMN "id" SET DEFAULT nextval('public.enrollments_id_seq'::regclass);
ALTER TABLE ONLY "public"."migration_history" ALTER COLUMN "id" SET DEFAULT nextval('public.migration_history_id_seq'::regclass);
ALTER TABLE ONLY "public"."order_items" ALTER COLUMN "id" SET DEFAULT nextval('public.order_items_id_seq'::regclass);
ALTER TABLE ONLY "public"."orders" ALTER COLUMN "id" SET DEFAULT nextval('public.orders_id_seq'::regclass);
ALTER TABLE ONLY "public"."payments" ALTER COLUMN "id" SET DEFAULT nextval('public.payments_id_seq'::regclass);
ALTER TABLE ONLY "public"."roles" ALTER COLUMN "id" SET DEFAULT nextval('public.roles_id_seq'::regclass);
ALTER TABLE ONLY "public"."schedules" ALTER COLUMN "id" SET DEFAULT nextval('public.schedules_id_seq'::regclass);
ALTER TABLE ONLY "public"."security_events" ALTER COLUMN "id" SET DEFAULT nextval('public.security_events_id_seq'::regclass);
ALTER TABLE ONLY "public"."sessions" ALTER COLUMN "id" SET DEFAULT nextval('public.sessions_id_seq'::regclass);
ALTER TABLE ONLY "public"."student_contacts" ALTER COLUMN "id" SET DEFAULT nextval('public.student_contacts_id_seq'::regclass);
ALTER TABLE ONLY "public"."students" ALTER COLUMN "id" SET DEFAULT nextval('public.students_id_seq'::regclass);
ALTER TABLE ONLY "public"."tutoring_center_settings" ALTER COLUMN "id" SET DEFAULT nextval('public.tutoring_center_settings_id_seq'::regclass);
ALTER TABLE ONLY "public"."users" ALTER COLUMN "id" SET DEFAULT nextval('public.users_id_seq'::regclass);
ALTER TABLE ONLY "public"."attendance"
ADD CONSTRAINT "attendance_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."audit_logs"
ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."classrooms"
ADD CONSTRAINT "classrooms_classroom_id_key" UNIQUE ("classroom_id");
ALTER TABLE ONLY "public"."classrooms"
ADD CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."contacts"
ADD CONSTRAINT "contacts_contact_id_key" UNIQUE ("contact_id");
ALTER TABLE ONLY "public"."contacts"
ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."conversions"
ADD CONSTRAINT "conversions_conversion_id_key" UNIQUE ("conversion_id");
ALTER TABLE ONLY "public"."conversions"
ADD CONSTRAINT "conversions_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."course_packages"
ADD CONSTRAINT "course_packages_package_id_key" UNIQUE ("package_id");
ALTER TABLE ONLY "public"."course_packages"
ADD CONSTRAINT "course_packages_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."courses"
ADD CONSTRAINT "courses_course_id_key" UNIQUE ("course_id");
ALTER TABLE ONLY "public"."courses"
ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."enrollments"
ADD CONSTRAINT "enrollments_enrollment_id_key" UNIQUE ("enrollment_id");
ALTER TABLE ONLY "public"."enrollments"
ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."follow_ups"
ADD CONSTRAINT "follow_ups_follow_up_id_key" UNIQUE ("follow_up_id");
ALTER TABLE ONLY "public"."follow_ups"
ADD CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."handover_notes"
ADD CONSTRAINT "handover_notes_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."lead_tags"
ADD CONSTRAINT "lead_tags_pkey" PRIMARY KEY ("lead_id", "tag_id");
ALTER TABLE ONLY "public"."leads"
ADD CONSTRAINT "leads_lead_id_key" UNIQUE ("lead_id");
ALTER TABLE ONLY "public"."leads"
ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."migration_history"
ADD CONSTRAINT "migration_history_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."order_items"
ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."orders"
ADD CONSTRAINT "orders_order_id_key" UNIQUE ("order_id");
ALTER TABLE ONLY "public"."orders"
ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."payments"
ADD CONSTRAINT "payments_payment_id_key" UNIQUE ("payment_id");
ALTER TABLE ONLY "public"."payments"
ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."roles"
ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."roles"
ADD CONSTRAINT "roles_role_code_key" UNIQUE ("role_code");
ALTER TABLE ONLY "public"."schedules"
ADD CONSTRAINT "schedules_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."schedules"
ADD CONSTRAINT "schedules_schedule_id_key" UNIQUE ("schedule_id");
ALTER TABLE ONLY "public"."security_events"
ADD CONSTRAINT "security_events_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."sessions"
ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."sessions"
ADD CONSTRAINT "sessions_session_id_key" UNIQUE ("session_id");
ALTER TABLE ONLY "public"."student_contacts"
ADD CONSTRAINT "student_contacts_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."student_notes_history"
ADD CONSTRAINT "student_notes_history_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."students"
ADD CONSTRAINT "students_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."students"
ADD CONSTRAINT "students_student_id_key" UNIQUE ("student_id");
ALTER TABLE ONLY "public"."tags"
ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."tags"
ADD CONSTRAINT "tags_tag_id_key" UNIQUE ("tag_id");
ALTER TABLE ONLY "public"."trial_classes"
ADD CONSTRAINT "trial_classes_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."trial_classes"
ADD CONSTRAINT "trial_classes_trial_id_key" UNIQUE ("trial_id");
ALTER TABLE ONLY "public"."tutoring_center_settings"
ADD CONSTRAINT "tutoring_center_settings_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."tutoring_center_settings"
ADD CONSTRAINT "tutoring_center_settings_setting_key_key" UNIQUE ("setting_key");
ALTER TABLE ONLY "public"."users"
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."users"
ADD CONSTRAINT "users_user_id_key" UNIQUE ("user_id");
ALTER TABLE ONLY "public"."users"
ADD CONSTRAINT "users_username_key" UNIQUE ("username");
CREATE INDEX idx_attendance_schedule_id ON public.attendance USING btree (schedule_id);
CREATE INDEX idx_attendance_student_id ON public.attendance USING btree (student_id);
CREATE INDEX idx_contacts_contact_id ON public.contacts USING btree (contact_id);
CREATE INDEX idx_enrollments_course_id ON public.enrollments USING btree (course_id);
CREATE INDEX idx_enrollments_student_id ON public.enrollments USING btree (student_id);
CREATE INDEX idx_follow_ups_lead_id ON public.follow_ups USING btree (lead_id);
CREATE INDEX idx_follow_ups_next_follow_up ON public.follow_ups USING btree (next_follow_up);
CREATE INDEX idx_handover_notes_created_at ON public.handover_notes USING btree (created_at);
CREATE INDEX idx_handover_notes_is_active ON public.handover_notes USING btree (is_active);
CREATE INDEX idx_leads_assigned_to ON public.leads USING btree (assigned_to);
CREATE INDEX idx_leads_status ON public.leads USING btree (status);
CREATE INDEX idx_orders_order_id ON public.orders USING btree (order_id);
CREATE INDEX idx_schedules_class_datetime ON public.schedules USING btree (class_datetime);
CREATE INDEX idx_schedules_course_id ON public.schedules USING btree (course_id);
CREATE INDEX idx_security_events_created ON public.security_events USING btree (created_at);
CREATE INDEX idx_security_events_type ON public.security_events USING btree (event_type);
CREATE INDEX idx_sessions_expires_at ON public.sessions USING btree (expires_at);
CREATE INDEX idx_sessions_session_id ON public.sessions USING btree (session_id);
CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);
CREATE INDEX idx_student_notes_history_created_at ON public.student_notes_history USING btree (created_at DESC);
CREATE INDEX idx_student_notes_history_student_id ON public.student_notes_history USING btree (student_id);
CREATE INDEX idx_students_student_id ON public.students USING btree (student_id);
CREATE INDEX idx_trial_classes_lead_id ON public.trial_classes USING btree (lead_id);
CREATE INDEX idx_trial_classes_scheduled_date ON public.trial_classes USING btree (scheduled_date);
CREATE INDEX idx_trial_classes_status ON public.trial_classes USING btree (status);
CREATE INDEX idx_users_user_id ON public.users USING btree (user_id);
CREATE INDEX idx_users_username ON public.users USING btree (username);
CREATE UNIQUE INDEX users_email_unique ON public.users USING btree (email);
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conversions_updated_at BEFORE UPDATE ON public.conversions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_follow_ups_updated_at BEFORE UPDATE ON public.follow_ups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_handover_notes_updated_at BEFORE UPDATE ON public.handover_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trial_classes_updated_at BEFORE UPDATE ON public.trial_classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE ONLY "public"."attendance"
ADD CONSTRAINT "attendance_enrollment_id_fkey" FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(enrollment_id);
ALTER TABLE ONLY "public"."attendance"
ADD CONSTRAINT "attendance_marked_by_fkey" FOREIGN KEY (marked_by) REFERENCES public.users(user_id);
ALTER TABLE ONLY "public"."attendance"
ADD CONSTRAINT "attendance_schedule_id_fkey" FOREIGN KEY (schedule_id) REFERENCES public.schedules(schedule_id);
ALTER TABLE ONLY "public"."attendance"
ADD CONSTRAINT "attendance_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public.students(student_id);
ALTER TABLE ONLY "public"."audit_logs"
ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY "public"."conversions"
ADD CONSTRAINT "conversions_converted_by_fkey" FOREIGN KEY (converted_by) REFERENCES public.users(user_id);
ALTER TABLE ONLY "public"."conversions"
ADD CONSTRAINT "conversions_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(lead_id);
ALTER TABLE ONLY "public"."conversions"
ADD CONSTRAINT "conversions_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(order_id);
ALTER TABLE ONLY "public"."conversions"
ADD CONSTRAINT "conversions_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public.students(student_id);
ALTER TABLE ONLY "public"."course_packages"
ADD CONSTRAINT "course_packages_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(course_id);
ALTER TABLE ONLY "public"."courses"
ADD CONSTRAINT "courses_instructor_id_fkey" FOREIGN KEY (instructor_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY "public"."enrollments"
ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(course_id);
ALTER TABLE ONLY "public"."enrollments"
ADD CONSTRAINT "enrollments_last_extended_by_fkey" FOREIGN KEY (last_extended_by) REFERENCES public.users(user_id);
ALTER TABLE ONLY "public"."enrollments"
ADD CONSTRAINT "enrollments_package_id_fkey" FOREIGN KEY (package_id) REFERENCES public.course_packages(package_id);
ALTER TABLE ONLY "public"."enrollments"
ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public.students(student_id);
ALTER TABLE ONLY "public"."follow_ups"
ADD CONSTRAINT "follow_ups_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(user_id);
ALTER TABLE ONLY "public"."follow_ups"
ADD CONSTRAINT "follow_ups_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(lead_id);
ALTER TABLE ONLY "public"."handover_notes"
ADD CONSTRAINT "handover_notes_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY "public"."lead_tags"
ADD CONSTRAINT "lead_tags_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(lead_id);
ALTER TABLE ONLY "public"."lead_tags"
ADD CONSTRAINT "lead_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES public.tags(tag_id);
ALTER TABLE ONLY "public"."leads"
ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES public.users(user_id);
ALTER TABLE ONLY "public"."order_items"
ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(order_id);
ALTER TABLE ONLY "public"."order_items"
ADD CONSTRAINT "order_items_package_id_fkey" FOREIGN KEY (package_id) REFERENCES public.course_packages(package_id);
ALTER TABLE ONLY "public"."orders"
ADD CONSTRAINT "orders_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(contact_id);
ALTER TABLE ONLY "public"."orders"
ADD CONSTRAINT "orders_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(user_id);
ALTER TABLE ONLY "public"."orders"
ADD CONSTRAINT "orders_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public.students(student_id);
ALTER TABLE ONLY "public"."payments"
ADD CONSTRAINT "payments_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(user_id);
ALTER TABLE ONLY "public"."payments"
ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(order_id);
ALTER TABLE ONLY "public"."schedules"
ADD CONSTRAINT "schedules_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(course_id);
ALTER TABLE ONLY "public"."schedules"
ADD CONSTRAINT "schedules_makeup_for_schedule_id_fkey" FOREIGN KEY (makeup_for_schedule_id) REFERENCES public.schedules(schedule_id);
ALTER TABLE ONLY "public"."sessions"
ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."student_contacts"
ADD CONSTRAINT "student_contacts_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(contact_id);
ALTER TABLE ONLY "public"."student_contacts"
ADD CONSTRAINT "student_contacts_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public.students(student_id);
ALTER TABLE ONLY "public"."student_notes_history"
ADD CONSTRAINT "student_notes_history_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;
ALTER TABLE ONLY "public"."student_notes_history"
ADD CONSTRAINT "student_notes_history_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."trial_classes"
ADD CONSTRAINT "trial_classes_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(course_id);
ALTER TABLE ONLY "public"."trial_classes"
ADD CONSTRAINT "trial_classes_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(user_id);
ALTER TABLE ONLY "public"."trial_classes"
ADD CONSTRAINT "trial_classes_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(lead_id);
ALTER TABLE ONLY "public"."trial_classes"
ADD CONSTRAINT "trial_classes_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY "public"."tutoring_center_settings"
ADD CONSTRAINT "tutoring_center_settings_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.users(user_id);
ALTER TABLE ONLY "public"."users"
ADD CONSTRAINT "users_auth_user_id_fkey" FOREIGN KEY (auth_user_id) REFERENCES auth.users(id);
ALTER TABLE ONLY "public"."users"
ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public.roles(id);
CREATE POLICY "Enable delete for authenticated users" ON "public"."student_notes_history" FOR DELETE TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "public"."student_notes_history" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable insert for system" ON "public"."users" FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read access for all authenticated users" ON "public"."student_notes_history" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all users" ON "public"."users" FOR SELECT USING (true);
CREATE POLICY "Enable read access for roles" ON "public"."roles" FOR SELECT USING (true);
CREATE POLICY "Enable update for authenticated users" ON "public"."student_notes_history" FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable users to update own profile" ON "public"."users" FOR UPDATE USING ((auth.uid() = auth_user_id)) WITH CHECK ((auth.uid() = auth_user_id));
CREATE POLICY "admin_delete_attendance" ON "public"."attendance" FOR DELETE USING ((public.auth_user_role() = 'ADMIN'::text));
CREATE POLICY "admin_delete_handover_notes" ON "public"."handover_notes" FOR DELETE USING ((public.auth_user_role() = 'ADMIN'::text));
CREATE POLICY "admin_delete_settings" ON "public"."tutoring_center_settings" FOR DELETE USING ((EXISTS ( SELECT 1
FROM (public.users u
JOIN public.roles r ON ((u.role_id = r.id)))
WHERE ((u.auth_user_id = auth.uid()) AND ((r.role_code)::text = 'ADMIN'::text) AND ((u.status)::text = 'active'::text)))));
CREATE POLICY "admin_insert_settings" ON "public"."tutoring_center_settings" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
FROM (public.users u
JOIN public.roles r ON ((u.role_id = r.id)))
WHERE ((u.auth_user_id = auth.uid()) AND ((r.role_code)::text = 'ADMIN'::text) AND ((u.status)::text = 'active'::text)))));
CREATE POLICY "admin_manage_payments" ON "public"."payments" USING ((public.auth_user_role() = 'ADMIN'::text)) WITH CHECK ((public.auth_user_role() = 'ADMIN'::text));
CREATE POLICY "admin_manage_tags" ON "public"."tags" USING ((public.auth_user_role() = 'ADMIN'::text)) WITH CHECK ((public.auth_user_role() = 'ADMIN'::text));
CREATE POLICY "admin_only_audit" ON "public"."audit_logs" FOR SELECT USING ((public.auth_user_role() = 'ADMIN'::text));
CREATE POLICY "admin_only_migration_history" ON "public"."migration_history" FOR SELECT USING ((public.auth_user_role() = 'ADMIN'::text));
CREATE POLICY "admin_only_security_events" ON "public"."security_events" USING ((public.auth_user_role() = 'ADMIN'::text)) WITH CHECK ((public.auth_user_role() = 'ADMIN'::text));
CREATE POLICY "admin_staff_manage_students" ON "public"."students" USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text]))) WITH CHECK ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "admin_staff_view_students" ON "public"."students" FOR SELECT USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "admin_update_settings" ON "public"."tutoring_center_settings" FOR UPDATE USING ((EXISTS ( SELECT 1
FROM (public.users u
JOIN public.roles r ON ((u.role_id = r.id)))
WHERE ((u.auth_user_id = auth.uid()) AND ((r.role_code)::text = 'ADMIN'::text) AND ((u.status)::text = 'active'::text))))) WITH CHECK ((EXISTS ( SELECT 1
FROM (public.users u
JOIN public.roles r ON ((u.role_id = r.id)))
WHERE ((u.auth_user_id = auth.uid()) AND ((r.role_code)::text = 'ADMIN'::text) AND ((u.status)::text = 'active'::text)))));
CREATE POLICY "admin_view_all_sessions" ON "public"."sessions" FOR SELECT USING ((public.auth_user_role() = 'ADMIN'::text));
CREATE POLICY "all_view_active_classrooms" ON "public"."classrooms" FOR SELECT USING ((is_active = true));
CREATE POLICY "all_view_active_courses" ON "public"."courses" FOR SELECT USING (((status)::text = 'active'::text));
ALTER TABLE "public"."attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_users_view_settings" ON "public"."tutoring_center_settings" FOR SELECT USING ((auth.uid() IS NOT NULL));
ALTER TABLE "public"."classrooms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."course_packages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."follow_ups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."handover_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."lead_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."migration_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."security_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_create_attendance" ON "public"."attendance" FOR INSERT WITH CHECK ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_create_handover_notes" ON "public"."handover_notes" FOR INSERT WITH CHECK ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_manage_attendance" ON "public"."attendance" USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text]))) WITH CHECK ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_manage_classrooms" ON "public"."classrooms" USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text]))) WITH CHECK ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_manage_contacts" ON "public"."contacts" USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text]))) WITH CHECK ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_manage_conversions" ON "public"."conversions" USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text]))) WITH CHECK ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_manage_courses" ON "public"."courses" USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text]))) WITH CHECK ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_manage_enrollments" ON "public"."enrollments" USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text]))) WITH CHECK ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_manage_follow_ups" ON "public"."follow_ups" USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text]))) WITH CHECK ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_manage_lead_tags" ON "public"."lead_tags" USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text]))) WITH CHECK ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_manage_leads" ON "public"."leads" USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text]))) WITH CHECK ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_manage_packages" ON "public"."course_packages" USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text]))) WITH CHECK ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_manage_schedules" ON "public"."schedules" USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text]))) WITH CHECK ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_manage_student_contacts" ON "public"."student_contacts" USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text]))) WITH CHECK ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_manage_trial_classes" ON "public"."trial_classes" USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text]))) WITH CHECK ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_only_order_items" ON "public"."order_items" USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text]))) WITH CHECK ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_only_orders" ON "public"."orders" USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text]))) WITH CHECK ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_update_attendance" ON "public"."attendance" FOR UPDATE USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text]))) WITH CHECK ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_view_all_leads" ON "public"."leads" FOR SELECT USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_view_attendance" ON "public"."attendance" FOR SELECT USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_view_contacts" ON "public"."contacts" FOR SELECT USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_view_conversions" ON "public"."conversions" FOR SELECT USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_view_enrollments" ON "public"."enrollments" FOR SELECT USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_view_follow_ups" ON "public"."follow_ups" FOR SELECT USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_view_handover_notes" ON "public"."handover_notes" FOR SELECT USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_view_lead_tags" ON "public"."lead_tags" FOR SELECT USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_view_packages" ON "public"."course_packages" FOR SELECT USING (((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])) OR (is_active = true)));
CREATE POLICY "staff_view_payments" ON "public"."payments" FOR SELECT USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_view_schedules" ON "public"."schedules" FOR SELECT USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_view_student_contacts" ON "public"."student_contacts" FOR SELECT USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_view_tags" ON "public"."tags" FOR SELECT USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
CREATE POLICY "staff_view_trial_classes" ON "public"."trial_classes" FOR SELECT USING ((public.auth_user_role() = ANY (ARRAY['ADMIN'::text, 'STAFF'::text])));
ALTER TABLE "public"."student_contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_notes_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teacher_manage_own_attendance" ON "public"."attendance" USING (((public.auth_user_role() = 'TEACHER'::text) AND (EXISTS ( SELECT 1
FROM (public.schedules s
JOIN public.courses c ON (((s.course_id)::text = (c.course_id)::text)))
WHERE (((s.schedule_id)::text = (attendance.schedule_id)::text) AND ((c.instructor_id)::text = (( SELECT users.user_id
FROM public.users
WHERE (users.auth_user_id = auth.uid())))::text))))));
CREATE POLICY "teacher_update_own_courses" ON "public"."courses" FOR UPDATE USING (((public.auth_user_role() = 'TEACHER'::text) AND ((instructor_id)::text = (( SELECT users.user_id
FROM public.users
WHERE (users.auth_user_id = auth.uid())))::text)));
CREATE POLICY "teacher_view_enrolled_students" ON "public"."students" FOR SELECT USING (((public.auth_user_role() = 'TEACHER'::text) AND (EXISTS ( SELECT 1
FROM (public.enrollments e
JOIN public.courses c ON (((e.course_id)::text = (c.course_id)::text)))
WHERE (((e.student_id)::text = (students.student_id)::text) AND ((c.instructor_id)::text = (( SELECT users.user_id
FROM public.users
WHERE (users.auth_user_id = auth.uid())))::text) AND ((e.status)::text = 'active'::text))))));
CREATE POLICY "teacher_view_own_enrollments" ON "public"."enrollments" FOR SELECT USING (((public.auth_user_role() = 'TEACHER'::text) AND (EXISTS ( SELECT 1
FROM public.courses c
WHERE (((c.course_id)::text = (enrollments.course_id)::text) AND ((c.instructor_id)::text = (( SELECT users.user_id
FROM public.users
WHERE (users.auth_user_id = auth.uid())))::text))))));
CREATE POLICY "teacher_view_own_schedules" ON "public"."schedules" FOR SELECT USING (((public.auth_user_role() = 'TEACHER'::text) AND (EXISTS ( SELECT 1
FROM public.courses c
WHERE (((c.course_id)::text = (schedules.course_id)::text) AND ((c.instructor_id)::text = (( SELECT users.user_id
FROM public.users
WHERE (users.auth_user_id = auth.uid())))::text))))));
CREATE POLICY "teacher_view_own_student_contacts" ON "public"."student_contacts" FOR SELECT USING (((public.auth_user_role() = 'TEACHER'::text) AND (EXISTS ( SELECT 1
FROM (public.enrollments e
JOIN public.courses c ON (((e.course_id)::text = (c.course_id)::text)))
WHERE (((e.student_id)::text = (student_contacts.student_id)::text) AND ((c.instructor_id)::text = (( SELECT users.user_id
FROM public.users
WHERE (users.auth_user_id = auth.uid())))::text) AND ((e.status)::text = 'active'::text))))));
CREATE POLICY "teacher_view_own_trial_classes" ON "public"."trial_classes" FOR SELECT USING (((public.auth_user_role() = 'TEACHER'::text) AND ((teacher_id)::text = (auth.uid())::text)));
CREATE POLICY "teacher_view_student_contacts" ON "public"."contacts" FOR SELECT USING (((public.auth_user_role() = 'TEACHER'::text) AND (EXISTS ( SELECT 1
FROM (((public.student_contacts sc
JOIN public.students s ON (((sc.student_id)::text = (s.student_id)::text)))
JOIN public.enrollments e ON (((s.student_id)::text = (e.student_id)::text)))
JOIN public.courses c ON (((e.course_id)::text = (c.course_id)::text)))
WHERE (((sc.contact_id)::text = (contacts.contact_id)::text) AND ((c.instructor_id)::text = (( SELECT users.user_id
FROM public.users
WHERE (users.auth_user_id = auth.uid())))::text) AND ((e.status)::text = 'active'::text))))));
ALTER TABLE "public"."trial_classes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tutoring_center_settings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "update_own_handover_notes" ON "public"."handover_notes" FOR UPDATE USING (((public.auth_user_role() = 'ADMIN'::text) OR ((public.auth_user_role() = 'STAFF'::text) AND ((author_id)::text = (auth.uid())::text)))) WITH CHECK (((public.auth_user_role() = 'ADMIN'::text) OR ((public.auth_user_role() = 'STAFF'::text) AND ((author_id)::text = (auth.uid())::text))));
CREATE POLICY "user_own_sessions" ON "public"."sessions" FOR SELECT USING (((user_id)::text = (( SELECT users.user_id
FROM public.users
WHERE (users.auth_user_id = auth.uid())))::text));
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT ALL ON FUNCTION "public"."auth_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_user_id"() TO "service_role";
GRANT ALL ON FUNCTION "public"."auth_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_user_role"() TO "service_role";
GRANT ALL ON FUNCTION "public"."can_access_financial_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_financial_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_financial_data"() TO "service_role";
GRANT ALL ON FUNCTION "public"."can_access_student_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_student_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_student_data"() TO "service_role";
GRANT ALL ON FUNCTION "public"."can_manage_system"() TO "anon";
GRANT ALL ON FUNCTION "public"."can_manage_system"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_manage_system"() TO "service_role";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "service_role";
GRANT ALL ON FUNCTION "public"."get_user_role"(user_id_param text) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"(user_id_param text) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"(user_id_param text) TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user_simple"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user_simple"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user_simple"() TO "service_role";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";
GRANT ALL ON FUNCTION "public"."is_staff_or_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_staff_or_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_staff_or_admin"() TO "service_role";
GRANT ALL ON FUNCTION "public"."update_last_login"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_last_login"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_last_login"() TO "service_role";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";
GRANT ALL ON TABLE "public"."attendance" TO "anon";
GRANT ALL ON TABLE "public"."attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance" TO "service_role";
GRANT ALL ON SEQUENCE "public"."attendance_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."attendance_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."attendance_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";
GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."classrooms" TO "anon";
GRANT ALL ON TABLE "public"."classrooms" TO "authenticated";
GRANT ALL ON TABLE "public"."classrooms" TO "service_role";
GRANT ALL ON SEQUENCE "public"."classrooms_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."classrooms_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."classrooms_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";
GRANT ALL ON SEQUENCE "public"."contacts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."contacts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."contacts_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."conversions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."conversions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."conversions_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."conversions" TO "anon";
GRANT ALL ON TABLE "public"."conversions" TO "authenticated";
GRANT ALL ON TABLE "public"."conversions" TO "service_role";
GRANT ALL ON TABLE "public"."course_packages" TO "anon";
GRANT ALL ON TABLE "public"."course_packages" TO "authenticated";
GRANT ALL ON TABLE "public"."course_packages" TO "service_role";
GRANT ALL ON SEQUENCE "public"."course_packages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."course_packages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."course_packages_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";
GRANT ALL ON SEQUENCE "public"."courses_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."courses_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."courses_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."enrollments" TO "anon";
GRANT ALL ON TABLE "public"."enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."enrollments" TO "service_role";
GRANT ALL ON SEQUENCE "public"."enrollments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."enrollments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."enrollments_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."follow_ups_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."follow_ups_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."follow_ups_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."follow_ups" TO "anon";
GRANT ALL ON TABLE "public"."follow_ups" TO "authenticated";
GRANT ALL ON TABLE "public"."follow_ups" TO "service_role";
GRANT ALL ON SEQUENCE "public"."handover_notes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."handover_notes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."handover_notes_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."handover_notes" TO "anon";
GRANT ALL ON TABLE "public"."handover_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."handover_notes" TO "service_role";
GRANT ALL ON TABLE "public"."lead_tags" TO "anon";
GRANT ALL ON TABLE "public"."lead_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_tags" TO "service_role";
GRANT ALL ON SEQUENCE "public"."leads_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."leads_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."leads_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";
GRANT ALL ON TABLE "public"."migration_history" TO "anon";
GRANT ALL ON TABLE "public"."migration_history" TO "authenticated";
GRANT ALL ON TABLE "public"."migration_history" TO "service_role";
GRANT ALL ON SEQUENCE "public"."migration_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."migration_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."migration_history_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";
GRANT ALL ON SEQUENCE "public"."order_items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."order_items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."order_items_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";
GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";
GRANT ALL ON SEQUENCE "public"."payments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."payments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."payments_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."schedules" TO "anon";
GRANT ALL ON TABLE "public"."schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."schedules" TO "service_role";
GRANT ALL ON SEQUENCE "public"."schedules_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."schedules_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."schedules_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."security_events" TO "anon";
GRANT ALL ON TABLE "public"."security_events" TO "authenticated";
GRANT ALL ON TABLE "public"."security_events" TO "service_role";
GRANT ALL ON SEQUENCE "public"."security_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."security_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."security_events_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";
GRANT ALL ON SEQUENCE "public"."sessions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sessions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sessions_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."student_contacts" TO "anon";
GRANT ALL ON TABLE "public"."student_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."student_contacts" TO "service_role";
GRANT ALL ON SEQUENCE "public"."student_contacts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."student_contacts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."student_contacts_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."student_notes_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."student_notes_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."student_notes_history_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."student_notes_history" TO "anon";
GRANT ALL ON TABLE "public"."student_notes_history" TO "authenticated";
GRANT ALL ON TABLE "public"."student_notes_history" TO "service_role";
GRANT ALL ON TABLE "public"."students" TO "anon";
GRANT ALL ON TABLE "public"."students" TO "authenticated";
GRANT ALL ON TABLE "public"."students" TO "service_role";
GRANT ALL ON SEQUENCE "public"."students_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."students_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."students_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."tags_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tags_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";
GRANT ALL ON SEQUENCE "public"."trial_classes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."trial_classes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."trial_classes_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."trial_classes" TO "anon";
GRANT ALL ON TABLE "public"."trial_classes" TO "authenticated";
GRANT ALL ON TABLE "public"."trial_classes" TO "service_role";
GRANT ALL ON TABLE "public"."tutoring_center_settings" TO "anon";
GRANT ALL ON TABLE "public"."tutoring_center_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."tutoring_center_settings" TO "service_role";
GRANT ALL ON SEQUENCE "public"."tutoring_center_settings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tutoring_center_settings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tutoring_center_settings_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
RESET ALL;
GRANT ALL  ON TABLE "public"."tags" TO "service_role";
GRANT ALL ON SEQUENCE "public"."trial_classes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."trial_classes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."trial_classes_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."trial_classes" TO "anon";
GRANT ALL ON TABLE "public"."trial_classes" TO "authenticated";
GRANT ALL ON TABLE "public"."trial_classes" TO "service_role";
GRANT ALL ON TABLE "public"."tutoring_center_settings" TO "anon";
GRANT ALL ON TABLE "public"."tutoring_center_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."tutoring_center_settings" TO "service_role";
GRANT ALL ON SEQUENCE "public"."tutoring_center_settings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tutoring_center_settings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tutoring_center_settings_id_seq" TO "service_role";
GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
RESET ALL;
