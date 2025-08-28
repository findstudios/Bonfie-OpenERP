// Supabase 資料庫類型定義
export interface Database {
  public: {
    Tables: {
      roles: {
        Row: {
          id: number
          role_code: string
          role_name: string
          permissions: Record<string, boolean>
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          role_code: string
          role_name: string
          permissions: Record<string, boolean>
          description?: string | null
          is_active?: boolean
        }
        Update: {
          role_code?: string
          role_name?: string
          permissions?: Record<string, boolean>
          description?: string | null
          is_active?: boolean
        }
      }
      users: {
        Row: {
          id: number
          user_id: string
          username: string
          password_hash: string
          full_name: string
          role_id: number
          phone: string | null
          email: string | null
          status: string
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          username: string
          password_hash: string
          full_name: string
          role_id: number
          phone?: string | null
          email?: string | null
          status?: string
          last_login_at?: string | null
        }
        Update: {
          user_id?: string
          username?: string
          password_hash?: string
          full_name?: string
          role_id?: number
          phone?: string | null
          email?: string | null
          status?: string
          last_login_at?: string | null
        }
      }
      contacts: {
        Row: {
          id: number
          contact_id: string
          full_name: string
          phone: string
          email: string | null
          address: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          contact_id: string
          full_name: string
          phone: string
          email?: string | null
          address?: string | null
          notes?: string | null
          is_active?: boolean
        }
        Update: {
          contact_id?: string
          full_name?: string
          phone?: string
          email?: string | null
          address?: string | null
          notes?: string | null
          is_active?: boolean
        }
      }
      students: {
        Row: {
          id: number
          student_id: string
          chinese_name: string
          english_name: string | null
          birth_date: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          student_id: string
          chinese_name: string
          english_name?: string | null
          birth_date?: string | null
          notes?: string | null
          is_active?: boolean
        }
        Update: {
          student_id?: string
          chinese_name?: string
          english_name?: string | null
          birth_date?: string | null
          notes?: string | null
          is_active?: boolean
        }
      }
      student_contacts: {
        Row: {
          id: number
          student_id: string
          contact_id: string
          relationship: string
          is_primary: boolean
          is_emergency: boolean
          is_billing: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          student_id: string
          contact_id: string
          relationship: string
          is_primary: boolean
          is_emergency: boolean
          is_billing: boolean
          notes?: string | null
        }
        Update: {
          student_id?: string
          contact_id?: string
          relationship?: string
          is_primary?: boolean
          is_emergency?: boolean
          is_billing?: boolean
          notes?: string | null
        }
      }
      courses: {
        Row: {
          id: number
          course_id: string
          course_name: string
          instructor_id: string
          course_type: string
          category: string
          total_sessions: number
          price_per_session: number
          max_students: number
          status: string
          schedule_pattern: Record<string, any>
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          course_id: string
          course_name: string
          instructor_id: string
          course_type: string
          category: string
          total_sessions: number
          price_per_session: number
          max_students: number
          status?: string
          schedule_pattern: Record<string, any>
          description?: string | null
        }
        Update: {
          course_id?: string
          course_name?: string
          instructor_id?: string
          course_type?: string
          category?: string
          total_sessions?: number
          price_per_session?: number
          max_students?: number
          status?: string
          schedule_pattern?: Record<string, any>
          description?: string | null
        }
      }
      enrollments: {
        Row: {
          id: number
          enrollment_id: string
          student_id: string
          course_id: string
          purchased_sessions: number
          remaining_sessions: number
          bonus_sessions: number
          status: string
          source: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          enrollment_id: string
          student_id: string
          course_id: string
          purchased_sessions: number
          remaining_sessions: number
          bonus_sessions?: number
          status?: string
          source?: string
          notes?: string | null
        }
        Update: {
          enrollment_id?: string
          student_id?: string
          course_id?: string
          purchased_sessions?: number
          remaining_sessions?: number
          bonus_sessions?: number
          status?: string
          source?: string
          notes?: string | null
        }
      }
      schedules: {
        Row: {
          id: number
          schedule_id: string
          course_id: string
          class_datetime: string
          end_datetime: string
          session_number: number
          classroom: string
          status: string
          is_makeup: boolean
          makeup_for_schedule_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          schedule_id: string
          course_id: string
          class_datetime: string
          end_datetime: string
          session_number: number
          classroom: string
          status?: string
          is_makeup?: boolean
          makeup_for_schedule_id?: string | null
          notes?: string | null
        }
        Update: {
          schedule_id?: string
          course_id?: string
          class_datetime?: string
          end_datetime?: string
          session_number?: number
          classroom?: string
          status?: string
          is_makeup?: boolean
          makeup_for_schedule_id?: string | null
          notes?: string | null
        }
      }
      attendance: {
        Row: {
          id: number
          schedule_id: string
          student_id: string
          enrollment_id: string
          status: string
          session_deducted: boolean
          teacher_notes: string | null
          marked_at: string | null
          marked_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          schedule_id: string
          student_id: string
          enrollment_id: string
          status: string
          session_deducted: boolean
          teacher_notes?: string | null
          marked_at?: string | null
          marked_by?: string | null
        }
        Update: {
          schedule_id?: string
          student_id?: string
          enrollment_id?: string
          status?: string
          session_deducted?: boolean
          teacher_notes?: string | null
          marked_at?: string | null
          marked_by?: string | null
        }
      }
      orders: {
        Row: {
          id: number
          order_id: string
          student_id: string
          contact_id: string
          item_type: string
          original_amount: number
          discount_amount: number
          final_amount: number
          status: string
          discount_reason: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          order_id: string
          student_id: string
          contact_id: string
          item_type: string
          original_amount: number
          discount_amount?: number
          final_amount: number
          status?: string
          discount_reason?: string | null
          created_by: string
        }
        Update: {
          order_id?: string
          student_id?: string
          contact_id?: string
          item_type?: string
          original_amount?: number
          discount_amount?: number
          final_amount?: number
          status?: string
          discount_reason?: string | null
          created_by?: string
        }
      }
      order_items: {
        Row: {
          id: number
          order_id: string
          item_type: string
          item_id: string
          item_name: string
          quantity: number
          unit_price: number
          total_price: number
          discount_amount: number
          final_price: number
          notes: string | null
        }
        Insert: {
          order_id: string
          item_type: string
          item_id: string
          item_name: string
          quantity: number
          unit_price: number
          total_price: number
          discount_amount?: number
          final_price: number
          notes?: string | null
        }
        Update: {
          order_id?: string
          item_type?: string
          item_id?: string
          item_name?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          discount_amount?: number
          final_price?: number
          notes?: string | null
        }
      }
      payments: {
        Row: {
          id: number
          payment_id: string
          order_id: string
          amount_paid: number
          payment_method: string
          payment_date: string
          receipt_number: string | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          payment_id: string
          order_id: string
          amount_paid: number
          payment_method: string
          payment_date: string
          receipt_number?: string | null
          notes?: string | null
          created_by: string
        }
        Update: {
          payment_id?: string
          order_id?: string
          amount_paid?: number
          payment_method?: string
          payment_date?: string
          receipt_number?: string | null
          notes?: string | null
          created_by?: string
        }
      }
      audit_logs: {
        Row: {
          id: number
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_values: Record<string, any> | null
          new_values: Record<string, any> | null
          old_amount: number | null
          new_amount: number | null
          old_status: string | null
          new_status: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_values?: Record<string, any> | null
          new_values?: Record<string, any> | null
          old_amount?: number | null
          new_amount?: number | null
          old_status?: string | null
          new_status?: string | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          user_id?: string
          action?: string
          table_name?: string
          record_id?: string
          old_values?: Record<string, any> | null
          new_values?: Record<string, any> | null
          old_amount?: number | null
          new_amount?: number | null
          old_status?: string | null
          new_status?: string | null
          ip_address?: string | null
          user_agent?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
