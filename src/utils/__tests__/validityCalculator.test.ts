import { describe, it, expect } from 'vitest'
import { calculateValidityPeriod, ValidityCalculationOptions } from '../validityCalculator'

describe('validityCalculator', () => {
  describe('calculateValidityPeriod', () => {
    it('should calculate validity period for regular course with default days', () => {
      const options: ValidityCalculationOptions = {
        courseType: 'regular',
        startDate: new Date('2024-01-01'),
        sessionCount: 10,
        defaultValidityDays: 180
      }

      const result = calculateValidityPeriod(options)

      expect(result.validFrom).toBe('2024-01-01')
      expect(result.validUntil).toBe('2024-06-29')
      expect(result.totalDays).toBe(180)
    })

    it('should calculate validity period for theme course with end date', () => {
      const options: ValidityCalculationOptions = {
        courseType: 'theme',
        startDate: new Date('2024-01-01'),
        courseEndDate: new Date('2024-03-31'),
        sessionCount: 20
      }

      const result = calculateValidityPeriod(options)

      expect(result.validFrom).toBe('2024-01-01')
      expect(result.validUntil).toBe('2024-05-30') // 2 months buffer after course end
      expect(result.totalDays).toBe(150)
    })

    it('should calculate validity period for package with specific validity days', () => {
      const options: ValidityCalculationOptions = {
        courseType: 'regular',
        startDate: new Date('2024-01-01'),
        sessionCount: 24,
        packageValidityDays: 365
      }

      const result = calculateValidityPeriod(options)

      expect(result.validFrom).toBe('2024-01-01')
      expect(result.validUntil).toBe('2024-12-31')
      expect(result.totalDays).toBe(365)
    })

    it('should calculate validity based on sessions per week', () => {
      const options: ValidityCalculationOptions = {
        courseType: 'regular',
        startDate: new Date('2024-01-01'),
        sessionCount: 48,
        sessionsPerWeek: 2,
        bufferWeeks: 4
      }

      const result = calculateValidityPeriod(options)

      // 48 sessions / 2 per week = 24 weeks + 4 buffer weeks = 28 weeks = 196 days
      expect(result.validFrom).toBe('2024-01-01')
      expect(result.validUntil).toBe('2024-07-15')
      expect(result.totalDays).toBe(196)
    })

    it('should apply minimum validity days', () => {
      const options: ValidityCalculationOptions = {
        courseType: 'regular',
        startDate: new Date('2024-01-01'),
        sessionCount: 4,
        sessionsPerWeek: 2,
        minimumValidityDays: 90
      }

      const result = calculateValidityPeriod(options)

      // 4 sessions / 2 per week = 2 weeks = 14 days, but minimum is 90
      expect(result.validFrom).toBe('2024-01-01')
      expect(result.validUntil).toBe('2024-03-31')
      expect(result.totalDays).toBe(90)
    })

    it('should handle custom start date', () => {
      const options: ValidityCalculationOptions = {
        courseType: 'regular',
        startDate: new Date('2024-02-15'),
        sessionCount: 10,
        defaultValidityDays: 30
      }

      const result = calculateValidityPeriod(options)

      expect(result.validFrom).toBe('2024-02-15')
      expect(result.validUntil).toBe('2024-03-16')
      expect(result.totalDays).toBe(30)
    })
  })
})
