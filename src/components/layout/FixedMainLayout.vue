<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 頂部導航欄 - 橫跨整個頂部 -->
    <header class="sticky top-0 z-50 border-b border-gray-200 bg-white shadow">
      <div class="pl-64 pr-4 sm:pr-6 lg:pr-8">
        <div class="flex h-16 items-center justify-between">
          <div class="text-lg font-medium text-gray-900">
            {{ pageTitle }}
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600">
              {{ user?.full_name || '用戶' }}
            </span>
            <button
              @click="handleLogout"
              class="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              登出
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 側邊欄 -->
    <div class="fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto bg-gray-800 pt-16">
      <div class="-mt-16 flex h-16 items-center justify-center bg-gray-900">
        <h1 class="text-xl font-bold text-white">OpenERP管理系統</h1>
      </div>

      <nav class="mt-8">
        <div class="space-y-1 px-2">
          <!-- 儀表板 -->
          <router-link
            to="/dashboard"
            :class="[
              'flex items-center rounded-md px-3 py-2 text-sm font-medium',
              $route.path === '/dashboard' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            ]"
          >
            儀表板
          </router-link>

          <!-- 學生管理 -->
          <div>
            <button
              @click="toggleStudentMenu"
              :class="[
                'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium',
                $route.path.startsWith('/students') ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              ]"
            >
              <span>學生管理</span>
              <svg
                :class="['size-4 transition-transform', studentMenuOpen ? 'rotate-90' : '']"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
            <div v-show="studentMenuOpen" class="ml-6 mt-1 space-y-1">
              <router-link
                to="/students"
                :class="[
                  'block rounded-md px-3 py-2 text-sm',
                  $route.path === '/students' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:bg-gray-600 hover:text-white'
                ]"
              >
                學生列表
              </router-link>
              <router-link
                to="/students/create"
                :class="[
                  'block rounded-md px-3 py-2 text-sm',
                  $route.path === '/students/create' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:bg-gray-600 hover:text-white'
                ]"
              >
                新增學生
              </router-link>
            </div>
          </div>

          <!-- 課程管理 -->
          <div>
            <button
              @click="toggleCourseMenu"
              :class="[
                'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium',
                $route.path.startsWith('/courses') ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              ]"
            >
              <span>課程管理</span>
              <svg
                :class="['size-4 transition-transform', courseMenuOpen ? 'rotate-90' : '']"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
            <div v-show="courseMenuOpen" class="ml-6 mt-1 space-y-1">
              <router-link
                to="/courses"
                :class="[
                  'block rounded-md px-3 py-2 text-sm',
                  $route.path === '/courses' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:bg-gray-600 hover:text-white'
                ]"
              >
                課程列表
              </router-link>
              <router-link
                to="/courses/create"
                :class="[
                  'block rounded-md px-3 py-2 text-sm',
                  $route.path === '/courses/create' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:bg-gray-600 hover:text-white'
                ]"
              >
                新增課程
              </router-link>
            </div>
          </div>
        </div>
      </nav>
    </div>

    <!-- 主要內容區域 -->
    <div class="ml-64 min-h-screen pt-16">
      <!-- 頁面內容 -->
      <main class="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authSupabase'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 菜單狀態
const studentMenuOpen = ref(false)
const courseMenuOpen = ref(false)

const user = computed(() => authStore.user)

const pageTitle = computed(() => {
  return route.meta.title || 'OpenERP管理系統'
})

// 根據當前路由自動展開對應菜單
watch(() => route.path, (newPath) => {
  // 只展開當前路由對應的菜單，其他保持不變
  if (newPath.startsWith('/students')) {
    studentMenuOpen.value = true
    courseMenuOpen.value = false
  } else if (newPath.startsWith('/courses')) {
    courseMenuOpen.value = true
    studentMenuOpen.value = false
  } else {
    // 在儀表板或其他頁面時，保持菜單收縮
    studentMenuOpen.value = false
    courseMenuOpen.value = false
  }
}, { immediate: true })

function toggleStudentMenu() {
  studentMenuOpen.value = !studentMenuOpen.value
  // 展開學生菜單時，收縮課程菜單
  if (studentMenuOpen.value) {
    courseMenuOpen.value = false
  }
}

function toggleCourseMenu() {
  courseMenuOpen.value = !courseMenuOpen.value
  // 展開課程菜單時，收縮學生菜單
  if (courseMenuOpen.value) {
    studentMenuOpen.value = false
  }
}

async function handleLogout() {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('登出失敗:', error)
  }
}
</script>
