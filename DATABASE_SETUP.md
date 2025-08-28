# 資料庫設定指南 (Database Setup Guide)

本指南會幫助您設定全新的 Supabase 資料庫，用於補習班管理系統。

## 🔧 前置需求

1. 已建立 Supabase 專案
2. 已設定環境變數 (`.env.development`)
3. 已安裝專案相依套件 (`npm install`)

## 📋 設定步驟

### 步驟 1: 檢查資料庫連線

```bash
npm run test:db
```

這個指令會測試：
- 基本資料庫連線
- 資料表結構
- 權限設定

### 步驟 2: 執行資料庫遷移 (Migrations)

由於此專案使用 Supabase，您需要在 Supabase Dashboard 執行遷移檔案：

1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇您的專案
3. 前往 **SQL Editor**
4. 依序執行以下遷移檔案：

#### 2.1 基礎結構遷移
```sql
-- 執行: supabase/migrations/000_initial_schema.sql
-- 建立所有基礎資料表
```

#### 2.2 安全設定遷移
```sql
-- 執行: supabase/migrations/001_security_update.sql
-- 設定 Row Level Security (RLS) 政策
```

#### 2.3 認證系統設定
```sql
-- 執行: supabase/migrations/002_setup_supabase_auth.sql  
-- 設定 Supabase Auth 整合
```

### 步驟 3: 建立 Authentication 使用者

在 Supabase Dashboard 的 **Authentication > Users** 頁面建立以下使用者：

| Email | Password | Role | 描述 |
|-------|----------|------|------|
| `admin@tutoring-center.com` | `Admin123!` | 管理員 | 系統管理員帳號 |
| `staff1@tutoring-center.com` | `Staff123!` | 行政人員 | 行政管理帳號 |
| `teacher1@tutoring-center.com` | `Teacher123!` | 老師 | 教師帳號 |

**重要**: 建立使用者時，在 **User Metadata** 加入以下 JSON:

```json
{
  "role_id": 1,
  "full_name": "系統管理員"
}
```

根據角色調整 `role_id`:
- 管理員: `role_id: 1`
- 行政人員: `role_id: 2`  
- 老師: `role_id: 3`

### 步驟 4: 執行種子資料

```sql
-- 在 Supabase SQL Editor 執行: supabase/seed.sql
-- 建立初始資料（角色、設定等）
```

### 步驟 5: 驗證設定

```bash
npm run test:db
```

應該看到：
- ✅ 資料庫連線正常
- ✅ 各資料表有初始資料
- ✅ 認證系統正常運作

## 🔐 登入測試

完成設定後，可以使用以下帳號登入系統：

1. 啟動開發伺服器：
   ```bash
   npm run dev:development
   ```

2. 開啟瀏覽器訪問 `http://localhost:3003`

3. 使用建立的帳號登入

## 🐛 常見問題與解決方案

### 問題 1: "new row violates row-level security policy"
**原因**: RLS 政策阻止未認證使用者插入資料  
**解決**: 確保已完成步驟 3 (建立 Auth 使用者)

### 問題 2: 無法查詢資料表
**原因**: 資料表不存在或權限不足  
**解決**: 檢查遷移檔案是否正確執行

### 問題 3: 登入失敗
**原因**: Auth 使用者未正確建立  
**解決**: 在 Supabase Dashboard 檢查 Authentication > Users

### 問題 4: 空白的資料表
**原因**: 種子資料未執行  
**解決**: 手動執行 `supabase/seed.sql`

## 📝 資料庫結構概覽

### 核心資料表

1. **roles** - 使用者角色
2. **users** - 系統使用者
3. **students** - 學生資料
4. **contacts** - 聯絡人資料
5. **courses** - 課程資料
6. **classrooms** - 教室資料
7. **enrollments** - 報名紀錄
8. **schedules** - 課程時間表
9. **attendance** - 出勤紀錄
10. **orders** - 訂單資料
11. **payments** - 付款紀錄

### 權限架構

- **ADMIN**: 完整系統權限
- **STAFF**: 業務管理權限（學生、課程、訂單）
- **TEACHER**: 教學相關權限（出勤、成績）

## 🚀 下一步

完成資料庫設定後，您可以：

1. 建立課程和學生資料
2. 設定課程時間表
3. 開始使用出勤管理功能
4. 設定付款和訂單流程

## 🆘 需要協助？

如果遇到問題，請檢查：

1. Supabase 專案設定
2. 環境變數檔案 (`.env.development`)
3. 網路連線狀態
4. Supabase 服務狀態

或聯繫技術支援團隊。