-- Fix attendance marked_by constraint to allow nulls temporarily
-- Date: 2025-01-25
-- Issue: Foreign key constraint preventing attendance creation

-- Option 1: Make marked_by nullable (recommended for now)
ALTER TABLE public.attendance 
ALTER COLUMN marked_by DROP NOT NULL;

-- Option 2: If you want to keep the foreign key but make it more flexible
-- First drop the existing constraint
ALTER TABLE public.attendance 
DROP CONSTRAINT IF EXISTS attendance_marked_by_fkey;

-- Then recreate it with ON DELETE SET NULL to handle user deletions gracefully
ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_marked_by_fkey 
FOREIGN KEY (marked_by) 
REFERENCES public.users(user_id) 
ON DELETE SET NULL;

-- Alternatively, if you want to temporarily disable the foreign key check
-- (not recommended for production, but useful for debugging)
-- ALTER TABLE public.attendance 
-- DROP CONSTRAINT IF EXISTS attendance_marked_by_fkey;