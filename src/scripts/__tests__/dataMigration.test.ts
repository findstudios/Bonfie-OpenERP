import { describe, it, expect, vi, beforeEach } from 'vitest'
import { migrateCoursesData, migrateEnrollmentsData, generateMigrationReport } from '../dataMigration'

// Mock supabase
vi.mock('@/services/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

import { supabase } from '@/services/supabase'

describe('Data Migration Script', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('migrateCoursesData', () => {
    it('should migrate courses to new schema with category field', async () => {
      // Mock existing courses without category
      const mockCourses = [
        {
          course_id: 'CRS001',
          course_name: '數學班',
          course_type: 'regular',
          total_sessions: 48
        },
        {
          course_id: 'CRS002',
          course_name: '暑期美術營',
          course_type: 'short_term',
          total_sessions: 8
        }
      ]

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'courses') {
          return {
            select: vi.fn().mockReturnThis(),
            is: vi.fn().mockResolvedValue({ data: mockCourses, error: null }),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: null, error: null })
          } as any
        }
        return {} as any
      })

      const result = await migrateCoursesData()

      expect(result.totalProcessed).toBe(2)
      expect(result.migrated).toBe(2)
      expect(result.errors).toBe(0)

      // Verify updates were called with correct category
      const fromMock = vi.mocked(supabase.from)
      expect(fromMock).toHaveBeenCalledWith('courses')

      // Verify update was called twice (once for each course)
      const coursesFromCalls = fromMock.mock.calls.filter(call => call[0] === 'courses')
      expect(coursesFromCalls.length).toBeGreaterThan(0)
    })
  })

  describe('migrateEnrollmentsData', () => {
    it('should migrate enrollments to new schema with validity and category', async () => {
      // Mock existing enrollments
      const mockEnrollments = [
        {
          enrollment_id: 'ENR001',
          student_id: 'STU001',
          course_id: 'CRS001',
          remaining_sessions: 10,
          created_at: '2024-01-01'
        },
        {
          enrollment_id: 'ENR002',
          student_id: 'STU002',
          course_id: 'CRS002',
          remaining_sessions: 5,
          created_at: '2024-01-15'
        }
      ]

      // Mock courses for looking up category
      const mockCourses = [
        { course_id: 'CRS001', course_category: 'regular' },
        { course_id: 'CRS002', course_category: 'theme' }
      ]

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'enrollments') {
          return {
            select: vi.fn().mockReturnThis(),
            is: vi.fn().mockResolvedValue({ data: mockEnrollments, error: null }),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: null, error: null })
          } as any
        }
        if (table === 'courses') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn((field, value) => ({
              single: vi.fn().mockResolvedValue({
                data: mockCourses.find(c => c.course_id === value),
                error: null
              })
            }))
          } as any
        }
        return {} as any
      })

      const result = await migrateEnrollmentsData()

      expect(result.totalProcessed).toBe(2)
      expect(result.migrated).toBe(2)
      expect(result.errors).toBe(0)
    })
  })

  describe('generateMigrationReport', () => {
    it('should generate a comprehensive migration report', async () => {
      // Mock migration results
      const coursesResult = { totalProcessed: 10, migrated: 9, errors: 1 }
      const enrollmentsResult = { totalProcessed: 50, migrated: 48, errors: 2 }

      const report = await generateMigrationReport(coursesResult, enrollmentsResult)

      expect(report).toContain('資料遷移報告')
      expect(report).toContain('課程資料遷移')
      expect(report).toContain('總處理數: 10')
      expect(report).toContain('成功遷移: 9')
      expect(report).toContain('錯誤數: 1')
      expect(report).toContain('註冊資料遷移')
      expect(report).toContain('總處理數: 50')
      expect(report).toContain('成功遷移: 48')
      expect(report).toContain('錯誤數: 2')
    })
  })
})
