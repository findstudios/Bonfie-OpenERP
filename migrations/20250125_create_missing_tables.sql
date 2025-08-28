-- ====================================================
-- 創建缺失的 CRM 和交班記錄表格
-- 日期：2025-01-25
-- 目的：修復 Dashboard 查詢錯誤
-- ====================================================

-- 1. 創建序列
-- ====================================================
CREATE SEQUENCE IF NOT EXISTS tags_id_seq;
CREATE SEQUENCE IF NOT EXISTS leads_id_seq;
CREATE SEQUENCE IF NOT EXISTS follow_ups_id_seq;
CREATE SEQUENCE IF NOT EXISTS trial_classes_id_seq;
CREATE SEQUENCE IF NOT EXISTS conversions_id_seq;
CREATE SEQUENCE IF NOT EXISTS handover_notes_id_seq;

-- 2. 創建 tags 表（標籤管理）
-- ====================================================
CREATE TABLE IF NOT EXISTS public.tags (
  id integer NOT NULL DEFAULT nextval('tags_id_seq'::regclass),
  tag_id character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  color character varying NOT NULL,
  description text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT tags_pkey PRIMARY KEY (id)
);

-- 3. 創建 leads 表（潛在客戶）
-- ====================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id integer NOT NULL DEFAULT nextval('leads_id_seq'::regclass),
  lead_id character varying NOT NULL UNIQUE,
  full_name character varying NOT NULL,
  parent_name character varying,
  phone character varying NOT NULL,
  email character varying,
  age integer,
  school character varying,
  grade character varying,
  status character varying DEFAULT 'new'::character varying CHECK (status::text = ANY (ARRAY['new'::character varying, 'contacted'::character varying, 'interested'::character varying, 'trial_scheduled'::character varying, 'trial_completed'::character varying, 'converted'::character varying, 'lost'::character varying]::text[])),
  source character varying NOT NULL CHECK (source::text = ANY (ARRAY['walk_in'::character varying, 'referral'::character varying, 'online'::character varying, 'phone'::character varying, 'social_media'::character varying, 'flyer'::character varying, 'event'::character varying, 'other'::character varying]::text[])),
  interest_subjects text[],
  budget_range character varying,
  preferred_schedule character varying,
  notes text,
  assigned_to character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(user_id)
);

-- 4. 創建 lead_tags 表（潛在客戶標籤關聯）
-- ====================================================
CREATE TABLE IF NOT EXISTS public.lead_tags (
  lead_id character varying NOT NULL,
  tag_id character varying NOT NULL,
  CONSTRAINT lead_tags_pkey PRIMARY KEY (lead_id, tag_id),
  CONSTRAINT lead_tags_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(lead_id),
  CONSTRAINT lead_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(tag_id)
);

-- 5. 創建 follow_ups 表（跟進記錄）
-- ====================================================
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id integer NOT NULL DEFAULT nextval('follow_ups_id_seq'::regclass),
  follow_up_id character varying NOT NULL UNIQUE,
  lead_id character varying NOT NULL,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['phone_call'::character varying, 'message'::character varying, 'email'::character varying, 'visit'::character varying, 'trial_class'::character varying, 'meeting'::character varying, 'other'::character varying]::text[])),
  subject character varying NOT NULL,
  content text NOT NULL,
  result character varying NOT NULL CHECK (result::text = ANY (ARRAY['positive'::character varying, 'neutral'::character varying, 'negative'::character varying, 'no_response'::character varying, 'converted'::character varying, 'lost'::character varying]::text[])),
  next_follow_up date,
  created_by character varying NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT follow_ups_pkey PRIMARY KEY (id),
  CONSTRAINT follow_ups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id),
  CONSTRAINT follow_ups_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(lead_id)
);

-- 6. 創建 trial_classes 表（試聽課程）
-- ====================================================
CREATE TABLE IF NOT EXISTS public.trial_classes (
  id integer NOT NULL DEFAULT nextval('trial_classes_id_seq'::regclass),
  trial_id character varying NOT NULL UNIQUE,
  lead_id character varying NOT NULL,
  course_id character varying,
  scheduled_date date NOT NULL,
  scheduled_time time without time zone NOT NULL,
  teacher_id character varying,
  classroom character varying,
  status character varying DEFAULT 'scheduled'::character varying CHECK (status::text = ANY (ARRAY['scheduled'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'no_show'::character varying]::text[])),
  attendance boolean,
  feedback text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  follow_up_notes text,
  created_by character varying NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT trial_classes_pkey PRIMARY KEY (id),
  CONSTRAINT trial_classes_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(lead_id),
  CONSTRAINT trial_classes_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id),
  CONSTRAINT trial_classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(user_id),
  CONSTRAINT trial_classes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id)
);

-- 7. 創建 conversions 表（轉換記錄）
-- ====================================================
CREATE TABLE IF NOT EXISTS public.conversions (
  id integer NOT NULL DEFAULT nextval('conversions_id_seq'::regclass),
  conversion_id character varying NOT NULL UNIQUE,
  lead_id character varying NOT NULL,
  student_id character varying NOT NULL,
  order_id character varying,
  enrollment_date date NOT NULL,
  total_amount numeric NOT NULL,
  conversion_days integer,
  converted_by character varying NOT NULL,
  notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT conversions_pkey PRIMARY KEY (id),
  CONSTRAINT conversions_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(lead_id),
  CONSTRAINT conversions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(student_id),
  CONSTRAINT conversions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id),
  CONSTRAINT conversions_converted_by_fkey FOREIGN KEY (converted_by) REFERENCES public.users(user_id)
);

-- 8. 創建 handover_notes 表（交班記錄）
-- ====================================================
CREATE TABLE IF NOT EXISTS public.handover_notes (
  id integer NOT NULL DEFAULT nextval('handover_notes_id_seq'::regclass),
  content text NOT NULL,
  author_id character varying NOT NULL,
  priority character varying DEFAULT 'normal'::character varying CHECK (priority::text = ANY (ARRAY['high'::character varying, 'normal'::character varying, 'low'::character varying]::text[])),
  tags text[],
  mentioned_users character varying[],
  read_by character varying[],
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT handover_notes_pkey PRIMARY KEY (id),
  CONSTRAINT handover_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(user_id)
);

-- 9. 創建索引以優化查詢性能
-- ====================================================
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_id ON follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_next_follow_up ON follow_ups(next_follow_up);
CREATE INDEX IF NOT EXISTS idx_trial_classes_lead_id ON trial_classes(lead_id);
CREATE INDEX IF NOT EXISTS idx_trial_classes_scheduled_date ON trial_classes(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_trial_classes_status ON trial_classes(status);
CREATE INDEX IF NOT EXISTS idx_handover_notes_is_active ON handover_notes(is_active);
CREATE INDEX IF NOT EXISTS idx_handover_notes_created_at ON handover_notes(created_at);

-- 10. 啟用 RLS
-- ====================================================
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_notes ENABLE ROW LEVEL SECURITY;

-- 11. 創建 RLS 政策
-- ====================================================

-- Tags 表政策（所有員工可查看，管理員可管理）
CREATE POLICY "staff_view_tags" ON tags
  FOR SELECT USING (auth_user_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "admin_manage_tags" ON tags
  FOR ALL USING (auth_user_role() = 'ADMIN')
  WITH CHECK (auth_user_role() = 'ADMIN');

-- Leads 表政策（員工可查看和管理）
CREATE POLICY "staff_view_all_leads" ON leads
  FOR SELECT USING (auth_user_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "staff_manage_leads" ON leads
  FOR ALL USING (auth_user_role() IN ('ADMIN', 'STAFF'))
  WITH CHECK (auth_user_role() IN ('ADMIN', 'STAFF'));

-- Lead_tags 表政策
CREATE POLICY "staff_view_lead_tags" ON lead_tags
  FOR SELECT USING (auth_user_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "staff_manage_lead_tags" ON lead_tags
  FOR ALL USING (auth_user_role() IN ('ADMIN', 'STAFF'))
  WITH CHECK (auth_user_role() IN ('ADMIN', 'STAFF'));

-- Follow_ups 表政策
CREATE POLICY "staff_view_follow_ups" ON follow_ups
  FOR SELECT USING (auth_user_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "staff_manage_follow_ups" ON follow_ups
  FOR ALL USING (auth_user_role() IN ('ADMIN', 'STAFF'))
  WITH CHECK (auth_user_role() IN ('ADMIN', 'STAFF'));

-- Trial_classes 表政策
CREATE POLICY "staff_view_trial_classes" ON trial_classes
  FOR SELECT USING (auth_user_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "teacher_view_own_trial_classes" ON trial_classes
  FOR SELECT USING (
    auth_user_role() = 'TEACHER' AND teacher_id = auth.uid()::text
  );

CREATE POLICY "staff_manage_trial_classes" ON trial_classes
  FOR ALL USING (auth_user_role() IN ('ADMIN', 'STAFF'))
  WITH CHECK (auth_user_role() IN ('ADMIN', 'STAFF'));

-- Conversions 表政策
CREATE POLICY "staff_view_conversions" ON conversions
  FOR SELECT USING (auth_user_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "staff_manage_conversions" ON conversions
  FOR ALL USING (auth_user_role() IN ('ADMIN', 'STAFF'))
  WITH CHECK (auth_user_role() IN ('ADMIN', 'STAFF'));

-- Handover_notes 表政策
CREATE POLICY "staff_view_handover_notes" ON handover_notes
  FOR SELECT USING (auth_user_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "staff_create_handover_notes" ON handover_notes
  FOR INSERT WITH CHECK (auth_user_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "update_own_handover_notes" ON handover_notes
  FOR UPDATE USING (
    auth_user_role() = 'ADMIN' OR 
    (auth_user_role() = 'STAFF' AND author_id = auth.uid()::text)
  )
  WITH CHECK (
    auth_user_role() = 'ADMIN' OR 
    (auth_user_role() = 'STAFF' AND author_id = auth.uid()::text)
  );

CREATE POLICY "admin_delete_handover_notes" ON handover_notes
  FOR DELETE USING (auth_user_role() = 'ADMIN');

-- 12. 創建觸發器以自動更新 updated_at
-- ====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_follow_ups_updated_at BEFORE UPDATE ON follow_ups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trial_classes_updated_at BEFORE UPDATE ON trial_classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversions_updated_at BEFORE UPDATE ON conversions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_handover_notes_updated_at BEFORE UPDATE ON handover_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();