<template>
  <div class="space-y-6">
    <div class="border-b border-gray-200 pb-4">
      <h2 class="text-xl font-semibold text-gray-900">系統權限設定</h2>
      <p class="mt-1 text-gray-600">配置各角色的系統權限與訪問控制</p>
    </div>

    <!-- 權限總覽 -->
    <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div class="text-2xl font-bold text-blue-600">{{ totalPermissions }}</div>
        <div class="text-sm text-blue-700">總權限數量</div>
      </div>
      <div class="rounded-lg border border-green-200 bg-green-50 p-4">
        <div class="text-2xl font-bold text-green-600">{{ totalRoles }}</div>
        <div class="text-sm text-green-700">總角色數量</div>
      </div>
      <div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div class="text-2xl font-bold text-yellow-600">{{ customPermissions }}</div>
        <div class="text-sm text-yellow-700">自訂權限</div>
      </div>
    </div>

    <!-- 角色權限矩陣 -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">角色權限矩陣</h3>
        <div class="flex space-x-2">
          <SmartButton
            @click="showCreatePermissionModal = true"
            variant="primary"
            size="sm"
          >
            <PlusIcon class="mr-2 size-4" />
            新增權限
          </SmartButton>
          <SmartButton
            @click="exportPermissions"
            variant="secondary"
            size="sm"
          >
            匯出設定
          </SmartButton>
        </div>
      </div>

      <div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div v-if="loading" class="p-8 text-center">
          <div class="mx-auto size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p class="mt-2 text-gray-600">載入權限資料中...</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="sticky left-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  權限項目
                </th>
                <th
                  v-for="role in roles"
                  :key="role.id"
                  class="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  <div class="flex flex-col items-center">
                    <span>{{ role.role_name }}</span>
                    <span class="font-normal normal-case text-gray-400">({{ role.role_code }})</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr
                v-for="category in permissionCategories"
                :key="category.name"
                class="bg-gray-50"
              >
                <td colspan="100%" class="px-6 py-2 text-sm font-semibold text-gray-700">
                  {{ category.name }}
                </td>
              </tr>
              <tr
                v-for="permission in category.permissions"
                :key="permission.key"
                class="hover:bg-gray-50"
              >
                <td class="sticky left-0 bg-white px-6 py-4 text-sm text-gray-900">
                  <div>
                    <div class="font-medium">{{ permission.name }}</div>
                    <div class="text-xs text-gray-500">{{ permission.description }}</div>
                    <div class="text-xs text-gray-400">{{ permission.key }}</div>
                  </div>
                </td>
                <td
                  v-for="role in roles"
                  :key="role.id"
                  class="px-6 py-4 text-center"
                >
                  <input
                    type="checkbox"
                    :checked="hasPermission(role.id, permission.key)"
                    @change="togglePermission(role.id, permission.key)"
                    :disabled="!canEditRole(role.role_code)"
                    class="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>

    <!-- 快速權限模板 -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">權限模板</h3>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div
          v-for="template in permissionTemplates"
          :key="template.id"
          class="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
        >
          <h4 class="mb-2 font-semibold text-gray-900">{{ template.name }}</h4>
          <p class="mb-3 text-sm text-gray-600">{{ template.description }}</p>
          <div class="mb-3 text-xs text-gray-500">
            包含 {{ template.permissions.length }} 項權限
          </div>
          <SmartButton
            @click="applyTemplate(template)"
            variant="outline"
            size="sm"
            class="w-full"
          >
            套用模板
          </SmartButton>
        </div>
      </div>
    </div>

    <!-- 權限日誌 -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">權限變更日誌</h3>

      <div class="rounded-lg border border-gray-200 bg-white">
        <div class="border-b border-gray-200 p-4">
          <div class="flex space-x-4">
            <input
              v-model="logFilter"
              type="text"
              placeholder="搜尋日誌..."
              class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              v-model="logTypeFilter"
              class="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">所有類型</option>
              <option value="grant">授權</option>
              <option value="revoke">撤銷</option>
              <option value="create">建立</option>
              <option value="delete">刪除</option>
            </select>
          </div>
        </div>

        <div class="max-h-96 overflow-y-auto">
          <div
            v-for="log in filteredLogs"
            :key="log.id"
            class="border-b border-gray-100 p-4 hover:bg-gray-50"
          >
            <div class="flex items-start justify-between">
              <div>
                <div class="text-sm font-medium text-gray-900">
                  {{ log.action_description }}
                </div>
                <div class="mt-1 text-xs text-gray-500">
                  操作者: {{ log.user_name }} |
                  目標: {{ log.target_type }} - {{ log.target_name }}
                </div>
              </div>
              <div class="text-xs text-gray-400">
                {{ formatDateTime(log.created_at) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增權限彈窗 -->
    <ConfirmDialog
      v-model="showCreatePermissionModal"
      title="新增權限"
      :show-cancel="false"
      :show-confirm="false"
    >
      <SmartForm
        :fields="permissionFormFields"
        v-model="newPermission"
        @submit="createPermission"
      >
        <template #actions>
          <div class="flex space-x-3">
            <SmartButton
              @click="showCreatePermissionModal = false"
              variant="secondary"
            >
              取消
            </SmartButton>
            <SmartButton
              type="submit"
              variant="primary"
              :loading="creating"
            >
              建立權限
            </SmartButton>
          </div>
        </template>
      </SmartForm>
    </ConfirmDialog>

    <!-- 套用模板確認彈窗 -->
    <ConfirmDialog
      v-model="showTemplateModal"
      title="套用權限模板"
      confirm-text="套用"
      cancel-text="取消"
      @confirm="confirmApplyTemplate"
    >
      <div v-if="selectedTemplate">
        <p class="mb-4">確定要套用「{{ selectedTemplate.name }}」模板嗎？</p>
        <div class="mb-4 rounded-lg bg-gray-50 p-3">
          <h4 class="mb-2 font-medium text-gray-900">將套用到角色：</h4>
          <div class="space-y-2">
            <label
              v-for="role in roles"
              :key="role.id"
              class="flex items-center"
            >
              <input
                v-model="templateTargetRoles"
                :value="role.id"
                type="checkbox"
                class="mr-2"
              />
              <span>{{ role.role_name }}</span>
            </label>
          </div>
        </div>
        <div class="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p class="text-sm text-yellow-800">
            <strong>注意：</strong>套用模板會覆蓋現有權限設定
          </p>
        </div>
      </div>
    </ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
import SmartButton from '@/components/ui/SmartButton.vue'
import SmartForm from '@/components/ui/SmartForm.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useAuthStore } from '@/stores/authSupabase'
import { db } from '@/services/supabase'

const emit = defineEmits(['save'])
const authStore = useAuthStore()

// 狀態管理
const creating = ref(false)
const loading = ref(false)
const showCreatePermissionModal = ref(false)
const showTemplateModal = ref(false)
const logFilter = ref('')
const logTypeFilter = ref('')

// 選中的模板
const selectedTemplate = ref<any>(null)
const templateTargetRoles = ref<number[]>([])

// 角色資料
const roles = ref<any[]>([])

// 權限分類與項目
const permissionCategories = ref([
  {
    name: '學生管理',
    permissions: [
      { key: 'student.create', name: '新增學生', description: '建立新的學生資料' },
      { key: 'student.read', name: '查看學生', description: '查看學生資料與詳情' },
      { key: 'student.update', name: '編輯學生', description: '修改學生資料' },
      { key: 'student.delete', name: '刪除學生', description: '刪除學生資料' },
      { key: 'student.export', name: '匯出學生資料', description: '匯出學生資料到文件' }
    ]
  },
  {
    name: '課程管理',
    permissions: [
      { key: 'course.create', name: '新增課程', description: '建立新的課程' },
      { key: 'course.read', name: '查看課程', description: '查看課程資料與詳情' },
      { key: 'course.update', name: '編輯課程', description: '修改課程資料' },
      { key: 'course.delete', name: '刪除課程', description: '刪除課程資料' },
      { key: 'course.schedule', name: '課程排程', description: '管理課程時間安排' }
    ]
  },
  {
    name: '訂單管理',
    permissions: [
      { key: 'order.create', name: '新增訂單', description: '建立新的訂單' },
      { key: 'order.read', name: '查看訂單', description: '查看訂單資料' },
      { key: 'order.update', name: '編輯訂單', description: '修改訂單資料' },
      { key: 'order.delete', name: '刪除訂單', description: '刪除訂單資料' },
      { key: 'order.refund', name: '訂單退款', description: '處理訂單退款' }
    ]
  },
  {
    name: '系統管理',
    permissions: [
      { key: 'system.settings', name: '系統設定', description: '修改系統設定' },
      { key: 'system.backup', name: '系統備份', description: '建立與還原系統備份' },
      { key: 'system.logs', name: '系統日誌', description: '查看系統日誌' },
      { key: 'system.users', name: '用戶管理', description: '管理系統用戶' },
      { key: 'system.roles', name: '角色管理', description: '管理用戶角色' }
    ]
  },
  {
    name: '報表統計',
    permissions: [
      { key: 'report.view', name: '查看報表', description: '查看各種統計報表' },
      { key: 'report.export', name: '匯出報表', description: '匯出報表到文件' },
      { key: 'report.create', name: '建立報表', description: '建立自訂報表' }
    ]
  }
])

// 權限模板
const permissionTemplates = ref([
  {
    id: 1,
    name: '管理員模板',
    description: '完整系統管理權限',
    permissions: ['student.*', 'course.*', 'order.*', 'system.*', 'report.*']
  },
  {
    id: 2,
    name: '櫃台人員模板',
    description: '基本業務操作權限',
    permissions: ['student.create', 'student.read', 'student.update', 'course.read', 'order.*', 'report.view']
  },
  {
    id: 3,
    name: '教師模板',
    description: '教學相關權限',
    permissions: ['student.read', 'course.read', 'course.schedule', 'report.view']
  }
])

// 權限變更日誌
const permissionLogs = ref([
  {
    id: 1,
    action_type: 'grant',
    action_description: '授予「學生管理」權限給櫃台人員角色',
    user_name: '系統管理員',
    target_type: '角色',
    target_name: '櫃台人員',
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    action_type: 'revoke',
    action_description: '撤銷教師角色的「訂單刪除」權限',
    user_name: '系統管理員',
    target_type: '角色',
    target_name: '教師',
    created_at: '2024-01-14T16:45:00Z'
  }
])

// 新建權限表單
const newPermission = ref({
  key: '',
  name: '',
  description: '',
  category: '',
  is_dangerous: false
})

// 表單欄位
const permissionFormFields = computed(() => [
  {
    key: 'key',
    label: '權限代碼',
    type: 'text',
    required: true,
    placeholder: '例如：student.create'
  },
  {
    key: 'name',
    label: '權限名稱',
    type: 'text',
    required: true,
    placeholder: '例如：新增學生'
  },
  {
    key: 'description',
    label: '權限描述',
    type: 'textarea',
    required: true,
    placeholder: '詳細描述此權限的作用'
  },
  {
    key: 'category',
    label: '權限分類',
    type: 'select',
    required: true,
    options: permissionCategories.value.map(cat => ({
      value: cat.name,
      label: cat.name
    }))
  },
  {
    key: 'is_dangerous',
    label: '危險權限',
    type: 'checkbox',
    help: '標記為危險權限需要特殊審核'
  }
])

// 計算屬性
const totalPermissions = computed(() => {
  return permissionCategories.value.reduce((total, cat) => total + cat.permissions.length, 0)
})

const totalRoles = computed(() => roles.value.length)

const customPermissions = computed(() => {
  // TODO: 計算自訂權限數量
  return 0
})

const filteredLogs = computed(() => {
  let filtered = permissionLogs.value

  if (logFilter.value) {
    const filter = logFilter.value.toLowerCase()
    filtered = filtered.filter(log =>
      log.action_description.toLowerCase().includes(filter) ||
      log.user_name.toLowerCase().includes(filter) ||
      log.target_name.toLowerCase().includes(filter)
    )
  }

  if (logTypeFilter.value) {
    filtered = filtered.filter(log => log.action_type === logTypeFilter.value)
  }

  return filtered
})

// 方法
const loadRoles = async () => {
  loading.value = true
  try {
    const rolesData = await db.findMany('roles', {
      columns: 'id, role_code, role_name, permissions, description, is_active',
      filters: { is_active: true },
      orderBy: 'role_name'
    })

    roles.value = rolesData.map(role => ({
      ...role,
      permissions: role.permissions || {}
    }))

    console.log('載入角色數據成功:', roles.value)
  } catch (error) {
    console.error('載入角色數據失敗:', error)
  } finally {
    loading.value = false
  }
}

const hasPermission = (roleId: number, permissionKey: string): boolean => {
  const role = roles.value.find(r => r.id === roleId)
  return role?.permissions[permissionKey] === true
}

const togglePermission = async (roleId: number, permissionKey: string) => {
  const role = roles.value.find(r => r.id === roleId)
  if (role) {
    // 更新本地狀態
    role.permissions[permissionKey] = !role.permissions[permissionKey]

    try {
      // 更新資料庫
      await db.update('roles', roleId, {
        permissions: role.permissions,
        updated_at: new Date().toISOString()
      })

      console.log(`權限更新成功: ${role.role_name} - ${permissionKey} = ${role.permissions[permissionKey]}`)
      emit('save', 'permissions', { roleId, permissionKey, value: role.permissions[permissionKey] })
    } catch (error) {
      console.error('權限更新失敗:', error)
      // 回滾本地狀態
      role.permissions[permissionKey] = !role.permissions[permissionKey]
    }
  }
}

const canEditRole = (roleCode: string): boolean => {
  // 只有管理員可以編輯權限
  return authStore.hasRole('ADMIN')
}

const applyTemplate = (template: any) => {
  selectedTemplate.value = template
  templateTargetRoles.value = []
  showTemplateModal.value = true
}

const confirmApplyTemplate = async () => {
  if (selectedTemplate.value && templateTargetRoles.value.length > 0) {
    try {
      const template = selectedTemplate.value
      const permissions = {}

      // 根據模板設置權限
      template.permissions.forEach((permKey: string) => {
        if (permKey.endsWith('.*')) {
          // 處理通配符權限
          const category = permKey.replace('.*', '')
          permissionCategories.value.forEach(cat => {
            cat.permissions.forEach(perm => {
              if (perm.key.startsWith(category)) {
                permissions[perm.key] = true
              }
            })
          })
        } else {
          permissions[permKey] = true
        }
      })

      // 更新選中的角色
      for (const roleId of templateTargetRoles.value) {
        const role = roles.value.find(r => r.id === roleId)
        if (role) {
          role.permissions = { ...permissions }

          await db.update('roles', roleId, {
            permissions: role.permissions,
            updated_at: new Date().toISOString()
          })
        }
      }

      console.log('模板套用成功:', template.name)
      emit('save', 'template', {
        template: selectedTemplate.value,
        targetRoles: templateTargetRoles.value
      })
    } catch (error) {
      console.error('套用模板失敗:', error)
    }
  }
  showTemplateModal.value = false
}

const createPermission = async () => {
  creating.value = true
  try {
    console.log('建立權限:', newPermission.value)
    emit('save', 'permission', newPermission.value)
    showCreatePermissionModal.value = false
  } catch (error) {
    console.error('建立權限失敗:', error)
  } finally {
    creating.value = false
  }
}

const exportPermissions = () => {
  console.log('匯出權限設定')
  // TODO: 實現匯出功能
}

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Taipei'
  })
}

// 初始化
onMounted(async () => {
  console.log('SystemPermissions 組件已掛載')
  await loadRoles()
})
</script>
