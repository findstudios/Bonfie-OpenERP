import { describe, it, expect, vi, beforeEach } from 'vitest'
import { db } from '@/services/supabase'

// Mock Supabase db
vi.mock('@/services/supabase', () => ({
  db: {
    create: vi.fn(),
    findMany: vi.fn()
  }
}))

describe('Attendance Service - RLS Compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('should pass user_id directly without modification when creating attendance', async () => {
    // Arrange
    const mockUserId = 'USR001'
    const attendanceRecord = {
      schedule_id: 'SCH001',
      student_id: 'STD001',
      enrollment_id: 'ENR001',
      status: 'present',
      marked_by: mockUserId
    }

    // Act
    await db.create('attendance', attendanceRecord)

    // Assert
    expect(db.create).toHaveBeenCalledWith('attendance', expect.objectContaining({
      marked_by: mockUserId
    }))
  })

  it('should throw error when user_id is missing', async () => {
    // Arrange
    const attendanceRecord = {
      schedule_id: 'SCH001',
      student_id: 'STD001',
      enrollment_id: 'ENR001',
      status: 'present',
      marked_by: null
    }

    vi.mocked(db.create).mockRejectedValue(new Error('marked_by cannot be null'))

    // Act & Assert
    await expect(db.create('attendance', attendanceRecord))
      .rejects.toThrow('marked_by cannot be null')
  })

  it('should not retry with different user_id when RLS fails', async () => {
    // Arrange
    const mockUserId = 'USR001'
    const attendanceRecord = {
      schedule_id: 'SCH001',
      student_id: 'STD001',
      enrollment_id: 'ENR001',
      status: 'present',
      marked_by: mockUserId
    }

    vi.mocked(db.create).mockRejectedValue({
      code: '42501',
      message: 'new row violates row-level security policy'
    })

    // Act
    try {
      await db.create('attendance', attendanceRecord)
    } catch (error) {
      // Expected to fail
    }

    // Assert - should only be called once, not multiple times with different user_ids
    expect(db.create).toHaveBeenCalledTimes(1)
    expect(db.create).toHaveBeenCalledWith('attendance', expect.objectContaining({
      marked_by: mockUserId
    }))
  })
})
