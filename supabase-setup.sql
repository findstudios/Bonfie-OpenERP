-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.attendance (
  id integer NOT NULL DEFAULT nextval('attendance_id_seq'::regclass),
  schedule_id character varying NOT NULL,
  student_id character varying NOT NULL,
  enrollment_id character varying NOT NULL,
  status character varying DEFAULT 'present'::character varying,
  session_deducted boolean DEFAULT true,
  teacher_notes text,
  marked_at timestamp without time zone,
  marked_by character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT attendance_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.schedules(schedule_id),
  CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(student_id),
  CONSTRAINT attendance_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(enrollment_id),
  CONSTRAINT attendance_marked_by_fkey FOREIGN KEY (marked_by) REFERENCES public.users(user_id)
);
CREATE TABLE public.audit_logs (
  id bigint NOT NULL DEFAULT nextval('audit_logs_id_seq'::regclass),
  user_id character varying NOT NULL,
  action character varying NOT NULL,
  table_name character varying,
  record_id character varying,
  old_values jsonb,
  new_values jsonb,
  old_amount numeric,
  new_amount numeric,
  old_status character varying,
  new_status character varying,
  ip_address inet,
  user_agent text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.classrooms (
  id integer NOT NULL DEFAULT nextval('classrooms_id_seq'::regclass),
  classroom_id character varying NOT NULL UNIQUE,
  classroom_name character varying NOT NULL,
  capacity integer DEFAULT 10,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT classrooms_pkey PRIMARY KEY (id)
);
CREATE TABLE public.contacts (
  id integer NOT NULL DEFAULT nextval('contacts_id_seq'::regclass),
  contact_id character varying NOT NULL UNIQUE,
  full_name character varying NOT NULL,
  phone character varying,
  email character varying,
  address text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  version integer DEFAULT 1,
  last_modified_by character varying,
  CONSTRAINT contacts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.courses (
  id integer NOT NULL DEFAULT nextval('courses_id_seq'::regclass),
  course_id character varying NOT NULL UNIQUE,
  course_name character varying NOT NULL,
  instructor_id character varying NOT NULL,
  course_type character varying DEFAULT 'regular'::character varying,
  category character varying,
  total_sessions integer NOT NULL,
  price_per_session numeric,
  max_students integer DEFAULT 10,
  status character varying DEFAULT 'planning'::character varying,
  schedule_pattern jsonb,
  description text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT courses_pkey PRIMARY KEY (id),
  CONSTRAINT courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.enrollments (
  id integer NOT NULL DEFAULT nextval('enrollments_id_seq'::regclass),
  enrollment_id character varying NOT NULL UNIQUE,
  student_id character varying NOT NULL,
  course_id character varying NOT NULL,
  purchased_sessions integer NOT NULL,
  remaining_sessions integer NOT NULL,
  bonus_sessions integer DEFAULT 0,
  status character varying DEFAULT 'active'::character varying,
  source character varying DEFAULT 'manual'::character varying,
  notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(student_id),
  CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id)
);
CREATE TABLE public.order_items (
  id integer NOT NULL DEFAULT nextval('order_items_id_seq'::regclass),
  order_id character varying NOT NULL,
  item_type character varying NOT NULL,
  item_id character varying,
  item_name character varying NOT NULL,
  quantity integer DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  discount_amount numeric DEFAULT 0,
  final_price numeric NOT NULL,
  notes text,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id)
);
CREATE TABLE public.orders (
  id integer NOT NULL DEFAULT nextval('orders_id_seq'::regclass),
  order_id character varying NOT NULL UNIQUE,
  student_id character varying NOT NULL,
  contact_id character varying NOT NULL,
  item_type character varying DEFAULT 'enrollment'::character varying,
  original_amount numeric NOT NULL,
  discount_amount numeric DEFAULT 0,
  final_amount numeric NOT NULL,
  status character varying DEFAULT 'pending'::character varying,
  discount_reason text,
  created_by character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(student_id),
  CONSTRAINT orders_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(contact_id),
  CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id)
);
CREATE TABLE public.payments (
  id integer NOT NULL DEFAULT nextval('payments_id_seq'::regclass),
  payment_id character varying NOT NULL UNIQUE,
  order_id character varying NOT NULL,
  amount_paid numeric NOT NULL,
  payment_method character varying DEFAULT 'cash'::character varying,
  payment_date date NOT NULL,
  receipt_number character varying,
  notes text,
  created_by character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id),
  CONSTRAINT payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id)
);
CREATE TABLE public.roles (
  id integer NOT NULL DEFAULT nextval('roles_id_seq'::regclass),
  role_code character varying NOT NULL UNIQUE,
  role_name character varying NOT NULL,
  permissions jsonb,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.schedules (
  id integer NOT NULL DEFAULT nextval('schedules_id_seq'::regclass),
  schedule_id character varying NOT NULL UNIQUE,
  course_id character varying NOT NULL,
  class_datetime timestamp without time zone NOT NULL,
  end_datetime timestamp without time zone NOT NULL,
  session_number integer,
  classroom character varying,
  status character varying DEFAULT 'scheduled'::character varying,
  is_makeup boolean DEFAULT false,
  makeup_for_schedule_id character varying,
  notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT schedules_pkey PRIMARY KEY (id),
  CONSTRAINT schedules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id),
  CONSTRAINT schedules_makeup_for_schedule_id_fkey FOREIGN KEY (makeup_for_schedule_id) REFERENCES public.schedules(schedule_id)
);
CREATE TABLE public.student_contacts (
  id integer NOT NULL DEFAULT nextval('student_contacts_id_seq'::regclass),
  student_id character varying NOT NULL,
  contact_id character varying NOT NULL,
  relationship character varying NOT NULL,
  is_primary boolean DEFAULT false,
  is_emergency boolean DEFAULT false,
  is_billing boolean DEFAULT false,
  notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  version integer DEFAULT 1,
  last_modified_by character varying,
  CONSTRAINT student_contacts_pkey PRIMARY KEY (id),
  CONSTRAINT student_contacts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(student_id),
  CONSTRAINT student_contacts_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(contact_id)
);
CREATE TABLE public.student_notes_history (
  id bigint NOT NULL DEFAULT nextval('student_notes_history_id_seq'::regclass),
  student_id character varying,
  note_content text NOT NULL,
  note_type character varying DEFAULT 'general'::character varying,
  created_by character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT student_notes_history_pkey PRIMARY KEY (id),
  CONSTRAINT student_notes_history_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(student_id),
  CONSTRAINT student_notes_history_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id)
);
CREATE TABLE public.students (
  id integer NOT NULL DEFAULT nextval('students_id_seq'::regclass),
  student_id character varying NOT NULL UNIQUE,
  chinese_name character varying NOT NULL,
  english_name character varying,
  birth_date date,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT students_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  user_id character varying NOT NULL UNIQUE,
  username character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  full_name character varying NOT NULL,
  role_id integer NOT NULL,
  phone character varying,
  email character varying,
  status character varying DEFAULT 'active'::character varying,
  last_login_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);