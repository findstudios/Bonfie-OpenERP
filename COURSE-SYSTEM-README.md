# 課程系統模組 README

## 模組概述

本模組實現了一個完整的教育機構課程管理系統，支援兩種課程類型：主題課程和常態課程。系統提供套餐管理、儲值管理、到期提醒等完整功能。

## 系統架構

### 課程類型

1. **主題課程 (Theme Courses)**
   - 短期特色課程
   - 固定堂數（通常 ≤ 16 堂）
   - 不支援套餐購買
   - 適合：暑期營隊、工作坊、特殊主題課程

2. **常態課程 (Regular Courses)**
   - 長期常規課程
   - 支援套餐制購買
   - 可設定多種價格方案
   - 適合：數學班、英文班、音樂課等常規課程

### 核心功能模組

#### 1. 課程管理 (`/courses`)
- **課程列表** (`CourseListView.vue`)
  - 顯示所有課程
  - 區分主題/常態課程
  - 快速搜尋和篩選
  
- **課程表單** (`CourseFormView.vue`)
  - 建立/編輯課程
  - 設定課程類別
  - 常態課程可啟用套餐功能

- **套餐管理** (`CoursePackageManagement.vue`)
  - 設定多種套餐方案
  - 堂數、價格、有效期配置
  - 啟用/停用套餐

#### 2. 訂單系統 (`/orders`)
- **訂單建立** (`OrderFormView.vue`)
  - 整合套餐選擇
  - 自動計算價格
  - 支援折扣設定

- **自動註冊建立**
  - 訂單確認後自動建立註冊記錄
  - 計算有效期限
  - 分配購買堂數

#### 3. 儲值管理 (`/credits`)
- **儲值儀表板** (`CreditManagementDashboard.vue`)
  - 即時統計資訊
  - 到期提醒列表
  - 快速延期功能

- **學生儲值狀態** (`StudentDetailView.vue`)
  - 主題/常態課程分開顯示
  - 剩餘堂數追蹤
  - 有效期限提醒

#### 4. 到期提醒系統
- **提醒小工具** (`ExpiryReminderWidget.vue`)
  - 顯示在頂部導航列
  - 即時通知數量
  - 快速查看到期項目

- **自動提醒邏輯**
  - 7 天內到期提醒
  - 今日到期警示
  - 可自訂提醒天數

## 資料庫結構

### 主要資料表

```sql
-- 課程表
courses:
  - course_id (PK)
  - course_name
  - course_category ('theme' | 'regular')
  - allow_package_purchase (boolean)
  - total_sessions
  - price_per_session
  - status

-- 課程套餐表
course_packages:
  - package_id (PK)
  - course_id (FK)
  - package_name
  - total_sessions
  - price
  - validity_days
  - is_active

-- 註冊表
enrollments:
  - enrollment_id (PK)
  - student_id (FK)
  - course_id (FK)
  - enrollment_category ('theme' | 'regular')
  - purchased_sessions
  - remaining_sessions
  - valid_until
  - status
```

## 使用指南

### 1. 設定課程

1. 進入「課程管理」
2. 點擊「新增課程」
3. 選擇課程類別：
   - 主題課程：短期特色課程
   - 常態課程：長期常規課程
4. 填寫課程資訊
5. 常態課程可勾選「允許套餐購買」

### 2. 管理套餐（常態課程）

1. 在課程列表點擊「套餐管理」
2. 新增套餐方案：
   - 套餐名稱（如：月卡、季卡、年卡）
   - 堂數
   - 價格
   - 有效天數
3. 可隨時啟用/停用套餐

### 3. 建立訂單

1. 進入「訂單管理」→「新增訂單」
2. 選擇學生
3. 選擇課程類型：
   - 主題課程：直接顯示總價
   - 常態課程：選擇套餐方案
4. 確認訂單後自動建立註冊記錄

### 4. 查看儲值狀態

- **學生詳情頁**：查看個別學生的所有儲值
- **儲值儀表板**：查看全校儲值概況
- **到期提醒**：點擊頂部鈴鐺圖示查看即將到期項目

## 服務層 API

### creditManagementService

```typescript
// 取得學生儲值狀態
getStudentCredits(studentId: string): Promise<{
  theme: Enrollment[]      // 主題課程
  regular: Enrollment[]    // 常態課程
  expired: Enrollment[]    // 已過期
}>

// 取得即將到期的註冊
getExpiringEnrollments(daysAhead: number): Promise<Enrollment[]>

// 計算到期狀態
getExpiryStatus(validUntil: string): {
  status: 'active' | 'expiring' | 'expired'
  remainingDays: number
  displayText: string
}
```

### coursePackageService

```typescript
// 取得課程套餐
getCoursePackages(courseId: string): Promise<CoursePackage[]>

// 建立套餐
createPackage(packageData: Partial<CoursePackage>): Promise<CoursePackage>

// 更新套餐
updatePackage(packageId: string, data: Partial<CoursePackage>): Promise<CoursePackage>

// 刪除套餐
deletePackage(packageId: string): Promise<void>
```

## 元件使用範例

### 顯示有效期狀態

```vue
<template>
  <ValidityDisplay :enrollment="enrollment" />
</template>

<script setup>
import ValidityDisplay from '@/components/courses/ValidityDisplay.vue'
</script>
```

### 使用到期提醒

```vue
<script setup>
import { useExpiryReminder } from '@/composables/useExpiryReminder'

const { expiringEnrollments, checkExpiringEnrollments } = useExpiryReminder()

// 檢查 7 天內到期的註冊
await checkExpiringEnrollments(7)
</script>
```

### 套餐選擇器

```vue
<template>
  <PackageSelector 
    :course-id="courseId"
    v-model="selectedPackageId"
    @change="handlePackageChange"
  />
</template>
```

## 資料遷移

如果您有現有系統需要遷移，請參考以下步驟：

### 方法一：使用遷移腳本

```bash
# 執行 Node.js 遷移腳本
node migrate-data.mjs
```

### 方法二：執行 SQL

```sql
-- 執行 migration-script.sql
-- 詳見 MIGRATION-GUIDE.md
```

## 系統設定

### 環境變數

```env
# Supabase 設定
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# 遷移用（可選）
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 權限設定

- **管理員 (ADMIN)**：完整存取權限
- **職員 (STAFF)**：除系統設定外的所有功能
- **教師 (TEACHER)**：僅能查看相關課程和學生資料

## 常見問題

### Q1: 如何區分主題課程和常態課程？

**A**: 系統會根據以下邏輯自動建議：
- 總堂數 ≤ 16：建議設為主題課程
- 總堂數 > 16：建議設為常態課程
- 您可以手動覆寫此設定

### Q2: 套餐價格如何計算？

**A**: 套餐價格計算公式：
- 單堂原價 = 課程單堂價格
- 套餐總價 = 自訂（通常有折扣）
- 每堂實際價格 = 套餐總價 ÷ 套餐堂數

### Q3: 有效期如何運作？

**A**: 有效期計算：
- 主題課程：通常為課程結束日
- 常態課程：從購買日起算，依套餐設定天數
- 可手動延期（需要權限）

### Q4: 如何處理退費？

**A**: 退費流程：
1. 取消訂單
2. 系統自動作廢相關註冊
3. 剩餘堂數不再計算

## 技術架構

### 前端技術
- Vue 3 (Composition API)
- TypeScript
- Tailwind CSS
- Pinia 狀態管理

### 後端服務
- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Real-time subscriptions

### 測試框架
- Vitest
- Vue Test Utils
- 測試覆蓋率 > 80%

## 開發指南

### 新增功能

1. 遵循 TDD 開發流程
2. 先寫測試，再寫實作
3. 保持程式碼覆蓋率

### 程式碼規範

```typescript
// 使用明確的型別定義
interface CoursePackage {
  package_id: string
  course_id: string
  package_name: string
  total_sessions: number
  price: number
  validity_days: number
  is_active: boolean
}

// 使用組合式 API
const { data, loading, error } = useCoursePackages(courseId)

// 錯誤處理
try {
  await coursePackageService.createPackage(data)
} catch (error) {
  console.error('建立套餐失敗:', error)
  // 顯示使用者友善的錯誤訊息
}
```

## 版本歷史

### v2.0.0 (2024-02)
- 新增課程分類系統
- 實作套餐購買功能
- 加入有效期管理
- 到期提醒系統
- 儲值管理儀表板

### v1.0.0 (2023)
- 基礎課程管理
- 訂單系統
- 學生管理

## 聯絡支援

如有問題或建議，請聯絡：
- 技術支援：[support@example.com]
- 文件更新：[docs@example.com]