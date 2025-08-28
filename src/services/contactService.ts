/**
 * 聯絡人管理服務
 * 提供聯絡人 CRUD 操作和智能更新功能
 */

import { db, supabase } from './supabase'
import type { Contact, Student, StudentContact } from '@/types'
import type { ContactFormData, ContactUpdateResult } from '@/components/contacts/types'

class ContactService {
  /**
   * 獲取學生的所有聯絡人
   */
  async getStudentContacts(studentId: string): Promise<ContactFormData[]> {
    try {
      const student = await db.findOne<Student>('students', studentId, `
        *,
        contacts:student_contacts(
          id,
          relationship,
          is_primary,
          is_emergency,
          is_billing,
          notes,
          contact:contacts(
            id,
            contact_id,
            full_name,
            phone,
            email,
            address
          )
        )
      `)

      if (!student) {
        return []
      }

      return student.contacts?.map(sc => ({
        contact_id: sc.contact?.contact_id,
        full_name: sc.contact?.full_name || '',
        phone: sc.contact?.phone || '',
        email: sc.contact?.email || '',
        address: sc.contact?.address || '',
        relationship: sc.relationship as ContactFormData['relationship'],
        is_primary: sc.is_primary,
        is_emergency: sc.is_emergency,
        is_billing: sc.is_billing,
        notes: sc.notes || '',
        student_contact_id: sc.id
      })) || []
    } catch (error) {
      console.error('獲取學生聯絡人失敗:', error)
      throw error
    }
  }

  /**
   * 智能更新學生聯絡人
   * 自動比較差異並執行新增、更新、刪除操作
   */
  async updateStudentContacts(
    studentId: string,
    newContacts: ContactFormData[],
    userId?: string
  ): Promise<ContactUpdateResult> {
    const result: ContactUpdateResult = {
      added: 0,
      updated: 0,
      deleted: 0,
      errors: []
    }

    try {
      // 1. 獲取當前聯絡人資料
      const currentContacts = await this.getStudentContacts(studentId)

      // 2. 找出需要新增的聯絡人
      const contactsToAdd = newContacts.filter(newContact =>
        !newContact.contact_id ||
        !currentContacts.some(current => current.contact_id === newContact.contact_id)
      )

      // 3. 找出需要更新的聯絡人
      const contactsToUpdate = newContacts.filter(newContact =>
        newContact.contact_id &&
        currentContacts.some(current => {
          if (current.contact_id !== newContact.contact_id) return false

          return this.hasContactChanged(current, newContact)
        })
      )

      // 4. 找出需要刪除的聯絡人
      const contactsToDelete = currentContacts.filter(current =>
        current.contact_id &&
        !newContacts.some(newContact => newContact.contact_id === current.contact_id)
      )

      // 5. 執行新增操作
      for (const contactData of contactsToAdd) {
        try {
          await this.addStudentContact(studentId, contactData, userId)
          result.added++
        } catch (error) {
          result.errors.push(`新增聯絡人失敗: ${error.message}`)
        }
      }

      // 6. 執行更新操作
      for (const contactData of contactsToUpdate) {
        try {
          await this.updateStudentContact(contactData, userId)
          result.updated++
        } catch (error) {
          result.errors.push(`更新聯絡人失敗: ${error.message}`)
        }
      }

      // 7. 執行刪除操作
      for (const contactData of contactsToDelete) {
        try {
          await this.deleteStudentContact(contactData, userId)
          result.deleted++
        } catch (error) {
          result.errors.push(`刪除聯絡人失敗: ${error.message}`)
        }
      }

      console.log('聯絡人更新完成:', result)
      return result

    } catch (error) {
      console.error('聯絡人更新過程發生錯誤:', error)
      result.errors.push(`更新過程失敗: ${error.message}`)
      return result
    }
  }

  /**
   * 新增學生聯絡人
   */
  private async addStudentContact(
    studentId: string,
    contactData: ContactFormData,
    userId?: string
  ): Promise<void> {
    // 創建聯絡人基本資料
    const contact = await db.create('contacts', {
      contact_id: await this.generateContactId(),
      full_name: contactData.full_name,
      phone: contactData.phone,
      email: contactData.email || null,
      address: contactData.address || null,
      is_active: true,
      last_modified_by: userId
    })

    // 創建學生-聯絡人關係
    await db.create('student_contacts', {
      student_id: studentId,
      contact_id: contact.contact_id,
      relationship: contactData.relationship,
      is_primary: contactData.is_primary,
      is_emergency: contactData.is_emergency,
      is_billing: contactData.is_billing,
      notes: contactData.notes || null,
      last_modified_by: userId
    })
  }

  /**
   * 更新學生聯絡人
   */
  private async updateStudentContact(
    contactData: ContactFormData,
    userId?: string
  ): Promise<void> {
    if (!contactData.contact_id || !contactData.student_contact_id) {
      throw new Error('缺少必要的 ID 資訊')
    }

    // 更新聯絡人基本資料 - 使用 contact_id 欄位
    const { error: contactError } = await supabase
      .from('contacts')
      .update({
        full_name: contactData.full_name,
        phone: contactData.phone,
        email: contactData.email || null,
        address: contactData.address || null,
        last_modified_by: userId
      })
      .eq('contact_id', contactData.contact_id)

    if (contactError) {
      throw contactError
    }

    // 更新學生-聯絡人關係 - 使用 id 欄位
    const { error: relationError } = await supabase
      .from('student_contacts')
      .update({
        relationship: contactData.relationship,
        is_primary: contactData.is_primary,
        is_emergency: contactData.is_emergency,
        is_billing: contactData.is_billing,
        notes: contactData.notes || null,
        last_modified_by: userId
      })
      .eq('id', contactData.student_contact_id)

    if (relationError) {
      throw relationError
    }
  }

  /**
   * 刪除學生聯絡人
   */
  private async deleteStudentContact(
    contactData: ContactFormData,
    userId?: string
  ): Promise<void> {
    if (!contactData.contact_id || !contactData.student_contact_id) {
      return
    }

    // 刪除學生-聯絡人關係
    await db.delete('student_contacts', contactData.student_contact_id)

    // 檢查是否有其他學生使用此聯絡人
    const otherRelations = await db.findMany('student_contacts', {
      contact_id: contactData.contact_id
    })

    // 如果沒有其他關係，標記聯絡人為不活躍
    if (otherRelations.length === 0) {
      const { error: deactivateError } = await supabase
        .from('contacts')
        .update({
          is_active: false,
          last_modified_by: userId
        })
        .eq('contact_id', contactData.contact_id)

      if (deactivateError) {
        throw deactivateError
      }
    }
  }

  /**
   * 檢查聯絡人是否有變化
   */
  private hasContactChanged(current: ContactFormData, newContact: ContactFormData): boolean {
    return current.full_name !== newContact.full_name ||
           current.phone !== newContact.phone ||
           current.email !== newContact.email ||
           current.address !== newContact.address ||
           current.relationship !== newContact.relationship ||
           current.is_primary !== newContact.is_primary ||
           current.is_emergency !== newContact.is_emergency ||
           current.is_billing !== newContact.is_billing ||
           current.notes !== newContact.notes
  }

  /**
   * 生成聯絡人 ID
   */
  private async generateContactId(): Promise<string> {
    try {
      // 查詢數據庫中最大的聯絡人編號
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('contact_id')
        .like('contact_id', 'C%')
        .order('contact_id', { ascending: false })
        .limit(1)

      if (error) {
        console.error('查詢聯絡人編號失敗:', error)
        throw error
      }

      let nextNumber = 1

      if (contacts && contacts.length > 0) {
        const lastId = contacts[0].contact_id
        // 從 C000001 格式中提取數字部分
        const match = lastId.match(/^C(\d+)$/)
        if (match) {
          nextNumber = parseInt(match[1]) + 1
        }
      }

      // 格式化為 C000001 格式（6位數字，不足補0）
      return `C${nextNumber.toString().padStart(6, '0')}`
    } catch (error) {
      console.error('生成聯絡人編號失敗:', error)
      // 如果查詢失敗，回退到第一個編號
      return 'C000001'
    }
  }

  /**
   * 驗證聯絡人資料
   */
  validateContact(contact: ContactFormData): string[] {
    const errors: string[] = []

    if (!contact.full_name?.trim()) {
      errors.push('聯絡人姓名不能為空')
    }

    if (!contact.phone?.trim()) {
      errors.push('聯絡人電話不能為空')
    }

    // 電話格式簡單驗證
    if (contact.phone && !/^[0-9+\-\s()]+$/.test(contact.phone)) {
      errors.push('電話格式不正確')
    }

    // Email 格式驗證
    if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      errors.push('電子郵件格式不正確')
    }

    return errors
  }

  /**
   * 驗證學生聯絡人設定
   */
  validateStudentContacts(contacts: ContactFormData[]): string[] {
    const errors: string[] = []

    if (contacts.length === 0) {
      errors.push('至少需要一個聯絡人')
    }

    const primaryCount = contacts.filter(c => c.is_primary).length
    if (primaryCount === 0) {
      errors.push('至少需要設定一個主要聯絡人')
    }
    if (primaryCount > 1) {
      errors.push('只能設定一個主要聯絡人')
    }

    // 驗證每個聯絡人
    contacts.forEach((contact, index) => {
      const contactErrors = this.validateContact(contact)
      contactErrors.forEach(error => {
        errors.push(`聯絡人 ${index + 1}: ${error}`)
      })
    })

    return errors
  }
}

// 匯出單例
export const contactService = new ContactService()
