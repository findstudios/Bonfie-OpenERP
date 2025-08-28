/**
 * RLS 權限測試工具
 * 用於測試不同角色的資料存取權限
 */

import { supabase, db } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'

export interface RLSTestResult {
  table: string
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  role: string
  success: boolean
  error?: string
  data?: any
}

export class RLSTestRunner {
  private authStore = useAuthStore()
  private results: RLSTestResult[] = []

  /**
   * 執行完整的 RLS 測試
   */
  async runFullTest(): Promise<RLSTestResult[]> {
    console.log('開始 RLS 權限測試...')
    this.results = []

    const currentUser = this.authStore.user
    if (!currentUser) {
      console.error('用戶未登入')
      return []
    }

    const role = currentUser.role?.role_code || 'UNKNOWN'
    console.log(`當前用戶角色: ${role}`)

    // 測試不同表格的存取權限
    await this.testTable('students', role)
    await this.testTable('contacts', role)
    await this.testTable('courses', role)
    await this.testTable('orders', role)
    await this.testTable('payments', role)
    await this.testTable('audit_logs', role)
    await this.testTable('schedules', role)
    await this.testTable('attendance', role)

    // 輸出測試結果摘要
    this.printSummary()

    return this.results
  }

  /**
   * 測試單個表格的所有操作
   */
  private async testTable(table: string, role: string) {
    console.log(`\n測試表格: ${table}`)

    // 測試 SELECT
    await this.testSelect(table, role)

    // 測試 INSERT（只測試非關鍵表）
    if (!['audit_logs', 'payments', 'users'].includes(table)) {
      await this.testInsert(table, role)
    }

    // 測試 UPDATE（需要先有資料）
    // await this.testUpdate(table, role)

    // 測試 DELETE（需要謹慎）
    // await this.testDelete(table, role)
  }

  /**
   * 測試 SELECT 操作
   */
  private async testSelect(table: string, role: string) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (error) {
        this.addResult(table, 'SELECT', role, false, error.message)
      } else {
        this.addResult(table, 'SELECT', role, true, undefined, data)
        console.log(`✅ ${table} - SELECT 成功 (找到 ${data?.length || 0} 筆資料)`)
      }
    } catch (err) {
      this.addResult(table, 'SELECT', role, false, err.message)
      console.error(`❌ ${table} - SELECT 失敗:`, err.message)
    }
  }

  /**
   * 測試 INSERT 操作
   */
  private async testInsert(table: string, role: string) {
    // 根據表格準備測試資料
    const testData = this.getTestDataForTable(table)
    if (!testData) {
      console.log(`⏭️  ${table} - 跳過 INSERT 測試（無測試資料）`)
      return
    }

    try {
      const { data, error } = await supabase
        .from(table)
        .insert(testData)
        .select()

      if (error) {
        this.addResult(table, 'INSERT', role, false, error.message)
        console.log(`❌ ${table} - INSERT 失敗:`, error.message)
      } else {
        this.addResult(table, 'INSERT', role, true, undefined, data)
        console.log(`✅ ${table} - INSERT 成功`)

        // 清理測試資料
        if (data && data[0]?.id) {
          await supabase.from(table).delete().eq('id', data[0].id)
        }
      }
    } catch (err) {
      this.addResult(table, 'INSERT', role, false, err.message)
      console.error(`❌ ${table} - INSERT 失敗:`, err.message)
    }
  }

  /**
   * 獲取測試資料
   */
  private getTestDataForTable(table: string): any {
    const testDataMap: Record<string, any> = {
      students: {
        student_id: `TEST_S_${Date.now()}`,
        chinese_name: '測試學生',
        english_name: 'Test Student',
        is_active: true
      },
      contacts: {
        contact_id: `TEST_C_${Date.now()}`,
        full_name: '測試聯絡人',
        phone: '0912345678',
        is_active: true
      },
      courses: {
        course_id: `TEST_COURSE_${Date.now()}`,
        course_name: '測試課程',
        instructor_id: this.authStore.user?.user_id,
        total_sessions: 10,
        status: 'active'
      },
      schedules: {
        schedule_id: `TEST_SCH_${Date.now()}`,
        course_id: 'COURSE001', // 需要真實的課程ID
        class_datetime: new Date().toISOString(),
        end_datetime: new Date(Date.now() + 3600000).toISOString(),
        status: 'scheduled'
      }
    }

    return testDataMap[table]
  }

  /**
   * 添加測試結果
   */
  private addResult(
    table: string,
    operation: RLSTestResult['operation'],
    role: string,
    success: boolean,
    error?: string,
    data?: any
  ) {
    this.results.push({
      table,
      operation,
      role,
      success,
      error,
      data
    })
  }

  /**
   * 打印測試摘要
   */
  private printSummary() {
    console.log('\n========== RLS 測試摘要 ==========')
    console.log(`總測試數: ${this.results.length}`)
    console.log(`成功: ${this.results.filter(r => r.success).length}`)
    console.log(`失敗: ${this.results.filter(r => !r.success).length}`)

    // 按表格分組顯示結果
    const tableGroups = this.results.reduce((acc, result) => {
      if (!acc[result.table]) acc[result.table] = []
      acc[result.table].push(result)
      return acc
    }, {} as Record<string, RLSTestResult[]>)

    Object.entries(tableGroups).forEach(([table, results]) => {
      console.log(`\n${table}:`)
      results.forEach(r => {
        const status = r.success ? '✅' : '❌'
        console.log(`  ${status} ${r.operation}: ${r.success ? '成功' : r.error}`)
      })
    })
  }
}

/**
 * 快速測試當前用戶權限
 */
export async function quickRLSTest() {
  const tester = new RLSTestRunner()
  return await tester.runFullTest()
}

/**
 * 測試特定表格
 */
export async function testTableAccess(tableName: string) {
  try {
    console.log(`測試表格 ${tableName} 的存取權限...`)

    // 測試讀取
    const { data: readData, error: readError } = await supabase
      .from(tableName)
      .select('*')
      .limit(5)

    if (readError) {
      console.error(`❌ 讀取 ${tableName} 失敗:`, readError.message)
      return { read: false, error: readError.message }
    }

    console.log(`✅ 讀取 ${tableName} 成功，找到 ${readData?.length || 0} 筆資料`)
    return { read: true, count: readData?.length || 0 }
  } catch (err) {
    console.error(`測試 ${tableName} 時發生錯誤:`, err)
    return { read: false, error: err.message }
  }
}
