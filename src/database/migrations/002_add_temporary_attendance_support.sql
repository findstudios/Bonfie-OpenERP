-- Migration: Add temporary student attendance support
-- Description: Allows teachers to add temporary students (makeup, trial, temporary) to attendance

-- 1. Make enrollment_id nullable in attendance table
ALTER TABLE public.attendance 
ALTER COLUMN enrollment_id DROP NOT NULL;

-- 2. Add attendance type column
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS attendance_type VARCHAR DEFAULT 'regular' 
CHECK (attendance_type IN ('regular', 'makeup', 'trial', 'temporary'));

-- 3. Add makeup reference column
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS makeup_from_enrollment_id VARCHAR;

-- 4. Add foreign key for makeup reference
ALTER TABLE public.attendance
ADD CONSTRAINT attendance_makeup_from_enrollment_fkey 
FOREIGN KEY (makeup_from_enrollment_id) 
REFERENCES public.enrollments(enrollment_id);

-- 5. Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_type ON public.attendance(attendance_type);
CREATE INDEX IF NOT EXISTS idx_attendance_makeup_from ON public.attendance(makeup_from_enrollment_id) WHERE makeup_from_enrollment_id IS NOT NULL;

-- 6. Add comment for documentation
COMMENT ON COLUMN public.attendance.attendance_type IS 'Type of attendance: regular (normal enrolled student), makeup (making up from another course), trial (trial class), temporary (one-time paid attendance)';
COMMENT ON COLUMN public.attendance.makeup_from_enrollment_id IS 'For makeup attendance, references the original enrollment that sessions are deducted from';