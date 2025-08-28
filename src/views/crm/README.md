# CRM 客戶關係管理模組

## 概述

CRM（Customer Relationship Management）模組是專為補習班設計的客戶關係管理系統，用於管理潛在客戶、追蹤記錄、試聽課程安排等功能。本模組幫助補習班有效管理從潛在客戶到正式學員的完整轉換流程。

## 功能特色

### 1. 潛在客戶管理
- **新增潛在客戶**：記錄學生和聯絡人基本資料
  - 支援全年齡層（3-99歲）
  - 智慧聯絡人姓名同步（預設帶入學生姓名）
  - 多元化年級選項（從幼兒到樂齡）
- **客戶列表查看**：快速瀏覽所有潛在客戶
- **客戶狀態追蹤**：新客戶、已聯絡、有興趣、已安排試聽、已試聽、已轉換、流失
- **客戶來源分析**：路過詢問、朋友介紹、網路查詢、電話詢問、社群媒體、傳單廣告、活動推廣等

### 2. 追蹤記錄管理（原跟進記錄）
- **多種追蹤方式**：電話聯絡、簡訊/Line、電子郵件、到場參觀、試聽課程、面談等
- **追蹤結果記錄**：正面回應、中性回應、負面回應、未回應、已轉換、已流失
- **後續追蹤提醒**：設定下次追蹤日期

### 3. 試聽課程管理
- **智慧化試聽安排**
  - 選擇課程後自動載入可試聽時段
  - 自動帶入授課老師和教室資訊
  - 顯示未來兩週的可選時段
- **彈性安排模式**
  - 有課程：選擇既定時段
  - 無課程：自由設定日期時間
- **試聽狀態管理**：已安排、已完成、已取消、未出席
- **試聽評價系統**：滿意度評分（1-5分）、試聽回饋記錄

### 4. CRM 儀表板
- **關鍵指標展示**
  - 總潛在客戶數
  - 本月新增客戶
  - 轉換率統計
  - 試聽預約率和出席率
- **視覺化圖表**
  - 客戶來源分布
  - 客戶狀態分布
  - 月度轉換趨勢
- **快速操作入口**
  - 新增潛在客戶
  - 查看近期追蹤記錄
  - 管理試聽課程

### 5. 客戶轉換功能
- **一鍵轉換**：將潛在客戶轉換為正式學員
- **轉換數據追蹤**：記錄轉換天數、金額等資訊
- **轉換報表分析**：分析各來源的轉換效率

## 技術架構

### 前端組件結構
```
src/
├── views/crm/                    # CRM 頁面組件
│   ├── CRMDashboard.vue         # CRM 儀表板
│   ├── LeadListView.vue         # 潛在客戶列表
│   ├── LeadDetailView.vue       # 客戶詳情頁
│   ├── FollowUpListView.vue     # 追蹤記錄列表
│   └── TrialClassListView.vue   # 試聽課程列表
├── components/crm/               # CRM 相關組件
│   ├── CreateLeadModal.vue      # 新增潛在客戶彈窗
│   └── CreateTrialClassModal.vue # 安排試聽課程彈窗
├── services/                     # 服務層
│   └── crmService.ts            # CRM API 服務
└── types/                       # 類型定義
    └── crm.ts                   # CRM 相關類型
```

### 資料庫架構
```sql
-- 主要資料表
leads                 -- 潛在客戶表
follow_ups           -- 追蹤記錄表
trial_classes        -- 試聽課程表
conversions          -- 轉換記錄表

-- 關聯關係
leads (1) ─── (N) follow_ups        -- 一個客戶多次追蹤
leads (1) ─── (N) trial_classes     -- 一個客戶多次試聽
leads (1) ─── (1) conversions       -- 一個客戶一次轉換
trial_classes ─── courses           -- 試聽關聯課程
trial_classes ─── users (teacher)   -- 試聽關聯老師
```

## API 端點

### CRM 服務 (crmService.ts)

#### 潛在客戶相關
```typescript
// 獲取潛在客戶列表
getLeads(params: LeadSearchParams): Promise<Lead[]>

// 獲取單一潛在客戶
getLead(leadId: string): Promise<Lead>

// 創建潛在客戶
createLead(leadData: Partial<Lead>): Promise<Lead>

// 更新潛在客戶
updateLead(leadId: string, leadData: Partial<Lead>): Promise<Lead>

// 刪除潛在客戶
deleteLead(leadId: string): Promise<void>
```

#### 追蹤記錄相關
```typescript
// 獲取追蹤記錄
getFollowUps(params: FollowUpSearchParams): Promise<FollowUp[]>

// 創建追蹤記錄
createFollowUp(followUpData: Partial<FollowUp>): Promise<FollowUp>
```

#### 試聽課程相關
```typescript
// 獲取試聽課程列表
getTrialClasses(leadId?: string): Promise<TrialClass[]>

// 創建試聽課程
createTrialClass(trialData: Partial<TrialClass>): Promise<TrialClass>

// 更新試聽課程
updateTrialClass(trialId: string, trialData: Partial<TrialClass>): Promise<TrialClass>
```

#### 轉換相關
```typescript
// 轉換潛在客戶為學生
convertLeadToStudent(leadId: string, conversionInput: {
  student_id: string
  course_ids: string[]
  total_amount: number
  notes?: string
  converted_by: string
}): Promise<Conversion>
```

#### 統計數據
```typescript
// 獲取 CRM 統計數據
getCRMStats(): Promise<CRMStats>
```

## 開發狀況

### 已完成功能 ✅
1. **基礎架構**
   - CRM 模組路由配置
   - 資料表結構設計
   - TypeScript 類型定義
   - API 服務層實作

2. **潛在客戶管理**
   - 新增潛在客戶（含智慧聯絡人同步）
   - 客戶列表顯示
   - 客戶狀態管理
   - 搜尋和篩選功能

3. **試聽課程管理**
   - 試聽課程列表
   - 智慧化試聽安排
   - 課表時段自動載入
   - 狀態更新功能

4. **CRM 儀表板**
   - 統計數據展示
   - 圖表視覺化
   - 快速操作入口

5. **UI/UX 優化**
   - 響應式設計
   - 直覺的操作流程
   - 防呆機制設計

### 開發中功能 🚧
1. **追蹤記錄管理**
   - 追蹤記錄列表頁面（頁面已建立，功能待實作）
   - 新增追蹤記錄功能
   - 追蹤提醒系統

2. **客戶詳情頁**
   - 客戶完整資訊展示
   - 歷史記錄時間軸
   - 編輯客戶資料功能

### 待開發功能 📋
1. **進階功能**
   - 批量匯入潛在客戶
   - 自動化追蹤提醒
   - 客戶標籤系統
   - 進階搜尋過濾器

2. **報表分析**
   - 轉換漏斗分析
   - 來源效益分析
   - 試聽轉換率報表
   - 業務人員績效報表

3. **整合功能**
   - 與 LINE 整合自動發送訊息
   - Email 行銷整合
   - 簡訊發送功能

4. **行動裝置優化**
   - 行動版專屬介面
   - 離線資料同步
   - 推播通知功能

## 使用指南

### 權限設定
- **ADMIN**：完整存取所有 CRM 功能
- **STAFF**：可以查看和管理 CRM 資料
- **TEACHER**：無權限存取 CRM 模組

### 最佳實踐
1. **客戶資料管理**
   - 定期更新客戶狀態
   - 詳細記錄每次互動
   - 設定追蹤提醒避免遺漏

2. **試聽課程安排**
   - 優先選擇有既定課表的課程
   - 確認老師和教室的可用性
   - 試聽後立即記錄回饋

3. **數據分析**
   - 定期檢視轉換率趨勢
   - 分析各來源的效益
   - 根據數據調整招生策略

## 相關文件
- [資料庫設計文件](../../DATABASE-SETUP-GUIDE.md)
- [API 文件](../../services/README.md)
- [類型定義](../../types/crm.ts)

## 維護與支援
如有問題或需要新功能，請聯絡開發團隊或在 GitHub 上提出 Issue。

---
最後更新：2024-12-25