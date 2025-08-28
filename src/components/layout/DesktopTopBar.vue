<template>
  <header class="desktop-top-bar sticky top-0 z-50" :style="headerStyles">
    <div class="px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <!-- 左側：收合按鈕 + 標題 -->
        <div class="flex items-center">
          <button
            @click="$emit('toggle-sidebar')"
            class="collapse-btn mr-3 rounded-md p-2 transition-colors"
            :style="buttonStyles"
            :aria-label="isCollapsed ? '展開側邊欄' : '收合側邊欄'"
          >
            <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="isCollapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7M19 19l-7-7 7-7'"
              />
            </svg>
          </button>

          <div class="text-lg font-medium" :style="{ color: 'var(--color-text-primary)' }">
            {{ pageTitle }}
          </div>
        </div>

        <!-- 右側：用戶資訊 + 操作 -->
        <div class="flex items-center space-x-4">
          <!-- CRM 跟進提醒 -->
          <FollowUpReminderWidget v-if="user?.role?.permissions?.crm?.enabled" />

          <!-- 用戶資訊 -->
          <div class="flex items-center space-x-3">
            <span class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
              {{ user?.full_name || '用戶' }}
            </span>

            <!-- 用戶頭像 -->
            <div class="relative">
              <button
                @click="toggleUserMenu"
                class="user-avatar-btn flex items-center rounded-full p-1 transition-colors"
                :style="buttonStyles"
                aria-label="用戶選單"
              >
                <div class="flex size-8 items-center justify-center overflow-hidden rounded-full bg-gray-300">
                  <img
                    v-if="user?.avatar_url"
                    :src="user.avatar_url"
                    :alt="user?.full_name || '用戶頭像'"
                    class="size-full object-cover"
                  />
                  <svg v-else class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
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
                    <div class="mt-1">
                      <span
                        v-if="user?.role?.role_name"
                        :class="getRoleBadgeClass(user.role.role_name)"
                        class="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                      >
                        {{ user.role.role_name }}
                      </span>
                    </div>
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
                    v-if="user?.role?.role_code === 'ADMIN'"
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
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import FollowUpReminderWidget from '@/components/crm/FollowUpReminderWidget.vue'

interface Props {
  isCollapsed: boolean
  pageTitle: string
  user?: {
    full_name?: string
    email?: string
    avatar_url?: string
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

defineProps<Props>()
const emit = defineEmits<Emits>()

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

// 根據角色返回對應的顏色樣式
function getRoleBadgeClass(roleName: string) {
  switch (roleName) {
    case '管理員':
      return 'bg-purple-100 text-purple-800'
    case '行政人員':
      return 'bg-blue-100 text-blue-800'
    case '老師':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// 點擊外部關閉選單
document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-avatar-btn') && !target.closest('.user-dropdown')) {
    userMenuOpen.value = false
  }
})
</script>

<style scoped>
.desktop-top-bar {
  /* 確保頂部導航在桌面版有適當的背景模糊效果 */
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

.collapse-btn,
.user-avatar-btn {
  /* 確保按鈕有足夠的點擊區域 */
  min-width: 40px;
  min-height: 40px;
}

.collapse-btn:hover,
.user-avatar-btn:hover {
  background-color: var(--hover-bg);
  color: var(--hover-color);
}

.dropdown-item:hover {
  background-color: var(--hover-bg);
}

/* 焦點指示器 */
.collapse-btn:focus,
.user-avatar-btn:focus {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

.collapse-btn:focus-visible,
.user-avatar-btn:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

.collapse-btn:focus:not(:focus-visible),
.user-avatar-btn:focus:not(:focus-visible) {
  outline: none;
}

/* 高對比度模式支援 */
@media (prefers-contrast: high) {
  .desktop-top-bar {
    border-bottom: 2px solid currentColor;
  }

  .collapse-btn,
  .user-avatar-btn {
    border: 1px solid transparent;
  }

  .collapse-btn:hover,
  .user-avatar-btn:hover,
  .collapse-btn:focus,
  .user-avatar-btn:focus {
    border-color: currentColor;
  }
}

/* 減少動畫偏好設定 */
@media (prefers-reduced-motion: reduce) {
  /* 移除了通知徽章相關動畫 */
}
</style>
