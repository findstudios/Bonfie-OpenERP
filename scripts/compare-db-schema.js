import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config({ path: '.env.development' })

// 新資料庫連線
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// 從原始 schema 解析表結構
const originalSchema = `
-- 原始資料庫表列表（從你提供的 schema 中提取）
attendance, audit_logs, classrooms, contacts, conversions, course_packages, courses, 
enrollments, follow_ups, handover_notes, lead_tags, leads, migration_history, 
order_items, orders, payments, roles, schedules, security_events, sessions, 
student_contacts, student_notes_history, students, tags, trial_classes, 
tutoring_center_settings, users
`.trim()

const originalTables = originalSchema.split(',').map(t => t.trim()).filter(t => t)

async function compareSchemas() {
  console.log('🔍 開始比較資料庫結構...')
  console.log('='.repeat(60))
  
  try {
    // 獲取新資料庫的表列表
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')
    
    if (error) {
      // 如果 information_schema 無法訪問，嘗試直接查詢已知的表
      console.log('⚠️  無法訪問 information_schema，嘗試直接檢查表...')
      await checkTablesDirectly()
      return
    }
    
    const newTables = tables ? tables.map(t => t.table_name) : []
    
    console.log(`📊 原始資料庫: ${originalTables.length} 個表`)
    console.log(`📊 新資料庫: ${newTables.length} 個表`)
    console.log('='.repeat(60))
    
    // 找出差異
    const missingTables = originalTables.filter(t => !newTables.includes(t))
    const extraTables = newTables.filter(t => !originalTables.includes(t))
    
    if (missingTables.length > 0) {
      console.log('\n❌ 缺少的表 (需要創建):')
      missingTables.forEach(t => console.log(`   - ${t}`))
    }
    
    if (extraTables.length > 0) {
      console.log('\n➕ 額外的表 (新資料庫特有):')
      extraTables.forEach(t => console.log(`   - ${t}`))
    }
    
    if (missingTables.length === 0 && extraTables.length === 0) {
      console.log('\n✅ 表結構完全一致！')
    }
    
  } catch (err) {
    console.error('❌ 錯誤:', err.message)
    // 改用直接檢查
    await checkTablesDirectly()
  }
}

async function checkTablesDirectly() {
  console.log('\n📋 直接檢查重要表是否存在...\n')
  
  const criticalTables = [
    'roles',
    'users', 
    'students',
    'contacts',
    'courses',
    'enrollments',
    'schedules',
    'attendance',
    'orders',
    'classrooms',
    'tutoring_center_settings'
  ]
  
  const existingTables = []
  const missingTables = []
  
  for (const table of criticalTables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1)
    
    if (error && error.message.includes('not found')) {
      console.log(`❌ ${table}: 不存在`)
      missingTables.push(table)
    } else if (error) {
      console.log(`⚠️  ${table}: ${error.message}`)
    } else {
      console.log(`✅ ${table}: 存在`)
      existingTables.push(table)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 總結:')
  console.log(`   ✅ 已存在: ${existingTables.length} 個表`)
  console.log(`   ❌ 缺少: ${missingTables.length} 個表`)
  
  if (missingTables.length > 0) {
    console.log('\n🔧 需要創建的表:')
    generateMissingTablesSql(missingTables)
  }
}

function generateMissingTablesSql(missingTables) {
  console.log('\n-- 補充缺少的表 SQL:')
  console.log('-- 請在 Supabase SQL Editor 執行以下腳本\n')
  
  const tableDefinitions = {
    'audit_logs': `
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  action VARCHAR NOT NULL,
  table_name VARCHAR,
  record_id VARCHAR,
  old_values JSONB,
  new_values JSONB,
  old_amount NUMERIC,
  new_amount NUMERIC,
  old_status VARCHAR,
  new_status VARCHAR,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`,
    'conversions': `
CREATE TABLE IF NOT EXISTS public.conversions (
  id SERIAL PRIMARY KEY,
  conversion_id VARCHAR NOT NULL UNIQUE,
  lead_id VARCHAR NOT NULL,
  student_id VARCHAR NOT NULL,
  order_id VARCHAR,
  enrollment_date DATE NOT NULL,
  total_amount NUMERIC NOT NULL,
  conversion_days INTEGER,
  converted_by VARCHAR NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`,
    'follow_ups': `
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id SERIAL PRIMARY KEY,
  follow_up_id VARCHAR NOT NULL UNIQUE,
  lead_id VARCHAR NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('phone_call', 'message', 'email', 'visit', 'trial_class', 'meeting', 'other')),
  subject VARCHAR NOT NULL,
  content TEXT NOT NULL,
  result VARCHAR NOT NULL CHECK (result IN ('positive', 'neutral', 'negative', 'no_response', 'converted', 'lost')),
  next_follow_up DATE,
  created_by VARCHAR NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`,
    'handover_notes': `
CREATE TABLE IF NOT EXISTS public.handover_notes (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  author_id VARCHAR NOT NULL,
  priority VARCHAR DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
  tags TEXT[],
  mentioned_users TEXT[],
  read_by TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`,
    'lead_tags': `
CREATE TABLE IF NOT EXISTS public.lead_tags (
  lead_id VARCHAR NOT NULL,
  tag_id VARCHAR NOT NULL,
  PRIMARY KEY (lead_id, tag_id)
);`,
    'migration_history': `
CREATE TABLE IF NOT EXISTS public.migration_history (
  id SERIAL PRIMARY KEY,
  version VARCHAR NOT NULL,
  description TEXT,
  applied_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  applied_by VARCHAR
);`,
    'security_events': `
CREATE TABLE IF NOT EXISTS public.security_events (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR NOT NULL,
  severity VARCHAR NOT NULL,
  user_id VARCHAR,
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`,
    'sessions': `
CREATE TABLE IF NOT EXISTS public.sessions (
  id BIGSERIAL PRIMARY KEY,
  session_id VARCHAR NOT NULL UNIQUE,
  user_id VARCHAR NOT NULL,
  token_hash VARCHAR NOT NULL,
  csrf_token VARCHAR NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  last_activity_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`,
    'student_notes_history': `
CREATE TABLE IF NOT EXISTS public.student_notes_history (
  id BIGSERIAL PRIMARY KEY,
  student_id VARCHAR,
  note_content TEXT NOT NULL,
  note_type VARCHAR DEFAULT 'general',
  created_by VARCHAR,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`,
    'tags': `
CREATE TABLE IF NOT EXISTS public.tags (
  id SERIAL PRIMARY KEY,
  tag_id VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  color VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`,
    'trial_classes': `
CREATE TABLE IF NOT EXISTS public.trial_classes (
  id SERIAL PRIMARY KEY,
  trial_id VARCHAR NOT NULL UNIQUE,
  lead_id VARCHAR NOT NULL,
  course_id VARCHAR,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME WITHOUT TIME ZONE NOT NULL,
  teacher_id VARCHAR,
  classroom VARCHAR,
  status VARCHAR DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  attendance BOOLEAN,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  follow_up_notes TEXT,
  created_by VARCHAR NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`
  }
  
  missingTables.forEach(table => {
    if (tableDefinitions[table]) {
      console.log(tableDefinitions[table])
      console.log('')
    }
  })
  
  // 添加外鍵約束
  console.log('-- 添加外鍵約束（在所有表創建後執行）:')
  if (missingTables.includes('audit_logs')) {
    console.log('ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);')
  }
  if (missingTables.includes('conversions')) {
    console.log('ALTER TABLE public.conversions ADD CONSTRAINT conversions_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(lead_id);')
    console.log('ALTER TABLE public.conversions ADD CONSTRAINT conversions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(student_id);')
    console.log('ALTER TABLE public.conversions ADD CONSTRAINT conversions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id);')
    console.log('ALTER TABLE public.conversions ADD CONSTRAINT conversions_converted_by_fkey FOREIGN KEY (converted_by) REFERENCES public.users(user_id);')
  }
  // ... 其他外鍵約束
}

// 執行比較
compareSchemas().catch(console.error)