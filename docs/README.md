# 📚 Bonfie OpenERP 文檔中心

## 快速導航

### 🏗️ 架構文檔
- [資料庫架構](./architecture/DATABASE.md) - 資料庫結構、關係、安全機制
- [技術棧說明](./architecture/TECH_STACK.md) - 使用的技術與框架
- [API 設計](./architecture/API.md) - API 架構與規範

### 💻 開發文檔
- [環境設定指南](./development/SETUP.md) - 開發環境設定步驟
- [測試指南](./development/TESTING.md) - 單元測試與整合測試
- [ESLint 設定](./development/eslint-setup.md) - 程式碼風格規範
- [Logger 實作](./development/logger.md) - 日誌系統說明

### 🎯 功能文檔
- [課程系統](./features/course-system.md) - 課程管理功能說明
- [出勤管理](./features/attendance.md) - 出勤記錄與管理
- [功能總覽](./features/FEATURES_OVERVIEW.md) - 系統功能完整列表

### 🔐 安全文檔
- [API 安全指南](./security/API_SECURITY_GUIDE.md) - API 安全最佳實踐
- [RLS 執行計畫](./security/RLS-EXECUTION-PLAN.md) - Row Level Security 實作
- [安全改進建議](./security/SECURITY_IMPROVEMENTS.md) - 安全性提升方案

#### 審計報告
- [安全審計報告](./security/audit-reports/SECURITY_AUDIT_REPORT.md)
- [RLS 審計報告](./security/audit-reports/RLS-AUDIT-REPORT.md)

### 🔄 遷移文檔
- [資料庫遷移需求](./migrations/DATABASE_MIGRATION_REQUIRED.md)

### 🔧 修復記錄
- [頭像上傳修復](./fixes/avatar-upload-fix.md)

## 文檔規範

### 命名規範
- 使用大寫字母和底線分隔 (SNAKE_CASE)
- 英文檔名，避免使用中文
- 描述性命名，清楚表達內容

### 目錄結構
```
docs/
├── README.md              # 文檔索引（本檔案）
├── architecture/          # 架構相關文檔
├── development/           # 開發指南與工具
├── features/              # 功能說明文檔
├── security/              # 安全相關文檔
│   └── audit-reports/     # 審計報告
├── migrations/            # 遷移記錄
└── fixes/                 # 問題修復記錄
```

### 文檔更新
- 新增功能時同步更新相關文檔
- 修改架構時更新架構文檔
- 發現安全問題時記錄在安全文檔

## 快速參考

### 開發流程
1. 查看 [環境設定指南](./development/SETUP.md)
2. 了解 [資料庫架構](./architecture/DATABASE.md)
3. 遵循 [TDD 開發原則](../CLAUDE.md)
4. 執行測試與檢查

### 常用指令
```bash
npm run dev:development  # 啟動開發伺服器
npm run test:db         # 測試資料庫連線
npm run build:check     # TypeScript 檢查與建置
npm run test            # 執行測試
```

## 聯絡與支援
如有問題請參考相關文檔或聯繫開發團隊。