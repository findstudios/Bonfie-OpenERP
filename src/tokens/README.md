# 增強設計Token系統

這是一個完整的設計Token系統，提供了類型安全、響應式和語義化的設計Token管理。

## 🚀 功能特色

### ✅ 已實現的功能

- **擴展的CSS變數系統** - 完整的CSS自定義屬性支援
- **完整的顏色調色板** - 主色調、中性色、語義化顏色
- **響應式字體配置** - 移動端、平板端、桌面端自適應
- **語義化間距系統** - 組件、佈局、容器間距分類
- **多層次陰影系統** - 基礎、語義化、響應式陰影
- **響應式邊框半徑** - 適應不同螢幕尺寸的圓角設計
- **TypeScript類型定義** - 完全類型安全的Token系統
- **Token驗證系統** - 自動驗證Token值的正確性
- **主題支援** - 淺色、深色、高對比度主題
- **工具函數** - 便捷的Token訪問和操作方法

### ✨ 系統特色

- **完全類型安全** - TypeScript支援，提供完整的類型檢查
- **響應式設計** - 自動適應不同螢幕尺寸
- **語義化命名** - 直觀的Token命名規範
- **自動驗證** - 內建Token值驗證和錯誤檢測
- **CSS變數生成** - 自動生成CSS自定義屬性
- **多主題支援** - 支援多種視覺主題切換

## 📁 文件結構

```
src/tokens/
├── colors.ts          # 顏色Token定義
├── typography.ts      # 字體Token定義
├── spacing.ts         # 間距Token定義
├── shadows.ts         # 陰影Token定義
├── borderRadius.ts    # 邊框半徑Token定義
├── types.ts           # TypeScript類型定義
├── validation.ts      # Token驗證系統
├── index.ts           # 主要導出文件
├── example.vue        # 使用示例組件
├── verify.js          # 系統驗證腳本
└── README.md          # 說明文件
```

## 🎨 顏色系統

### 主色調
```typescript
import { PRIMARY_COLORS } from '@/tokens'

// 使用主色調
const primaryColor = PRIMARY_COLORS[500] // #3b82f6
```

### 語義化顏色
```typescript
import { SEMANTIC_COLORS } from '@/tokens'

// 使用語義化顏色
const successColor = SEMANTIC_COLORS.success[500] // #10b981
const warningColor = SEMANTIC_COLORS.warning[500] // #f59e0b
const errorColor = SEMANTIC_COLORS.error[500]     // #ef4444
const infoColor = SEMANTIC_COLORS.info[500]       // #0ea5e9
```

### 主題顏色
```typescript
import { getThemeColor } from '@/tokens'

// 獲取主題顏色
const bgColor = getThemeColor('light', 'background', 'primary')
const textColor = getThemeColor('dark', 'text', 'primary')
```

## 🔤 字體系統

### 響應式字體
```typescript
import { getResponsiveTypography } from '@/tokens'

// 獲取響應式字體配置
const mobileH1 = getResponsiveTypography('mobile', 'h1')
const desktopBody = getResponsiveTypography('desktop', 'body')
```

### CSS中使用
```css
.title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}

/* 響應式字體 */
@media (min-width: 768px) {
  .title {
    font-size: var(--font-size-3xl);
  }
}
```

## 📏 間距系統

### 語義化間距
```typescript
import { getResponsiveSpacing } from '@/tokens'

// 獲取響應式間距
const mobileSpacing = getResponsiveSpacing('mobile', 'component', 'md')
const desktopSpacing = getResponsiveSpacing('desktop', 'layout', 'lg')
```

### CSS中使用
```css
.component {
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

/* 響應式間距 */
.container {
  padding: var(--spacing-mobile);
}

@media (min-width: 768px) {
  .container {
    padding: var(--spacing-tablet);
  }
}
```

## 🌑 陰影系統

### 語義化陰影
```css
.card {
  box-shadow: var(--shadow-md);
}

.card:hover {
  box-shadow: var(--shadow-lg);
}

.button {
  box-shadow: var(--shadow-sm);
}

.button:active {
  box-shadow: var(--shadow-inner);
}
```

### 響應式陰影
```css
.card {
  box-shadow: var(--shadow-mobile);
}

@media (min-width: 768px) {
  .card {
    box-shadow: var(--shadow-tablet);
  }
}

@media (min-width: 1200px) {
  .card {
    box-shadow: var(--shadow-desktop);
  }
}
```

## 🔘 邊框半徑系統

### 語義化邊框半徑
```css
.button {
  border-radius: var(--border-radius-md);
}

.card {
  border-radius: var(--border-radius-lg);
}

.avatar {
  border-radius: var(--border-radius-full);
}
```

### 響應式邊框半徑
```css
.component {
  border-radius: var(--radius-mobile);
}

@media (min-width: 768px) {
  .component {
    border-radius: var(--radius-tablet);
  }
}

@media (min-width: 1200px) {
  .component {
    border-radius: var(--radius-desktop);
  }
}
```

## 🎭 主題系統

### 主題切換
```typescript
// 設置主題
document.documentElement.setAttribute('data-theme', 'dark')
```

### 主題顏色使用
```css
.component {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
}

/* 主題會自動切換這些顏色 */
```

## 🔧 工具函數

### 顏色工具
```typescript
import { TOKEN_UTILS } from '@/tokens'

// 檢查顏色是否為深色
const isDark = TOKEN_UTILS.colors.isDarkColor('#000000') // true

// 添加透明度
const transparentColor = TOKEN_UTILS.colors.withOpacity('#3b82f6', 0.5)
```

### 間距工具
```typescript
// rem轉像素
const pixels = TOKEN_UTILS.spacing.remToPx('1rem') // 16

// 像素轉rem
const rems = TOKEN_UTILS.spacing.pxToRem(16) // '1rem'
```

## ✅ Token驗證

### 驗證Token值
```typescript
import { validateTokens, validateColorToken } from '@/tokens'

// 驗證顏色Token
const isValidColor = validateColorToken('#3b82f6') // true

// 驗證整個Token對象
const result = validateTokens({
  colors: {
    primary: { 500: '#3b82f6' }
  }
})

if (!result.isValid) {
  console.log('驗證錯誤:', result.errors)
}
```

## 🚀 快速開始

### 1. 導入Token
```typescript
import { 
  DESIGN_TOKENS,
  getColor,
  getThemeColor,
  getResponsiveTypography,
  getResponsiveSpacing
} from '@/tokens'
```

### 2. 在Vue組件中使用
```vue
<template>
  <div class="my-component">
    <h1 class="title">標題</h1>
    <p class="content">內容</p>
  </div>
</template>

<style scoped>
.my-component {
  padding: var(--spacing-6);
  background-color: var(--color-bg-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
}

.title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-4);
}

.content {
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
}
</style>
```

### 3. 響應式設計
```css
/* 移動端優先 */
.component {
  padding: var(--spacing-mobile);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-mobile);
  box-shadow: var(--shadow-mobile);
}

/* 平板端 */
@media (min-width: 768px) {
  .component {
    padding: var(--spacing-tablet);
    font-size: var(--font-size-base);
    border-radius: var(--radius-tablet);
    box-shadow: var(--shadow-tablet);
  }
}

/* 桌面端 */
@media (min-width: 1200px) {
  .component {
    padding: var(--spacing-desktop);
    font-size: var(--font-size-lg);
    border-radius: var(--radius-desktop);
    box-shadow: var(--shadow-desktop);
  }
}
```

## 🧪 測試和驗證

### 運行驗證腳本
```bash
node src/tokens/verify.js
```

### TypeScript類型檢查
```bash
npx tsc --noEmit src/tokens/index.ts
```

## 📚 最佳實踐

### 1. 使用語義化Token
```css
/* ✅ 好的做法 */
.error-message {
  color: var(--color-error-500);
}

/* ❌ 避免直接使用顏色值 */
.error-message {
  color: #ef4444;
}
```

### 2. 響應式設計
```css
/* ✅ 使用響應式Token */
.component {
  padding: var(--spacing-mobile);
}

@media (min-width: 768px) {
  .component {
    padding: var(--spacing-tablet);
  }
}
```

### 3. 主題支援
```css
/* ✅ 使用主題顏色 */
.component {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
}
```

### 4. 類型安全
```typescript
// ✅ 使用TypeScript類型
import type { ColorValue, TypographyConfig } from '@/tokens'

const myColor: ColorValue = '#3b82f6'
const myTypography: TypographyConfig = {
  fontSize: '1rem',
  lineHeight: '1.5',
  fontWeight: 400,
  letterSpacing: '0em'
}
```

## 🔄 更新和維護

### 添加新的Token
1. 在相應的Token文件中添加新值
2. 更新TypeScript類型定義
3. 更新CSS變數
4. 運行驗證腳本確保正確性

### 修改現有Token
1. 更新Token值
2. 檢查影響範圍
3. 更新相關文檔
4. 運行測試確保兼容性

## 🤝 貢獻指南

1. 遵循現有的命名規範
2. 添加適當的TypeScript類型
3. 更新相關文檔
4. 運行驗證腳本
5. 提供使用示例

## 📄 許可證

此設計Token系統遵循項目的整體許可證。