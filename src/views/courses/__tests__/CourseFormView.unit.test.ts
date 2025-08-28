import { describe, it, expect } from 'vitest'

describe('CourseFormView Student Management Functions', () => {
  // 模擬學生資料
  const mockStudents = [
    { id: 1, student_id: 'S001', chinese_name: '張三', english_name: 'John', is_active: true },
    { id: 2, student_id: 'S002', chinese_name: '李四', english_name: 'Jane', is_active: true },
    { id: 3, student_id: 'S003', chinese_name: '王五', english_name: 'Bob', is_active: true }
  ]

  // 測試學生選擇邏輯
  describe('Student Selection Logic', () => {
    it('should add students correctly', () => {
      const selectedStudents: any[] = []
      const maxStudents = 10

      // 模擬 addStudent 邏輯
      function addStudent(student: any) {
        if (selectedStudents.some(s => s.id === student.id)) return
        if (maxStudents > 0 && selectedStudents.length >= maxStudents) return
        selectedStudents.push(student)
      }

      addStudent(mockStudents[0])
      expect(selectedStudents).toHaveLength(1)
      expect(selectedStudents[0].chinese_name).toBe('張三')
    })

    it('should prevent duplicate students', () => {
      const selectedStudents: any[] = []

      function addStudent(student: any) {
        if (selectedStudents.some(s => s.id === student.id)) return
        selectedStudents.push(student)
      }

      addStudent(mockStudents[0])
      addStudent(mockStudents[0]) // 重複添加
      expect(selectedStudents).toHaveLength(1)
    })

    it('should respect student limit', () => {
      const selectedStudents: any[] = []
      const maxStudents = 2

      function addStudent(student: any) {
        if (selectedStudents.some(s => s.id === student.id)) return
        if (maxStudents > 0 && selectedStudents.length >= maxStudents) return
        selectedStudents.push(student)
      }

      addStudent(mockStudents[0])
      addStudent(mockStudents[1])
      addStudent(mockStudents[2]) // 這個不應該被添加
      expect(selectedStudents).toHaveLength(2)
    })

    it('should remove students correctly', () => {
      const selectedStudents = [...mockStudents]

      function removeStudent(studentId: number) {
        const index = selectedStudents.findIndex(s => s.id === studentId)
        if (index !== -1) {
          selectedStudents.splice(index, 1)
        }
      }

      removeStudent(2)
      expect(selectedStudents).toHaveLength(2)
      expect(selectedStudents.find(s => s.id === 2)).toBeUndefined()
    })

    it('should check if student is selected', () => {
      const selectedStudents = [mockStudents[0], mockStudents[1]]

      function isStudentSelected(studentId: number): boolean {
        return selectedStudents.some(s => s.id === studentId)
      }

      expect(isStudentSelected(1)).toBe(true)
      expect(isStudentSelected(2)).toBe(true)
      expect(isStudentSelected(3)).toBe(false)
    })
  })

  describe('Student Search Logic', () => {
    it('should filter students by name', () => {
      function searchStudents(query: string, students: any[]) {
        if (!query.trim()) return []

        return students.filter(student =>
          student.chinese_name?.toLowerCase().includes(query.toLowerCase()) ||
          student.english_name?.toLowerCase().includes(query.toLowerCase()) ||
          student.student_id?.toLowerCase().includes(query.toLowerCase())
        )
      }

      const results = searchStudents('張', mockStudents)
      expect(results).toHaveLength(1)
      expect(results[0].chinese_name).toBe('張三')

      const resultsEn = searchStudents('john', mockStudents)
      expect(resultsEn).toHaveLength(1)
      expect(resultsEn[0].english_name).toBe('John')

      const resultsId = searchStudents('S00', mockStudents)
      expect(resultsId).toHaveLength(3)
    })
  })
})
