-- Enable RLS on courses table
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Enable RLS on students table  
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'courses' 
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS not enabled on courses table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'students' 
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS not enabled on students table';
    END IF;
END$$;