import { supabase } from './supabase'
import type { Database } from '@/types/database'

export interface HandoverNote {
  id: string
  content: string
  author: {
    user_id: string
    full_name: string
    avatar_url?: string
  }
  created_at: string
  updated_at?: string
  priority: 'normal' | 'urgent'
  tags: string[]
  mentioned_users: string[] // Array of user_ids that were mentioned
  read_by: string[]
  is_active: boolean
}

export interface UserMention {
  user_id: string
  full_name: string
  role?: string
}

export interface CreateHandoverNoteInput {
  content: string
  priority: 'normal' | 'urgent'
  author_id: string
  tags?: string[]
}

export interface UpdateHandoverNoteInput {
  content?: string
  priority?: 'normal' | 'urgent'
  tags?: string[]
  is_active?: boolean
}

class HandoverNotesService {
  private mentionCache: Map<string, UserMention> = new Map()

  private readonly NOTE_SELECT_FIELDS = `
    id,
    content,
    author_id,
    priority,
    tags,
    mentioned_users,
    read_by,
    is_active,
    created_at,
    updated_at,
    users (
      user_id,
      full_name,
      avatar_url
    )
  `

  private readonly STUDENT_SELECT_FIELDS = 'student_id, chinese_name, english_name'

  private extractMentions(content: string): string[] {
    const mentions = content.match(/@[\u4e00-\u9fa5\w]+/g) || []
    return mentions
  }

  private transformNoteData(noteData: any): HandoverNote {
    return {
      id: noteData.id.toString(),
      content: noteData.content,
      author: {
        user_id: noteData.users.user_id,
        full_name: noteData.users.full_name,
        avatar_url: noteData.users.avatar_url
      },
      created_at: noteData.created_at,
      updated_at: noteData.updated_at,
      priority: noteData.priority as 'normal' | 'urgent',
      tags: noteData.tags || [],
      mentioned_users: noteData.mentioned_users || [],
      read_by: noteData.read_by || [],
      is_active: noteData.is_active
    }
  }

  private transformStudentToMention(student: any): UserMention {
    return {
      user_id: student.student_id,
      full_name: student.chinese_name || student.english_name || 'Unknown'
    }
  }

  async validateAndExtractMentions(content: string): Promise<{
    validMentions: string[],
    mentionedUserIds: string[],
    invalidMentions: string[]
  }> {
    const mentions = this.extractMentions(content)
    const validMentions: string[] = []
    const mentionedUserIds: string[] = []
    const invalidMentions: string[] = []

    for (const mention of mentions) {
      const nameWithoutAt = mention.substring(1)
      const user = await this.findUserByName(nameWithoutAt)

      if (user) {
        validMentions.push(mention)
        mentionedUserIds.push(user.user_id)
      } else {
        invalidMentions.push(mention)
      }
    }

    return { validMentions, mentionedUserIds, invalidMentions }
  }

  private async findUserByName(name: string): Promise<UserMention | null> {
    // Check cache first
    if (this.mentionCache.has(name)) {
      return this.mentionCache.get(name)!
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('student_id, chinese_name, english_name')
        .or(`chinese_name.eq.${name},english_name.eq.${name}`)
        .eq('is_active', true)
        .single()

      if (error || !data) return null

      const userMention: UserMention = this.transformStudentToMention(data)

      // Cache the result
      this.mentionCache.set(name, userMention)
      return userMention
    } catch (error) {
      console.error('Error finding student by name:', error)
      return null
    }
  }

  async createNote(input: CreateHandoverNoteInput): Promise<HandoverNote> {
    try {
      const tags = input.tags || []

      // Validate mentions and extract user IDs
      const { validMentions, mentionedUserIds, invalidMentions } =
        await this.validateAndExtractMentions(input.content)

      if (invalidMentions.length > 0) {
        console.warn('Invalid mentions found:', invalidMentions)
      }

      // Combine tags with valid mentions only
      const allTags = [...new Set([...tags.filter(t => !t.startsWith('@')), ...validMentions])]

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id, full_name, avatar_url')
        .eq('user_id', input.author_id)
        .single()

      if (userError || !userData) {
        throw new Error('Failed to fetch user data')
      }

      // Store in database (不設置 id，讓資料庫自動生成)
      const { data: insertData, error: insertError } = await supabase
        .from('handover_notes')
        .insert({
          content: input.content,
          author_id: input.author_id,
          priority: input.priority,
          tags: allTags,
          mentioned_users: mentionedUserIds,
          read_by: [input.author_id],
          is_active: true
        })
        .select()
        .single()

      if (insertError) {
        console.error('Database insert error:', insertError)
        throw new Error('Failed to create handover note in database')
      }

      const noteData: HandoverNote = {
        id: insertData.id.toString(),
        content: input.content,
        author: {
          user_id: userData.user_id,
          full_name: userData.full_name,
          avatar_url: userData.avatar_url
        },
        created_at: insertData.created_at || new Date().toISOString(),
        priority: input.priority,
        tags: allTags,
        mentioned_users: mentionedUserIds,
        read_by: [input.author_id],
        is_active: true
      }

      // TODO: Send notifications to mentioned users

      return noteData
    } catch (error) {
      console.error('Error creating handover note:', error)
      throw error
    }
  }

  async getNotes(limit: number = 50): Promise<HandoverNote[]> {
    try {
      const { data: notesData, error: notesError } = await supabase
        .from('handover_notes')
        .select(this.NOTE_SELECT_FIELDS)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (notesError) {
        console.error('Database query error:', notesError)
        throw new Error('Failed to fetch handover notes from database')
      }

      if (!notesData || notesData.length === 0) {
        return []
      }

      const notes: HandoverNote[] = notesData.map(note => this.transformNoteData(note))

      return notes
    } catch (error) {
      console.error('Error fetching handover notes:', error)
      throw error
    }
  }

  async markAsRead(noteId: string, userId: string): Promise<void> {
    try {
      // First, get the current note to check existing read_by array
      const { data: currentNote, error: fetchError } = await supabase
        .from('handover_notes')
        .select('read_by')
        .eq('id', noteId)
        .single()

      if (fetchError) {
        console.error('Error fetching note for read status:', fetchError)
        throw new Error('Failed to fetch note for marking as read')
      }

      const currentReadBy = currentNote?.read_by || []

      // Only update if user hasn't already read it
      if (!currentReadBy.includes(userId)) {
        const updatedReadBy = [...currentReadBy, userId]

        const { error: updateError } = await supabase
          .from('handover_notes')
          .update({
            read_by: updatedReadBy,
            updated_at: new Date().toISOString()
          })
          .eq('id', noteId)

        if (updateError) {
          console.error('Error updating read status:', updateError)
          throw new Error('Failed to mark note as read')
        }
      }
    } catch (error) {
      console.error('Error marking note as read:', error)
      throw error
    }
  }

  async updateNote(noteId: string, updates: UpdateHandoverNoteInput): Promise<HandoverNote> {
    try {
      const existingNote = await this.getNote(noteId)
      if (!existingNote) {
        throw new Error('Note not found')
      }

      let newTags = existingNote.tags
      let newMentionedUsers = existingNote.mentioned_users

      if (updates.content) {
        const { validMentions, mentionedUserIds } =
          await this.validateAndExtractMentions(updates.content)
        const existingTags = existingNote.tags.filter(tag => !tag.startsWith('@'))
        newTags = [...existingTags, ...validMentions]
        newMentionedUsers = mentionedUserIds
      }

      const updateData = {
        content: updates.content || existingNote.content,
        priority: updates.priority || existingNote.priority,
        tags: updates.tags || newTags,
        mentioned_users: newMentionedUsers,
        is_active: updates.is_active !== undefined ? updates.is_active : existingNote.is_active,
        updated_at: new Date().toISOString()
      }

      const { data: updatedData, error: updateError } = await supabase
        .from('handover_notes')
        .update(updateData)
        .eq('id', noteId)
        .select(this.NOTE_SELECT_FIELDS)
        .single()

      if (updateError) {
        console.error('Database update error:', updateError)
        throw new Error('Failed to update handover note in database')
      }

      const updatedNote: HandoverNote = this.transformNoteData(updatedData)

      return updatedNote
    } catch (error) {
      console.error('Error updating handover note:', error)
      throw error
    }
  }

  async getNotesForUser(userId: string): Promise<HandoverNote[]> {
    try {
      // Get all notes where user is mentioned
      const allNotes = await this.getNotes()
      return allNotes.filter(note =>
        note.mentioned_users?.includes(userId) ||
        note.author.user_id === userId
      )
    } catch (error) {
      console.error('Error fetching notes for user:', error)
      return []
    }
  }

  async deleteNote(noteId: string): Promise<void> {
    try {
      const { error: deleteError } = await supabase
        .from('handover_notes')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)

      if (deleteError) {
        console.error('Database delete error:', deleteError)
        throw new Error('Failed to delete handover note')
      }
    } catch (error) {
      console.error('Error deleting handover note:', error)
      throw error
    }
  }

  async getNote(noteId: string): Promise<HandoverNote | null> {
    try {
      const { data: noteData, error: noteError } = await supabase
        .from('handover_notes')
        .select(this.NOTE_SELECT_FIELDS)
        .eq('id', noteId)
        .eq('is_active', true)
        .single()

      if (noteError) {
        if (noteError.code === 'PGRST116') {
          // No rows returned
          return null
        }
        console.error('Database query error:', noteError)
        throw new Error('Failed to fetch note from database')
      }

      if (!noteData) {
        return null
      }

      const note: HandoverNote = this.transformNoteData(noteData)

      return note
    } catch (error) {
      console.error('Error fetching single note:', error)
      return null
    }
  }

  async searchNotes(query: string): Promise<HandoverNote[]> {
    try {
      if (!query.trim()) {
        return this.getNotes()
      }

      const { data: notesData, error: notesError } = await supabase
        .from('handover_notes')
        .select(this.NOTE_SELECT_FIELDS)
        .eq('is_active', true)
        .or(`content.ilike.%${query}%,users.full_name.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      if (notesError) {
        console.error('Database search error:', notesError)
        throw new Error('Failed to search handover notes')
      }

      if (!notesData || notesData.length === 0) {
        return []
      }

      const notes: HandoverNote[] = notesData.map(note => this.transformNoteData(note))

      // Additional client-side filtering for tags (since PostgreSQL array search is complex)
      const lowerQuery = query.toLowerCase()
      return notes.filter(note =>
        note.content.toLowerCase().includes(lowerQuery) ||
        note.author.full_name.toLowerCase().includes(lowerQuery) ||
        note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
    } catch (error) {
      console.error('Error searching notes:', error)
      return []
    }
  }

  async getAvailableMentions(): Promise<UserMention[]> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(this.STUDENT_SELECT_FIELDS)
        .eq('is_active', true)
        .order('chinese_name')

      if (error) {
        console.error('Error fetching students for mentions:', error)
        return []
      }

      return data?.map(student => this.transformStudentToMention(student)) || []
    } catch (error) {
      console.error('Error fetching available mentions:', error)
      return []
    }
  }

  async searchUsersByName(query: string): Promise<UserMention[]> {
    if (!query || query.length < 1) return []

    try {
      const { data, error } = await supabase
        .from('students')
        .select(this.STUDENT_SELECT_FIELDS)
        .eq('is_active', true)
        .or(`chinese_name.ilike.%${query}%,english_name.ilike.%${query}%`)
        .limit(10)

      if (error) {
        console.error('Error searching students:', error)
        return []
      }

      return data?.map(student => this.transformStudentToMention(student)) || []
    } catch (error) {
      console.error('Error searching students:', error)
      return []
    }
  }

  clearMentionCache() {
    this.mentionCache.clear()
  }
}

export const handoverNotesService = new HandoverNotesService()
