<template>
  <header class="mobile-top-bar sticky top-0 z-50" :style="headerStyles">
    <div class="flex h-14 items-center justify-between px-4">
      <!-- 左側：返回按鈕/漢堡選單 + 標題 -->
      <div class="flex min-w-0 flex-1 items-center">
        <!-- 返回按鈕（當有上級頁面時顯示） -->
        <button
          v-if="showBackButton"
          @click="goBack"
          class="back-btn -ml-2 rounded-md p-2 transition-colors touch-target"
          :style="buttonStyles"
          aria-label="返回上一頁"
        >
          <svg class="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- 漢堡選單（當沒有返回按鈕時顯示） -->
        <button
          v-else
          @click="$emit('toggle-sidebar')"
          class="hamburger-btn -ml-2 rounded-md p-2 transition-colors touch-target"
          :style="buttonStyles"
          aria-label="開啟選單"
        >
          <svg class="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <!-- 標題和麵包屑 -->
        <div class="ml-2 min-w-0 flex-1">
          <!-- 麵包屑導航（當有多層級時顯示） -->
          <nav v-if="breadcrumbs.length > 1" class="breadcrumb mb-1" aria-label="麵包屑導航">
            <ol class="flex items-center space-x-1 text-xs" :style="{ color: 'var(--color-text-tertiary)' }">
              <li v-for="(crumb, index) in breadcrumbs" :key="crumb.path" class="flex items-center">
                <router-link
                  v-if="index < breadcrumbs.length - 1"
                  :to="crumb.path"
                  class="breadcrumb-link inline-flex max-w-20 items-center truncate transition-colors"
                  :style="{ color: 'var(--color-text-tertiary)', '--hover-color': 'var(--color-text-secondary)' }"
                >
                  {{ crumb.name }}
                </router-link>
                <span v-else class="max-w-20 truncate font-medium" :style="{ color: 'var(--color-text-primary)' }">
                  {{ crumb.name }}
                </span>
                <svg
                  v-if="index < breadcrumbs.length - 1"
                  class="mx-1 size-3 shrink-0"
                  :style="{ color: 'var(--color-text-tertiary)' }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <!-- 右側：用戶資訊 + 登出 -->
      <div class="flex items-center space-x-2">
        <!-- CRM 跟進提醒 -->
        <FollowUpReminderWidget v-if="user?.role?.permissions?.crm?.enabled" />

        <!-- 用戶名稱（在較大的行動螢幕上顯示） -->
        <span class="hidden max-w-20 truncate text-sm xs:block" :style="{ color: 'var(--color-text-secondary)' }">
          {{ user?.full_name || '用戶' }}
        </span>

        <!-- 用戶選單按鈕 -->
        <div class="relative">
          <button
            @click="toggleUserMenu"
            class="user-menu-btn rounded-full p-2 transition-colors touch-target"
            :style="buttonStyles"
            aria-label="用戶選單"
          >
            <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>

          <!-- 用戶下拉選單 -->
          <div
            v-if="userMenuOpen"
            class="user-dropdown z-60 absolute right-0 mt-2 w-48 rounded-md shadow-lg"
            :style="dropdownStyles"
          >
            <div class="py-1">
              <!-- 用戶資訊 -->
              <div class="border-b px-4 py-2" :style="{ borderBottomColor: 'var(--color-border-primary)' }">
                <p class="text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ user?.full_name || '用戶' }}</p>
                <p class="text-xs" :style="{ color: 'var(--color-text-tertiary)' }">{{ user?.email || '' }}</p>
              </div>

              <!-- 選單項目 -->
              <router-link
                to="/profile"
                class="dropdown-item block px-4 py-2 text-sm transition-colors"
                :style="dropdownItemStyles"
                @click="closeUserMenu"
              >
                個人資料
              </router-link>

              <router-link
                to="/settings"
                class="dropdown-item block px-4 py-2 text-sm transition-colors"
                :style="dropdownItemStyles"
                @click="closeUserMenu"
              >
                系統設定
              </router-link>

              <div class="border-t" :style="{ borderTopColor: 'var(--color-border-primary)' }">
                <button
                  @click="handleLogout"
                  class="dropdown-item w-full px-4 py-2 text-left text-sm transition-colors"
                  :style="dropdownItemStyles"
                >
                  登出
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import FollowUpReminderWidget from '@/components/crm/FollowUpReminderWidget.vue'

interface Props {
  title: string
  user?: {
    full_name?: string
    email?: string
    role?: {
      role_code?: string
      role_name?: string
      permissions?: {
        crm?: {
          enabled?: boolean
        }
      }
    }
  } | null
}

interface Emits {
  (e: 'toggle-sidebar'): void
  (e: 'logout'): void
}

interface Breadcrumb {
  name: string
  path: string
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const router = useRouter()
const route = useRoute()
const userMenuOpen = ref(false)

// 主題相關樣式
const headerStyles = computed(() => ({
  backgroundColor: 'var(--color-bg-elevated)',
  borderBottomColor: 'var(--color-border-primary)',
  borderBottomWidth: '1px',
  boxShadow: 'var(--shadow-sm)',
  backdropFilter: 'blur(10px)'
}))

const buttonStyles = computed(() => ({
  color: 'var(--color-text-secondary)',
  '--hover-bg': 'var(--color-surface-hover)',
  '--hover-color': 'var(--color-text-primary)'
}))

const dropdownStyles = computed(() => ({
  backgroundColor: 'var(--color-bg-elevated)',
  borderColor: 'var(--color-border-primary)',
  borderWidth: '1px',
  boxShadow: 'var(--shadow-lg)'
}))

const dropdownItemStyles = computed(() => ({
  color: 'var(--color-text-primary)',
  '--hover-bg': 'var(--color-surface-hover)'
}))

// 麵包屑導航計算
const breadcrumbs = computed<Breadcrumb[]>(() => {
  const pathSegments = route.path.split('/').filter(segment => segment)
  const crumbs: Breadcrumb[] = []

  // 總是包含儀表板
  crumbs.push({ name: '儀表板', path: '/dashboard' })

  // 根據路由路徑生成麵包屑
  let currentPath = ''

  for (let i = 0; i < pathSegments.length; i++) {
    currentPath += `/${pathSegments[i]}`
    const segment = pathSegments[i]

    // 根據路徑段生成麵包屑名稱
    let breadcrumbName = ''

    switch (segment) {
      case 'students':
        breadcrumbName = '學生管理'
        break
      case 'courses':
        breadcrumbName = '課程管理'
        break
      case 'schedule':
        breadcrumbName = '課程行事曆'
        break
      case 'attendance':
        breadcrumbName = '出席管理'
        break
      case 'orders':
        breadcrumbName = '訂單管理'
        break
      case 'reports':
        breadcrumbName = '報表統計'
        break
      case 'settings':
        breadcrumbName = '系統設定'
        break
      case 'profile':
        breadcrumbName = '個人資料'
        break
      case 'create':
        breadcrumbName = '新增'
        break
      case 'edit':
        breadcrumbName = '編輯'
        break
      case 'take':
        breadcrumbName = '點名'
        break
      case 'users':
        breadcrumbName = '帳號管理'
        break
      case 'contacts':
        breadcrumbName = '聯絡人管理'
        break
      case 'crm':
        breadcrumbName = '客戶關係'
        break
      case 'credits':
        breadcrumbName = '儲值管理'
        break
      default:
        // 如果是 ID（數字），跳過
        if (/^\d+$/.test(segment)) {
          continue
        }
        breadcrumbName = segment
    }

    if (breadcrumbName) {
      crumbs.push({ name: breadcrumbName, path: currentPath })
    }
  }

  return crumbs
})

// 是否顯示返回按鈕
const showBackButton = computed(() => {
  // 在詳情頁、編輯頁、新增頁等子頁面顯示返回按鈕
  const subPages = ['create', 'edit', 'take']
  const pathSegments = route.path.split('/').filter(segment => segment)

  return pathSegments.some(segment =>
    subPages.includes(segment) || /^\d+$/.test(segment)
  ) || breadcrumbs.value.length > 2
})

// 返回上一頁
const goBack = () => {
  // 如果有歷史記錄，返回上一頁
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    // 否則根據麵包屑導航到上級頁面
    if (breadcrumbs.value.length > 1) {
      const parentCrumb = breadcrumbs.value[breadcrumbs.value.length - 2]
      router.push(parentCrumb.path)
    } else {
      router.push('/dashboard')
    }
  }
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function closeUserMenu() {
  userMenuOpen.value = false
}

function handleLogout() {
  closeUserMenu()
  emit('logout')
}

// 點擊外部關閉選單
document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu-btn') && !target.closest('.user-dropdown')) {
    userMenuOpen.value = false
  }
})
</script>

<style scoped>
.mobile-top-bar {
  /* 確保在 iOS Safari 中正確顯示 */
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

.hamburger-btn,
.back-btn,
.user-menu-btn {
  /* 增加觸控區域 */
  min-width: 44px;
  min-height: 44px;
}

.hamburger-btn:hover,
.back-btn:hover,
.user-menu-btn:hover {
  background-color: var(--hover-bg);
  color: var(--hover-color);
}

.touch-target {
  /* 確保觸控目標符合可訪問性標準 */
  min-width: 44px;
  min-height: 44px;
}

.user-dropdown {
  /* 確保下拉選單在所有裝置上都能正確顯示 */
  min-width: 12rem;
  max-width: 90vw;
}

.dropdown-item:hover {
  background-color: var(--hover-bg);
}

/* 響應式字體大小 */
@media (max-width: 375px) {
  .mobile-top-bar h1 {
    font-size: 1rem;
  }
}

/* 超小螢幕優化 */
@screen xs {
  .max-w-20 {
    max-width: 5rem;
  }
}

/* 麵包屑樣式 */
.breadcrumb {
  line-height: 1.2;
}

.breadcrumb-link:hover {
  color: var(--hover-color);
  text-decoration: none;
}

/* 確保麵包屑在小螢幕上不會過度擠壓 */
@media (max-width: 375px) {
  .breadcrumb .max-w-20 {
    max-width: 3rem;
  }

  .mobile-top-bar h1 {
    font-size: 1rem;
  }
}

/* 麵包屑響應式調整 */
@media (max-width: 320px) {
  .breadcrumb {
    display: none;
  }
}
</style>
