# Logger 實作文檔

## 概述
我們已經實作了一個簡單的 Logger 工具，在正式環境中會自動關閉所有 `console.log` 訊息。

## 實作檔案
1. **Logger 工具**: `/src/utils/logger.ts`
2. **已修改的檔案**:
   - `/src/stores/authSupabase.ts`
   - `/src/views/auth/LoginView.vue`
   - `/src/router/index.ts`

## 功能特點
- 在開發環境（`import.meta.env.DEV === true`）顯示所有 log
- 在正式環境（`import.meta.env.DEV === false`）隱藏 log、warn、info、debug
- 錯誤訊息（`error`）在所有環境都會顯示
- 支援前綴功能，方便識別訊息來源

## 使用方式
```typescript
import { createLogger } from '@/utils/logger'

const log = createLogger('ModuleName')

log.log('一般訊息')     // 開發環境顯示 [ModuleName] 一般訊息
log.warn('警告訊息')    // 開發環境顯示 [ModuleName] 警告訊息
log.error('錯誤訊息')   // 所有環境都顯示 [ModuleName] 錯誤訊息
```

## 測試方式

### 1. 開發環境測試
```bash
npm run dev
```
- 打開瀏覽器開發者工具的 Console
- 登入系統
- 應該看到各種 log 訊息：
  - `[AuthStore] 開始初始化 Supabase Auth`
  - `[AuthStore] 用戶資料載入成功: xxx`
  - `[Router] 路由切換: /login -> /dashboard`
  - 等等...

### 2. 正式環境測試
```bash
npm run build
npm run preview
```
- 打開瀏覽器開發者工具的 Console
- 登入系統
- **不應該**看到任何 log、warn、info、debug 訊息
- 只有錯誤訊息（如果有的話）會顯示

## 需要注意的地方
1. 敏感資訊（如 auth_user_id）不應該在任何環境中記錄
2. 如果需要在正式環境除錯，可以暫時使用 `console.error` 或修改 logger.ts
3. 未來可以考慮整合專業的 logging 服務（如 Sentry、LogRocket）

## 後續建議
1. 將其他模組的 console.log 也改為使用 logger
2. 考慮加入 log level 控制（DEBUG、INFO、WARN、ERROR）
3. 考慮將 log 送到後端記錄（用於正式環境除錯）