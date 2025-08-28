# 側邊欄文字隱藏修正

## 問題描述
側邊欄收合時，文字沒有完全隱藏，仍然可以看到部分文字內容。

## 根本原因分析

### 1. 自動調整邏輯問題
在 `responsive.ts` 的 `updateScreenSize()` 函數中，有一段自動調整側邊欄狀態的邏輯：

```typescript
// 原始問題代碼
if (config.value.sidebar.autoCollapse) {
  if (state.isMobile) {
    state.sidebarOpen = false
  } else if (state.isTablet) {
    state.sidebarCollapsed = true
  } else {
    state.sidebarCollapsed = false  // 這裡強制設為 false！
    state.sidebarOpen = true
  }
}
```

**問題**: 桌面版 (`else` 分支) 會自動將 `sidebarCollapsed` 設為 `false`，這意味著每次螢幕尺寸更新時，桌面版的側邊欄都會被強制展開，覆蓋了用戶的手動設置。

### 2. 狀態管理衝突
- 用戶點擊收合按鈕 → `sidebarCollapsed = true`
- 螢幕尺寸更新觸發 → `updateScreenSize()` → 自動設為 `sidebarCollapsed = false`
- 結果：側邊欄看起來收合了，但狀態實際上是展開的

## 修正方案

### 1. 修改自動調整邏輯
```typescript
// 修正後的代碼
if (config.value.sidebar.autoCollapse) {
  if (state.isMobile) {
    state.sidebarOpen = false
  } else if (state.isTablet) {
    // 平板版預設收合，但可以手動切換
    if (!state.sidebarOpen) {
      state.sidebarCollapsed = true
    }
  } else {
    // 桌面版預設展開，但保持用戶的手動設置
    state.sidebarOpen = true
    // 不自動修改 sidebarCollapsed，保持用戶設置
  }
}
```

**改善點**:
- 桌面版不再強制設置 `sidebarCollapsed = false`
- 保持用戶的手動收合/展開設置
- 只確保 `sidebarOpen = true`（桌面版側邊欄應該可見）

### 2. 添加調試功能
在響應式測試頁面添加了：
- 強制收合測試按鈕
- 詳細的狀態顯示
- 條件檢查調試信息

```vue
<button @click="forceSidebarCollapse" 
        class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 touch-target">
  強制收合測試
</button>
```

## 測試方法

### 1. 基本測試
1. 訪問響應式測試頁面 (`/responsive-test`)
2. 觀察當前的側邊欄狀態
3. 點擊頂部的收合/展開按鈕
4. 確認文字是否正確隱藏/顯示

### 2. 強制測試
1. 點擊 "強制收合測試" 按鈕
2. 觀察側邊欄文字是否立即隱藏
3. 檢查調試信息中的條件檢查結果

### 3. 響應式測試
1. 調整瀏覽器視窗大小
2. 確認不同螢幕尺寸下的行為
3. 驗證用戶設置是否被保持

## 預期結果

### 桌面版 (≥ 1200px)
- **展開狀態**: 顯示圖標 + 文字
- **收合狀態**: 只顯示圖標，完全隱藏文字
- **用戶設置**: 手動收合後，調整視窗大小不會重置狀態

### 平板版 (768px - 1199px)
- **預設**: 收合狀態
- **行為**: 與桌面版相同

### 行動版 (< 768px)
- **行為**: 覆蓋模式，始終顯示完整內容
- **收合**: 不支援收合，只有開啟/關閉

## 技術細節

### 條件邏輯
文字隱藏的條件是：
```typescript
v-if="!sidebarCollapsed || isMobile"
```

這意味著：
- 如果 `sidebarCollapsed = true` 且不是行動版 → 隱藏文字
- 如果 `sidebarCollapsed = false` 或是行動版 → 顯示文字

### 狀態優先級
1. **行動版**: 始終顯示文字（覆蓋模式）
2. **桌面/平板版**: 根據 `sidebarCollapsed` 狀態決定
3. **用戶設置**: 優先於自動調整邏輯

## 驗證清單

- [x] 修正自動調整邏輯
- [x] 添加調試功能
- [x] 測試桌面版收合行為
- [x] 測試平板版收合行為
- [x] 測試行動版覆蓋行為
- [x] 驗證用戶設置保持
- [x] 確認文字完全隱藏
- [x] 構建測試通過

## 後續改善

1. **持久化設置**: 可以將用戶的側邊欄偏好保存到 localStorage
2. **動畫優化**: 改善文字隱藏/顯示的過渡效果
3. **可訪問性**: 確保螢幕閱讀器正確處理狀態變化
4. **主題整合**: 與深色/淺色主題系統整合

現在側邊欄收合時應該能正確隱藏所有文字內容！