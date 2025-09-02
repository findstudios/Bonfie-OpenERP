<template>
  <div class="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <!-- Logo 區域 -->
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900">中小型補教業OpenERP</h1>
        <p class="mt-2 text-sm text-gray-600">請使用您的帳號登入系統</p>
      </div>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
        <!-- 登入表單 -->
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- 錯誤提示 -->
          <div v-if="authStore.error" class="rounded-md border border-red-200 bg-red-50 p-4">
            <div class="flex">
              <div class="shrink-0">
                <ExclamationTriangleIcon class="size-5 text-red-400" />
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">登入失敗</h3>
                <p class="mt-1 text-sm text-red-700">{{ authStore.error }}</p>
              </div>
            </div>
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="mb-2 block text-sm font-medium text-gray-700">
              電子郵件
            </label>
            <div class="mt-1">
              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                autocomplete="email"
                class="input h-11 w-full px-4"
                placeholder="請輸入電子郵件"
                :disabled="authStore.loading"
              />
            </div>
          </div>

          <!-- 密碼 -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              密碼
            </label>
            <div class="relative mt-1">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                class="input h-11 w-full px-4 pr-10"
                placeholder="請輸入密碼"
                :disabled="authStore.loading"
              />
              <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="text-gray-400 hover:text-gray-500 focus:text-gray-500 focus:outline-none"
                  :disabled="authStore.loading"
                >
                  <EyeIcon v-if="!showPassword" class="size-5" />
                  <EyeSlashIcon v-else class="size-5" />
                </button>
              </div>
            </div>
          </div>

          <!-- 記住我 -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                v-model="form.rememberMe"
                type="checkbox"
                class="size-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                :disabled="authStore.loading"
                @change="handleRememberMeChange"
              />
              <label for="remember-me" class="ml-2 block text-sm text-gray-900">
                記住我
              </label>
            </div>

            <!-- 忘記密碼 -->
            <div class="text-sm">
              <router-link
                to="/reset-password"
                class="font-medium text-primary-600 hover:text-primary-500"
              >
                忘記密碼？
              </router-link>
            </div>
          </div>

          <!-- 登入按鈕 -->
          <div>
            <button
              type="submit"
              :disabled="authStore.loading || !form.email || !form.password"
              class="flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                v-if="authStore.loading"
                class="-ml-1 mr-3 size-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ authStore.loading ? '登入中...' : '登入' }}
            </button>
          </div>
        </form>

        <!-- 系統資訊 -->
        <div class="mt-6 text-center text-xs text-gray-500">
          <p>版本 {{ version }}</p>
          <p class="mt-1">© 2025 中小型補教業OpenERP</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authSupabase'
import { ExclamationTriangleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'
import { createLogger } from '@/utils/logger'

const log = createLogger('LoginView')

// 路由和狀態管理
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 記住的帳號 key
const REMEMBERED_EMAIL_KEY = 'tutoring_remembered_email'

// 表單狀態
const form = ref({
  email: '',
  password: '',
  rememberMe: false
})

// 介面狀態
const showPassword = ref(false)

// 應用版本
const version = import.meta.env.VITE_APP_VERSION || '1.0.0'

// 當記住我選項改變時
function handleRememberMeChange() {
  if (!form.value.rememberMe && form.value.email) {
    // 如果取消勾選，立即清除記住的帳號
    localStorage.removeItem(REMEMBERED_EMAIL_KEY)
    log.log('清除記住的帳號')
  }
}

// 處理登入
async function handleLogin() {
  try {
    // 清除之前的錯誤
    authStore.clearError()
    
    // 處理記住帳號
    if (form.value.rememberMe) {
      // 記住帳號到 localStorage
      localStorage.setItem(REMEMBERED_EMAIL_KEY, form.value.email)
    } else {
      // 清除記住的帳號
      localStorage.removeItem(REMEMBERED_EMAIL_KEY)
    }

    // 執行登入
    await authStore.login(form.value.email, form.value.password)

    // 登入成功，檢查是否有重定向路徑
    const redirectPath = route.query.redirect as string || '/dashboard'
    log.log('登入成功，重定向到:', redirectPath)
    router.push(redirectPath)
  } catch (error) {
    // 錯誤處理已在 store 中完成
    log.error('登入失敗:', error)
  }
}

// 組件掛載時執行
onMounted(() => {
  // 顯示環境變數（僅用於調試）
  console.log('LoginView - Environment:', {
    env: import.meta.env.MODE,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    appEnv: import.meta.env.VITE_APP_ENV,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD
  })
  
  // 載入記住的帳號
  const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY)
  if (rememberedEmail) {
    form.value.email = rememberedEmail
    form.value.rememberMe = true
    log.log('載入記住的帳號:', rememberedEmail)
  }

  // 如果已登入，檢查是否有重定向路徑
  if (authStore.isAuthenticated) {
    const redirectPath = route.query.redirect as string || '/dashboard'
    log.log('用戶已登入，重定向到:', redirectPath)
    router.push(redirectPath)
  }
})
</script>

