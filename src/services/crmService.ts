/**
 * CRM 客戶關係管理服務
 * 專為補習班客戶管理設計
 */

import { db, supabase } from './supabase'
import type {
  Lead,
  FollowUp,
  TrialClass,
  Conversion,
  CRMStats,
  LeadSearchParams,
  FollowUpSearchParams,
  LeadStatus,
  LeadSource,
  FollowUpType,
  FollowUpResult,
  Tag
} from '@/types/crm'

export class CRMService {
  // 潛在客戶管理
  async getLeads(params: LeadSearchParams = {}) {
    const query = supabase
      .from('leads')
      .select(`
        *,
        lead_tags (
          tags (*)
        )
      `)

    if (params.search) {
      query.or(`full_name.ilike.%${params.search}%,parent_name.ilike.%${params.search}%,phone.ilike.%${params.search}%,email.ilike.%${params.search}%,school.ilike.%${params.search}%`)
    }

    // 狀態篩選
    if (params.status) {
      query.eq('status', params.status)
    }

    // 來源篩選
    if (params.source) {
      query.eq('source', params.source)
    }

    if (params.assigned_to) {
      query.eq('assigned_to', params.assigned_to)
    }

    if (params.date_from) {
      query.gte('created_at', params.date_from)
    }

    if (params.date_to) {
      query.lte('created_at', params.date_to)
    }

    // 年齡範圍
    if (params.age_min) {
      query.gte('age', params.age_min)
    }

    if (params.age_max) {
      query.lte('age', params.age_max)
    }

    // 學校篩選
    if (params.school) {
      query.ilike('school', `%${params.school}%`)
    }

    // 年級篩選
    if (params.grade) {
      query.ilike('grade', `%${params.grade}%`)
    }

    // 興趣科目篩選
    if (params.interest_subjects && params.interest_subjects.length > 0) {
      query.contains('interest_subjects', params.interest_subjects)
    }

    // 是否有電子郵件
    if (params.has_email === true) {
      query.not('email', 'is', null)
    } else if (params.has_email === false) {
      query.is('email', null)
    }

    // 標籤篩選
    if (params.tag_ids && params.tag_ids.length > 0) {
      // 使用子查詢來篩選具有指定標籤的潛在客戶
      const { data: leadIdsWithTags } = await supabase
        .from('lead_tags')
        .select('lead_id')
        .in('tag_id', params.tag_ids)

      if (leadIdsWithTags && leadIdsWithTags.length > 0) {
        const leadIds = [...new Set(leadIdsWithTags.map(lt => lt.lead_id))]
        query.in('lead_id', leadIds)
      } else {
        // 如果沒有找到任何符合的記錄，返回空結果
        return []
      }
    }

    // 排序
    const sortBy = params.sort_by || 'created_at'
    const sortOrder = params.sort_order || 'desc'
    query.order(sortBy, { ascending: sortOrder === 'asc' })

    const { data, error } = await query
      .range(
        ((params.page || 1) - 1) * (params.limit || 20),
        (params.page || 1) * (params.limit || 20) - 1
      )

    if (error) throw error

    // 轉換數據格式，將 lead_tags 扁平化為 tags 陣列
    const leads = data?.map(lead => ({
      ...lead,
      tags: lead.lead_tags?.map((lt: any) => lt.tags).filter(Boolean) || []
    })) || []

    return leads as Lead[]
  }

  async getLead(leadId: string) {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        lead_tags (
          tags (*)
        )
      `)
      .eq('lead_id', leadId)
      .single()

    if (error) throw error

    // 轉換數據格式
    const lead = {
      ...data,
      tags: data.lead_tags?.map((lt: any) => lt.tags).filter(Boolean) || []
    }

    return lead as Lead
  }

  async createLead(leadData: Partial<Lead>) {
    const newLead = {
      lead_id: await this.generateLeadId(),
      status: 'new' as LeadStatus,
      ...leadData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('leads')
      .insert(newLead)
      .select()
      .single()

    if (error) throw error
    return data as Lead
  }

  async updateLead(leadId: string, leadData: Partial<Lead>) {
    const { data, error } = await supabase
      .from('leads')
      .update({
        ...leadData,
        updated_at: new Date().toISOString()
      })
      .eq('lead_id', leadId)
      .select()
      .single()

    if (error) throw error
    return data as Lead
  }

  async deleteLead(leadId: string) {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('lead_id', leadId)

    if (error) throw error
  }

  // 追蹤記錄管理
  async getFollowUps(params: FollowUpSearchParams = {}) {
    const query = supabase
      .from('follow_ups')
      .select('*, leads(full_name, parent_name)')

    if (params.lead_id) {
      query.eq('lead_id', params.lead_id)
    }

    if (params.type) {
      query.eq('type', params.type)
    }

    if (params.result) {
      query.eq('result', params.result)
    }

    if (params.created_by) {
      query.eq('created_by', params.created_by)
    }

    if (params.date_from) {
      // 從該日期的開始時間開始
      query.gte('created_at', params.date_from)
    }

    if (params.date_to) {
      // 包含整個結束日期（到該日期的 23:59:59）
      const endDate = new Date(params.date_to)
      endDate.setHours(23, 59, 59, 999)
      query.lte('created_at', endDate.toISOString())
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(
        ((params.page || 1) - 1) * (params.limit || 20),
        (params.page || 1) * (params.limit || 20) - 1
      )

    if (error) throw error
    return data as FollowUp[]
  }

  async createFollowUp(followUpData: Partial<FollowUp>) {
    const newFollowUp = {
      follow_up_id: `FU${Date.now()}`,
      ...followUpData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('follow_ups')
      .insert(newFollowUp)
      .select()
      .single()

    if (error) throw error
    return data as FollowUp
  }

  // 試聽課程管理
  async getTrialClasses(leadId?: string) {
    const query = supabase
      .from('trial_classes')
      .select(`
        *,
        leads(full_name, phone),
        courses(course_name),
        users!trial_classes_created_by_fkey(full_name),
        teacher:users!trial_classes_teacher_id_fkey(full_name)
      `)

    if (leadId) {
      query.eq('lead_id', leadId)
    }

    const { data, error } = await query.order('scheduled_date', { ascending: false })
    if (error) {
      console.error('載入試聽課程失敗:', error)
      throw error
    }

    // 轉換數據格式以匹配前端期望的結構
    const transformedData = data?.map(trial => ({
      ...trial,
      lead: trial.leads,
      course: trial.courses,
      created_by_user: trial.users,
      teacher_user: trial.teacher
    })) || []

    return transformedData as TrialClass[]
  }

  async createTrialClass(trialData: Partial<TrialClass>) {
    const newTrial = {
      trial_id: `TRIAL${Date.now()}`,
      status: 'scheduled',
      ...trialData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('trial_classes')
      .insert(newTrial)
      .select()
      .single()

    if (error) throw error
    return data as TrialClass
  }

  async updateTrialClass(trialId: string, trialData: Partial<TrialClass>) {
    const { data, error } = await supabase
      .from('trial_classes')
      .update({
        ...trialData,
        updated_at: new Date().toISOString()
      })
      .eq('trial_id', trialId)
      .select()
      .single()

    if (error) throw error
    return data as TrialClass
  }

  // 轉換管理
  async convertLeadToStudent(leadId: string, convertedBy: string) {
    try {
      // 1. 獲取潛在客戶資料
      const lead = await this.getLead(leadId)
      if (!lead) {
        throw new Error('找不到潛在客戶資料')
      }

      if (lead.status === 'converted') {
        throw new Error('此潛在客戶已經轉換為學生')
      }

      // 2. 生成唯一ID
      const timestamp = Date.now()
      const studentId = `STU${timestamp}`
      const contactId = `CON${timestamp}`

      // 3. 創建聯絡人記錄
      const contactData = {
        contact_id: contactId,
        full_name: lead.parent_name || lead.full_name,
        phone: lead.phone,
        email: lead.email,
        notes: `由潛在客戶 ${lead.lead_id} 轉換而來`,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_modified_by: convertedBy
      }

      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert(contactData)
        .select()
        .single()

      if (contactError) throw contactError

      // 4. 創建學生記錄
      const studentData = {
        student_id: studentId,
        chinese_name: lead.full_name,
        english_name: null,
        birth_date: null,
        notes: `由潛在客戶轉換：${lead.notes || ''}`,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert(studentData)
        .select()
        .single()

      if (studentError) throw studentError

      // 5. 建立學生-聯絡人關係
      const studentContactData = {
        student_id: studentId,
        contact_id: contactId,
        relationship: lead.parent_name ? 'parent' : 'self',
        is_primary: true,
        is_emergency: true,
        is_billing: true,
        created_at: new Date().toISOString(),
        last_modified_by: convertedBy
      }

      const { error: relationError } = await supabase
        .from('student_contacts')
        .insert(studentContactData)

      if (relationError) throw relationError

      // 6. 創建轉換記錄
      const conversionData = {
        conversion_id: `CONV${timestamp}`,
        lead_id: leadId,
        student_id: studentId,
        enrollment_date: new Date().toISOString().split('T')[0],
        total_amount: 0, // 將在後續建立訂單時更新
        conversion_days: Math.ceil((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        converted_by: convertedBy,
        notes: '系統自動轉換',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: conversion, error: conversionError } = await supabase
        .from('conversions')
        .insert(conversionData)
        .select()
        .single()

      if (conversionError) throw conversionError

      // 7. 更新潛在客戶狀態為已轉換
      await this.updateLead(leadId, {
        status: 'converted' as LeadStatus
      })

      return {
        conversion,
        student,
        contact,
        message: '成功轉換為學生'
      }

    } catch (error) {
      console.error('轉換失敗:', error)
      throw error
    }
  }

  /**
   * 生成潛在客戶編號 - L+日期+流水編號格式
   * 例如：L20250723001
   */
  private async generateLeadId(): Promise<string> {
    try {
      const today = new Date()
      const dateStr = today.getFullYear().toString() +
                     (today.getMonth() + 1).toString().padStart(2, '0') +
                     today.getDate().toString().padStart(2, '0')

      // 查詢今天已創建的潛在客戶數量
      const { data: leads, error } = await supabase
        .from('leads')
        .select('lead_id')
        .like('lead_id', `L${dateStr}%`)
        .order('lead_id', { ascending: false })
        .limit(1)

      if (error) {
        console.error('查詢潛在客戶編號失敗:', error)
        throw error
      }

      let nextNumber = 1

      if (leads && leads.length > 0) {
        const lastId = leads[0].lead_id
        // 從 L20250723001 格式中提取數字部分
        const match = lastId.match(/^L\d{8}(\d{3})$/)
        if (match) {
          nextNumber = parseInt(match[1]) + 1
        }
      }

      // 格式化為 L20250723001 格式（3位數字，不足補0）
      return `L${dateStr}${nextNumber.toString().padStart(3, '0')}`
    } catch (error) {
      console.error('生成潛在客戶編號失敗:', error)
      // 如果查詢失敗，使用當前日期+001作為回退
      const today = new Date()
      const dateStr = today.getFullYear().toString() +
                     (today.getMonth() + 1).toString().padStart(2, '0') +
                     today.getDate().toString().padStart(2, '0')
      return `L${dateStr}001`
    }
  }

  // CRM 統計數據
  async getCRMStats(): Promise<CRMStats> {
    try {
      // 並行執行多個查詢以提高效能
      const [
        totalLeadsResult,
        newLeadsResult,
        conversionsResult,
        trialClassesResult,
        leadsBySourceResult,
        leadsByStatusResult
      ] = await Promise.all([
        // 總潛在客戶數
        supabase.from('leads').select('*', { count: 'exact', head: true }),

        // 本月新增客戶數
        supabase.from('leads').select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),

        // 轉換數據
        supabase.from('conversions').select('conversion_days'),

        // 試聽數據
        supabase.from('trial_classes').select('status'),

        // 按來源分組 - 使用直接查詢替代函數
        supabase
          .from('leads')
          .select('source')
          .then(({ data }) => {
            const grouped = data?.reduce((acc: any, item) => {
              acc[item.source] = (acc[item.source] || 0) + 1
              return acc
            }, {})
            return { data: grouped }
          }),

        // 按狀態分組 - 使用直接查詢替代函數
        supabase
          .from('leads')
          .select('status')
          .then(({ data }) => {
            const grouped = data?.reduce((acc: any, item) => {
              acc[item.status] = (acc[item.status] || 0) + 1
              return acc
            }, {})
            return { data: grouped }
          })
      ])

      const totalLeads = totalLeadsResult.count || 0
      const newLeads = newLeadsResult.count || 0
      const conversions = conversionsResult.data || []
      const trialClasses = trialClassesResult.data || []

      // 計算轉換率
      const conversionRate = totalLeads > 0 ? (conversions.length / totalLeads) * 100 : 0

      // 計算平均轉換天數
      const averageConversionDays = conversions.length > 0
        ? conversions.reduce((sum, c) => sum + (c.conversion_days || 0), 0) / conversions.length
        : 0

      // 試聽預約率和出席率
      const trialBookings = trialClasses.length
      const trialShows = trialClasses.filter(t => t.status === 'completed').length
      const trialBookingRate = totalLeads > 0 ? (trialBookings / totalLeads) * 100 : 0
      const trialShowRate = trialBookings > 0 ? (trialShows / trialBookings) * 100 : 0

      return {
        total_leads: totalLeads,
        new_leads_this_month: newLeads,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        average_conversion_days: Math.round(averageConversionDays * 100) / 100,
        trial_booking_rate: Math.round(trialBookingRate * 100) / 100,
        trial_show_rate: Math.round(trialShowRate * 100) / 100,
        leads_by_source: leadsBySourceResult.data || {},
        leads_by_status: leadsByStatusResult.data || {},
        monthly_conversions: [] // TODO: 實現月度轉換數據查詢
      }
    } catch (error) {
      console.error('獲取 CRM 統計失敗:', error)
      throw error
    }
  }

  // 批量匯入潛在客戶
  async bulkImportLeads(leads: Partial<Lead>[]): Promise<{
    success: Lead[]
    failed: { data: Partial<Lead>; error: string }[]
  }> {
    const success: Lead[] = []
    const failed: { data: Partial<Lead>; error: string }[] = []

    for (const leadData of leads) {
      try {
        const newLead = await this.createLead(leadData)
        success.push(newLead)
      } catch (error) {
        failed.push({
          data: leadData,
          error: error instanceof Error ? error.message : '未知錯誤'
        })
      }
    }

    return { success, failed }
  }

  // 標籤管理
  async getTags(): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name')

    if (error) throw error
    return data as Tag[]
  }

  async createTag(tagData: Partial<Tag>): Promise<Tag> {
    const newTag = {
      tag_id: `TAG${Date.now()}`,
      ...tagData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('tags')
      .insert(newTag)
      .select()
      .single()

    if (error) throw error
    return data as Tag
  }

  async updateTag(tagId: string, tagData: Partial<Tag>): Promise<Tag> {
    const { data, error } = await supabase
      .from('tags')
      .update({
        ...tagData,
        updated_at: new Date().toISOString()
      })
      .eq('tag_id', tagId)
      .select()
      .single()

    if (error) throw error
    return data as Tag
  }

  async deleteTag(tagId: string): Promise<void> {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('tag_id', tagId)

    if (error) throw error
  }

  // 潛在客戶標籤管理
  async addTagsToLead(leadId: string, tagIds: string[]): Promise<void> {
    const tagsToAdd = tagIds.map(tagId => ({
      lead_id: leadId,
      tag_id: tagId
    }))

    const { error } = await supabase
      .from('lead_tags')
      .insert(tagsToAdd)

    if (error) throw error
  }

  async removeTagFromLead(leadId: string, tagId: string): Promise<void> {
    const { error } = await supabase
      .from('lead_tags')
      .delete()
      .eq('lead_id', leadId)
      .eq('tag_id', tagId)

    if (error) throw error
  }

  async getLeadTags(leadId: string): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('lead_tags')
      .select('tags(*)')
      .eq('lead_id', leadId)

    if (error) throw error
    return data?.map(item => (item as any).tags) || []
  }

  // 移除行銷活動功能，專注於核心CRM業務
}

// 導出單例實例
export const crmService = new CRMService()
