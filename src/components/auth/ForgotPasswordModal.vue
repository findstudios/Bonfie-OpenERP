<template>
  <TransitionRoot appear :show="true" as="template">
    <Dialog as="div" class="relative z-10" @close="$emit('close')">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-25" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900">
                重設密碼
              </DialogTitle>

              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  請輸入您的電子郵件地址，我們將發送重設密碼的連結給您。
                </p>
              </div>

              <!-- 錯誤提示 -->
              <div v-if="error" class="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
                <div class="flex">
                  <div class="shrink-0">
                    <ExclamationTriangleIcon class="size-5 text-red-400" />
                  </div>
                  <div class="ml-3">
                    <p class="text-sm text-red-700">{{ error }}</p>
                  </div>
                </div>
              </div>

              <!-- 成功提示 -->
              <div v-if="success" class="mt-4 rounded-md border border-green-200 bg-green-50 p-4">
                <div class="flex">
                  <div class="shrink-0">
                    <CheckCircleIcon class="size-5 text-green-400" />
                  </div>
                  <div class="ml-3">
                    <p class="text-sm text-green-700">{{ success }}</p>
                  </div>
                </div>
              </div>

              <form @submit.prevent="handleSubmit" class="mt-4">
                <div>
                  <label for="email" class="mb-2 block text-sm font-medium text-gray-700">
                    電子郵件
                  </label>
                  <div class="mt-1">
                    <input
                      id="email"
                      v-model="email"
                      type="email"
                      required
                      autocomplete="email"
                      class="input h-11 w-full px-4"
                      placeholder="請輸入您的電子郵件"
                      :disabled="loading"
                    />
                  </div>
                </div>

                <div class="mt-6 flex justify-end space-x-4">
                  <button
                    type="button"
                    @click="$emit('close')"
                    class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    :disabled="loading"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    :disabled="loading || !email"
                    class="btn btn-primary"
                  >
                    <svg
                      v-if="loading"
                      class="-ml-1 mr-3 size-5 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ loading ? '發送中...' : '發送重設連結' }}
                  </button>
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionRoot,
  TransitionChild,
} from '@headlessui/vue'
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/authSupabase'

// 定義事件
const emit = defineEmits<{
  close: []
}>()

// 狀態管理
const authStore = useAuthStore()

// 表單狀態
const email = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

// 處理表單提交
async function handleSubmit() {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    await authStore.resetPassword(email.value)
    success.value = '重設密碼連結已發送至您的電子郵件'

    // 3秒後自動關閉
    setTimeout(() => {
      emit('close')
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '發送失敗'
  } finally {
    loading.value = false
  }
}
</script>
