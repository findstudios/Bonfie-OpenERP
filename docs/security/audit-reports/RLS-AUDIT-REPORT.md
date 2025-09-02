# RLS (Row Level Security) 完整檢查報告
生成時間：2025-09-02

## 🔴 重大問題

### 1. **RLS 完全未啟用！**
所有 30 個表格的 RLS 都是 **❌ 未啟用** 狀態，這表示：
- RLS 政策雖然存在，但**完全沒有生效**
- 任何人都可以存取所有資料
- 這是一個**嚴重的安全漏洞**

### 2. **大量重複政策**
以下表格有重複的政策需要清理：

| 表格 | 操作 | 重複數量 | 政策名稱 |
|------|------|----------|----------|
| **attendance** | SELECT | 3個 | Teachers can view..., staff_view_all..., teacher_view_own... |
| **contacts** | SELECT | 3個 | Staff can view all..., staff_view_all..., teacher_view... |
| **courses** | SELECT | 3個 | All authenticated..., staff_view_all..., teacher_view_own... |
| **enrollments** | SELECT | 3個 | Staff can view all..., staff_view_all..., teacher_view_own... |
| **schedules** | SELECT | 3個 | All authenticated..., staff_view_all..., teacher_view_own... |
| **users** | ALL | 3個 | Admin can manage..., Admins can manage all..., admin_manage... |
| **users** | SELECT | **6個** | 過多重複政策 |

### 3. **混合驗證方式**
政策使用三種不同的驗證方式，造成不一致：
- 舊式：使用 `auth.uid()` 字串比對
- 新式：使用 `is_staff()`, `is_teacher()` 函數
- 混合：兩種方式都有

### 4. **函數問題**
RLS 函數使用 `current_user_id()` 而非 `auth.uid()`，可能導致驗證失敗。

## 📊 統計摘要

- **總表格數**：30 個
- **RLS 啟用**：0 個（0%）
- **RLS 未啟用**：30 個（100%）
- **總政策數**：127 個
- **重複政策**：約 40 個需要清理

## 🛠️ 立即修復方案

### 步驟 1：啟用所有表格的 RLS
```sql
-- 啟用所有表格的 RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ... 其他表格
```

### 步驟 2：清理重複政策
```sql
-- 移除舊的重複政策（以 attendance 為例）
DROP POLICY IF EXISTS "Teachers can view relevant attendance" ON attendance;
DROP POLICY IF EXISTS "Staff can update attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers can mark attendance" ON attendance;

-- 保留統一的新政策
-- staff_view_all_attendance
-- teacher_view_own_attendance
-- staff_manage_attendance
```

### 步驟 3：修正函數
```sql
-- 修正 current_user_id() 函數
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS varchar AS $$
BEGIN
    RETURN (
        SELECT user_id 
        FROM users 
        WHERE auth_user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🔒 安全建議

1. **立即行動**：
   - 馬上啟用所有表格的 RLS
   - 這是最緊急的安全問題

2. **政策清理**：
   - 移除所有重複的舊政策
   - 統一使用函數式驗證（is_staff(), is_teacher()）

3. **測試驗證**：
   - 啟用 RLS 後徹底測試所有功能
   - 確保不同角色的權限正確

4. **定期審查**：
   - 每月檢查 RLS 狀態
   - 監控政策變更

## 📋 詳細問題列表

### 需要啟用 RLS 的表格（全部 30 個）：
- api_keys, attendance, audit_logs, blocked_ips
- classrooms, contacts, conversions, course_packages
- courses, enrollment_extensions, enrollments
- follow_ups, handover_notes, lead_tags, leads
- order_items, orders, payments, rate_limit_tracking
- roles, schedules, security_alert_rules, security_events
- student_contacts, student_notes_history, students
- tags, trial_classes, tutoring_center_settings, users

### 政策數量統計：
- attendance: 9 個政策（建議保留 3 個）
- users: 10 個政策（建議保留 4 個）
- 其他表格：平均 3-4 個政策

## ⚠️ 風險評估

**當前風險等級：極高**
- 沒有 RLS 保護 = 所有資料都可被任意存取
- 必須立即修復

## 📝 執行優先級

1. **緊急（今天）**：啟用所有 RLS
2. **高（本週）**：清理重複政策
3. **中（本月）**：優化函數和政策邏輯
4. **低（季度）**：建立自動化監控