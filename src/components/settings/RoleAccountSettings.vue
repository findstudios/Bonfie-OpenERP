<template>
  <div class="space-y-6">
    <div class="border-b border-gray-200 pb-4">
      <h2 class="text-xl font-semibold text-gray-900">角色/帳密設定</h2>
      <p class="mt-1 text-gray-600">管理系統用戶角色與帳號密碼</p>
    </div>

    <!-- 角色管理 -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">角色管理</h3>

      <div class="rounded-lg bg-gray-50 p-4">
        <div class="mb-4 flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700">現有角色</span>
          <SmartButton
            @click="showCreateRoleModal = true"
            variant="primary"
            size="sm"
          >
            <PlusIcon class="mr-2 size-4" />
            新增角色
          </SmartButton>
        </div>

        <div class="space-y-3">
          <div
            v-for="role in roles"
            :key="role.id"
            class="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3">
                  <span
                    :class="[
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      role.role_code === 'ADMIN' ? 'bg-red-100 text-red-800' :
                      role.role_code === 'STAFF' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    ]"
                  >
                    {{ role.role_name }}
                  </span>
                  <span class="text-sm text-gray-500">{{ role.role_code }}</span>
                </div>
                <p class="mt-1 text-sm text-gray-600">{{ role.description }}</p>
                <div class="mt-2 flex items-center space-x-4">
                  <span class="text-xs text-gray-500">
                    用戶數量: {{ getUserCountByRole(role.id) }}
                  </span>
                  <span
                    :class="[
                      'text-xs',
                      role.is_active ? 'text-green-600' : 'text-gray-400'
                    ]"
                  >
                    {{ role.is_active ? '啟用' : '停用' }}
                  </span>
                </div>
              </div>

              <div class="flex items-center space-x-2">
                <SmartButton
                  @click="editRole(role)"
                  variant="secondary"
                  size="sm"
                >
                  編輯
                </SmartButton>
                <SmartButton
                  @click="toggleRoleStatus(role)"
                  :variant="role.is_active ? 'danger' : 'success'"
                  size="sm"
                >
                  {{ role.is_active ? '停用' : '啟用' }}
                </SmartButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 帳號管理 -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">帳號管理</h3>

      <div class="rounded-lg bg-gray-50 p-4">
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <span class="text-sm font-medium text-gray-700">系統帳號</span>
            <select
              v-model="selectedRoleFilter"
              class="rounded-md border border-gray-300 px-3 py-1 text-sm"
            >
              <option value="">所有角色</option>
              <option v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.role_name }}
              </option>
            </select>
          </div>
          <SmartButton
            @click="showCreateUserModal = true"
            variant="primary"
            size="sm"
          >
            <PlusIcon class="mr-2 size-4" />
            新增帳號
          </SmartButton>
        </div>

        <ResponsiveTable
          :columns="userColumns"
          :data="filteredUsers"
          :loading="loading"
        >
          <template #status="{ item }">
            <span
              :class="[
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              ]"
            >
              {{ item.status === 'active' ? '啟用' : '停用' }}
            </span>
          </template>

          <template #role="{ item }">
            <span
              :class="[
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                item.role?.role_code === 'ADMIN' ? 'bg-red-100 text-red-800' :
                item.role?.role_code === 'STAFF' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              ]"
            >
              {{ item.role?.role_name || '未分配' }}
            </span>
          </template>

          <template #actions="{ item }">
            <div class="flex items-center space-x-2">
              <SmartButton
                @click="resetPassword(item)"
                variant="secondary"
                size="sm"
              >
                重置密碼
              </SmartButton>
              <SmartButton
                @click="editUser(item)"
                variant="secondary"
                size="sm"
              >
                編輯
              </SmartButton>
              <SmartButton
                @click="toggleUserStatus(item)"
                :variant="item.status === 'active' ? 'danger' : 'success'"
                size="sm"
              >
                {{ item.status === 'active' ? '停用' : '啟用' }}
              </SmartButton>
            </div>
          </template>
        </ResponsiveTable>
      </div>
    </div>

    <!-- 密碼政策設定 -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">密碼政策</h3>

      <div class="rounded-lg bg-gray-50 p-4">
        <SmartForm
          :fields="passwordPolicyFields"
          v-model="passwordPolicy"
          @submit="savePasswordPolicy"
        >
          <template #actions>
            <SmartButton
              type="submit"
              variant="primary"
              :loading="savingPolicy"
            >
              儲存密碼政策
            </SmartButton>
          </template>
        </SmartForm>
      </div>
    </div>

    <!-- 建立角色彈窗 -->
    <ConfirmDialog
      v-model="showCreateRoleModal"
      title="新增角色"
      :show-cancel="false"
      :show-confirm="false"
    >
      <SmartForm
        :fields="roleFormFields"
        v-model="newRole"
        @submit="createRole"
      >
        <template #actions>
          <div class="flex space-x-3">
            <SmartButton
              @click="showCreateRoleModal = false"
              variant="secondary"
            >
              取消
            </SmartButton>
            <SmartButton
              type="submit"
              variant="primary"
              :loading="creating"
            >
              建立角色
            </SmartButton>
          </div>
        </template>
      </SmartForm>
    </ConfirmDialog>

    <!-- 建立用戶彈窗 -->
    <ConfirmDialog
      v-model="showCreateUserModal"
      title="新增帳號"
      :show-cancel="false"
      :show-confirm="false"
    >
      <SmartForm
        :fields="userFormFields"
        v-model="newUser"
        @submit="createUser"
      >
        <template #actions>
          <div class="flex space-x-3">
            <SmartButton
              @click="showCreateUserModal = false"
              variant="secondary"
            >
              取消
            </SmartButton>
            <SmartButton
              type="submit"
              variant="primary"
              :loading="creating"
            >
              建立帳號
            </SmartButton>
          </div>
        </template>
      </SmartForm>
    </ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
import SmartButton from '@/components/ui/SmartButton.vue'
import SmartForm from '@/components/ui/SmartForm.vue'
import ResponsiveTable from '@/components/common/ResponsiveTable.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { db } from '@/services/supabase'

const emit = defineEmits(['save'])

// 狀態管理
const loading = ref(false)
const creating = ref(false)
const savingPolicy = ref(false)
const showCreateRoleModal = ref(false)
const showCreateUserModal = ref(false)
const selectedRoleFilter = ref('')

// 調試：監控對話框狀態變化
import { watch } from 'vue'
watch(showCreateUserModal, (newVal) => {
  console.log('showCreateUserModal 變化:', newVal)
})
watch(showCreateRoleModal, (newVal) => {
  console.log('showCreateRoleModal 變化:', newVal)
})

// 資料
const roles = ref([
  {
    id: 1,
    role_code: 'ADMIN',
    role_name: '系統管理員',
    description: '具有所有系統權限的最高管理員',
    is_active: true,
    created_at: '2024-01-01'
  },
  {
    id: 2,
    role_code: 'STAFF',
    role_name: '櫃台人員',
    description: '負責日常行政工作的櫃台人員',
    is_active: true,
    created_at: '2024-01-01'
  },
  {
    id: 3,
    role_code: 'TEACHER',
    role_name: '教師',
    description: '負責教學工作的教師',
    is_active: true,
    created_at: '2024-01-01'
  }
])

const users = ref([
  {
    id: 1,
    user_id: 'U001',
    username: 'admin',
    full_name: '系統管理員',
    email: 'admin@example.com',
    role_id: 1,
    role: { role_code: 'ADMIN', role_name: '系統管理員' },
    status: 'active',
    last_login_at: '2024-01-15T10:30:00Z',
    created_at: '2024-01-01'
  },
  {
    id: 2,
    user_id: 'U002',
    username: 'staff',
    full_name: '櫃台人員',
    email: 'staff@example.com',
    role_id: 2,
    role: { role_code: 'STAFF', role_name: '櫃台人員' },
    status: 'active',
    last_login_at: '2024-01-14T14:20:00Z',
    created_at: '2024-01-02'
  }
])

const passwordPolicy = ref({
  min_length: 8,
  require_uppercase: true,
  require_lowercase: true,
  require_numbers: true,
  require_special_chars: false,
  max_age_days: 90,
  prevent_reuse: 5,
  lockout_attempts: 5
})

// 新建表單資料
const newRole = ref({
  role_code: '',
  role_name: '',
  description: '',
  is_active: true
})

const newUser = ref({
  username: '',
  full_name: '',
  email: '',
  role_id: null,
  password: '',
  status: 'active'
})

// 表格欄位
const userColumns = computed(() => [
  { key: 'user_id', label: '用戶ID', sortable: true },
  { key: 'username', label: '用戶名稱', sortable: true },
  { key: 'full_name', label: '姓名', sortable: true },
  { key: 'email', label: '電子郵件' },
  { key: 'role', label: '角色' },
  { key: 'status', label: '狀態' },
  { key: 'last_login_at', label: '最後登入', sortable: true },
  { key: 'actions', label: '操作' }
])

// 表單欄位
const roleFormFields = computed(() => [
  {
    key: 'role_code',
    label: '角色代碼',
    type: 'text',
    required: true,
    placeholder: '例如：MANAGER'
  },
  {
    key: 'role_name',
    label: '角色名稱',
    type: 'text',
    required: true,
    placeholder: '例如：部門經理'
  },
  {
    key: 'description',
    label: '描述',
    type: 'textarea',
    placeholder: '描述此角色的職責與權限範圍'
  }
])

const userFormFields = computed(() => [
  {
    key: 'username',
    label: '用戶名稱',
    type: 'text',
    required: true,
    placeholder: '登入用戶名'
  },
  {
    key: 'full_name',
    label: '真實姓名',
    type: 'text',
    required: true,
    placeholder: '用戶的真實姓名'
  },
  {
    key: 'email',
    label: '電子郵件',
    type: 'email',
    required: true,
    placeholder: 'user@example.com'
  },
  {
    key: 'role_id',
    label: '角色',
    type: 'select',
    required: true,
    options: roles.value.map(role => ({
      value: role.id,
      label: role.role_name
    }))
  },
  {
    key: 'password',
    label: '密碼',
    type: 'password',
    required: true,
    placeholder: '設定初始密碼'
  }
])

const passwordPolicyFields = computed(() => [
  {
    key: 'min_length',
    label: '最小長度',
    type: 'number',
    min: 6,
    max: 20
  },
  {
    key: 'require_uppercase',
    label: '需要大寫字母',
    type: 'checkbox'
  },
  {
    key: 'require_lowercase',
    label: '需要小寫字母',
    type: 'checkbox'
  },
  {
    key: 'require_numbers',
    label: '需要數字',
    type: 'checkbox'
  },
  {
    key: 'require_special_chars',
    label: '需要特殊字元',
    type: 'checkbox'
  },
  {
    key: 'max_age_days',
    label: '密碼有效期 (天)',
    type: 'number',
    min: 0,
    max: 365
  },
  {
    key: 'prevent_reuse',
    label: '防止重複使用 (次數)',
    type: 'number',
    min: 0,
    max: 20
  },
  {
    key: 'lockout_attempts',
    label: '鎖定前嘗試次數',
    type: 'number',
    min: 3,
    max: 10
  }
])

// 計算屬性
const filteredUsers = computed(() => {
  if (!selectedRoleFilter.value) return users.value
  return users.value.filter(user => user.role_id === parseInt(selectedRoleFilter.value))
})

// 方法
const getUserCountByRole = (roleId: number) => {
  return users.value.filter(user => user.role_id === roleId).length
}

const editRole = (role: any) => {
  console.log('編輯角色:', role)
  // TODO: 實現編輯角色功能
}

const toggleRoleStatus = async (role: any) => {
  role.is_active = !role.is_active
  console.log('切換角色狀態:', role)
  // TODO: 實際更新資料庫
}

const editUser = (user: any) => {
  console.log('編輯用戶:', user)
  // TODO: 實現編輯用戶功能
}

const resetPassword = async (user: any) => {
  console.log('重置密碼:', user)
  // TODO: 實現重置密碼功能
}

const toggleUserStatus = async (user: any) => {
  user.status = user.status === 'active' ? 'inactive' : 'active'
  console.log('切換用戶狀態:', user)
  // TODO: 實際更新資料庫
}

const createRole = async () => {
  creating.value = true
  try {
    console.log('建立角色:', newRole.value)
    // TODO: 實際建立角色
    showCreateRoleModal.value = false
    emit('save', 'role', newRole.value)
  } catch (error) {
    console.error('建立角色失敗:', error)
  } finally {
    creating.value = false
  }
}

const createUser = async () => {
  creating.value = true
  try {
    console.log('建立用戶:', newUser.value)
    // TODO: 實際建立用戶
    showCreateUserModal.value = false
    emit('save', 'user', newUser.value)
  } catch (error) {
    console.error('建立用戶失敗:', error)
  } finally {
    creating.value = false
  }
}

const savePasswordPolicy = async () => {
  savingPolicy.value = true
  try {
    console.log('儲存密碼政策:', passwordPolicy.value)
    emit('save', 'password-policy', passwordPolicy.value)
  } catch (error) {
    console.error('儲存密碼政策失敗:', error)
  } finally {
    savingPolicy.value = false
  }
}

onMounted(() => {
  // 載入資料
  console.log('RoleAccountSettings 組件已掛載')
  console.log('showCreateUserModal:', showCreateUserModal.value)
  console.log('showCreateRoleModal:', showCreateRoleModal.value)
})
</script>
