# 訂單管理系統 (Order Management System)

## 系統概述

訂單管理系統是 Vibe-OpenERP 教育管理平台的核心模組之一，專為補習班設計，提供完整的訂單創建、管理、付款追蹤和收據產生功能。系統支援多項目訂單、彈性折扣機制、分期付款，並具備完整的審計追蹤功能。

## 功能特色

### 1. 訂單管理
- **訂單創建**：支援多項目訂單（課程報名、教材、活動）
- **訂單狀態**：待確認 → 已確認/已取消的清晰流程
- **折扣系統**：支援項目層級和訂單層級的雙重折扣
- **審計追蹤**：完整記錄創建者、修改時間等資訊

### 2. 付款管理
- **多次付款**：支援分期付款，可多次記錄付款
- **付款方式**：現金、轉帳、信用卡、LINE Pay
- **收據編號**：每筆付款可記錄收據編號
- **付款追蹤**：即時顯示已付/未付金額和付款比例

### 3. 搜尋與篩選
- **智慧搜尋**：訂單編號、學生姓名模糊搜尋
- **狀態篩選**：依訂單狀態快速篩選
- **日期篩選**：今日、本週、本月快速篩選
- **即時統計**：總訂單數、待處理數、今日營收

### 4. 收據與報表
- **PDF 收據**：自動產生 PDF 格式收據
- **瀏覽器列印**：PDF 失敗時的備用方案
- **營收統計**：每日營收自動計算（僅計算已確認訂單）

## 技術架構

### 資料庫結構

```sql
-- 訂單主表
orders
├── order_id (訂單編號: ORD + 日期 + 時間戳)
├── student_id (學生 ID)
├── contact_id (聯絡人 ID)
├── original_amount (原始金額)
├── discount_amount (折扣金額)
├── final_amount (最終金額)
└── status (狀態: pending/confirmed/cancelled)

-- 訂單項目表
order_items
├── order_id (關聯訂單)
├── item_type (類型: enrollment/material/activity)
├── quantity (數量)
├── unit_price (單價)
├── discount_amount (項目折扣)
└── final_price (項目最終價格)

-- 付款記錄表
payments
├── order_id (關聯訂單)
├── amount_paid (付款金額)
├── payment_method (付款方式)
├── payment_date (付款日期)
└── receipt_number (收據編號)
```

### 檔案結構

```
src/views/orders/
├── OrderListView.vue      # 訂單列表頁面
├── OrderDetailView.vue    # 訂單詳情頁面
├── OrderFormView.vue      # 訂單創建/編輯表單
└── README.md             # 本文件

src/services/
├── orderService.ts        # 訂單核心服務
├── orderFormService.ts    # 訂單表單服務
└── orderStatus.ts         # 訂單狀態管理

src/utils/
├── paymentCalculator.ts   # 付款計算工具
└── formatters.ts          # 格式化工具
```

## 使用指南

### 創建訂單

1. 點擊「新增訂單」按鈕
2. 搜尋並選擇學生
3. 新增訂單項目：
   - **課程報名**：選擇課程，自動帶入課程價格
   - **教材**：輸入教材名稱和價格
   - **活動**：輸入活動名稱和價格
4. 設定折扣（選填）
5. 確認訂單資訊後提交

### 管理訂單

1. **確認訂單**：將待確認訂單改為已確認狀態
2. **取消訂單**：取消訂單並可填寫取消原因
3. **記錄付款**：
   - 點擊「付款」按鈕
   - 選擇付款方式
   - 輸入付款金額
   - 填寫收據編號（選填）
4. **產生收據**：點擊「收據/發票」下載 PDF

### 搜尋訂單

- **快速搜尋**：在搜尋框輸入訂單編號或學生姓名
- **狀態篩選**：選擇特定狀態查看訂單
- **日期篩選**：使用快速篩選或自訂日期範圍

## API 介面

### 訂單服務 (orderService.ts)

```typescript
// 確認訂單
confirmOrder(orderId: string): Promise<Order>

// 取消訂單
cancelOrder(orderId: string, reason?: string): Promise<Order>

// 記錄付款
recordPayment(payment: PaymentData): Promise<Payment>

// 取得今日營收
getTodayRevenue(): Promise<number>

// 載入訂單列表
loadOrdersList(filters: OrderFilters): Promise<Order[]>
```

### 訂單表單服務 (orderFormService.ts)

```typescript
// 創建訂單
createOrder(orderData: OrderFormData): Promise<Order>

// 產生訂單編號
generateOrderNumber(): string

// 計算訂單金額
calculateOrderAmounts(items: OrderItem[]): OrderAmounts

// 驗證訂單表單
validateOrderForm(form: OrderForm): ValidationResult
```

## 權限控制

- **ADMIN**：完整權限，可創建、編輯、確認、取消所有訂單
- **STAFF**：完整權限，可創建、編輯、確認、取消所有訂單
- **TEACHER**：無權限存取訂單管理模組

## 注意事項

1. **訂單編號格式**：ORD + YYYYMMDD + 6位數字（如：ORD20250123123456）
2. **營收計算**：只計算狀態為「已確認」的訂單
3. **時區處理**：使用本地時間進行日期計算
4. **折扣邏輯**：先計算項目折扣，再套用訂單折扣
5. **付款追蹤**：支援部分付款，系統會追蹤未付餘額

## 最佳實踐

1. **定期確認訂單**：避免待確認訂單累積過多
2. **即時記錄付款**：收到款項後立即記錄，確保帳務準確
3. **填寫折扣原因**：提供折扣時務必填寫原因，便於後續審核
4. **收據編號管理**：建議使用統一的收據編號規則

## 錯誤處理

系統具備完善的錯誤處理機制：
- 網路錯誤自動提示重試
- 資料驗證失敗會顯示具體錯誤訊息
- PDF 產生失敗會自動切換到瀏覽器列印
- 所有錯誤都會記錄在控制台供技術人員除錯

## 未來規劃

- [ ] 批次訂單處理功能
- [ ] 訂單匯出功能（Excel/CSV）
- [ ] 自動催款提醒
- [ ] 訂單模板功能
- [ ] 發票串接整合