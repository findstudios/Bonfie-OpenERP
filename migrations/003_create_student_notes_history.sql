-- Migration: Create student_notes_history table
-- Purpose: 建立學生備註歷史記錄表，用於追蹤學生備註的完整歷史
-- Date: 2025-01-25
-- Issue: student_notes_history 表不存在，導致備註功能無法使用

-- 創建序列
CREATE SEQUENCE IF NOT EXISTS student_notes_history_id_seq;

-- 創建 student_notes_history 表
CREATE TABLE IF NOT EXISTS public.student_notes_history (
  id bigint NOT NULL DEFAULT nextval('student_notes_history_id_seq'::regclass),
  student_id character varying,
  note_content text NOT NULL,
  note_type character varying DEFAULT 'general'::character varying,
  created_by character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT student_notes_history_pkey PRIMARY KEY (id),
  CONSTRAINT student_notes_history_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE,
  CONSTRAINT student_notes_history_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL
);

-- 添加索引以提高查詢效能
CREATE INDEX IF NOT EXISTS idx_student_notes_history_student_id ON public.student_notes_history(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_history_created_at ON public.student_notes_history(created_at DESC);

-- 設置 RLS (Row Level Security)
ALTER TABLE public.student_notes_history ENABLE ROW LEVEL SECURITY;

-- 創建 RLS 政策 - 允許已認證用戶讀取所有備註
CREATE POLICY "Enable read access for all authenticated users" ON public.student_notes_history
  FOR SELECT TO authenticated USING (true);

-- 創建 RLS 政策 - 允許已認證用戶新增備註
CREATE POLICY "Enable insert for authenticated users" ON public.student_notes_history
  FOR INSERT TO authenticated WITH CHECK (true);

-- 創建 RLS 政策 - 允許已認證用戶更新備註
CREATE POLICY "Enable update for authenticated users" ON public.student_notes_history
  FOR UPDATE TO authenticated USING (true);

-- 創建 RLS 政策 - 允許已認證用戶刪除備註
CREATE POLICY "Enable delete for authenticated users" ON public.student_notes_history
  FOR DELETE TO authenticated USING (true);

-- 授予權限給 authenticated 角色
GRANT ALL ON public.student_notes_history TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE student_notes_history_id_seq TO authenticated;

-- 備註：
-- 1. 此表用於儲存學生備註的歷史記錄
-- 2. note_type 可以是 'general', 'important', 'academic', 'behavioral', 'health', 'family' 等
-- 3. created_by 關聯到 users 表，用於追蹤是誰創建的備註
-- 4. 使用 ON DELETE CASCADE 確保學生被刪除時，相關備註也會被刪除
-- 5. 使用 ON DELETE SET NULL 確保用戶被刪除時，備註仍保留但 created_by 變為 NULL