# 資料庫初始化指南 (Database Initialization Guide)

本專案使用 Supabase 作為後端資料庫。以下是完整的資料庫設定和測試工具。

## 🛠️ 可用工具 (Available Tools)

### 1. 資料庫連線測試
```bash
npm run test:db
```
測試項目：
- 基本資料庫連線
- 所有主要資料表查詢
- 認證系統狀態
- 顯示資料統計

### 2. Supabase 設定檢查
```bash
npm run check:supabase
```
功能：
- 識別本地/雲端環境
- 檢查連線狀態
- 提供設定建議
- 故障排除指引

### 3. 資料庫初始化 (僅適用於本地或特殊情況)
```bash
npm run init:db
```
注意：由於使用 RLS，此工具僅在特定情況下有效

## 📁 重要檔案

### 遷移檔案 (Migration Files)
- `supabase/migrations/000_initial_schema.sql` - 基礎資料表結構
- `supabase/migrations/099_initialize_essential_data.sql` - 初始資料（需在 Supabase SQL Editor 執行）
- `supabase/seed.sql` - 種子資料（本地環境用）

### 設定檔案
- `.env.development` - 開發環境變數
- `supabase/config.toml` - Supabase CLI 設定
- `src/services/supabase.ts` - Supabase 客戶端設定

### 文件檔案
- `DATABASE_SETUP.md` - 詳細設定指南
- `README_DATABASE.md` - 本檔案

## 🚀 快速開始

### 對於全新的 Supabase 專案：

1. **檢查環境設定**
   ```bash
   npm run check:supabase
   ```

2. **執行基礎設定** (在 Supabase Dashboard > SQL Editor)
   ```sql
   -- 執行 supabase/migrations/000_initial_schema.sql
   -- 執行 supabase/migrations/099_initialize_essential_data.sql
   ```

3. **建立 Authentication 使用者** (在 Supabase Dashboard > Authentication > Users)
   - Email: `admin@tutoring-center.com`
   - Password: `Admin123!`
   - User Metadata: `{"role_id": 1, "full_name": "系統管理員"}`

4. **驗證設定**
   ```bash
   npm run test:db
   ```

5. **啟動開發伺服器**
   ```bash
   npm run dev:development
   ```

## 🔧 資料庫結構

### 核心資料表
- **roles** - 使用者角色 (ADMIN, STAFF, TEACHER)
- **users** - 系統使用者
- **students** - 學生資料
- **contacts** - 聯絡人資料
- **courses** - 課程資料
- **classrooms** - 教室資料
- **enrollments** - 報名紀錄
- **schedules** - 課程時間表
- **attendance** - 出勤紀錄
- **orders** - 訂單資料
- **payments** - 付款紀錄

### 安全機制
- **Row Level Security (RLS)** - 資料表層級安全控制
- **Supabase Auth** - 使用者認證
- **角色權限** - 基於角色的存取控制

## 📊 預設資料

### 系統角色
1. **ADMIN** - 管理員 (完整權限)
2. **STAFF** - 行政人員 (業務管理)
3. **TEACHER** - 老師 (教學功能)

### 預設使用者帳號
| 使用者名稱 | 密碼 | 角色 | Email |
|------------|------|------|-------|
| admin | Admin123! | 管理員 | admin@tutoring-center.com |
| staff1 | Staff123! | 行政人員 | staff1@tutoring-center.com |
| teacher1 | Teacher123! | 老師 | teacher1@tutoring-center.com |

### 預設教室
- 101教室 (容量: 15人)
- 102教室 (容量: 20人)
- 小會議室 (容量: 8人)

## 🐛 故障排除

### 連線問題
```bash
npm run check:supabase  # 檢查設定和連線狀態
```

### 空白資料庫
1. 確認遷移檔案已執行
2. 檢查 RLS 政策設定
3. 驗證 Authentication 使用者

### 權限錯誤
1. 檢查使用者是否已登入
2. 確認使用者角色設定
3. 檢查 RLS 政策

### 開發環境重設
```bash
# 本地環境 (如果使用 Supabase CLI)
supabase db reset --seed

# 雲端環境
# 需要在 Supabase Dashboard 重新執行遷移檔案
```

## 📞 技術支援

如果遇到問題：
1. 先執行 `npm run check:supabase` 診斷
2. 檢查 `DATABASE_SETUP.md` 詳細指南
3. 查看 Supabase Dashboard 錯誤訊息
4. 聯繫開發團隊

---

**注意**: 此系統使用 Supabase 的 Row Level Security (RLS) 確保資料安全。所有資料存取都基於使用者認證和角色權限。