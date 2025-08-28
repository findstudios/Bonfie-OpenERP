<template>
  <div class="space-y-8">
    <!-- 頁面標題 -->
    <div class="border-b border-gray-200 pb-4">
      <h1 class="text-3xl font-bold text-gray-900">系統設定</h1>
      <p class="mt-2 text-gray-600">管理系統核心設定，僅限最高權限管理員</p>
    </div>

    <!-- 設定分類 -->
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <!-- 側邊選單 -->
      <div class="lg:col-span-1">
        <nav class="space-y-2">
          <button
            v-for="category in settingCategories"
            :key="category.key"
            @click="activeCategory = category.key"
            :class="[
              'w-full rounded-lg px-4 py-3 text-left transition-colors duration-200',
              activeCategory === category.key
                ? 'border-l-4 border-blue-500 bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            ]"
          >
            <div class="flex items-center space-x-3">
              <component :is="category.icon" class="size-5" />
              <span class="font-medium">{{ category.name }}</span>
            </div>
          </button>
        </nav>
      </div>

      <!-- 設定內容 -->
      <div class="lg:col-span-2">
        <div class="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div class="p-6">
            <!-- 角色/帳密設定 -->
            <RoleAccountSettings
              v-if="activeCategory === 'roles'"
              @save="handleSaveSettings"
            />

            <!-- 教室設定 -->
            <ClassroomSettings
              v-if="activeCategory === 'classrooms'"
              @save="handleSaveSettings"
            />

            <!-- 系統權限設定 -->
            <SystemPermissions
              v-if="activeCategory === 'permissions'"
              @save="handleSaveSettings"
            />

            <!-- 備份還原 -->
            <BackupRestore
              v-if="activeCategory === 'backup'"
              @backup="handleBackup"
              @restore="handleRestore"
            />

            <!-- 安全設定 -->
            <SecuritySettings
              v-if="activeCategory === 'security'"
              @save="handleSaveSettings"
            />

            <!-- 系統監控 -->
            <SystemMonitoring
              v-if="activeCategory === 'monitoring'"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 儲存提示 -->
    <div v-if="showSaveNotice" class="fixed bottom-4 right-4 z-50">
      <div class="flex items-center space-x-2 rounded-lg bg-green-500 px-6 py-3 text-white shadow-lg">
        <CheckIcon class="size-5" />
        <span>設定已儲存</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authSupabase'
import {
  UserGroupIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  ServerIcon,
  LockClosedIcon,
  ChartBarIcon,
  CheckIcon
} from '@heroicons/vue/24/outline'

// 子組件
import RoleAccountSettings from './RoleAccountSettings.vue'
import ClassroomSettings from './ClassroomSettings.vue'
import SystemPermissions from './SystemPermissions.vue'
import BackupRestore from './BackupRestore.vue'
import SecuritySettings from './SecuritySettings.vue'
import SystemMonitoring from './SystemMonitoring.vue'

const authStore = useAuthStore()

// 當前選中的分類
const activeCategory = ref<string>('roles')

// 調試信息
console.log('SystemSettingsModule 初始化，activeCategory:', activeCategory.value)

// 儲存提示
const showSaveNotice = ref(false)

// 設定分類
const settingCategories = computed(() => [
  {
    key: 'roles',
    name: '角色/帳密設定',
    icon: UserGroupIcon
  },
  {
    key: 'classrooms',
    name: '教室設定',
    icon: BuildingOffice2Icon
  },
  {
    key: 'permissions',
    name: '系統權限',
    icon: ShieldCheckIcon
  },
  {
    key: 'backup',
    name: '備份還原',
    icon: ServerIcon
  },
  {
    key: 'security',
    name: '安全設定',
    icon: LockClosedIcon
  },
  {
    key: 'monitoring',
    name: '系統監控',
    icon: ChartBarIcon
  }
])

// 權限檢查 - 確保只有 ADMIN 可以訪問
const hasAdminAccess = computed(() => {
  return authStore.hasRole('ADMIN')
})

// 處理設定儲存
const handleSaveSettings = (category: string, data: any) => {
  console.log(`儲存 ${category} 設定:`, data)
  showSaveNotice.value = true
  setTimeout(() => {
    showSaveNotice.value = false
  }, 3000)

  // TODO: 實際儲存邏輯
}

// 處理備份
const handleBackup = () => {
  console.log('開始系統備份...')
  // TODO: 實際備份邏輯
}

// 處理還原
const handleRestore = (backupFile: File) => {
  console.log('開始系統還原:', backupFile.name)
  // TODO: 實際還原邏輯
}

// 如果不是管理員，重定向或顯示錯誤
if (!hasAdminAccess.value) {
  console.error('權限不足：需要管理員權限才能訪問系統設定')
}
</script>

<style scoped>
.card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200;
}
</style>
