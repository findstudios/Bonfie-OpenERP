/**
 * 學生備註歷史服務
 * 提供備註 CRUD 操作和歷史記錄功能
 */

import { db } from '@/services/supabase'
import type {
  StudentNoteHistory,
  CreateNoteData,
  NotesQueryOptions,
  SearchOptions,
  NotesStatistics,
  NoteSaveResult,
  DateRange
} from './types'
import { DEFAULT_NOTES_QUERY_OPTIONS } from './types'

class NotesService {
  /**
   * 獲取學生備註歷史
   */
  async getStudentNotesHistory(
    studentId: string,
    options: NotesQueryOptions = {}
  ): Promise<StudentNoteHistory[]> {
    try {
      const opts = { ...DEFAULT_NOTES_QUERY_OPTIONS, ...options }

      // 構建查詢條件
      const query = `
        *,
        created_by_user:users!created_by(full_name)
      `

      const filters: any = { student_id: studentId }

      // 類型篩選
      if (opts.types && opts.types.length > 0) {
        filters.note_type = { in: opts.types }
      }

      // 重要備註篩選
      if (opts.onlyImportant) {
        filters.is_important = true
      }

      // 排除敏感備註
      if (opts.excludeSensitive) {
        filters.is_sensitive = { neq: true }
      }

      // 日期範圍篩選
      if (opts.dateRange) {
        filters.created_at = {
          gte: opts.dateRange.start,
          lte: `${opts.dateRange.end} 23:59:59`
        }
      }

      let dbQuery = db.findMany('student_notes_history', filters, query)

      // 排序
      if (opts.orderBy) {
        dbQuery = dbQuery.order(opts.orderBy, { ascending: opts.orderDirection === 'asc' })
      }

      // 分頁
      if (opts.limit) {
        dbQuery = dbQuery.range(opts.offset || 0, (opts.offset || 0) + opts.limit - 1)
      }

      const { data, error } = await dbQuery

      if (error) throw error

      // 處理資料格式
      return data.map(note => ({
        ...note,
        created_by_name: note.created_by_user?.full_name,
        tags: note.tags || [],
        is_important: note.is_important || false,
        is_sensitive: note.is_sensitive || false
      }))

    } catch (error) {
      console.error('獲取學生備註歷史失敗:', error)
      throw error
    }
  }

  /**
   * 新增學生備註歷史記錄
   */
  async addStudentNote(
    studentId: string,
    noteData: CreateNoteData,
    userId?: string
  ): Promise<StudentNoteHistory> {
    try {
      const data = {
        student_id: studentId,
        note_content: noteData.content,
        note_type: noteData.type || 'general',
        is_important: noteData.isImportant || false,
        is_sensitive: noteData.isSensitive || false,
        tags: noteData.tags || [],
        created_by: userId || 'system'
      }

      const result = await db.create('student_notes_history', data)

      // 獲取完整記錄（包含建立者資訊）
      const fullRecord = await this.getStudentNotesHistory(studentId, {
        limit: 1,
        orderBy: 'created_at',
        orderDirection: 'desc'
      })

      return fullRecord[0] || result

    } catch (error) {
      console.error('新增學生備註失敗:', error)
      throw error
    }
  }

  /**
   * 更新學生當前備註（會觸發歷史記錄）
   */
  async updateStudentCurrentNotes(
    studentId: string,
    newNotes: string,
    userId?: string
  ): Promise<void> {
    try {
      // 更新學生表的 notes 欄位
      // 這會觸發資料庫的 trigger，自動記錄到 student_notes_history
      await db.update('students', studentId, {
        notes: newNotes,
        updated_by: userId || 'system'
      }, 'student_id')

    } catch (error) {
      console.error('更新學生備註失敗:', error)
      throw error
    }
  }

  /**
   * 搜尋備註內容
   */
  async searchNotes(
    studentId: string,
    keyword: string,
    options: SearchOptions = {}
  ): Promise<StudentNoteHistory[]> {
    try {
      if (!keyword.trim()) {
        return []
      }

      const queryOptions: NotesQueryOptions = {
        types: options.types,
        dateRange: options.dateRange,
        onlyImportant: options.onlyImportant,
        includeCreator: true
      }

      // 使用全文搜尋
      const { data, error } = await db.query(`
        SELECT *, 
               users.full_name as created_by_name
        FROM student_notes_history 
        LEFT JOIN users ON student_notes_history.created_by = users.user_id
        WHERE student_id = $1 
          AND to_tsvector('chinese', note_content) @@ plainto_tsquery('chinese', $2)
          ${options.types ? 'AND note_type = ANY($3)' : ''}
          ${options.onlyImportant ? 'AND is_important = true' : ''}
        ORDER BY ts_rank(to_tsvector('chinese', note_content), plainto_tsquery('chinese', $2)) DESC,
                 created_at DESC
        LIMIT 100
      `, [
        studentId,
        keyword,
        ...(options.types ? [options.types] : [])
      ])

      if (error) throw error

      return data || []

    } catch (error) {
      console.error('搜尋備註失敗:', error)
      // 降級為簡單的 LIKE 搜尋
      return this.searchNotesSimple(studentId, keyword, options)
    }
  }

  /**
   * 簡單搜尋（降級方案）
   */
  private async searchNotesSimple(
    studentId: string,
    keyword: string,
    options: SearchOptions
  ): Promise<StudentNoteHistory[]> {
    const allNotes = await this.getStudentNotesHistory(studentId, {
      types: options.types,
      dateRange: options.dateRange,
      onlyImportant: options.onlyImportant
    })

    const searchTerm = options.caseSensitive ? keyword : keyword.toLowerCase()

    return allNotes.filter(note => {
      const content = options.caseSensitive ? note.note_content : note.note_content.toLowerCase()
      return content.includes(searchTerm)
    })
  }

  /**
   * 獲取備註統計
   */
  async getNotesStatistics(
    studentId: string,
    dateRange?: DateRange
  ): Promise<NotesStatistics> {
    try {
      const filters: any = { student_id: studentId }

      if (dateRange) {
        filters.created_at = {
          gte: dateRange.start,
          lte: `${dateRange.end} 23:59:59`
        }
      }

      const { data, error } = await db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_important = true THEN 1 END) as important_count,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_count,
          note_type,
          COUNT(*) as type_count,
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as monthly_count
        FROM student_notes_history 
        WHERE student_id = $1
          ${dateRange ? 'AND created_at BETWEEN $2 AND $3' : ''}
        GROUP BY GROUPING SETS (
          (), 
          (note_type), 
          (DATE_TRUNC('month', created_at))
        )
      `, [
        studentId,
        ...(dateRange ? [dateRange.start, `${dateRange.end} 23:59:59`] : [])
      ])

      if (error) throw error

      // 處理統計資料
      const stats: NotesStatistics = {
        total: 0,
        byType: {
          general: 0,
          academic: 0,
          behavioral: 0,
          family: 0,
          health: 0,
          attendance: 0
        },
        importantCount: 0,
        recentCount: 0,
        monthlyCount: {}
      }

      data.forEach(row => {
        if (row.note_type) {
          stats.byType[row.note_type as keyof typeof stats.byType] = row.type_count
        } else if (row.month) {
          const monthKey = new Date(row.month).toISOString().substring(0, 7)
          stats.monthlyCount[monthKey] = row.monthly_count
        } else {
          stats.total = row.total
          stats.importantCount = row.important_count
          stats.recentCount = row.recent_count
        }
      })

      return stats

    } catch (error) {
      console.error('獲取備註統計失敗:', error)
      throw error
    }
  }

  /**
   * 匯出備註歷史
   */
  async exportNotesHistory(
    studentId: string,
    format: 'pdf' | 'excel' | 'csv',
    options: NotesQueryOptions = {}
  ): Promise<Blob> {
    try {
      const notes = await this.getStudentNotesHistory(studentId, {
        ...options,
        limit: 1000, // 匯出時不限制數量
        includeCreator: true
      })

      switch (format) {
        case 'csv':
          return this.exportToCSV(notes)
        case 'excel':
          return this.exportToExcel(notes)
        case 'pdf':
          return this.exportToPDF(notes)
        default:
          throw new Error(`不支援的匯出格式: ${format}`)
      }

    } catch (error) {
      console.error('匯出備註歷史失敗:', error)
      throw error
    }
  }

  /**
   * 匯出為 CSV
   */
  private exportToCSV(notes: StudentNoteHistory[]): Blob {
    const headers = ['日期', '類型', '內容', '重要', '建立者']
    const rows = notes.map(note => [
      new Date(note.created_at).toLocaleString('zh-TW'),
      note.note_type,
      note.note_content.replace(/"/g, '""'), // CSV 跳脫雙引號
      note.is_important ? '是' : '否',
      note.created_by_name || note.created_by
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    // 加上 BOM 確保中文正確顯示
    const BOM = '\uFEFF'
    return new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  }

  /**
   * 匯出為 Excel (簡化版，實際可使用 xlsx 庫)
   */
  private exportToExcel(notes: StudentNoteHistory[]): Blob {
    // 這裡簡化為 CSV 格式，實際專案中建議使用 xlsx 庫
    return this.exportToCSV(notes)
  }

  /**
   * 匯出為 PDF (簡化版，實際可使用 jsPDF 庫)
   */
  private exportToPDF(notes: StudentNoteHistory[]): Blob {
    // 這裡簡化為文字格式，實際專案中建議使用 jsPDF 庫
    const content = notes.map(note =>
      `${new Date(note.created_at).toLocaleString('zh-TW')}\n` +
      `類型：${note.note_type}\n` +
      `內容：${note.note_content}\n` +
      `建立者：${note.created_by_name || note.created_by}\n` +
      '---\n'
    ).join('\n')

    return new Blob([content], { type: 'text/plain;charset=utf-8;' })
  }

  /**
   * 驗證備註資料
   */
  validateNoteData(noteData: CreateNoteData): string[] {
    const errors: string[] = []

    if (!noteData.content?.trim()) {
      errors.push('備註內容不能為空')
    }

    if (noteData.content && noteData.content.length > 2000) {
      errors.push('備註內容不能超過 2000 字元')
    }

    return errors
  }
}

// 匯出單例
export const notesService = new NotesService()
