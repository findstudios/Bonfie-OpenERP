<template>
  <MainLayout>
    <div class="mx-auto max-w-4xl space-y-6">
      <h2 class="text-2xl font-bold text-gray-900">個人資料</h2>

      <div class="card p-6">
        <h3 class="mb-4 text-lg font-medium text-gray-900">基本資訊</h3>
        <div v-if="authStore.user" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">用戶名</label>
            <p class="mt-1 text-sm text-gray-900">{{ authStore.user.username }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">姓名</label>
            <p class="mt-1 text-sm text-gray-900">{{ authStore.user.full_name }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">角色</label>
            <p class="mt-1 text-sm text-gray-900">{{ authStore.user.role?.role_name }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">電話</label>
            <p class="mt-1 text-sm text-gray-900">{{ authStore.user.phone || '未設定' }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">電子郵件</label>
            <p class="mt-1 text-sm text-gray-900">{{ authStore.user.email || '未設定' }}</p>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authSupabase'
import MainLayout from '@/components/layout/MainLayout.vue'

const authStore = useAuthStore()
</script>
