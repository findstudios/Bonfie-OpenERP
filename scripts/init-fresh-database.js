#!/usr/bin/env node

/**
 * 全新資料庫初始化腳本
 * 用於為新的 Supabase 資料庫創建基本結構和種子資料
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 載入環境變數
dotenv.config({ path: join(__dirname, '..', '.env.development') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🚀 開始初始化全新資料庫')
console.log('=' .repeat(50))

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境變數缺失！請檢查 .env.development 檔案')
  process.exit(1)
}

// 創建 Supabase 客戶端
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 初始化角色資料
const initialRoles = [
  {
    id: 1,
    role_code: 'ADMIN',
    role_name: '管理員',
    permissions: { all: true },
    is_active: true,
    description: '系統管理員，擁有所有權限'
  },
  {
    id: 2,
    role_code: 'STAFF',
    role_name: '行政人員',
    permissions: {
      contacts: true,
      students: true,
      courses: true,
      orders: true,
      enrollments: true,
      attendance: true,
      payments: true,
      leads: true,
      trial_classes: true
    },
    is_active: true,
    description: '行政人員，負責日常營運管理'
  },
  {
    id: 3,
    role_code: 'TEACHER',
    role_name: '老師',
    permissions: {
      courses: true,
      students: true,
      attendance: true,
      schedules: true
    },
    is_active: true,
    description: '授課老師，負責教學和出勤管理'
  }
]

// 初始化使用者資料
const initialUsers = [
  {
    user_id: 'USR001',
    username: 'admin',
    password_hash: '$2a$10$rGKqNsmjKrWk.xvEoSK5beBfUCnNkeAHrA.IWnqZbYyI8WGTT6sGu', // 預設密碼: admin123
    full_name: '系統管理員',
    role_id: 1,
    email: 'admin@tutoring-center.com',
    phone: '0912345678',
    status: 'active'
  },
  {
    user_id: 'USR002',
    username: 'staff1',
    password_hash: '$2a$10$rGKqNsmjKrWk.xvEoSK5beBfUCnNkeAHrA.IWnqZbYyI8WGTT6sGu', // 預設密碼: admin123
    full_name: '陳小美',
    role_id: 2,
    email: 'staff1@tutoring-center.com',
    phone: '0923456789',
    status: 'active'
  },
  {
    user_id: 'USR003',
    username: 'teacher1',
    password_hash: '$2a$10$rGKqNsmjKrWk.xvEoSK5beBfUCnNkeAHrA.IWnqZbYyI8WGTT6sGu', // 預設密碼: admin123
    full_name: '王老師',
    role_id: 3,
    email: 'teacher1@tutoring-center.com',
    phone: '0945678901',
    status: 'active'
  }
]

// 初始化教室資料
const initialClassrooms = [
  {
    classroom_id: 'ROOM001',
    classroom_name: '101教室',
    capacity: 15,
    is_active: true
  },
  {
    classroom_id: 'ROOM002',
    classroom_name: '102教室',
    capacity: 20,
    is_active: true
  },
  {
    classroom_id: 'ROOM003',
    classroom_name: '小會議室',
    capacity: 8,
    is_active: true
  }
]

// 系統設定資料
const initialSettings = [
  {
    setting_key: 'business_hours',
    setting_value: {
      monday: { open: '09:00', close: '21:00' },
      tuesday: { open: '09:00', close: '21:00' },
      wednesday: { open: '09:00', close: '21:00' },
      thursday: { open: '09:00', close: '21:00' },
      friday: { open: '09:00', close: '21:00' },
      saturday: { open: '09:00', close: '18:00' },
      sunday: { open: '13:00', close: '18:00' }
    },
    description: '補習班營業時間設定',
    updated_by: 'USR001'
  },
  {
    setting_key: 'payment_methods',
    setting_value: ['cash', 'transfer', 'credit_card', 'line_pay'],
    description: '支援的付款方式',
    updated_by: 'USR001'
  },
  {
    setting_key: 'session_duration',
    setting_value: { default: 90, min: 60, max: 120 },
    description: '課程時長設定（分鐘）',
    updated_by: 'USR001'
  },
  {
    setting_key: 'center_info',
    setting_value: {
      name: '學習教育中心',
      address: '台北市大安區復興南路100號',
      phone: '02-2345-6789',
      email: 'info@tutoring-center.com'
    },
    description: '補習班基本資訊',
    updated_by: 'USR001'
  }
]

async function initializeDatabase() {
  try {
    console.log('1. 初始化角色資料...')
    
    // 先檢查是否已有資料
    const { data: existingRoles, error: checkError } = await supabase
      .from('roles')
      .select('id')
    
    if (checkError) {
      console.error('❌ 無法檢查角色表狀態:', checkError.message)
      return false
    }

    if (existingRoles && existingRoles.length > 0) {
      console.log('⚠️  角色表已有資料，跳過初始化')
    } else {
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .insert(initialRoles)
        .select()

      if (rolesError) {
        console.error('❌ 角色資料初始化失敗:', rolesError.message)
        return false
      }
      console.log('✅ 成功創建', rolesData.length, '個角色')
    }

    console.log('2. 初始化使用者資料...')
    const { data: existingUsers } = await supabase
      .from('users')
      .select('user_id')
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('⚠️  使用者表已有資料，跳過初始化')
    } else {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .insert(initialUsers)
        .select()

      if (usersError) {
        console.error('❌ 使用者資料初始化失敗:', usersError.message)
        return false
      }
      console.log('✅ 成功創建', usersData.length, '個使用者帳號')
      console.log('📝 預設登入帳號密碼:')
      initialUsers.forEach(user => {
        console.log(`   - 使用者名稱: ${user.username} | 密碼: admin123`)
      })
    }

    console.log('3. 初始化教室資料...')
    const { data: existingClassrooms } = await supabase
      .from('classrooms')
      .select('classroom_id')
    
    if (existingClassrooms && existingClassrooms.length > 0) {
      console.log('⚠️  教室表已有資料，跳過初始化')
    } else {
      const { data: classroomsData, error: classroomsError } = await supabase
        .from('classrooms')
        .insert(initialClassrooms)
        .select()

      if (classroomsError) {
        console.error('❌ 教室資料初始化失敗:', classroomsError.message)
        return false
      }
      console.log('✅ 成功創建', classroomsData.length, '間教室')
    }

    console.log('4. 初始化系統設定...')
    const { data: existingSettings } = await supabase
      .from('tutoring_center_settings')
      .select('setting_key')
    
    if (existingSettings && existingSettings.length > 0) {
      console.log('⚠️  系統設定表已有資料，跳過初始化')
    } else {
      const { data: settingsData, error: settingsError } = await supabase
        .from('tutoring_center_settings')
        .insert(initialSettings)
        .select()

      if (settingsError) {
        console.error('❌ 系統設定初始化失敗:', settingsError.message)
        return false
      }
      console.log('✅ 成功創建', settingsData.length, '項系統設定')
    }

    return true

  } catch (error) {
    console.error('❌ 資料庫初始化過程中發生錯誤:', error)
    return false
  }
}

async function verifyInitialization() {
  console.log('\n🔍 驗證初始化結果...')
  
  try {
    // 驗證角色
    const { data: roles } = await supabase
      .from('roles')
      .select('role_code, role_name')
    console.log('角色數量:', roles?.length || 0)

    // 驗證使用者
    const { data: users } = await supabase
      .from('users')
      .select('username, full_name')
    console.log('使用者數量:', users?.length || 0)

    // 驗證教室
    const { data: classrooms } = await supabase
      .from('classrooms')
      .select('classroom_name')
    console.log('教室數量:', classrooms?.length || 0)

    // 驗證系統設定
    const { data: settings } = await supabase
      .from('tutoring_center_settings')
      .select('setting_key')
    console.log('系統設定數量:', settings?.length || 0)

    return true
    
  } catch (error) {
    console.error('❌ 驗證過程中發生錯誤:', error)
    return false
  }
}

// 主執行函數
async function main() {
  const initSuccess = await initializeDatabase()
  
  if (initSuccess) {
    const verifySuccess = await verifyInitialization()
    
    console.log('\n' + '='.repeat(50))
    if (verifySuccess) {
      console.log('🎉 資料庫初始化完成！')
      console.log('')
      console.log('📋 接下來的步驟:')
      console.log('1. 使用以下預設帳號登入系統:')
      console.log('   - 管理員: admin / admin123')
      console.log('   - 行政人員: staff1 / admin123')
      console.log('   - 老師: teacher1 / admin123')
      console.log('')
      console.log('2. 修改預設密碼')
      console.log('3. 建立課程和學生資料')
      console.log('4. 設定排課時間表')
      console.log('')
      console.log('🚀 執行 npm run dev:development 啟動開發伺服器')
    } else {
      console.log('❌ 初始化驗證失敗')
    }
  } else {
    console.log('💥 資料庫初始化失敗')
    process.exit(1)
  }
}

main()