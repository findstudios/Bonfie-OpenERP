<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">用戶權限管理</h3>
      <button
        @click="userManagement.openCreateForm()"
        class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        <PlusIcon class="mr-2 size-4" />
        新增用戶
      </button>
    </div>

    <!-- 用戶列表 -->
    <div class="overflow-hidden bg-white shadow sm:rounded-md">
      <ul class="divide-y divide-gray-200">
        <li v-for="user in userManagement.users.value" :key="user.user_id" class="px-6 py-4 hover:bg-gray-50">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="shrink-0">
                <div class="flex size-10 items-center justify-center overflow-hidden rounded-full bg-gray-300">
                  <img
                    v-if="user.avatar_url"
                    :src="user.avatar_url"
                    :alt="user.full_name"
                    class="size-full object-cover"
                  />
                  <UserIcon v-else class="size-6 text-gray-600" />
                </div>
              </div>
              <div class="ml-4">
                <div class="text-sm font-medium text-gray-900">{{ user.full_name }}</div>
                <div class="text-sm text-gray-500">@{{ user.username }}</div>
              </div>
              <div class="ml-6">
                <span :class="[
                  'rounded-full px-2 py-1 text-xs font-medium',
                  userManagement.getRoleBadgeClass(user.roles?.role_name || '')
                ]">
                  {{ user.roles?.role_name || '未設定' }}
                </span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="userManagement.openEditForm(user)"
                class="text-blue-600 hover:text-blue-900"
              >
                <PencilIcon class="size-5" />
              </button>
              <button
                @click="handleToggleStatus(user)"
                :class="[
                  'text-sm font-medium',
                  user.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                ]"
              >
                {{ user.status === 'active' ? '停用' : '啟用' }}
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- 權限說明 -->
    <div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div class="flex">
        <InformationCircleIcon class="mr-3 mt-0.5 size-5 text-blue-400" />
        <div>
          <h4 class="text-sm font-medium text-blue-800">權限說明</h4>
          <div class="mt-2 text-sm text-blue-700">
            <ul class="list-inside list-disc space-y-1">
              <li><strong>管理員</strong>：擁有所有功能的完整權限，包含系統設定</li>
              <li><strong>職員</strong>：負責日常營運管理，無法修改系統設定</li>
              <li><strong>教師</strong>：
                <ul class="ml-4 mt-1 list-inside list-disc">
                  <li>可以查看：儀表板、學生資料、課程、課表</li>
                  <li>可以操作：點名（出勤管理）</li>
                  <li>無法存取：聯絡人、訂單、收費、客戶關係、報表分析、系統設定</li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <PermissionMatrix :modules="permissionModules" />
  </div>
</template>

<script setup lang="ts">
import { PlusIcon, UserIcon, PencilIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import PermissionMatrix from './PermissionMatrix.vue'
import type { User } from '@/composables/useUserManagement'

interface Props {
  userManagement: any
  permissionModules: Array<{
    name: string
    admin: boolean
    staff: boolean
    teacher: boolean
  }>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'toggle-status': [user: User]
}>()

const handleToggleStatus = async (user: User) => {
  await props.userManagement.toggleUserStatus(user)
}
</script>
