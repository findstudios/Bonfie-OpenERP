import { supabase } from './supabase'
import type { Database } from '@/types/database'

type Course = Database['public']['Tables']['courses']['Row']

class CourseService {
  async getCourses() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          course_id,
          course_name,
          course_type,
          status,
          users!courses_instructor_id_fkey (
            full_name
          )
        `)
        .eq('status', 'active')

      if (error) throw error

      return data?.map(course => ({
        ...course,
        instructor_name: (course.users as any)?.full_name || '未指定'
      })) || []
    } catch (error) {
      console.error('Error fetching courses:', error)
      return []
    }
  }

  async getCourseById(courseId: string) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          users!courses_instructor_id_fkey (
            user_id,
            full_name
          )
        `)
        .eq('course_id', courseId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching course:', error)
      return null
    }
  }

  async createCourse(courseData: Partial<Course>) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating course:', error)
      throw error
    }
  }

  async updateCourse(courseId: string, courseData: Partial<Course>) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .update(courseData)
        .eq('course_id', courseId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating course:', error)
      throw error
    }
  }

  async deleteCourse(courseId: string) {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('course_id', courseId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting course:', error)
      throw error
    }
  }
}

export const courseService = new CourseService()
