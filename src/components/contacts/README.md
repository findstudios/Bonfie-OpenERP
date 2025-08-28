# 📞 聯絡人管理組件

這個模組提供完整的聯絡人管理功能，包含可重用的 Vue 組件和服務。

## 📦 組件結構

```
src/components/contacts/
├── README.md              # 📖 本文檔
├── ContactManager.vue     # 🎛️ 聯絡人管理主組件
├── ContactForm.vue        # 📝 單個聯絡人表單組件  
├── ContactList.vue        # 📋 聯絡人列表顯示組件
└── types.ts              # 📄 聯絡人相關類型定義
```

```
src/services/
└── contactService.ts      # 🛠️ 聯絡人 API 服務 (已完成)
```

## 🎯 功能特色

### ✨ 智能聯絡人更新系統
- 🔍 **差異比較**: 自動比較現有聯絡人與新資料的差異
- ➕ **智能新增**: 只新增真正新的聯絡人
- ✏️ **精確更新**: 只更新有變化的聯絡人欄位
- 🗑️ **安全刪除**: 刪除不再使用的聯絡人關係，但保留可能被其他學生使用的聯絡人資料

### 🛡️ 資料完整性保護
- ✅ **表單驗證**: 必填欄位檢查、格式驗證
- 🎯 **業務規則**: 確保每個學生只有一個主要聯絡人
- 📝 **版本控制**: 自動追蹤資料變更版本
- 🔒 **併發控制**: 防止多人同時編輯衝突

### 🎨 使用者體驗
- ⚡ **即時更新**: 變更立即反映到介面
- 🔄 **批量操作**: 支援一次更新多個聯絡人
- 📱 **響應式設計**: 適配桌面和行動裝置
- 🎭 **錯誤處理**: 友善的錯誤提示和回饋

## 🚀 快速開始

### 基本用法

```vue
<template>
  <ContactManager 
    :student-id="studentId"
    :initial-contacts="contacts"
    @contacts-updated="handleContactsUpdate"
    @validation-error="handleValidationError"
  />
</template>

<script setup>
import ContactManager from '@/components/contacts/ContactManager.vue'

const studentId = 'S0001'
const contacts = ref([])

function handleContactsUpdate(updatedContacts) {
  contacts.value = updatedContacts
  console.log('聯絡人已更新:', updatedContacts)
}

function handleValidationError(errors) {
  console.error('驗證錯誤:', errors)
}
</script>
```

### 直接使用服務

```typescript
import { contactService } from '@/services/contactService'

// 獲取學生聯絡人
const contacts = await contactService.getStudentContacts('S0001')

// 更新學生聯絡人
const result = await contactService.updateStudentContacts('S0001', contacts, 'U0001')
console.log(`新增: ${result.added}, 更新: ${result.updated}, 刪除: ${result.deleted}`)

// 驗證聯絡人資料
const errors = contactService.validateStudentContacts(contacts)
if (errors.length > 0) {
  console.error('驗證失敗:', errors)
}
```

## 📝 組件 API

### ContactManager.vue

#### Props
| 參數 | 類型 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| `studentId` | `string` | ✅ | - | 學生 ID |
| `initialContacts` | `ContactFormData[]` | ❌ | `[]` | 初始聯絡人資料 |
| `readonly` | `boolean` | ❌ | `false` | 是否為唯讀模式 |
| `maxContacts` | `number` | ❌ | `10` | 最大聯絡人數量 |

#### Events
| 事件名 | 參數 | 說明 |
|--------|------|------|
| `contacts-updated` | `ContactFormData[]` | 聯絡人資料更新時觸發 |
| `validation-error` | `string[]` | 驗證失敗時觸發 |
| `save-success` | `ContactUpdateResult` | 儲存成功時觸發 |
| `save-error` | `Error` | 儲存失敗時觸發 |

### ContactForm.vue

#### Props
| 參數 | 類型 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| `contact` | `ContactFormData` | ✅ | - | 聯絡人資料 |
| `index` | `number` | ✅ | - | 聯絡人序號 |
| `readonly` | `boolean` | ❌ | `false` | 是否為唯讀模式 |

#### Events
| 事件名 | 參數 | 說明 |
|--------|------|------|
| `update:contact` | `ContactFormData` | 聯絡人資料變更時觸發 |
| `remove` | - | 請求移除此聯絡人時觸發 |

### ContactList.vue

#### Props
| 參數 | 類型 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| `contacts` | `ContactFormData[]` | ✅ | - | 聯絡人資料陣列 |
| `readonly` | `boolean` | ❌ | `false` | 是否為唯讀模式 |

## 🔧 服務 API

### contactService

```typescript
// 獲取學生聯絡人
getStudentContacts(studentId: string): Promise<ContactFormData[]>

// 智能更新學生聯絡人
updateStudentContacts(
  studentId: string, 
  newContacts: ContactFormData[], 
  userId?: string
): Promise<ContactUpdateResult>

// 驗證單個聯絡人
validateContact(contact: ContactFormData): string[]

// 驗證學生聯絡人設定
validateStudentContacts(contacts: ContactFormData[]): string[]
```

## 📄 資料類型

### ContactFormData
```typescript
interface ContactFormData {
  contact_id?: string           // 聯絡人 ID (新增時為空)
  full_name: string            // 聯絡人姓名 *必填
  phone: string                // 聯絡人電話 *必填  
  email?: string               // 電子郵件 (可選)
  address?: string             // 地址 (可選)
  relationship: '父親' | '母親' | '監護人' | '本人'  // 關係
  is_primary: boolean          // 是否為主要聯絡人
  is_emergency: boolean        // 是否為緊急聯絡人
  is_billing: boolean          // 是否為帳務聯絡人
  notes?: string               // 備註 (可選)
  student_contact_id?: number  // 學生聯絡人關係 ID (內部使用)
}
```

### ContactUpdateResult
```typescript
interface ContactUpdateResult {
  added: number      // 新增的聯絡人數量
  updated: number    // 更新的聯絡人數量  
  deleted: number    // 刪除的聯絡人數量
  errors: string[]   // 錯誤訊息陣列
}
```

## 🎨 樣式指南

### CSS 類別命名規則
```css
.contact-manager        /* 主容器 */
.contact-form          /* 聯絡人表單 */
.contact-list          /* 聯絡人列表 */
.contact-item          /* 單個聯絡人項目 */
.contact-field         /* 聯絡人欄位 */
.contact-actions       /* 操作按鈕區域 */
.contact-validation    /* 驗證錯誤樣式 */
```

### 主題色彩
```css
:root {
  --contact-primary: #3b82f6;     /* 主色調 */
  --contact-success: #10b981;     /* 成功色 */
  --contact-warning: #f59e0b;     /* 警告色 */
  --contact-error: #ef4444;       /* 錯誤色 */
  --contact-border: #e5e7eb;      /* 邊框色 */
}
```

## 📋 使用案例

### 1. 學生編輯頁面
```vue
<!-- StudentFormView.vue -->
<ContactManager 
  :student-id="route.params.id"
  :initial-contacts="form.contacts"
  @contacts-updated="form.contacts = $event"
/>
```

### 2. 聯絡人專門編輯頁面
```vue
<!-- ContactEditView.vue -->
<ContactManager 
  :student-id="studentId"
  :max-contacts="20"
  @save-success="showSuccessMessage"
  @save-error="showErrorMessage"
/>
```

### 3. 唯讀顯示模式
```vue
<!-- StudentDetailView.vue -->
<ContactList 
  :contacts="student.contacts"
  :readonly="true"
/>
```

## ⚠️ 重要注意事項

### 🔒 資料安全
- 所有更新操作都會記錄 `last_modified_by` 欄位
- 刪除聯絡人時會檢查是否被其他學生使用
- 支援資料版本控制，防止併發編輯衝突

### 📏 驗證規則
- 姓名和電話為必填欄位
- 每個學生必須有且只有一個主要聯絡人
- 電話格式會進行基本驗證
- Email 格式會進行正規表達式驗證

### 🎭 錯誤處理
- 所有 API 調用都包含完整的錯誤處理
- 驗證錯誤會以陣列形式回傳，方便批量顯示
- 操作結果會詳細記錄成功和失敗的項目數量

## 🔄 版本歷史

### v1.0.0 (目前版本)
- ✅ 基礎聯絡人管理功能
- ✅ 智能差異比較更新系統
- ✅ 完整的表單驗證
- ✅ 可重用的 Vue 組件
- ✅ 完整的 TypeScript 支援

### 🚧 規劃中功能
- 📱 行動版優化介面
- 🔍 聯絡人搜尋和篩選
- 📊 聯絡人統計和報表
- 🎨 自訂主題支援
- 📤 聯絡人批量匯入/匯出

## 🤝 開發指南

### 加入新功能
1. 在 `contactService.ts` 中加入服務邏輯
2. 在組件中實作對應的 UI
3. 更新 `types.ts` 中的型別定義
4. 更新本 README.md 文檔
5. 撰寫單元測試

### 測試建議
```typescript
// 測試智能更新功能
describe('ContactService', () => {
  it('應該正確識別需要新增的聯絡人', async () => {
    // 測試邏輯...
  })
  
  it('應該正確識別需要更新的聯絡人', async () => {
    // 測試邏輯...
  })
})
```

---

**💡 提示**: 使用這個組件前，請確保你的專案已經設定好 Supabase 資料庫和相關的觸發器。如果有任何問題，請查看 `src/services/contactService.ts` 中的詳細實作。