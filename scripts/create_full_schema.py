#!/usr/bin/env python3
"""
合併 schema_final.sql (完整結構) 和 INIT_NEW_DATABASE.sql (初始資料)
建立一個包含所有功能但沒有歷史資料的乾淨資料庫
"""

def create_comprehensive_schema():
    # 讀取 schema_final.sql 取得完整結構
    with open('D:/Github-repo/Bonfie-OpenERP/schema_final.sql', 'r', encoding='utf-8') as f:
        schema_content = f.read()
    
    # 讀取 INIT_NEW_DATABASE.sql 取得初始資料部分
    with open('D:/Github-repo/Bonfie-OpenERP/supabase/migrations/INIT_NEW_DATABASE.sql', 'r', encoding='utf-8') as f:
        init_content = f.read()
    
    # 擷取初始資料部分 (從 PART 2 開始)
    init_data_start = init_content.find('-- PART 2: 初始資料')
    init_data_end = init_content.find('-- PART 3: Row Level Security')
    
    if init_data_start != -1 and init_data_end != -1:
        init_data = init_content[init_data_start:init_data_end]
    else:
        # 如果找不到標記，手動擷取 INSERT 語句
        init_lines = init_content.split('\n')
        init_data_lines = []
        for line in init_lines:
            if 'INSERT INTO public.roles' in line or \
               'INSERT INTO public.classrooms' in line or \
               'INSERT INTO public.tutoring_center_settings' in line:
                # 找到 INSERT 語句，收集到分號為止
                idx = init_lines.index(line)
                while idx < len(init_lines):
                    init_data_lines.append(init_lines[idx])
                    if ';' in init_lines[idx]:
                        break
                    idx += 1
        init_data = '\n'.join(init_data_lines)
    
    # 建立完整的 SQL 檔案
    comprehensive_sql = f"""-- ================================================
-- 完整資料庫架構 (Bonfie Art ERP)
-- 包含所有表結構、函數、觸發器、RLS政策和初始資料
-- 建立日期: {__import__('datetime').datetime.now().strftime('%Y-%m-%d')}
-- ================================================

-- =====================================
-- PART 1: 擴展和設定
-- =====================================
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- 確保必要的擴展存在
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- =====================================
-- PART 2: 完整表結構 (27個表)
-- =====================================

{schema_content}

-- =====================================
-- PART 3: 初始資料
-- =====================================

-- 插入角色
INSERT INTO public.roles (id, role_code, role_name, permissions, description, is_active)
VALUES 
  (1, 'ADMIN', '管理員', '{{"all": true}}', '系統管理員，擁有所有權限', true),
  (2, 'STAFF', '行政人員', '{{"students": true, "courses": true, "orders": true, "reports": true}}', '行政人員，管理日常營運', true),
  (3, 'TEACHER', '教師', '{{"attendance": true, "students": ["read"], "courses": ["read"]}}', '教師，管理課堂和出席', true)
ON CONFLICT (id) DO UPDATE SET
  permissions = EXCLUDED.permissions,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- 插入預設教室
INSERT INTO public.classrooms (classroom_id, classroom_name, capacity, is_active)
VALUES 
  ('ROOM001', '教室 A', 15, true),
  ('ROOM002', '教室 B', 12, true),
  ('ROOM003', '教室 C', 10, true),
  ('ROOM004', '教室 D', 8, true)
ON CONFLICT (classroom_id) DO NOTHING;

-- 插入系統設定
INSERT INTO public.tutoring_center_settings (setting_key, setting_value, description)
VALUES 
  ('business_info', '{{"name": "邦妃美術 Bonfie Art", "phone": "", "address": "", "email": "jamy@bonfieart.com"}}', '營業資訊'),
  ('receipt_settings', '{{"prefix": "RC", "show_logo": true, "footer_text": "感謝您的支持"}}', '收據設定'),
  ('system_config', '{{"timezone": "Asia/Taipei", "language": "zh-TW", "currency": "TWD"}}', '系統設定'),
  ('class_settings', '{{"default_duration": 90, "break_time": 10, "advance_booking_days": 30}}', '課程設定'),
  ('notification_settings', '{{"email_enabled": true, "sms_enabled": false, "reminder_hours": 24}}', '通知設定')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = CURRENT_TIMESTAMP;

-- =====================================
-- PART 4: 建立管理員帳號指引
-- =====================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===============================================';
  RAISE NOTICE '✅ 資料庫架構建立完成！';
  RAISE NOTICE '===============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 已建立的內容：';
  RAISE NOTICE '   - 27 個資料表（包含所有功能）';
  RAISE NOTICE '   - 函數和觸發器';
  RAISE NOTICE '   - RLS 安全政策';
  RAISE NOTICE '   - 效能優化索引';
  RAISE NOTICE '   - 初始資料（角色、教室、系統設定）';
  RAISE NOTICE '';
  RAISE NOTICE '📋 下一步：執行 create-admin-simple.sql 建立管理員帳號';
  RAISE NOTICE '';
  RAISE NOTICE '   Email: jamy@bonfieart.com';
  RAISE NOTICE '   Password: Jamy1206';
  RAISE NOTICE '';
  RAISE NOTICE '===============================================';
END $$;
"""
    
    # 寫入檔案
    output_path = 'D:/Github-repo/Bonfie-OpenERP/COMPLETE_SCHEMA.sql'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(comprehensive_sql)
    
    print(f"Comprehensive schema created: COMPLETE_SCHEMA.sql")
    print(f"This file includes:")
    print(f"  - All 27 tables from schema_final.sql")
    print(f"  - All functions, triggers, and indexes")
    print(f"  - Initial data (roles, classrooms, settings)")
    print(f"  - RLS policies")
    print(f"  - Ready for production use!")

if __name__ == '__main__':
    create_comprehensive_schema()