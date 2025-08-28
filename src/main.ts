import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/css/main.css'

// 響應式系統
import ResponsivePlugin from './plugins/responsive'

// 動畫系統
import AnimationPlugin from './plugins/animation'

// 認證系統
import AuthPlugin from './plugins/auth'

// 創建 Vue 應用實例
const app = createApp(App)

// 安裝插件
app.use(createPinia()) // 狀態管理
app.use(router) // 路由管理

// 安裝認證系統插件（需要在 router 之後）
app.use(AuthPlugin, {
  autoInit: false, // 在 App.vue 中手動初始化，避免重複
  debug: import.meta.env.DEV, // 開發環境啟用調試
})

// 安裝響應式系統插件
app.use(ResponsivePlugin, {
  autoInit: true,
  debug: import.meta.env.DEV, // 開發環境啟用調試
})

// 安裝動畫系統插件
app.use(AnimationPlugin)

// 在開發環境中添加 RLS 測試工具
if (import.meta.env.DEV) {
  import('./utils/testRLS').then(({ quickRLSTest, testTableAccess }) => {
    // 將測試函數掛載到 window 對象
    ;(window as any).testRLS = quickRLSTest
    ;(window as any).testTable = testTableAccess
    console.log('🔒 RLS 測試工具已載入:')
    console.log('  - window.testRLS() : 測試所有表格的權限')
    console.log('  - window.testTable("表名") : 測試特定表格')
  })
}

// 掛載應用
app.mount('#app')
