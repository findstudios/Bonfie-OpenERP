import { describe, it, expect, vi, beforeEach } from 'vitest'
import { crmService } from '../crmService'
import { supabase } from '../supabase'
import type { Lead, LeadStatus, LeadSource, Tag } from '@/types/crm'

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('CRMService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getLeads', () => {
    it('should fetch leads with basic query', async () => {
      const mockLeads = [
        {
          id: 1,
          lead_id: 'LEAD001',
          full_name: 'Test Student',
          phone: '0912345678',
          status: 'new' as LeadStatus,
          source: 'walk_in' as LeadSource,
          lead_tags: []
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockLeads, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await crmService.getLeads({ limit: 20 })

      expect(supabase.from).toHaveBeenCalledWith('leads')
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.range).toHaveBeenCalledWith(0, 19)
      expect(result).toHaveLength(1)
      expect(result[0].lead_id).toBe('LEAD001')
    })

    it('should apply search filter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      await crmService.getLeads({ search: 'test' })

      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('full_name.ilike.%test%')
      )
    })

    it('should apply status filter with array', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      await crmService.getLeads({ status: ['new', 'contacted'] })

      expect(mockQuery.in).toHaveBeenCalledWith('status', ['new', 'contacted'])
    })

    it('should handle tag filtering', async () => {
      const mockLeadTags = [
        { lead_id: 'LEAD001' },
        { lead_id: 'LEAD002' }
      ]

      const mockTagQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: mockLeadTags, error: null })
      }

      const mockLeadQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null })
      }

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockLeadQuery as any)
        .mockReturnValueOnce(mockTagQuery as any)

      await crmService.getLeads({ tag_ids: ['TAG001'] })

      expect(mockLeadQuery.in).toHaveBeenCalledWith('lead_id', ['LEAD001', 'LEAD002'])
    })
  })

  describe('createLead', () => {
    it('should create a new lead', async () => {
      const leadData = {
        full_name: 'New Student',
        parent_name: 'Parent Name',
        phone: '0912345678',
        source: 'referral' as LeadSource
      }

      const mockCreatedLead = {
        ...leadData,
        lead_id: 'LEAD123',
        status: 'new' as LeadStatus,
        created_at: new Date().toISOString()
      }

      // Mock generateLeadId query (first call to supabase.from)
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null })
      }

      // Mock createLead insert query (second call to supabase.from)
      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCreatedLead, error: null })
      }

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        return callCount === 1 ? mockSelectQuery as any : mockInsertQuery as any
      })

      const result = await crmService.createLead(leadData)

      expect(mockInsertQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...leadData,
          status: 'new',
          lead_id: expect.stringMatching(/^L\d{8}\d{3}$/)
        })
      )
      expect(result.full_name).toBe('New Student')
    })
  })

  describe('updateLead', () => {
    it('should update a lead', async () => {
      const leadId = 'LEAD001'
      const updateData = {
        status: 'contacted' as LeadStatus,
        notes: 'Called and interested'
      }

      const mockUpdatedLead = {
        lead_id: leadId,
        ...updateData,
        updated_at: new Date().toISOString()
      }

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedLead, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await crmService.updateLead(leadId, updateData)

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updateData,
          updated_at: expect.any(String)
        })
      )
      expect(mockQuery.eq).toHaveBeenCalledWith('lead_id', leadId)
      expect(result.status).toBe('contacted')
    })
  })

  describe('Tag Management', () => {
    it('should fetch all tags', async () => {
      const mockTags: Tag[] = [
        {
          id: 1,
          tag_id: 'TAG001',
          name: 'VIP',
          color: '#FF0000',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockTags, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await crmService.getTags()

      expect(supabase.from).toHaveBeenCalledWith('tags')
      expect(mockQuery.order).toHaveBeenCalledWith('name')
      expect(result).toEqual(mockTags)
    })

    it('should add tags to lead', async () => {
      const leadId = 'LEAD001'
      const tagIds = ['TAG001', 'TAG002']

      const mockQuery = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      await crmService.addTagsToLead(leadId, tagIds)

      expect(mockQuery.insert).toHaveBeenCalledWith([
        { lead_id: leadId, tag_id: 'TAG001' },
        { lead_id: leadId, tag_id: 'TAG002' }
      ])
    })
  })

  describe('Follow-up Management', () => {
    it('should create a follow-up', async () => {
      const followUpData = {
        lead_id: 'LEAD001',
        type: 'phone_call' as const,
        subject: 'Initial Contact',
        content: 'Discussed course options',
        result: 'positive' as const,
        created_by: 'USER001'
      }

      const mockCreatedFollowUp = {
        ...followUpData,
        follow_up_id: 'FU123',
        created_at: new Date().toISOString()
      }

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCreatedFollowUp, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await crmService.createFollowUp(followUpData)

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...followUpData,
          follow_up_id: expect.stringContaining('FU')
        })
      )
      expect(result.subject).toBe('Initial Contact')
    })
  })

  describe('Trial Class Management', () => {
    it('should create a trial class', async () => {
      const trialData = {
        lead_id: 'LEAD001',
        course_id: 'COURSE001',
        scheduled_date: '2024-01-20',
        scheduled_time: '14:00',
        teacher_id: 'TEACHER001',
        created_by: 'USER001'
      }

      const mockCreatedTrial = {
        ...trialData,
        trial_id: 'TRIAL123',
        status: 'scheduled',
        created_at: new Date().toISOString()
      }

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCreatedTrial, error: null })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await crmService.createTrialClass(trialData)

      expect(result.status).toBe('scheduled')
      expect(result.trial_id).toBe('TRIAL123')
    })
  })

  describe('Bulk Import', () => {
    it('should handle bulk import with success and failures', async () => {
      const leadsToImport = [
        { full_name: 'Student 1', phone: '0911111111', source: 'online' as LeadSource },
        { full_name: 'Student 2', phone: '0922222222', source: 'referral' as LeadSource },
        { full_name: '', phone: '0933333333', source: 'walk_in' as LeadSource } // Invalid
      ]

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({ data: { ...leadsToImport[0], lead_id: 'LEAD001' }, error: null })
          .mockResolvedValueOnce({ data: { ...leadsToImport[1], lead_id: 'LEAD002' }, error: null })
          .mockRejectedValueOnce(new Error('Validation failed'))
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await crmService.bulkImportLeads(leadsToImport)

      expect(result.success).toHaveLength(2)
      expect(result.failed).toHaveLength(1)
      expect(result.failed[0].error).toContain('Validation failed')
    })
  })

  describe('CRM Stats', () => {
    it('should calculate CRM statistics', async () => {
      // Mock total leads count
      const totalLeadsQuery = {
        select: vi.fn().mockResolvedValue({ count: 100, error: null })
      }

      // Mock new leads this month
      const newLeadsQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ count: 20, error: null })
      }

      // Mock conversions
      const conversionsQuery = {
        select: vi.fn().mockResolvedValue({
          data: [
            { conversion_days: 5 },
            { conversion_days: 10 },
            { conversion_days: 7 }
          ],
          error: null
        })
      }

      // Mock trial classes
      const trialClassesQuery = {
        select: vi.fn().mockResolvedValue({
          data: [
            { status: 'completed' },
            { status: 'completed' },
            { status: 'scheduled' },
            { status: 'no_show' }
          ],
          error: null
        })
      }

      // Mock leads by source
      const leadsBySourceQuery = {
        select: vi.fn().mockResolvedValue({
          data: [
            { source: 'online' },
            { source: 'online' },
            { source: 'referral' },
            { source: 'walk_in' }
          ],
          error: null
        })
      }

      // Mock leads by status
      const leadsByStatusQuery = {
        select: vi.fn().mockResolvedValue({
          data: [
            { status: 'new' },
            { status: 'new' },
            { status: 'contacted' },
            { status: 'converted' }
          ],
          error: null
        })
      }

      vi.mocked(supabase.from)
        .mockReturnValueOnce(totalLeadsQuery as any)
        .mockReturnValueOnce(newLeadsQuery as any)
        .mockReturnValueOnce(conversionsQuery as any)
        .mockReturnValueOnce(trialClassesQuery as any)
        .mockReturnValueOnce(leadsBySourceQuery as any)
        .mockReturnValueOnce(leadsByStatusQuery as any)

      const stats = await crmService.getCRMStats()

      expect(stats.total_leads).toBe(100)
      expect(stats.new_leads_this_month).toBe(20)
      expect(stats.conversion_rate).toBe(3) // 3 conversions / 100 leads * 100
      expect(stats.average_conversion_days).toBe(7.33) // (5+10+7)/3
      expect(stats.trial_booking_rate).toBe(4) // 4 trials / 100 leads * 100
      expect(stats.trial_show_rate).toBe(50) // 2 completed / 4 total * 100
    })
  })
})
