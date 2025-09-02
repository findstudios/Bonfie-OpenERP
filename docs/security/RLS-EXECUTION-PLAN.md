# 📋 RLS 完整執行計畫與風險評估

## 🎯 執行目標
1. 啟用所有表格的 RLS 保護
2. 清理重複和衝突的政策
3. 統一驗證方式
4. 確保系統正常運作

## 📊 現況分析

### 關鍵發現：
- **所有 30 個表格的 RLS 都未啟用** ❌
- **students 表有 12 筆資料**（唯一有資料的表）
- **127 個政策已定義但未生效**
- **混合驗證方式造成不一致**

### 風險等級分類：

| 風險等級 | 表格 | 資料量 | 政策狀況 | 問題 |
|---------|------|--------|----------|------|
| 🔴 **極高** | students | 12筆 | 3個政策，統一驗證 | RLS未啟用 |
| 🔴 **極高** | enrollments | 0筆 | 5個政策，混合驗證 | RLS未啟用 |
| 🔴 **極高** | attendance | 0筆 | 8個政策(過多)，混合驗證 | RLS未啟用 |
| 🔴 **極高** | courses | 0筆 | 7個政策(過多)，混合驗證 | RLS未啟用 |
| 🔴 **極高** | schedules | 0筆 | 6個政策(過多)，混合驗證 | RLS未啟用 |
| 🟠 **高** | users | 1筆 | 10個政策(嚴重過多)，混合驗證 | RLS未啟用 |
| 🟠 **高** | contacts | 0筆 | 5個政策，混合驗證 | RLS未啟用 |
| 🟠 **高** | orders | 0筆 | 4個政策，混合驗證 | RLS未啟用 |
| 🟠 **高** | payments | 0筆 | 6個政策(過多)，混合驗證 | RLS未啟用 |

## 🚀 分階段執行計畫

### 📅 第一階段：緊急修復（立即執行）
**目標：啟用 RLS 保護，防止資料外洩**

#### A. 測試環境驗證（5分鐘）
```sql
-- 1. 先在測試表驗證 RLS 功能
CREATE TABLE test_rls (id int, data text);
ALTER TABLE test_rls ENABLE ROW LEVEL SECURITY;
CREATE POLICY test_policy ON test_rls FOR ALL TO PUBLIC USING (false);
-- 測試是否阻擋存取
SELECT * FROM test_rls; -- 應該返回 0 筆
DROP TABLE test_rls;
```

#### B. 啟用核心業務表格 RLS（10分鐘）
```sql
-- 階段1A：學生管理模組（有資料，最重要）
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes_history ENABLE ROW LEVEL SECURITY;

-- 驗證：確認應用程式仍可正常存取學生資料
-- 如有問題，執行回滾：ALTER TABLE students DISABLE ROW LEVEL SECURITY;
```

#### C. 啟用教學管理表格（5分鐘）
```sql
-- 階段1B：課程教學模組
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_packages ENABLE ROW LEVEL SECURITY;
```

#### D. 啟用財務和系統表格（5分鐘）
```sql
-- 階段1C：財務模組
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 階段1D：系統權限
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
```

### 📅 第二階段：政策清理（今天完成）
**目標：移除重複政策，統一驗證方式**

#### A. 清理 users 表（最混亂）
```sql
-- users 表有 10 個政策，需要清理到 4 個
DROP POLICY IF EXISTS "Admin can manage users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- 保留這些統一的政策：
-- admin_manage_users (ALL for admins)
-- admin_view_all_users (SELECT for admins)
-- staff_view_active_users (SELECT for staff)
-- teacher_view_self (SELECT for teachers)
```

#### B. 清理 attendance 表（8個→3個）
```sql
DROP POLICY IF EXISTS "Staff can update attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers can mark attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers can view relevant attendance" ON attendance;
DROP POLICY IF EXISTS "teacher_manage_own_attendance" ON attendance;
DROP POLICY IF EXISTS "teacher_update_own_attendance" ON attendance;

-- 保留：
-- staff_manage_attendance
-- staff_view_all_attendance
-- teacher_view_own_attendance
```

### 📅 第三階段：驗證和優化（本週）
**目標：確保系統穩定，優化性能**

#### A. 功能測試清單
- [ ] 管理員登入並管理學生 ✓
- [ ] 行政人員新增/編輯學生 ✓
- [ ] 老師查看自己的學生 ✓
- [ ] 老師無法看到其他老師的學生 ✓
- [ ] 報表功能正常 ✓

#### B. 性能監控
```sql
-- 監控 RLS 對查詢性能的影響
EXPLAIN ANALYZE SELECT * FROM students;
EXPLAIN ANALYZE SELECT * FROM enrollments WHERE student_id = 'STU001';
```

## ⚠️ 風險與回滾方案

### 風險評估：
1. **風險**：啟用 RLS 後應用程式無法存取資料
   - **機率**：中（政策已存在）
   - **影響**：高（系統無法使用）
   - **緩解**：分階段啟用，每階段測試

2. **風險**：政策衝突導致權限錯誤
   - **機率**：高（有重複政策）
   - **影響**：中（部分功能異常）
   - **緩解**：先清理重複政策

### 回滾腳本：
```sql
-- 緊急回滾：關閉所有 RLS
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
```

## 📝 執行檢查清單

### 執行前：
- [ ] 備份資料庫
- [ ] 記錄當前應用程式版本
- [ ] 準備回滾腳本
- [ ] 通知相關人員維護時間

### 執行中：
- [ ] 第一階段A：測試環境驗證
- [ ] 第一階段B：啟用學生相關表格
- [ ] 測試：學生功能正常
- [ ] 第一階段C：啟用教學表格
- [ ] 測試：課程功能正常
- [ ] 第一階段D：啟用財務系統表格
- [ ] 測試：完整功能測試

### 執行後：
- [ ] 監控錯誤日誌 30 分鐘
- [ ] 確認所有角色可正常登入
- [ ] 驗證報表功能
- [ ] 記錄完成時間

## 🎯 建議執行順序

1. **立即（現在）**：
   - 執行第一階段 A+B（測試+學生表）
   - 驗證學生管理功能

2. **30分鐘後**：
   - 如果穩定，執行第一階段 C+D
   - 完整功能測試

3. **今天下班前**：
   - 執行第二階段政策清理
   - 移除重複政策

4. **明天**：
   - 監控系統運作
   - 處理任何問題

5. **本週內**：
   - 完成所有表格的 RLS 啟用
   - 性能優化