import { supabase } from './supabase'
import { auditService } from './auditService'

interface ImportResult {
  success: boolean
  imported: number
  updated: number
  skipped: number
  failed: number
  errors: string[]
}

export const importService = {
  /**
   * Import students data
   */
  async importStudents(data: any[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    }

    for (const row of data) {
      try {
        // Generate student ID
        const studentId = await this.generateStudentId()

        // Create student record
        const studentData = {
          student_id: studentId,
          chinese_name: row['學生姓名(中文)'],
          english_name: row['學生姓名(英文)'] || null,
          birth_date: row['出生日期'] || null,
          notes: row['備註'] || null,
          is_active: true
        }

        const { data: student, error: studentError } = await supabase
          .from('students')
          .insert(studentData)
          .select()
          .single()

        if (studentError) throw studentError

        // Create contact if provided
        if (row['聯絡人姓名']) {
          const contactId = await this.generateContactId()

          const contactData = {
            contact_id: contactId,
            full_name: row['聯絡人姓名'],
            phone: row['聯絡電話'] || null,
            email: row['電子郵件'] || null,
            address: row['地址'] || null,
            is_active: true
          }

          const { data: contact, error: contactError } = await supabase
            .from('contacts')
            .insert(contactData)
            .select()
            .single()

          if (contactError) throw contactError

          // Link student and contact
          await supabase
            .from('student_contacts')
            .insert({
              student_id: studentId,
              contact_id: contactId,
              relationship: '父母',
              is_primary: true,
              is_emergency: true,
              is_billing: true
            })
        }

        result.imported++

        // Log the import
        await auditService.logCreate('students', studentId, studentData)
      } catch (error) {
        result.failed++
        result.errors.push(`學生 ${row['學生姓名(中文)']} 匯入失敗: ${error.message}`)
      }
    }

    result.success = result.failed === 0
    return result
  },

  /**
   * Import contacts data
   */
  async importContacts(data: any[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    }

    for (const row of data) {
      try {
        const contactId = await this.generateContactId()

        const contactData = {
          contact_id: contactId,
          full_name: row['姓名'],
          phone: row['電話'] || null,
          email: row['電子郵件'] || null,
          address: row['地址'] || null,
          notes: row['備註'] || null,
          is_active: true
        }

        const { error } = await supabase
          .from('contacts')
          .insert(contactData)

        if (error) throw error

        result.imported++

        // Log the import
        await auditService.logCreate('contacts', contactId, contactData)
      } catch (error) {
        result.failed++
        result.errors.push(`聯絡人 ${row['姓名']} 匯入失敗: ${error.message}`)
      }
    }

    result.success = result.failed === 0
    return result
  },

  /**
   * Import courses data
   */
  async importCourses(data: any[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    }

    for (const row of data) {
      try {
        // Find instructor by name
        const { data: instructor } = await supabase
          .from('users')
          .select('user_id')
          .eq('full_name', row['教師姓名'])
          .single()

        if (!instructor) {
          throw new Error(`找不到教師: ${row['教師姓名']}`)
        }

        const courseId = await this.generateCourseId()

        const courseData = {
          course_id: courseId,
          course_name: row['課程名稱'],
          instructor_id: instructor.user_id,
          course_type: row['課程類型'] || 'regular',
          total_sessions: parseInt(row['總堂數']),
          price_per_session: parseFloat(row['每堂價格']),
          max_students: parseInt(row['最大人數']) || 10,
          description: row['課程說明'] || null,
          status: 'planning'
        }

        const { error } = await supabase
          .from('courses')
          .insert(courseData)

        if (error) throw error

        result.imported++

        // Log the import
        await auditService.logCreate('courses', courseId, courseData)
      } catch (error) {
        result.failed++
        result.errors.push(`課程 ${row['課程名稱']} 匯入失敗: ${error.message}`)
      }
    }

    result.success = result.failed === 0
    return result
  },

  /**
   * Generate unique student ID
   */
  async generateStudentId(): Promise<string> {
    const year = new Date().getFullYear()
    const { data } = await supabase
      .from('students')
      .select('student_id')
      .like('student_id', `STU${year}%`)
      .order('student_id', { ascending: false })
      .limit(1)

    if (data && data.length > 0) {
      const lastId = data[0].student_id
      const lastNumber = parseInt(lastId.slice(-4))
      const newNumber = (lastNumber + 1).toString().padStart(4, '0')
      return `STU${year}${newNumber}`
    }

    return `STU${year}0001`
  },

  /**
   * Generate unique contact ID
   */
  async generateContactId(): Promise<string> {
    const year = new Date().getFullYear()
    const { data } = await supabase
      .from('contacts')
      .select('contact_id')
      .like('contact_id', `CON${year}%`)
      .order('contact_id', { ascending: false })
      .limit(1)

    if (data && data.length > 0) {
      const lastId = data[0].contact_id
      const lastNumber = parseInt(lastId.slice(-4))
      const newNumber = (lastNumber + 1).toString().padStart(4, '0')
      return `CON${year}${newNumber}`
    }

    return `CON${year}0001`
  },

  /**
   * Generate unique course ID
   */
  async generateCourseId(): Promise<string> {
    const year = new Date().getFullYear()
    const { data } = await supabase
      .from('courses')
      .select('course_id')
      .like('course_id', `CRS${year}%`)
      .order('course_id', { ascending: false })
      .limit(1)

    if (data && data.length > 0) {
      const lastId = data[0].course_id
      const lastNumber = parseInt(lastId.slice(-4))
      const newNumber = (lastNumber + 1).toString().padStart(4, '0')
      return `CRS${year}${newNumber}`
    }

    return `CRS${year}0001`
  },

  /**
   * Parse CSV content
   */
  parseCSV(content: string): { headers: string[], data: any[] } {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('CSV 檔案必須包含標題列和至少一筆資料')
    }

    const headers = this.parseCSVLine(lines[0])
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i])
      const row: any = {}

      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      data.push(row)
    }

    return { headers, data }
  },

  /**
   * Parse a single CSV line handling quoted values
   */
  parseCSVLine(line: string): string[] {
    const result = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    result.push(current.trim())
    return result
  }
}
