-- 匯出現有資料庫結構的腳本
-- 在生產 Supabase 的 SQL Editor 執行此查詢，將結果複製到新專案

-- 1. 首先關閉所有 RLS（在新專案執行）
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('ALTER TABLE IF EXISTS public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- 2. 建立所有表結構（這是您需要從生產環境匯出的）
-- 在生產環境執行以下查詢來生成 CREATE TABLE 語句：

WITH table_ddl AS (
  SELECT 
    table_name,
    'CREATE TABLE IF NOT EXISTS public.' || table_name || ' (' || E'\n' ||
    string_agg(
      '  ' || column_name || ' ' || 
      CASE 
        WHEN data_type = 'character varying' THEN 'VARCHAR' || COALESCE('(' || character_maximum_length || ')', '')
        WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP WITHOUT TIME ZONE'
        WHEN data_type = 'character' THEN 'CHAR' || COALESCE('(' || character_maximum_length || ')', '')
        ELSE UPPER(data_type)
      END ||
      CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
      CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
      E',\n' ORDER BY ordinal_position
    ) || E'\n);'
    AS create_statement
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name NOT IN ('schema_migrations', 'supabase_migrations')
  GROUP BY table_name
)
SELECT create_statement FROM table_ddl ORDER BY table_name;

-- 3. 匯出所有索引
SELECT indexdef || ';'
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename NOT IN ('schema_migrations', 'supabase_migrations');

-- 4. 匯出所有外鍵約束
SELECT 
  'ALTER TABLE public.' || tc.table_name || 
  ' ADD CONSTRAINT ' || tc.constraint_name || 
  ' FOREIGN KEY (' || kcu.column_name || ')' ||
  ' REFERENCES public.' || ccu.table_name || '(' || ccu.column_name || ');'
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public';

-- 5. 匯出所有函數
SELECT 
  pg_get_functiondef(p.oid) || ';'
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f';

-- 6. 匯出所有觸發器
SELECT 
  'CREATE TRIGGER ' || trigger_name || E'\n' ||
  action_timing || ' ' || event_manipulation || E'\n' ||
  'ON public.' || event_object_table || E'\n' ||
  'FOR EACH ' || action_orientation || E'\n' ||
  'EXECUTE FUNCTION ' || action_statement || ';'
FROM information_schema.triggers
WHERE trigger_schema = 'public';