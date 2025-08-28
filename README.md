# OpenERP管理系統
> 現代化企業資源規劃系統

基於 Vue 3 + TypeScript + Tailwind CSS 開發的全功能ERP管理平台，專為各類企業和機構的企業資源規劃設計。

## 🎯 專案概述

**OpenERP管理系統** 是一套完整的企業資源規劃解決方案，整合潛在客戶管理、跟進追蹤、轉換分析、聯絡人管理等核心ERP功能。系統採用現代化技術架構，提供直觀的使用者體驗與高度響應式設計。

### 核心特色
- 🚀 **現代化架構** - Vue 3 + TypeScript + Vite
- 🎨 **響應式設計** - 完美適配桌面/平板/手機
- 🔐 **多角色權限** - ADMIN/STAFF/TEACHER 權限管理
- 📊 **實時儀表板** - 營運數據一目了然
- 🔄 **即時同步** - Supabase 即時資料更新
- 🛡️ **資料安全** - Row Level Security 防護

## 📋 功能模組

### ✅ 已完成功能
- **身份認證系統** - 多角色登入、權限控制、操作日誌
- **學生管理** - 完整 CRUD、搜尋篩選、資料匯入匯出
- **課程管理** - 課程設定、分類管理、教師指派
- **排程系統** - 視覺化行事曆、智慧排課、衝突檢測
- **出席管理** - 點名系統、出席記錄、補課安排
- **訂單系統** - 付款處理、金流管理、收據生成
- **營運儀表板** - 實時統計、趨勢分析、快速概覽
- **CRM 系統** - 潛在客戶管理、跟進追蹤、轉換分析
- **聯絡人管理** - 多對多關係管理、家長資訊維護

### 🚧 開發中功能
- **報表系統** - 進階數據分析與視覺化
- **系統設定** - 帳號管理、權限配置
- **通知系統** - 簡訊/郵件自動化通知

## 🛠 技術架構

### 前端技術棧
```
Vue.js 3         - 現代化響應式框架
TypeScript       - 型別安全開發
Tailwind CSS     - 原子化樣式框架
Vite            - 高效能建置工具
Pinia           - 輕量化狀態管理
Vue Router      - 前端路由管理
```

### UI 元件
```
Headless UI     - 無障礙 UI 元件
Heroicons       - 精美的 SVG 圖標庫
```

### 後端服務
```
Supabase        - PostgreSQL + 即時 API
Row Level Security - 細粒度權限控制
Real-time API   - 即時資料同步
```

### 開發工具
```
Vitest          - 現代化測試框架
PostCSS         - CSS 後處理器
```

## 🚀 快速開始

### 環境需求
- Node.js 18+
- npm 或 yarn 套件管理工具

### 1. 專案設定
```bash
# 複製專案
git clone <repository-url>
cd vibe-openerp

# 安裝相依套件
npm install
```

### 2. 環境配置
建立 `.env` 檔案並設定 Supabase 連線資訊：
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_KEY=your_supabase_service_key
```

### 2.1 資料庫初始化
CRM 模組需要額外的資料表，請執行以下 SQL 腳本：
```sql
-- 執行 CRM 標籤表格建立腳本
crm-tags-tables-simple.sql
```

### 3. 啟動專案
```bash
# 開發模式
npm run dev

# 建置專案
npm run build

# 預覽建置結果
npm run preview

# 執行測試
npm run test
```

### 4. 訪問應用
開啟瀏覽器前往 `http://localhost:3000`

## 📁 專案結構

```
src/
├── assets/              # 靜態資源
│   └── css/            # 全域樣式
├── components/          # 可重用組件
│   ├── auth/           # 認證相關組件
│   ├── common/         # 通用組件 (Loading, Modal)
│   ├── contacts/       # 聯絡人管理組件
│   ├── layout/         # 佈局組件
│   ├── notes/          # 筆記系統組件
│   ├── transitions/    # 過渡動畫組件
│   └── ui/             # UI 基礎組件
├── composables/         # Vue 3 組合式函數
├── docs/               # 專案文檔
├── plugins/            # Vue 插件
├── router/             # 路由配置
├── services/           # API 服務層
├── stores/             # 狀態管理 (Pinia)
├── types/              # TypeScript 型別定義
├── utils/              # 工具函數
├── views/              # 頁面組件
│   ├── auth/           # 認證頁面
│   ├── students/       # 學生管理
│   ├── courses/        # 課程管理
│   ├── schedule/       # 排程管理
│   ├── attendance/     # 出席管理
│   ├── orders/         # 訂單管理
│   ├── contacts/       # 聯絡人管理
│   ├── crm/            # CRM 系統
│   ├── reports/        # 報表系統
│   └── settings/       # 系統設定
└── main.ts             # 應用程式進入點
```

## 🎯 CRM 系統特色

### 潛在客戶管理
- **智慧標籤分類** - 自定義標籤，快速分類客戶
- **跟進提醒系統** - 自動提醒跟進時間，不錯過任何商機
- **批量匯入** - CSV 檔案批量匯入，支援範本下載
- **進階搜尋** - 多條件組合搜尋，快速找到目標客戶

### 轉換追蹤
- **試聽管理** - 安排試聽課程，記錄反饋
- **轉換分析** - 追蹤從潛在客戶到正式學員的轉換率
- **來源分析** - 分析客戶來源，優化行銷策略

### 操作便利性
- **即時更新** - 團隊協作，資料即時同步
- **行動裝置優化** - 隨時隨地管理客戶
- **直覺化介面** - 簡潔明瞭的操作流程

## 🎨 設計規範

### 響應式設計斷點
```css
mobile:     320px - 767px   (手機)
tablet:     768px - 1199px  (平板)
desktop:    1200px+         (桌面)
```

### 色彩系統
```css
主色調:     #3b82f6 (藍色)
成功色:     #10b981 (綠色)  
警告色:     #f59e0b (黃色)
錯誤色:     #ef4444 (紅色)
中性色:     #6b7280 (灰色)
```

### 字體系統
```css
主字體:     Inter (英文) + Noto Sans TC (中文)
字重範圍:   400 (Regular) ~ 700 (Bold)
```

## 🔐 權限角色系統

### 角色定義
- **ADMIN** - 系統管理員，擁有完整系統權限
- **STAFF** - 櫃台人員，負責學生、課程、訂單管理
- **TEACHER** - 教師，專注於課程與出席管理

### 功能權限矩陣

| 功能模組     | ADMIN | STAFF | TEACHER |
|-------------|-------|-------|---------|  
| 儀表板       | ✅    | ✅    | ✅      |
| 學生管理     | ✅    | ✅    | ❌      |
| 課程管理     | ✅    | ✅    | 🔍      |
| 排程安排     | ✅    | ✅    | ✅      |
| 出席管理     | ✅    | ✅    | ✅      |
| 訂單管理     | ✅    | ✅    | ❌      |
| 聯絡人管理   | ✅    | ✅    | ❌      |
| CRM 系統     | ✅    | ✅    | ❌      |
| 報表統計     | ✅    | ✅    | ❌      |
| 系統設定     | ✅    | ❌    | ❌      |

*圖例: ✅ 完整權限 🔍 僅檢視權限 ❌ 無權限*

## 🗄️ 資料庫架構

### 核心資料表
```
users              - 使用者帳號與角色
students           - 學生基本資料
contacts           - 聯絡人資訊
student_contacts   - 學生-聯絡人關聯
courses            - 課程資料與設定
enrollments        - 學生報名記錄
schedules          - 課程排程安排
attendance         - 出席點名記錄  
orders             - 訂單與付款資訊
payments           - 付款交易記錄
audit_logs         - 系統操作日誌

# CRM 相關資料表
leads              - 潛在客戶資料
follow_ups         - 跟進記錄
trial_classes      - 試聽課程安排
conversions        - 轉換記錄
tags               - 標籤定義
lead_tags          - 客戶標籤關聯
```

## 🔒 安全特性

- **JWT Token 認證** - 無狀態身份驗證機制
- **Row Level Security** - 資料庫層級權限控制
- **RBAC 權限系統** - 基於角色的存取控制
- **操作日誌記錄** - 完整的審計軌跡
- **HTTPS 加密** - 端到端資料傳輸保護
- **XSS/CSRF 防護** - 前端安全防護機制

## 📈 效能優化

- **代碼分割** - 路由層級的延遲載入
- **虛擬滾動** - 處理大量資料列表
- **響應式圖片** - 自動尺寸與格式優化  
- **API 快取** - 智慧型資料快取策略
- **防抖處理** - 減少不必要的 API 請求

## 🧪 測試與品質

```bash
# 型別檢查
npm run build:check

# 單元測試
npm run test

# 測試覆蓋率
npm run test:run
```

## 🤝 開發貢獻

### 開發流程
1. Fork 專案並建立功能分支
2. 遵循 TypeScript 嚴格模式
3. 確保所有測試通過
4. 提交 Pull Request

### 程式碼規範
- 使用 TypeScript 嚴格模式
- 遵循 Vue 3 Composition API 最佳實務
- 採用語義化的 Git 提交訊息
- 確保響應式設計相容性

## 📄 授權條款

本專案採用 ISC 授權條款。詳見 [LICENSE](LICENSE) 檔案。

## 🎯 專案狀態

**目前版本:** v1.0.0  
**開發狀態:** 核心功能完成，持續優化中  
**整體完成度:** ~95%

### 近期更新
- ✅ 完成 CRM 系統實作（潛在客戶、跟進、轉換追蹤）
- ✅ 實現批量匯入功能與 CSV 範本下載
- ✅ 新增標籤系統與進階搜尋功能
- ✅ 優化響應式設計與行動裝置體驗
- 🚧 進行報表系統與數據分析開發

---

<div align="center">

**OpenERP管理系統** - 讓企業資源規劃更簡單、更高效

[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-green.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-cyan.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-orange.svg)](https://supabase.com/)

</div>