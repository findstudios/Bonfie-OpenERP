# 響應式設計 Token 系統

## 概述

本文件說明補習班管理系統的響應式設計 Token 系統，提供統一的設計參數和使用指南。

## 設計 Token

### 斷點 (Breakpoints)

```css
/* CSS 變數 */
--breakpoint-mobile: 767px;     /* 行動裝置上限 */
--breakpoint-tablet: 768px;     /* 平板裝置起點 */
--breakpoint-desktop: 1200px;   /* 桌面裝置起點 */
```

```javascript
// Tailwind 斷點
screens: {
  'mobile': {'max': '767px'},           // 行動裝置
  'tablet': {'min': '768px', 'max': '1199px'}, // 平板裝置
  'desktop': {'min': '1200px'},         // 桌面裝置
}
```

### 間距 Token (Spacing)

```css
/* 基礎間距 */
--spacing-xs: 0.25rem;    /* 4px */
--spacing-sm: 0.5rem;     /* 8px */
--spacing-md: 1rem;       /* 16px */
--spacing-lg: 1.5rem;     /* 24px */
--spacing-xl: 2rem;       /* 32px */
--spacing-2xl: 3rem;      /* 48px */

/* 響應式間距 */
--spacing-mobile: var(--spacing-sm);    /* 8px */
--spacing-tablet: var(--spacing-md);    /* 16px */
--spacing-desktop: var(--spacing-lg);   /* 24px */
```

### 字體大小 Token (Typography)

```css
/* 基礎字體大小 */
--text-xs: 0.75rem;       /* 12px */
--text-sm: 0.875rem;      /* 14px */
--text-base: 1rem;        /* 16px */
--text-lg: 1.125rem;      /* 18px */
--text-xl: 1.25rem;       /* 20px */
--text-2xl: 1.5rem;       /* 24px */

/* 響應式字體大小 */
--text-mobile-base: var(--text-sm);     /* 14px */
--text-tablet-base: var(--text-base);   /* 16px */
--text-desktop-base: var(--text-base);  /* 16px */
```

### 邊框半徑 Token (Border Radius)

```css
/* 基礎邊框半徑 */
--radius-sm: 0.25rem;     /* 4px */
--radius-md: 0.5rem;      /* 8px */
--radius-lg: 0.75rem;     /* 12px */
--radius-xl: 1rem;        /* 16px */

/* 響應式邊框半徑 */
--radius-mobile: var(--radius-sm);      /* 4px */
--radius-tablet: var(--radius-md);      /* 8px */
--radius-desktop: var(--radius-lg);     /* 12px */
```

### 陰影 Token (Shadows)

```css
/* 基礎陰影 */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

/* 響應式陰影 */
--shadow-mobile: var(--shadow-sm);
--shadow-tablet: var(--shadow-md);
--shadow-desktop: var(--shadow-lg);
```

### 佈局 Token (Layout)

```css
/* 側邊欄 */
--sidebar-width-expanded: 16rem;    /* 256px */
--sidebar-width-collapsed: 4rem;    /* 64px */

/* 標題列 */
--header-height-mobile: 3.5rem;     /* 56px */

/* 觸控目標 */
--touch-target-min: 2.75rem;        /* 44px */
```

### 過渡時間 Token (Transitions)

```css
--transition-fast: 150ms;
--transition-normal: 250ms;
--transition-slow: 350ms;
```

### Z-index Token

```css
--z-sidebar: 40;
--z-overlay: 30;
--z-header: 50;
--z-dropdown: 60;
--z-modal: 70;
--z-toast: 80;
```

## 使用方式

### 1. CSS 變數使用

```css
.my-component {
  padding: var(--spacing-mobile);
  border-radius: var(--radius-mobile);
  box-shadow: var(--shadow-mobile);
}

@media (min-width: 768px) {
  .my-component {
    padding: var(--spacing-tablet);
    border-radius: var(--radius-tablet);
    box-shadow: var(--shadow-tablet);
  }
}
```

### 2. Tailwind 工具類別

```html
<!-- 響應式按鈕 -->
<button class="btn-responsive btn-primary">
  按鈕文字
</button>

<!-- 響應式輸入框 -->
<input class="input-responsive" type="text" placeholder="輸入文字">

<!-- 響應式卡片 -->
<div class="card-responsive">
  卡片內容
</div>

<!-- 響應式網格 -->
<div class="grid-responsive-cards">
  <div>項目 1</div>
  <div>項目 2</div>
  <div>項目 3</div>
</div>
```

### 3. 響應式顯示工具類別

```html
<!-- 只在行動裝置顯示 -->
<div class="mobile-only">
  行動版內容
</div>

<!-- 只在平板顯示 -->
<div class="tablet-only">
  平板版內容
</div>

<!-- 只在桌面顯示 -->
<div class="desktop-only">
  桌面版內容
</div>

<!-- 在行動裝置隱藏 -->
<div class="mobile-hidden">
  非行動版內容
</div>
```

### 4. 觸控優化

```html
<!-- 觸控友善按鈕 -->
<button class="touch-friendly btn-primary">
  觸控按鈕
</button>

<!-- 最小觸控目標 -->
<a href="#" class="touch-target">
  連結
</a>
```

## 最佳實踐

### 1. 間距使用

- 使用響應式間距 Token 確保一致性
- 行動裝置使用較小間距節省空間
- 桌面裝置使用較大間距改善視覺層次

### 2. 字體大小

- 行動裝置使用較小字體適應螢幕
- 確保最小字體大小符合可訪問性標準
- 使用相對單位 (rem) 支援用戶縮放

### 3. 觸控目標

- 所有互動元素最小尺寸 44px × 44px
- 使用 `touch-target` 或 `touch-friendly` 類別
- 在觸控裝置上增加內邊距

### 4. 視覺層次

- 使用響應式陰影建立深度感
- 行動裝置使用較淺陰影
- 桌面裝置使用較深陰影增強層次

### 5. 佈局適應

- 使用響應式網格系統
- 行動裝置採用單欄佈局
- 平板和桌面使用多欄佈局

## 範例組件

### 響應式卡片組件

```vue
<template>
  <div class="card-responsive">
    <h3 class="text-responsive font-semibold mb-4">
      {{ title }}
    </h3>
    <p class="text-responsive text-gray-600 mb-6">
      {{ description }}
    </p>
    <button class="btn-responsive btn-primary">
      {{ buttonText }}
    </button>
  </div>
</template>
```

### 響應式表單

```vue
<template>
  <form class="form-responsive">
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">姓名</label>
        <input class="input-responsive" type="text">
      </div>
      <div class="form-group">
        <label class="form-label">電子郵件</label>
        <input class="input-responsive" type="email">
      </div>
    </div>
  </form>
</template>
```

## 注意事項

1. **一致性**: 始終使用設計 Token，避免硬編碼數值
2. **可訪問性**: 確保觸控目標大小和對比度符合標準
3. **效能**: 使用 CSS 變數減少重複計算
4. **維護性**: 集中管理設計參數，便於後續調整
5. **測試**: 在不同裝置和螢幕尺寸下測試效果

## 更新記錄

- 2024-01-XX: 建立響應式設計 Token 系統
- 2024-01-XX: 新增觸控優化工具類別
- 2024-01-XX: 擴展響應式組件樣式