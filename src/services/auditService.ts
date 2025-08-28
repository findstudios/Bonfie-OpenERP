import { supabase } from './supabase'
import { useAuthStore } from '@/stores/authSupabase'

interface AuditLogData {
  action: string
  table_name?: string
  record_id?: string
  old_values?: any
  new_values?: any
  old_amount?: number
  new_amount?: number
  old_status?: string
  new_status?: string
}

export const auditService = {
  /**
   * Log an audit event
   */
  async log(data: AuditLogData) {
    try {
      const authStore = useAuthStore()
      const userId = authStore.currentUser?.id || authStore.currentUser?.user_id

      if (!userId) {
        console.warn('Cannot log audit event: No user ID available')
        return
      }

      // Get user's IP address (in production, this would come from the server)
      const ipAddress = '127.0.0.1' // Placeholder for local development

      // Get user agent
      const userAgent = navigator.userAgent

      const auditLog = {
        user_id: userId,
        action: data.action,
        table_name: data.table_name,
        record_id: data.record_id,
        old_values: data.old_values,
        new_values: data.new_values,
        old_amount: data.old_amount,
        new_amount: data.new_amount,
        old_status: data.old_status,
        new_status: data.new_status,
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('audit_logs')
        .insert(auditLog)

      if (error) {
        console.error('Failed to create audit log:', error)
      }
    } catch (error) {
      console.error('Audit logging error:', error)
    }
  },

  /**
   * Log login event
   */
  async logLogin() {
    await this.log({ action: 'login' })
  },

  /**
   * Log logout event
   */
  async logLogout() {
    await this.log({ action: 'logout' })
  },

  /**
   * Log CRUD operations
   */
  async logCreate(table: string, recordId: string, data: any) {
    await this.log({
      action: 'create',
      table_name: table,
      record_id: recordId,
      new_values: data
    })
  },

  async logUpdate(table: string, recordId: string, oldData: any, newData: any) {
    await this.log({
      action: 'update',
      table_name: table,
      record_id: recordId,
      old_values: oldData,
      new_values: newData
    })
  },

  async logDelete(table: string, recordId: string, data: any) {
    await this.log({
      action: 'delete',
      table_name: table,
      record_id: recordId,
      old_values: data
    })
  },

  async logView(table: string, recordId: string) {
    await this.log({
      action: 'view',
      table_name: table,
      record_id: recordId
    })
  },

  async logExport(table: string) {
    await this.log({
      action: 'export',
      table_name: table
    })
  }
}
