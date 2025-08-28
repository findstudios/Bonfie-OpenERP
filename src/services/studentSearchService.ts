import { supabase } from './supabase'

export interface StudentSearchResult {
  student_id: string
  chinese_name: string
  english_name?: string
  is_active: boolean
  matchedPhone?: string
}

class StudentSearchService {
  /**
   * 搜尋學生
   * @param query 搜尋關鍵字
   * @param limit 結果數量限制
   * @returns 搜尋結果
   */
  async searchStudents(query: string, limit: number = 5): Promise<StudentSearchResult[]> {
    if (!query || !query.trim()) {
      return []
    }

    try {
      // 先搜尋學生本身的資料
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .or(`chinese_name.ilike.%${query}%,english_name.ilike.%${query}%,student_id.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(limit)

      if (studentError) throw studentError

      // 再從聯絡人電話搜尋
      const { data: contactData, error: contactError } = await supabase
        .from('student_contacts')
        .select(`
          student_id,
          contacts!inner(
            phone
          ),
          students!inner(
            student_id,
            chinese_name,
            english_name,
            is_active
          )
        `)
        .ilike('contacts.phone', `%${query}%`)
        .eq('students.is_active', true)
        .limit(limit)

      if (contactError) throw contactError

      // 合併結果，移除重複
      const studentMap = new Map<string, StudentSearchResult>()

      // 先加入直接搜尋到的學生
      studentData?.forEach(student => {
        studentMap.set(student.student_id, {
          student_id: student.student_id,
          chinese_name: student.chinese_name,
          english_name: student.english_name,
          is_active: student.is_active
        })
      })

      // 再加入通過電話搜尋到的學生
      contactData?.forEach(item => {
        if (!studentMap.has(item.students.student_id)) {
          studentMap.set(item.students.student_id, {
            student_id: item.students.student_id,
            chinese_name: item.students.chinese_name,
            english_name: item.students.english_name,
            is_active: item.students.is_active,
            matchedPhone: item.contacts.phone
          })
        }
      })

      return Array.from(studentMap.values()).slice(0, limit)
    } catch (error) {
      console.error('搜尋學生失敗:', error)
      throw error
    }
  }

  /**
   * 透過學生ID獲取學生資料
   * @param studentId 學生ID
   * @returns 學生資料
   */
  async getStudentById(studentId: string): Promise<StudentSearchResult | null> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('student_id', studentId)
        .single()

      if (error) throw error

      return data ? {
        student_id: data.student_id,
        chinese_name: data.chinese_name,
        english_name: data.english_name,
        is_active: data.is_active
      } : null
    } catch (error) {
      console.error('獲取學生資料失敗:', error)
      return null
    }
  }

  /**
   * 透過學生姓名（中文或英文）獲取學生資料
   * @param name 學生姓名
   * @returns 學生資料
   */
  async getStudentByName(name: string): Promise<StudentSearchResult | null> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .or(`chinese_name.eq.${name},english_name.eq.${name}`)
        .eq('is_active', true)
        .single()

      if (error) throw error

      return data ? {
        student_id: data.student_id,
        chinese_name: data.chinese_name,
        english_name: data.english_name,
        is_active: data.is_active
      } : null
    } catch (error) {
      console.error('透過姓名獲取學生資料失敗:', error)
      return null
    }
  }
}

export const studentSearchService = new StudentSearchService()
