# 系統設定模組 (System Settings Module)

## 概述

系統設定模組是補習班管理系統的核心管理功能，專為具有最高權限的管理員設計。此模組提供完整的系統配置、權限管理、安全控制等功能。

## 功能特色

### 🔐 權限控制
- 僅限 ADMIN 角色訪問
- 基於角色的存取控制 (RBAC)
- 完整的權限審核日誌

### 📋 核心功能模組

#### 1. 角色/帳密設定 (Role & Account Settings)
- **角色管理**
  - 新增、編輯、停用角色
  - 角色權限配置
  - 角色統計與分析
  
- **帳號管理**
  - 用戶帳號建立與編輯
  - 密碼重置功能
  - 帳號狀態管理
  - 角色分配與變更

- **密碼政策**
  - 密碼複雜度要求
  - 密碼有效期設定
  - 防止密碼重複使用
  - 失敗嘗試鎖定機制

#### 2. 教室設定 (Classroom Settings)
- **教室管理**
  - 教室新增、編輯、刪除
  - 教室狀態控制 (啟用/維護/停用)
  - 容納人數與位置資訊
  - 教室使用率統計

- **設備管理**
  - 教室設備配置
  - 設備狀態追蹤
  - 維護記錄管理
  - 設備保固追蹤

- **排程規則**
  - 預約時間限制
  - 營業時間設定
  - 重疊預約控制
  - 自動清理間隔

#### 3. 系統權限 (System Permissions)
- **權限矩陣**
  - 視覺化權限管理介面
  - 批量權限操作
  - 權限繼承設定

- **權限模板**
  - 預設權限組合
  - 快速權限分配
  - 自定義權限模板

- **權限日誌**
  - 完整的權限變更記錄
  - 操作者追蹤
  - 變更時間記錄

#### 4. 備份還原 (Backup & Restore)
- **資料備份**
  - 即時手動備份
  - 自動排程備份
  - 選擇性資料備份 (用戶資料/系統設定/檔案上傳)

- **備份管理**
  - 備份歷史查看
  - 備份檔案下載
  - 備份檔案刪除
  - 儲存空間統計

- **系統還原**
  - 從備份檔案還原
  - 選擇性還原功能
  - 還原前安全確認

#### 5. 安全設定 (Security Settings)
- **登入安全**
  - 最大登入嘗試次數
  - 帳號鎖定機制
  - 雙重驗證設定
  - 驗證碼要求

- **會話管理**
  - 會話超時設定
  - 同時會話限制
  - 安全 Cookie 設定

- **IP 訪問控制**
  - IP 白名單/黑名單
  - 地區訪問限制
  - 動態 IP 封鎖

- **安全監控**
  - 登入失敗追蹤
  - 可疑活動偵測
  - 安全事件通知

#### 6. 系統監控 (System Monitoring)
- **系統狀態**
  - 伺服器健康檢查
  - 資料庫連線狀態
  - 快取系統狀態
  - 儲存空間監控

- **效能監控**
  - CPU 使用率
  - 記憶體使用量
  - 磁碟 I/O
  - 網路流量統計

- **系統日誌**
  - 應用程式日誌
  - 錯誤日誌追蹤
  - 系統事件記錄
  - 日誌搜尋與過濾

- **活躍會話**
  - 線上用戶監控
  - 會話詳細資訊
  - 強制登出功能

## 技術架構

### 組件結構
```
src/components/settings/
├── SystemSettingsModule.vue     # 主模組容器
├── RoleAccountSettings.vue      # 角色帳密設定
├── ClassroomSettings.vue        # 教室設定
├── SystemPermissions.vue        # 系統權限
├── BackupRestore.vue           # 備份還原
├── SecuritySettings.vue        # 安全設定
├── SystemMonitoring.vue        # 系統監控
└── README.md                   # 模組說明文件
```

### 依賴組件
- `SmartButton`: 智能按鈕組件
- `SmartForm`: 智能表單組件
- `ResponsiveTable`: 響應式表格組件
- `ConfirmDialog`: 確認對話框組件
- `LoadingSpinner`: 載入動畫組件

### 外部依賴
- `@heroicons/vue`: 圖示庫
- `pinia`: 狀態管理
- `vue-router`: 路由管理

## 安全考量

### 權限驗證
- 所有操作前都會驗證用戶權限
- ADMIN 角色限制
- 操作日誌記錄

### 資料保護
- 敏感資料加密儲存
- 安全的密碼重置流程
- 防止資料洩露

### 審核追蹤
- 完整的操作日誌
- 系統變更記錄
- 安全事件監控

## 使用方式

### 1. 基本集成
```vue
<template>
  <MainLayout>
    <SystemSettingsModule />
  </MainLayout>
</template>

<script setup lang="ts">
import SystemSettingsModule from '@/components/settings/SystemSettingsModule.vue'
</script>
```

### 2. 權限檢查
```typescript
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 檢查是否為管理員
if (!authStore.hasRole('ADMIN')) {
  // 重定向或顯示錯誤
}
```

### 3. 事件處理
```vue
<SystemSettingsModule 
  @save="handleSaveSettings"
  @backup="handleBackup" 
  @restore="handleRestore"
/>
```

## 配置選項

### 環境變數
```env
# 備份設定
BACKUP_STORAGE_PATH=/backups
BACKUP_RETENTION_DAYS=30

# 安全設定
MAX_LOGIN_ATTEMPTS=5
SESSION_TIMEOUT=480
ENABLE_IP_WHITELIST=true

# 監控設定
METRICS_UPDATE_INTERVAL=5000
LOG_LEVEL=INFO
```

### 系統配置
```typescript
// 在 main.ts 中配置
app.provide('systemConfig', {
  backup: {
    maxFileSize: '100MB',
    allowedFormats: ['.sql', '.zip', '.tar.gz']
  },
  security: {
    requireStrongPassword: true,
    enableTwoFactor: false
  },
  monitoring: {
    realTimeUpdate: true,
    alertThresholds: {
      cpu: 80,
      memory: 85,
      disk: 90
    }
  }
})
```

## API 接口

### 權限管理
```typescript
// 獲取角色列表
GET /api/admin/roles

// 更新用戶權限
PUT /api/admin/users/:id/permissions

// 記錄權限變更
POST /api/admin/audit/permissions
```

### 系統設定
```typescript
// 獲取系統設定
GET /api/admin/settings

// 更新系統設定
PUT /api/admin/settings/:category

// 系統備份
POST /api/admin/backup
```

### 監控數據
```typescript
// 獲取系統狀態
GET /api/admin/system/status

// 獲取效能指標
GET /api/admin/system/metrics

// 獲取系統日誌
GET /api/admin/system/logs
```

## 故障排除

### 常見問題

#### 1. 權限驗證失敗
```
錯誤: 權限不足，無法訪問系統設定
解決: 確認用戶角色為 ADMIN，檢查 auth store 狀態
```

#### 2. 組件載入失敗
```
錯誤: Cannot resolve component 'SmartButton'
解決: 檢查組件路徑，確認相關依賴已安裝
```

#### 3. 備份功能異常
```
錯誤: 備份建立失敗
解決: 檢查伺服器儲存空間，確認備份目錄權限
```

### 調試模式
```typescript
// 啟用調試模式
window.systemSettings = {
  debug: true,
  mockData: true,
  bypassAuth: false // 生產環境切勿啟用
}
```

## 更新日誌

### v1.0.0 (2024-01-15)
- ✅ 初始版本發布
- ✅ 完整的六大功能模組
- ✅ ADMIN 權限控制
- ✅ 響應式設計支持

### 計劃功能
- 🔄 多語言支持
- 🔄 主題定制功能
- 🔄 高級報表系統
- 🔄 API 速率限制
- 🔄 更多監控指標

## 貢獻指南

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 授權

此專案使用 MIT 授權 - 查看 [LICENSE](LICENSE) 檔案了解詳情。

## 支援

如有問題或建議，請聯繫：
- 開發團隊: dev@example.com
- 技術支援: support@example.com
- 文件問題: docs@example.com