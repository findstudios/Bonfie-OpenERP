<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          重設密碼
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          {{ mode === 'request' ? '輸入您的 Email 以接收重設密碼連結' : '輸入新密碼' }}
        </p>
      </div>

      <!-- Request Reset Form -->
      <form v-if="mode === 'request'" class="mt-8 space-y-6" @submit.prevent="handleRequestReset">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">
            Email 地址
          </label>
          <div class="mt-1">
            <input
              id="email"
              v-model="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="your@email.com"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span v-if="loading" class="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg class="size-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            {{ loading ? '發送中...' : '發送重設連結' }}
          </button>
        </div>
      </form>

      <!-- Update Password Form -->
      <form v-else-if="mode === 'update'" class="mt-8 space-y-6" @submit.prevent="handleUpdatePassword">
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">
            新密碼
          </label>
          <div class="mt-1">
            <input
              id="password"
              v-model="newPassword"
              name="password"
              type="password"
              autocomplete="new-password"
              required
              minlength="6"
              class="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="至少 6 個字元"
            />
          </div>
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
            確認新密碼
          </label>
          <div class="mt-1">
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              name="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              class="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="再次輸入密碼"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading || newPassword !== confirmPassword"
            class="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span v-if="loading" class="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg class="size-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            {{ loading ? '更新中...' : '更新密碼' }}
          </button>
        </div>
      </form>

      <!-- Success Message -->
      <div v-if="successMessage" class="mt-4 rounded-md border border-green-200 bg-green-50 p-4">
        <p class="text-sm text-green-800">{{ successMessage }}</p>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
        <p class="text-sm text-red-800">{{ errorMessage }}</p>
      </div>

      <!-- Back to Login Link -->
      <div class="text-center">
        <router-link to="/login" class="text-sm text-indigo-600 hover:text-indigo-500">
          返回登入頁面
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authSupabase'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Form mode: 'request' for requesting reset, 'update' for updating password
const mode = ref<'request' | 'update'>('request')

// Form data
const email = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// States
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Check if we have a recovery token in the URL
onMounted(() => {
  const hash = window.location.hash
  if (hash && hash.includes('type=recovery')) {
    mode.value = 'update'
  }
})

// Handle password reset request
async function handleRequestReset() {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await authStore.resetPassword(email.value)
    successMessage.value = '密碼重設郵件已發送！請檢查您的信箱。'
    email.value = ''
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '發送重設郵件失敗'
  } finally {
    loading.value = false
  }
}

// Handle password update
async function handleUpdatePassword() {
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = '兩次輸入的密碼不一致'
    return
  }

  if (newPassword.value.length < 6) {
    errorMessage.value = '密碼長度至少需要 6 個字元'
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await authStore.updatePassword(newPassword.value)
    successMessage.value = '密碼已成功更新！正在跳轉到登入頁面...'

    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '更新密碼失敗'
  } finally {
    loading.value = false
  }
}
</script>
