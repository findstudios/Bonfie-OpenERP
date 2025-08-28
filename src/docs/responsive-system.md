# 響應式系統使用指南

本文件說明如何使用補習班管理系統的響應式設計基礎設施。

## 概述

響應式系統提供了統一的方式來處理不同螢幕尺寸和裝置類型的佈局適配，包括：

- 響應式狀態管理
- 裝置類型檢測
- 側邊欄狀態管理
- 響應式工具函數
- 自定義 Tailwind CSS 類別

## 快速開始

### 1. 使用響應式 Composable

```vue
<template>
  <div>
    <!-- 根據裝置類型顯示不同內容 -->
    <div v-if="isMobile" class="mobile-layout">
      行動版佈局
    </div>
    <div v-else-if="isTablet" class="tablet-layout">
      平板版佈局
    </div>
    <div v-else class="desktop-layout">
      桌面版佈局
    </div>
    
    <!-- 響應式網格 -->
    <div :class="getGridCols({ mobile: 1, tablet: 2, desktop: 3 })" 
         class="grid gap-4">
      <div v-for="item in items" :key="item.id">
        {{ item.name }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useResponsive, useResponsiveClasses } from '@/composables/useResponsive'

const { isMobile, isTablet, isDesktop } = useResponsive()
const { getGridCols } = useResponsiveClasses()
</script>
```

### 2. 使用響應式狀態管理

```typescript
import { useResponsiveStore } from '@/stores/responsive'

const responsiveStore = useResponsiveStore()

// 獲取當前狀態
console.log(responsiveStore.state.isMobile)
console.log(responsiveStore.currentBreakpoint)

// 控制側邊欄
responsiveStore.toggleSidebar()
responsiveStore.openSidebar()
responsiveStore.closeSidebar()
```

### 3. 使用工具函數

```typescript
import { 
  isMobileDevice, 
  getCurrentBreakpoint, 
  getResponsiveImageUrl 
} from '@/utils/responsive'

// 檢測裝置類型
if (isMobileDevice()) {
  // 行動裝置特定邏輯
}

// 獲取當前斷點
const breakpoint = getCurrentBreakpoint()

// 生成響應式圖片 URL
const imageUrl = getResponsiveImageUrl('/api/image.jpg', {
  width: 800,
  quality: 80
})
```

## 斷點定義

系統定義了以下響應式斷點：

```typescript
const BREAKPOINTS = {
  mobile: 768,    // < 768px
  tablet: 1200,   // 768px - 1199px  
  desktop: 1200   // >= 1200px
}
```

對應的 Tailwind CSS 斷點：

- `mobile:` - 最大寬度 767px
- `tablet:` - 768px 到 1199px
- `desktop:` - 最小寬度 1200px
- `md:` - 最小寬度 768px
- `lg:` - 最小寬度 1024px
- `xl:` - 最小寬度 1280px

## 響應式組件

### 響應式佈局容器

```vue
<template>
  <div class="container-responsive">
    <!-- 內容會根據螢幕尺寸自動調整內邊距 -->
  </div>
</template>
```

### 響應式卡片

```vue
<template>
  <div class="card-responsive">
    <!-- 卡片會根據螢幕尺寸調整圓角、陰影和內邊距 -->
  </div>
</template>
```

### 響應式表格

```vue
<template>
  <div>
    <!-- 桌面版表格 -->
    <table v-if="!isMobile" class="w-full">
      <!-- 表格內容 -->
    </table>
    
    <!-- 行動版卡片 -->
    <div v-else class="space-y-4">
      <div v-for="item in items" :key="item.id" class="card-responsive">
        <!-- 卡片內容 -->
      </div>
    </div>
  </div>
</template>
```

## 側邊欄管理

系統提供了統一的側邊欄狀態管理：

```vue
<template>
  <div class="layout">
    <!-- 側邊欄 -->
    <aside :class="sidebarClasses">
      <!-- 側邊欄內容 -->
    </aside>
    
    <!-- 主要內容 -->
    <main :style="{ marginLeft: contentMargin }">
      <!-- 頁面內容 -->
    </main>
    
    <!-- 行動版遮罩 -->
    <div v-if="isMobile && sidebarOpen" 
         class="fixed inset-0 bg-black bg-opacity-50 z-mobile-overlay"
         @click="closeSidebar">
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useResponsive } from '@/composables/useResponsive'

const { 
  isMobile, 
  sidebarOpen, 
  sidebarCollapsed, 
  contentMargin, 
  closeSidebar 
} = useResponsive()

const sidebarClasses = computed(() => [
  'sidebar',
  {
    'sidebar-expanded': !sidebarCollapsed.value,
    'sidebar-collapsed': sidebarCollapsed.value && !isMobile.value,
    'sidebar-mobile-open': isMobile.value && sidebarOpen.value,
    'sidebar-mobile-closed': isMobile.value && !sidebarOpen.value,
  }
])
</script>
```

## 觸控優化

### 最小觸控目標尺寸

使用 `touch-target` 類別確保按鈕符合 44px 最小觸控目標：

```vue
<template>
  <button class="touch-target px-4 py-2 bg-blue-500 text-white rounded">
    按鈕文字
  </button>
</template>
```

### 觸控手勢

```vue
<template>
  <div @touchstart="onTouchStart"
       @touchmove="onTouchMove" 
       @touchend="onTouchEnd">
    <!-- 支援滑動手勢的內容 -->
  </div>
</template>

<script setup lang="ts">
import { useTouch } from '@/composables/useResponsive'

const { 
  onTouchStart, 
  onTouchMove, 
  onTouchEnd, 
  getSwipeDirection 
} = useTouch()

const handleTouchEnd = () => {
  onTouchEnd()
  const direction = getSwipeDirection()
  
  if (direction === 'right') {
    // 向右滑動邏輯
  } else if (direction === 'left') {
    // 向左滑動邏輯
  }
}
</script>
```

## 效能優化

### 防抖和節流

```typescript
import { debounce, throttle } from '@/utils/responsive'

// 防抖處理 resize 事件
const debouncedResize = debounce(() => {
  // resize 處理邏輯
}, 150)

window.addEventListener('resize', debouncedResize)

// 節流處理滾動事件
const throttledScroll = throttle(() => {
  // scroll 處理邏輯
}, 16)

window.addEventListener('scroll', throttledScroll)
```

### 響應式圖片

```typescript
import { getAdaptiveImageUrl } from '@/utils/responsive'

// 根據當前螢幕尺寸獲取適當的圖片
const imageUrl = getAdaptiveImageUrl('/api/image.jpg')
```

## 可訪問性

### 鍵盤導航

```vue
<template>
  <div class="focus:outline-none focus:ring-2 focus:ring-blue-500" 
       tabindex="0">
    <!-- 可聚焦的內容 -->
  </div>
</template>
```

### 螢幕閱讀器支援

```vue
<template>
  <div>
    <!-- 響應式佈局變化提示 -->
    <div role="status" aria-live="polite" class="sr-only">
      {{ layoutChangeAnnouncement }}
    </div>
    
    <!-- 跳轉連結 -->
    <a href="#main-content" class="sr-only focus:not-sr-only">
      跳轉到主要內容
    </a>
  </div>
</template>
```

## 自定義配置

### 更新響應式配置

```typescript
import { useResponsiveStore } from '@/stores/responsive'

const responsiveStore = useResponsiveStore()

// 更新斷點
responsiveStore.updateConfig({
  breakpoints: {
    mobile: 640,
    tablet: 1024,
    desktop: 1280
  }
})
```

### 自定義 Tailwind 類別

在 `tailwind.config.js` 中添加自定義響應式類別：

```javascript
module.exports = {
  theme: {
    extend: {
      // 自定義斷點
      screens: {
        'custom': '900px',
      },
      // 自定義間距
      spacing: {
        'custom': '2.5rem',
      }
    }
  }
}
```

## 調試

### 啟用調試模式

```typescript
// 在 main.ts 中
app.use(ResponsivePlugin, {
  debug: true
})
```

### 使用響應式測試組件

```vue
<template>
  <div>
    <!-- 你的頁面內容 -->
    
    <!-- 開發環境顯示響應式測試組件 -->
    <ResponsiveTest v-if="isDev" />
  </div>
</template>

<script setup lang="ts">
import ResponsiveTest from '@/components/ResponsiveTest.vue'

const isDev = import.meta.env.DEV
</script>
```

## 最佳實踐

1. **優先使用 Composables**: 使用 `useResponsive()` 而不是直接訪問 store
2. **觸控優化**: 確保所有互動元素至少 44px × 44px
3. **效能考量**: 使用防抖處理 resize 事件
4. **可訪問性**: 確保響應式變化不影響鍵盤導航順序
5. **測試**: 在不同裝置和螢幕尺寸下測試功能
6. **漸進式增強**: 確保基本功能在所有裝置上都能正常工作

## 故障排除

### 常見問題

1. **響應式狀態未更新**: 確保已正確安裝響應式插件
2. **側邊欄狀態異常**: 檢查是否正確使用 `useResponsive()` composable
3. **觸控事件無效**: 確認裝置支援觸控且事件處理器正確綁定
4. **CSS 類別無效**: 檢查 Tailwind 配置是否正確編譯

### 調試步驟

1. 檢查瀏覽器控制台是否有錯誤
2. 使用 Vue DevTools 檢查響應式狀態
3. 確認 Tailwind CSS 類別是否正確生成
4. 測試不同螢幕尺寸下的行為

## 更新日誌

- v1.0.0: 初始版本，包含基本響應式功能
- 未來版本將添加更多響應式組件和優化功能