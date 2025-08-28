# 安全實踐指南

## 概述

本指南提供了 Vibe-OpenERP 系統的安全最佳實踐，包括輸入驗證、XSS/CSRF 防護、SQL 注入防護等重要安全措施。

## 輸入驗證架構

### 1. 前端驗證 (使用 Zod)

所有使用者輸入都必須經過驗證：

```typescript
import { contactSchema, validateWithSchema } from '@/utils/validation'

// 驗證聯絡人資料
const result = validateWithSchema(contactSchema, formData)
if (!result.success) {
  // 處理驗證錯誤
  console.error(result.errors)
}
```

### 2. 輸入清理

使用 sanitizers 清理所有使用者輸入：

```typescript
import { sanitizers } from '@/utils/validation'

// 清理 HTML 內容
const cleanContent = sanitizers.html.basic(userInput)

// 清理 Markdown
const cleanMarkdown = sanitizers.html.markdown(markdownContent)

// 清理搜尋查詢
const cleanQuery = sanitizers.data.search(searchInput)
```

## XSS 防護

### 1. 避免使用 v-html

盡量避免使用 `v-html`。如果必須使用，請確保內容已經過清理：

```vue
<template>
  <!-- 錯誤：直接使用未清理的內容 -->
  <div v-html="userContent"></div>
  
  <!-- 正確：使用清理後的內容 -->
  <div v-html="sanitizedContent"></div>
</template>

<script setup>
import { computed } from 'vue'
import { sanitizers } from '@/utils/validation'

const sanitizedContent = computed(() => {
  return sanitizers.html.rich(userContent.value)
})
</script>
```

### 2. 偵測 XSS 模式

在處理使用者輸入時主動偵測 XSS：

```typescript
if (sanitizers.security.detectXSS(userInput)) {
  throw new Error('偵測到潛在的 XSS 攻擊')
}
```

## SQL 注入防護

### 1. 使用參數化查詢

永遠使用 Supabase 的參數化查詢功能：

```typescript
// 錯誤：字串串接
const { data } = await supabase
  .from('students')
  .select('*')
  .filter('name', 'eq', userInput) // 可能有 SQL 注入風險

// 正確：使用參數化查詢
const { data } = await supabase
  .from('students')
  .select('*')
  .eq('name', userInput) // 安全
```

### 2. 驗證 ID 格式

所有 ID 參數都應該驗證格式：

```typescript
import { idSchema } from '@/utils/validation/schemas'

const validatedId = idSchema.parse(userId)
```

## CSRF 防護

### 1. 生成 CSRF Token

```typescript
import { middleware } from '@/utils/validation'

// 生成 token
const csrfToken = middleware.generateCSRFToken()

// 儲存到 cookie 和 session
document.cookie = `csrf_token=${csrfToken}; SameSite=Strict`
```

### 2. 驗證 CSRF Token

在所有狀態改變的請求中包含 CSRF token：

```typescript
const response = await fetch('/api/update', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(data)
})
```

## 使用 Edge Functions

### 1. 輸入驗證 API

使用部署的 `input-validation` Edge Function：

```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/input-validation`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'contact',
    data: contactData,
    action: 'save' // 可選：直接儲存到資料庫
  })
})
```

### 2. 安全監控 API

使用 `security-monitor` Edge Function 記錄可疑活動：

```typescript
// 這個函數會自動檢測並記錄安全事件
const response = await fetch(`${SUPABASE_URL}/functions/v1/security-monitor`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestData)
})
```

## 檔案上傳安全

### 1. 驗證檔案類型和大小

```typescript
import { fileUploadSchema } from '@/utils/validation/schemas'

const validatedFile = fileUploadSchema.parse({
  file: uploadedFile,
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
})
```

### 2. 清理檔案名稱

```typescript
const cleanFilename = sanitizers.data.filename(originalFilename)
```

## 安全的表單元件使用

### 使用 SecureContactForm

```vue
<template>
  <SecureContactForm
    :contact="contactData"
    :index="0"
    @update:contact="updateContact"
    @validation-change="handleValidationErrors"
  />
</template>

<script setup>
import SecureContactForm from '@/components/contacts/SecureContactForm.vue'

function handleValidationErrors(errors) {
  // 處理驗證錯誤
  console.log('Validation errors:', errors)
}
</script>
```

## Content Security Policy (CSP)

在應用程式中設定適當的 CSP：

```typescript
// 在 index.html 或伺服器配置中
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https: blob:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
">
```

## 錯誤處理

### 安全的錯誤訊息

不要洩漏敏感資訊：

```typescript
import { errorHandlers } from '@/utils/validation'

try {
  // 執行操作
} catch (error) {
  // 記錄完整錯誤（僅在伺服器端）
  errorHandlers.logError(error, { context: 'user_update' })
  
  // 返回安全的錯誤訊息給客戶端
  const clientError = errorHandlers.formatForClient(error)
  return clientError
}
```

## 監控和審計

### 1. 記錄安全事件

所有安全相關事件都會自動記錄到 `audit_logs` 表：

- SQL 注入嘗試
- XSS 嘗試
- CSRF 攻擊
- 速率限制超過
- 未授權存取

### 2. 定期檢查安全報告

```sql
-- 查看最近的安全事件
SELECT * FROM audit_logs 
WHERE action LIKE 'SECURITY_%' 
ORDER BY created_at DESC 
LIMIT 100;
```

## 最佳實踐清單

- [ ] 所有表單都使用 Zod schema 驗證
- [ ] 所有 v-html 使用都經過 DOMPurify 清理
- [ ] 所有 API 請求都包含 CSRF token
- [ ] 所有檔案上傳都驗證類型和大小
- [ ] 所有錯誤訊息都不洩漏敏感資訊
- [ ] 定期檢查 audit_logs 中的安全事件
- [ ] 使用 HTTPS 進行所有通訊
- [ ] 實施適當的 CSP 政策
- [ ] 定期更新依賴套件
- [ ] 進行安全性程式碼審查

## 緊急應變

如果偵測到安全事件：

1. 立即檢查 audit_logs 了解影響範圍
2. 暫時封鎖可疑 IP 位址
3. 檢查是否有資料外洩
4. 通知相關人員
5. 修補漏洞
6. 更新安全措施

## 持續改進

- 定期進行安全審計
- 更新安全依賴套件
- 培訓開發人員安全意識
- 實施自動化安全測試
- 監控新的安全威脅