<template>
  <div class="space-y-6">
    <div class="border-b border-gray-200 pb-4">
      <h2 class="text-xl font-semibold text-gray-900">安全設定</h2>
      <p class="mt-1 text-gray-600">系統安全與訪問控制設定</p>
    </div>

    <!-- 登入安全 -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">登入安全</h3>

      <div class="rounded-lg bg-gray-50 p-4">
        <SmartForm
          :fields="loginSecurityFields"
          v-model="loginSecurity"
          @submit="saveLoginSecurity"
        >
          <template #actions>
            <SmartButton
              type="submit"
              variant="primary"
              :loading="savingSecurity"
            >
              儲存登入安全設定
            </SmartButton>
          </template>
        </SmartForm>
      </div>
    </div>

    <!-- 會話管理 -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">會話管理</h3>

      <div class="rounded-lg bg-gray-50 p-4">
        <SmartForm
          :fields="sessionFields"
          v-model="sessionConfig"
          @submit="saveSessionConfig"
        >
          <template #actions>
            <SmartButton
              type="submit"
              variant="primary"
              :loading="savingSession"
            >
              儲存會話設定
            </SmartButton>
          </template>
        </SmartForm>
      </div>
    </div>

    <!-- IP 訪問控制 -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">IP 訪問控制</h3>
        <SmartButton
          @click="showAddIPModal = true"
          variant="primary"
          size="sm"
        >
          <PlusIcon class="mr-2 size-4" />
          新增 IP 規則
        </SmartButton>
      </div>

      <ResponsiveTable
        :columns="ipRuleColumns"
        :data="ipAccessRules"
        :loading="loadingIPRules"
      >
        <template #type="{ item }">
          <span
            :class="[
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              item.type === 'allow' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            ]"
          >
            {{ item.type === 'allow' ? '允許' : '拒絕' }}
          </span>
        </template>

        <template #status="{ item }">
          <span
            :class="[
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            ]"
          >
            {{ item.is_active ? '啟用' : '停用' }}
          </span>
        </template>

        <template #actions="{ item }">
          <div class="flex items-center space-x-2">
            <SmartButton
              @click="editIPRule(item)"
              variant="secondary"
              size="sm"
            >
              編輯
            </SmartButton>
            <SmartButton
              @click="toggleIPRule(item)"
              :variant="item.is_active ? 'warning' : 'success'"
              size="sm"
            >
              {{ item.is_active ? '停用' : '啟用' }}
            </SmartButton>
            <SmartButton
              @click="deleteIPRule(item)"
              variant="danger"
              size="sm"
            >
              刪除
            </SmartButton>
          </div>
        </template>
      </ResponsiveTable>
    </div>

    <!-- 安全日誌 -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">安全日誌</h3>
        <div class="flex space-x-2">
          <select
            v-model="logTypeFilter"
            class="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">所有類型</option>
            <option value="login_attempt">登入嘗試</option>
            <option value="login_success">登入成功</option>
            <option value="login_failed">登入失敗</option>
            <option value="logout">登出</option>
            <option value="ip_blocked">IP 封鎖</option>
            <option value="suspicious_activity">可疑活動</option>
          </select>
          <SmartButton
            @click="exportSecurityLogs"
            variant="secondary"
            size="sm"
          >
            匯出日誌
          </SmartButton>
        </div>
      </div>

      <div class="max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white">
        <div v-if="loadingLogs" class="p-8 text-center">
          <div class="mx-auto size-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p class="mt-2 text-sm text-gray-600">載入安全日誌中...</p>
        </div>
        <div v-else-if="filteredSecurityLogs.length === 0" class="p-8 text-center text-gray-500">
          暫無安全日誌記錄
        </div>
        <div
          v-else
          v-for="log in filteredSecurityLogs"
          :key="log.id"
          class="border-b border-gray-100 p-4 hover:bg-gray-50"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-3">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                    getLogTypeColor(log.type)
                  ]"
                >
                  {{ getLogTypeText(log.type) }}
                </span>
                <span class="text-sm font-medium text-gray-900">{{ log.username }}</span>
              </div>
              <p class="mt-1 text-sm text-gray-600">{{ log.description }}</p>
              <div class="mt-2 text-xs text-gray-500">
                IP: {{ log.ip_address }} |
                用戶代理: {{ log.user_agent?.substring(0, 50) }}...
              </div>
            </div>
            <div class="text-xs text-gray-400">
              {{ formatDateTime(log.created_at) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 安全統計 -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">安全統計</h3>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <div class="text-2xl font-bold text-blue-600">{{ securityStats.totalLogins }}</div>
          <div class="text-sm text-gray-600">今日登入次數</div>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <div class="text-2xl font-bold text-red-600">{{ securityStats.failedLogins }}</div>
          <div class="text-sm text-gray-600">失敗登入次數</div>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <div class="text-2xl font-bold text-yellow-600">{{ securityStats.blockedIPs }}</div>
          <div class="text-sm text-gray-600">被封鎖 IP</div>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <div class="text-2xl font-bold text-green-600">{{ securityStats.activeUsers }}</div>
          <div class="text-sm text-gray-600">活躍用戶</div>
        </div>
      </div>
    </div>

    <!-- 新增 IP 規則彈窗 -->
    <ConfirmDialog
      v-model="showAddIPModal"
      title="新增 IP 訪問規則"
      :show-cancel="false"
      :show-confirm="false"
    >
      <SmartForm
        :fields="ipRuleFormFields"
        v-model="newIPRule"
        @submit="createIPRule"
      >
        <template #actions>
          <div class="flex space-x-3">
            <SmartButton
              @click="showAddIPModal = false"
              variant="secondary"
            >
              取消
            </SmartButton>
            <SmartButton
              type="submit"
              variant="primary"
              :loading="creatingIPRule"
            >
              建立規則
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
const savingSecurity = ref(false)
const savingSession = ref(false)
const loadingIPRules = ref(false)
const loadingLogs = ref(false)
const creatingIPRule = ref(false)
const showAddIPModal = ref(false)
const logTypeFilter = ref('')

// 登入安全設定
const loginSecurity = ref({
  max_login_attempts: 5,
  lockout_duration: 30,
  require_strong_password: true,
  enable_two_factor: false,
  password_expiry_days: 90,
  prevent_reuse_count: 5,
  require_captcha_after_failures: 3
})

// 會話設定
const sessionConfig = ref({
  session_timeout: 480,
  concurrent_sessions: 3,
  remember_me_duration: 2592000,
  force_logout_inactive: true,
  secure_cookies: true,
  same_site_policy: 'strict'
})

// IP 訪問規則
const ipAccessRules = ref([
  {
    id: 1,
    ip_address: '192.168.1.0/24',
    type: 'allow',
    description: '內網 IP 範圍',
    is_active: true,
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 2,
    ip_address: '203.0.113.0/24',
    type: 'deny',
    description: '惡意 IP 範圍',
    is_active: true,
    created_at: '2024-01-05T15:30:00Z'
  }
])

// 安全日誌
const securityLogs = ref<any[]>([])

// 安全統計
const securityStats = ref({
  totalLogins: 0,
  failedLogins: 0,
  blockedIPs: 0,
  activeUsers: 0
})

// 計算安全統計
const calculateStats = () => {
  const today = new Date().toDateString()
  const todayLogs = securityLogs.value.filter(log =>
    new Date(log.created_at).toDateString() === today
  )

  securityStats.value = {
    totalLogins: todayLogs.filter(log => log.type === 'login_success').length,
    failedLogins: todayLogs.filter(log => log.type === 'login_failed').length,
    blockedIPs: ipAccessRules.value.filter(rule => rule.type === 'deny' && rule.is_active).length,
    activeUsers: new Set(todayLogs.filter(log => log.type === 'login_success').map(log => log.username)).size
  }
}

// 新 IP 規則
const newIPRule = ref({
  ip_address: '',
  type: 'allow',
  description: '',
  is_active: true
})

// 表單欄位
const loginSecurityFields = computed(() => [
  {
    key: 'max_login_attempts',
    label: '最大登入嘗試次數',
    type: 'number',
    min: 3,
    max: 10,
    help: '超過此次數將暫時鎖定帳號'
  },
  {
    key: 'lockout_duration',
    label: '鎖定時長 (分鐘)',
    type: 'number',
    min: 5,
    max: 1440
  },
  {
    key: 'require_strong_password',
    label: '要求強密碼',
    type: 'checkbox',
    help: '密碼必須包含大小寫字母、數字和特殊字元'
  },
  {
    key: 'enable_two_factor',
    label: '啟用雙重驗證',
    type: 'checkbox',
    help: '要求用戶使用雙重驗證登入'
  },
  {
    key: 'password_expiry_days',
    label: '密碼有效期 (天)',
    type: 'number',
    min: 30,
    max: 365
  },
  {
    key: 'prevent_reuse_count',
    label: '防止重複使用密碼次數',
    type: 'number',
    min: 0,
    max: 20
  },
  {
    key: 'require_captcha_after_failures',
    label: '失敗後要求驗證碼次數',
    type: 'number',
    min: 1,
    max: 10
  }
])

const sessionFields = computed(() => [
  {
    key: 'session_timeout',
    label: '會話超時時間 (分鐘)',
    type: 'number',
    min: 30,
    max: 1440
  },
  {
    key: 'concurrent_sessions',
    label: '同時會話數量',
    type: 'number',
    min: 1,
    max: 10
  },
  {
    key: 'remember_me_duration',
    label: '記住我持續時間 (秒)',
    type: 'number',
    min: 86400,
    max: 7776000
  },
  {
    key: 'force_logout_inactive',
    label: '強制登出非活躍用戶',
    type: 'checkbox'
  },
  {
    key: 'secure_cookies',
    label: '安全 Cookies',
    type: 'checkbox',
    help: '只在 HTTPS 連線中傳送 cookies'
  },
  {
    key: 'same_site_policy',
    label: 'SameSite 政策',
    type: 'select',
    options: [
      { value: 'strict', label: 'Strict' },
      { value: 'lax', label: 'Lax' },
      { value: 'none', label: 'None' }
    ]
  }
])

const ipRuleFormFields = computed(() => [
  {
    key: 'ip_address',
    label: 'IP 地址或範圍',
    type: 'text',
    required: true,
    placeholder: '例如：192.168.1.100 或 192.168.1.0/24'
  },
  {
    key: 'type',
    label: '規則類型',
    type: 'select',
    required: true,
    options: [
      { value: 'allow', label: '允許' },
      { value: 'deny', label: '拒絕' }
    ]
  },
  {
    key: 'description',
    label: '描述',
    type: 'textarea',
    placeholder: '規則的用途說明'
  }
])

// 表格欄位
const ipRuleColumns = computed(() => [
  { key: 'ip_address', label: 'IP 地址', sortable: true },
  { key: 'type', label: '類型' },
  { key: 'description', label: '描述' },
  { key: 'status', label: '狀態' },
  { key: 'created_at', label: '建立時間', sortable: true },
  { key: 'actions', label: '操作' }
])

// 載入安全日誌
const loadSecurityLogs = async () => {
  loadingLogs.value = true
  try {
    const logs = await db.findMany('audit_logs', {
      columns: 'id, user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, created_at',
      orderBy: 'created_at',
      ascending: false,
      limit: 100
    })

    // 將audit_logs映射為安全日誌格式
    securityLogs.value = logs.map(log => ({
      id: log.id,
      type: mapActionToType(log.action),
      username: log.user_id || 'system',
      description: generateLogDescription(log),
      ip_address: log.ip_address || 'N/A',
      user_agent: log.user_agent || 'N/A',
      created_at: log.created_at
    }))

    console.log('載入安全日誌成功:', securityLogs.value.length, '條記錄')
  } catch (error) {
    console.error('載入安全日誌失敗:', error)
  } finally {
    loadingLogs.value = false
  }
}

// 將操作類型映射為安全日誌類型
const mapActionToType = (action: string): string => {
  const actionMap: Record<string, string> = {
    'login': 'login_success',
    'logout': 'logout',
    'failed_login': 'login_failed',
    'create': 'create_record',
    'update': 'update_record',
    'delete': 'delete_record'
  }
  return actionMap[action] || 'system_activity'
}

// 生成日誌描述
const generateLogDescription = (log: any): string => {
  const actionMap: Record<string, string> = {
    'login': '用戶登入系統',
    'logout': '用戶登出系統',
    'create': `建立${log.table_name}記錄`,
    'update': `更新${log.table_name}記錄`,
    'delete': `刪除${log.table_name}記錄`
  }
  return actionMap[log.action] || `執行${log.action}操作`
}

// 計算屬性
const filteredSecurityLogs = computed(() => {
  if (!logTypeFilter.value) return securityLogs.value
  return securityLogs.value.filter(log => log.type === logTypeFilter.value)
})

// 方法
const saveLoginSecurity = async () => {
  savingSecurity.value = true
  try {
    console.log('儲存登入安全設定:', loginSecurity.value)
    emit('save', 'login-security', loginSecurity.value)
  } catch (error) {
    console.error('儲存登入安全設定失敗:', error)
  } finally {
    savingSecurity.value = false
  }
}

const saveSessionConfig = async () => {
  savingSession.value = true
  try {
    console.log('儲存會話設定:', sessionConfig.value)
    emit('save', 'session-config', sessionConfig.value)
  } catch (error) {
    console.error('儲存會話設定失敗:', error)
  } finally {
    savingSession.value = false
  }
}

const createIPRule = async () => {
  creatingIPRule.value = true
  try {
    console.log('建立 IP 規則:', newIPRule.value)
    emit('save', 'ip-rule', newIPRule.value)
    showAddIPModal.value = false
    // 重置表單
    newIPRule.value = {
      ip_address: '',
      type: 'allow',
      description: '',
      is_active: true
    }
  } catch (error) {
    console.error('建立 IP 規則失敗:', error)
  } finally {
    creatingIPRule.value = false
  }
}

const editIPRule = (rule: any) => {
  console.log('編輯 IP 規則:', rule)
  // TODO: 實現編輯功能
}

const toggleIPRule = (rule: any) => {
  rule.is_active = !rule.is_active
  console.log('切換 IP 規則狀態:', rule)
  emit('save', 'ip-rule-toggle', rule)
}

const deleteIPRule = (rule: any) => {
  if (confirm(`確定要刪除 IP 規則 "${rule.ip_address}" 嗎？`)) {
    console.log('刪除 IP 規則:', rule)
    emit('save', 'ip-rule-delete', rule)
  }
}

const exportSecurityLogs = () => {
  console.log('匯出安全日誌')
  // TODO: 實現匯出功能
}

const getLogTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    login_attempt: '登入嘗試',
    login_success: '登入成功',
    login_failed: '登入失敗',
    logout: '登出',
    ip_blocked: 'IP 封鎖',
    suspicious_activity: '可疑活動'
  }
  return typeMap[type] || type
}

const getLogTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    login_success: 'bg-green-100 text-green-800',
    login_failed: 'bg-red-100 text-red-800',
    login_attempt: 'bg-blue-100 text-blue-800',
    logout: 'bg-gray-100 text-gray-800',
    ip_blocked: 'bg-red-100 text-red-800',
    suspicious_activity: 'bg-yellow-100 text-yellow-800'
  }
  return colorMap[type] || 'bg-gray-100 text-gray-800'
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

onMounted(async () => {
  console.log('SecuritySettings 組件已掛載')
  await loadSecurityLogs()
  calculateStats()
})
</script>
