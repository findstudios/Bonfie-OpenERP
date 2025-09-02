# 開發環境設定指南 (Development Setup Guide)

## 📋 前置需求

- Node.js 18+ 
- npm 或 yarn
- Git
- Supabase 帳號

## 🚀 快速開始

### 1. 複製專案
```bash
git clone [repository-url]
cd Bonfie-OpenERP
```

### 2. 安裝相依套件
```bash
npm install
```

### 3. 環境變數設定
複製環境變數範本並填入您的 Supabase 資訊：
```bash
cp .env.example .env.development
```

編輯 `.env.development`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 資料庫初始化
請參考 [資料庫架構文檔](../architecture/DATABASE.md) 進行資料庫設定。

快速步驟：
1. 在 Supabase Dashboard SQL Editor 執行遷移檔案
2. 建立管理員帳號 (admin@tutoring-center.com)
3. 執行連線測試：`npm run test:db`

### 5. 啟動開發伺服器
```bash
npm run dev:development
```
瀏覽器開啟 `http://localhost:3000`

## 🛠️ 開發指令

### 開發模式
```bash
npm run dev:development  # 開發伺服器 (port 3000)
npm run dev             # 同上
```

### 建置
```bash
npm run build           # 生產環境建置
npm run build:check     # TypeScript 檢查 + 建置
npm run preview         # 預覽生產建置
```

### 測試
```bash
npm run test            # 執行測試 (watch mode)
npm run test:run        # 執行測試 (單次)
npm run test:db         # 測試資料庫連線
```

### 程式碼品質
```bash
npm run lint            # ESLint 檢查
npm run type-check      # TypeScript 類型檢查
```

### 資料庫工具
```bash
npm run check:supabase  # 檢查 Supabase 設定
npm run test:db         # 測試資料庫連線
```

## 📁 專案結構

```
src/
├── components/         # Vue 元件
│   ├── auth/          # 認證相關
│   ├── contacts/      # 聯絡人管理
│   ├── crm/           # CRM 系統
│   ├── layout/        # 版面配置
│   └── ui/            # UI 元件
├── views/             # 頁面元件
├── stores/            # Pinia 狀態管理
├── services/          # API 服務
├── composables/       # Vue 組合式函數
├── utils/             # 工具函數
├── types/             # TypeScript 類型定義
└── tokens/            # 設計系統 tokens
```

## 🔧 VS Code 設定

建議安裝的擴充套件：
- Vue - Official
- TypeScript Vue Plugin (Volar)
- Tailwind CSS IntelliSense
- ESLint
- Prettier

## 🐛 常見問題

### Port 3000 被佔用
修改 `vite.config.ts` 中的 port 設定，或結束佔用該 port 的程序。

### TypeScript 錯誤
執行 `npm run type-check` 檢查並修復類型錯誤。

### Supabase 連線失敗
1. 檢查環境變數設定
2. 執行 `npm run check:supabase` 診斷
3. 確認 Supabase 專案狀態

### 登入失敗
確認已在 Supabase Authentication 建立使用者，並包含正確的 metadata。

## 📚 相關文檔
- [資料庫架構](../architecture/DATABASE.md)
- [技術棧說明](../architecture/TECH_STACK.md)
- [測試指南](./TESTING.md)
- [ESLint 設定](./eslint-setup.md)