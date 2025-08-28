# UI Components Library

這個目錄包含了增強型智能UI組件，專為補習班管理系統設計，提供一致的用戶體驗和完整的可訪問性支援。

## 組件列表

### SmartButton 智能按鈕組件

功能豐富的智能按鈕組件，支援多種變體、尺寸和交互狀態。

#### 特性

- ✅ **多種變體**: primary, secondary, tertiary, danger, success, warning, ghost, outline
- ✅ **響應式尺寸**: xs, sm, md, lg, xl，支援響應式配置
- ✅ **圖標支援**: 左側、右側、僅圖標模式
- ✅ **載入狀態**: 內建載入動畫和禁用狀態
- ✅ **徽章顯示**: 支援數字和文字徽章
- ✅ **觸控友好**: 符合44px最小觸控目標標準
- ✅ **完整可訪問性**: WCAG 2.1 AA標準，支援屏幕閱讀器
- ✅ **主題適配**: 支援淺色、高對比度主題
- ✅ **動畫優化**: 支援減少動畫偏好設置

#### 基本使用

```vue
<template>
  <div>
    <!-- 基本按鈕 -->
    <SmartButton text="點擊我" @click="handleClick" />
    
    <!-- 帶圖標的按鈕 -->
    <SmartButton 
      text="添加項目" 
      :icon="PlusIcon" 
      variant="primary"
      @click="addItem" 
    />
    
    <!-- 載入狀態 -->
    <SmartButton 
      text="提交" 
      :loading="isSubmitting"
      type="submit"
      @click="submitForm" 
    />
    
    <!-- 僅圖標按鈕 -->
    <SmartButton 
      text="刪除" 
      :icon="TrashIcon" 
      icon-only
      variant="danger"
      aria-label="刪除選中項目"
      @click="deleteItem" 
    />
  </div>
</template>

<script setup>
import { SmartButton } from '@/components/ui'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'

const handleClick = () => {
  console.log('按鈕被點擊')
}
</script>
```

#### Props 屬性

| 屬性 | 類型 | 默認值 | 描述 |
|------|------|--------|------|
| `text` | `string` | - | 按鈕文字 |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | 按鈕類型 |
| `variant` | `'primary' \| 'secondary' \| 'tertiary' \| 'danger' \| 'success' \| 'warning' \| 'ghost' \| 'outline'` | `'primary'` | 按鈕變體 |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | 按鈕尺寸 |
| `icon` | `Component` | - | 圖標組件 |
| `iconPosition` | `'left' \| 'right'` | `'left'` | 圖標位置 |
| `iconOnly` | `boolean` | `false` | 是否僅顯示圖標 |
| `badge` | `string \| number` | - | 徽章內容 |
| `loading` | `boolean` | `false` | 是否載入中 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `fullWidth` | `boolean` | `false` | 是否全寬顯示 |
| `rounded` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` | `'md'` | 圓角大小 |
| `ariaLabel` | `string` | - | 可訪問性標籤 |
| `ariaDescribedBy` | `string` | - | 可訪問性描述 |
| `responsiveSize` | `object` | - | 響應式尺寸配置 |

#### Events 事件

| 事件 | 參數 | 描述 |
|------|------|------|
| `click` | `MouseEvent` | 按鈕點擊事件 |

#### 響應式配置

```vue
<SmartButton 
  text="響應式按鈕"
  :responsive-size="{
    mobile: 'sm',
    tablet: 'md', 
    desktop: 'lg'
  }"
/>
```

#### 可訪問性最佳實踐

1. **使用語義化的按鈕類型**
   ```vue
   <SmartButton text="提交表單" type="submit" />
   ```

2. **為僅圖標按鈕提供 aria-label**
   ```vue
   <SmartButton 
     :icon="TrashIcon" 
     icon-only 
     aria-label="刪除選中項目" 
   />
   ```

3. **使用 aria-describedby 提供額外描述**
   ```vue
   <SmartButton 
     text="刪除" 
     aria-describedby="delete-warning"
   />
   <p id="delete-warning">此操作無法撤銷</p>
   ```

#### 主題適配

組件自動適配當前主題，支援：

- **淺色主題** (`data-theme="light"`)
- **高對比度主題** (`data-theme="high-contrast"`)

#### 觸控優化

- 所有按鈕符合44px最小觸控目標標準
- 觸控設備上自動增加內邊距
- 支援觸控手勢和長按操作

#### 性能優化

- 使用CSS變數實現主題切換，避免重新渲染
- 載入狀態使用內建動畫，性能優異
- 支援減少動畫偏好設置

## 開發指南

### 添加新組件

1. 在 `src/components/ui/` 目錄下創建組件文件
2. 在 `types.ts` 中添加類型定義
3. 創建對應的測試文件 `__tests__/ComponentName.test.ts`
4. 創建 Storybook 故事 `ComponentName.stories.ts`
5. 在 `index.ts` 中導出組件

### 測試

```bash
# 運行所有UI組件測試
npm test -- ui

# 運行特定組件測試
npm test -- SmartButton

# 運行測試並生成覆蓋率報告
npm test -- --coverage
```

### Storybook

```bash
# 啟動 Storybook 開發服務器
npm run storybook

# 構建 Storybook 靜態文件
npm run build-storybook
```

## 設計原則

### 一致性
- 所有組件使用統一的設計Token系統
- 遵循相同的命名約定和API設計模式
- 保持視覺和交互的一致性

### 可訪問性
- 遵循WCAG 2.1 AA標準
- 支援鍵盤導航和屏幕閱讀器
- 提供適當的焦點指示和狀態反饋

### 響應式設計
- 移動優先的設計方法
- 支援多種設備和屏幕尺寸
- 觸控友好的交互設計

### 性能優化
- 最小化重新渲染
- 使用CSS變數實現主題切換
- 支援代碼分割和懶載入

### 可維護性
- 清晰的組件結構和文檔
- 完整的類型定義和測試覆蓋
- 模塊化的設計和易於擴展

## 貢獻指南

1. 遵循現有的代碼風格和約定
2. 為新功能添加完整的測試
3. 更新相關文檔和類型定義
4. 確保可訪問性和響應式設計
5. 提交前運行所有測試和檢查

## 許可證

本項目採用 MIT 許可證。