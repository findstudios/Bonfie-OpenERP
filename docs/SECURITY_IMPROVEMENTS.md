# 認證系統安全性改進說明

## 概述

本次更新徹底重建了認證系統，從使用硬編碼密碼和自定義認證改為使用 Supabase Auth 的標準實作，大幅提升了系統的安全性。

## 主要改進

### 1. 移除硬編碼密碼

**之前的問題：**
- 在 `auth.ts` 中使用硬編碼的密碼映射表
- 密碼以明文形式儲存在程式碼中
- 不安全的密碼驗證邏輯

```typescript
// 已移除的不安全程式碼
const validPasswordMap: { [key: string]: string[] } = {
  'admin': ['admin'],
  'staff': ['staff'],  
  'teacher1': ['teacher', 'teacher1'],
  'teacher2': ['teacher', 'teacher2']
}
```

**改進後：**
- 使用 Supabase Auth 進行身份驗證
- 密碼使用 bcrypt 加密儲存
- 支援標準的密碼重設流程

### 2. 實作標準 OAuth 2.0 認證流程

**新功能：**
- 使用 JWT tokens 進行安全的會話管理
- 自動 token 更新機制
- 安全的會話持久化

### 3. Row Level Security (RLS)

**實作內容：**
- 啟用資料表的 RLS 政策
- 用戶只能訪問自己的資料
- 管理員可以管理所有用戶
- 移除了 service_role key 的使用，改用 anon key + RLS

### 4. 密碼重設功能

**新增功能：**
- 安全的密碼重設郵件發送
- 具有時效性的重設 token
- 密碼強度要求（至少 6 個字元）

## 資料庫變更

### 新增欄位
- `users.auth_user_id` - 關聯到 Supabase Auth 用戶

### 新增觸發器
- `handle_new_user()` - 自動創建對應的 auth 用戶
- `handle_auth_user_signup()` - Auth 用戶註冊時創建應用用戶

### RLS 政策
- 用戶可查看自己的資料
- 用戶可更新自己的個人資料（除了角色）
- 管理員可查看和管理所有用戶

## 遷移指南

### 1. 執行資料庫遷移

```bash
# 在 Supabase Dashboard 中執行
supabase/migrations/20250125_secure_auth_system.sql
```

### 2. 更新環境變數

確保 `.env` 檔案中有正確的 Supabase 配置：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
# 不再需要 VITE_SUPABASE_SERVICE_KEY
```

### 3. 用戶密碼更新

所有現有用戶的密碼已設為 `Test123!`，用戶應在首次登入後立即更改密碼。

**測試帳號：**
- 管理員: `admin` / `Test123!`
- 職員: `staff` / `Test123!`
- 老師: `teacher1` 或 `teacher2` / `Test123!`

### 4. 密碼重設流程

1. 在登入頁面點擊「忘記密碼？」
2. 輸入註冊的 Email 地址
3. 檢查信箱中的重設連結
4. 點擊連結並設定新密碼

## 安全建議

### 1. 強制密碼政策

建議實施以下密碼要求：
- 最少 8 個字元
- 包含大小寫字母
- 包含數字
- 包含特殊字元

### 2. 定期密碼更新

- 強制用戶每 90 天更改密碼
- 防止重複使用最近 5 次的密碼

### 3. 多因素認證 (MFA)

考慮未來實作：
- SMS 驗證碼
- TOTP (Google Authenticator)
- 備用碼

### 4. 登入嘗試限制

- 連續 5 次失敗後鎖定帳號 15 分鐘
- 記錄所有登入嘗試

### 5. 安全審計

- 定期檢查 `audit_logs` 表
- 監控異常登入模式
- 設定安全警報

## API 變更

### 認證相關函數

```typescript
// 舊版 (已棄用)
await authStore.login(username, password)

// 新版 (支援 email 或 username)
await authStore.login(emailOrUsername, password)
```

### 權限檢查

```typescript
// 舊版 (同步)
permissions.checkPermission(['ADMIN'])

// 新版 (非同步)
await permissions.checkPermission(['ADMIN'])
```

## 故障排除

### 常見問題

1. **無法登入**
   - 確認使用新密碼 `Test123!`
   - 檢查用戶的 email 是否正確設定

2. **密碼重設郵件未收到**
   - 檢查垃圾郵件資料夾
   - 確認 Supabase 的郵件服務設定

3. **權限錯誤**
   - 確保資料庫遷移已執行
   - 檢查 RLS 政策是否正確啟用

## 總結

這次安全性升級大幅提升了系統的安全性，符合現代 Web 應用的安全標準。所有用戶資料現在都受到適當的保護，並且實作了完整的身份驗證和授權機制。

如有任何問題或需要協助，請聯繫系統管理員。