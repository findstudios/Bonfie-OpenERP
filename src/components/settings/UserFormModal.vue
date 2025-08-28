<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
    <div class="w-full max-w-md rounded-lg bg-white p-6">
      <h3 class="mb-4 text-lg font-semibold text-gray-900">
        {{ editingUser ? '編輯用戶' : '新增用戶' }}
      </h3>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- 頭像上傳 -->
        <div class="flex justify-center">
          <div class="relative">
            <div class="flex size-24 items-center justify-center overflow-hidden rounded-full bg-gray-300">
              <img
                v-if="avatarUpload.preview.value || modal.formData.value.avatar_url"
                :src="avatarUpload.preview.value || modal.formData.value.avatar_url"
                :alt="modal.formData.value.full_name || '頭像'"
                class="size-full object-cover"
              />
              <UserIcon v-else class="size-12 text-gray-600" />
            </div>
            <label class="absolute bottom-0 right-0 cursor-pointer rounded-full bg-blue-600 p-2 transition-colors hover:bg-blue-700">
              <PlusIcon class="size-4 text-white" />
              <input
                type="file"
                accept="image/*"
                @change="avatarUpload.handleFileChange"
                class="hidden"
              />
            </label>
          </div>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            帳號 *
          </label>
          <input
            v-model="modal.formData.value.username"
            type="text"
            required
            :disabled="!!editingUser"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="請輸入帳號"
          />
        </div>

        <div v-if="!editingUser">
          <label class="mb-1 block text-sm font-medium text-gray-700">
            密碼 *
          </label>
          <input
            v-model="modal.formData.value.password"
            type="password"
            required
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            placeholder="請輸入密碼"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            姓名 *
          </label>
          <input
            v-model="modal.formData.value.full_name"
            type="text"
            required
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            placeholder="請輸入姓名"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            角色 *
          </label>
          <select
            v-model="modal.formData.value.role_id"
            required
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">請選擇角色</option>
            <option v-for="role in roles" :key="role.id" :value="role.id">
              {{ role.role_name }}
            </option>
          </select>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            電話
          </label>
          <input
            v-model="modal.formData.value.phone"
            type="tel"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            placeholder="請輸入電話"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            電子郵件
          </label>
          <input
            v-model="modal.formData.value.email"
            type="email"
            class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            placeholder="請輸入電子郵件"
          />
        </div>

        <div v-if="modal.error.value" class="text-sm text-red-600">
          {{ modal.error.value }}
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            @click="modal.close()"
            class="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="submit"
            class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            :disabled="modal.isSubmitting.value"
          >
            {{ modal.isSubmitting.value ? '儲存中...' : '儲存' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UserIcon, PlusIcon } from '@heroicons/vue/24/outline'

interface Props {
  modal: any
  avatarUpload: any
  roles: any[]
  editingUser: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: []
}>()

const handleSubmit = () => {
  emit('save')
}
</script>
