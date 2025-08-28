<template>
  <div class="space-y-6">
    <!-- Header with filters -->
    <div class="rounded-lg bg-white p-6 shadow-sm">
      <h3 class="mb-4 text-lg font-semibold text-gray-900">
        系統操作日誌
      </h3>

      <!-- Filters -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <!-- Date Range -->
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            開始日期
          </label>
          <input
            type="date"
            v-model="filters.startDate"
            @change="applyFilters"
            class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 "
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            結束日期
          </label>
          <input
            type="date"
            v-model="filters.endDate"
            @change="applyFilters"
            class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 "
          />
        </div>

        <!-- User Filter -->
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            使用者
          </label>
          <select
            v-model="filters.userId"
            @change="applyFilters"
            class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 "
          >
            <option value="">所有使用者</option>
            <option v-for="user in users" :key="user.user_id" :value="user.user_id">
              {{ user.full_name }}
            </option>
          </select>
        </div>

        <!-- Action Filter -->
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">
            操作類型
          </label>
          <select
            v-model="filters.action"
            @change="applyFilters"
            class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 "
          >
            <option value="">所有操作</option>
            <option value="login">登入</option>
            <option value="logout">登出</option>
            <option value="create">新增</option>
            <option value="update">更新</option>
            <option value="delete">刪除</option>
            <option value="view">查看</option>
            <option value="export">匯出</option>
          </select>
        </div>
      </div>

      <!-- Search and Export Buttons -->
      <div class="mt-4 flex flex-col justify-between gap-4 sm:flex-row">
        <div class="max-w-md flex-1">
          <input
            type="text"
            v-model="searchQuery"
            @input="debounceSearch"
            placeholder="搜尋操作內容..."
            class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 "
          />
        </div>

        <div class="flex gap-2">
          <button
            @click="resetFilters"
            class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 "
          >
            重置
          </button>
          <button
            @click="exportLogs"
            class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            匯出日誌
          </button>
        </div>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="overflow-hidden rounded-lg bg-white shadow-sm">
      <div v-if="loading" class="p-8 text-center">
        <div class="mx-auto size-12 animate-spin rounded-full border-b-2 border-indigo-500"></div>
        <p class="mt-2 text-gray-500">載入中...</p>
      </div>

      <div v-else-if="logs.length === 0" class="p-8 text-center text-gray-500">
        沒有找到符合條件的日誌
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                時間
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                使用者
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                操作
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                目標
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                IP 位址
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                詳情
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="log in paginatedLogs" :key="log.id" class="hover:bg-gray-50">
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {{ formatDateTime(log.created_at) }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {{ log.user?.full_name || log.user_id }}
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <span :class="getActionClass(log.action)" class="inline-flex rounded-full px-2 text-xs font-semibold leading-5">
                  {{ getActionLabel(log.action) }}
                </span>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {{ log.table_name || '-' }}
                <span v-if="log.record_id" class="text-gray-500">
                  ({{ log.record_id }})
                </span>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {{ log.ip_address || '-' }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm">
                <button
                  @click="showDetails(log)"
                  class="text-indigo-600 hover:text-indigo-900"
                >
                  查看
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="logs.length > 0" class="border-t border-gray-200 px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            顯示第 {{ (currentPage - 1) * pageSize + 1 }} 至 {{ Math.min(currentPage * pageSize, logs.length) }} 筆，共 {{ logs.length }} 筆
          </div>
          <div class="flex gap-2">
            <button
              @click="currentPage = 1"
              :disabled="currentPage === 1"
              class="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              第一頁
            </button>
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              上一頁
            </button>
            <span class="px-3 py-1 text-sm">
              第 {{ currentPage }} / {{ totalPages }} 頁
            </span>
            <button
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              class="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              下一頁
            </button>
            <button
              @click="currentPage = totalPages"
              :disabled="currentPage === totalPages"
              class="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              最後一頁
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <div v-if="selectedLog" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75 p-4">
        <div class="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white">
          <div class="border-b border-gray-200 px-6 py-4">
            <h3 class="text-lg font-medium text-gray-900">
              日誌詳情
            </h3>
          </div>

          <div class="max-h-[60vh] overflow-y-auto px-6 py-4">
            <dl class="space-y-4">
              <div>
                <dt class="text-sm font-medium text-gray-500">時間</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ formatDateTime(selectedLog.created_at) }}
                </dd>
              </div>

              <div>
                <dt class="text-sm font-medium text-gray-500">使用者</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ selectedLog.user?.full_name || selectedLog.user_id }} ({{ selectedLog.user_id }})
                </dd>
              </div>

              <div>
                <dt class="text-sm font-medium text-gray-500">操作</dt>
                <dd class="mt-1">
                  <span :class="getActionClass(selectedLog.action)" class="inline-flex rounded-full px-2 text-xs font-semibold leading-5">
                    {{ getActionLabel(selectedLog.action) }}
                  </span>
                </dd>
              </div>

              <div v-if="selectedLog.table_name">
                <dt class="text-sm font-medium text-gray-500">目標資料表</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ selectedLog.table_name }}
                </dd>
              </div>

              <div v-if="selectedLog.record_id">
                <dt class="text-sm font-medium text-gray-500">記錄 ID</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ selectedLog.record_id }}
                </dd>
              </div>

              <div v-if="selectedLog.ip_address">
                <dt class="text-sm font-medium text-gray-500">IP 位址</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ selectedLog.ip_address }}
                </dd>
              </div>

              <div v-if="selectedLog.user_agent">
                <dt class="text-sm font-medium text-gray-500">瀏覽器資訊</dt>
                <dd class="mt-1 break-all text-sm text-gray-900">
                  {{ selectedLog.user_agent }}
                </dd>
              </div>

              <div v-if="selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0">
                <dt class="text-sm font-medium text-gray-500">原始值</dt>
                <dd class="mt-1">
                  <pre class="overflow-x-auto rounded bg-gray-100 p-2 text-sm">{{ JSON.stringify(selectedLog.old_values, null, 2) }}</pre>
                </dd>
              </div>

              <div v-if="selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0">
                <dt class="text-sm font-medium text-gray-500">新值</dt>
                <dd class="mt-1">
                  <pre class="overflow-x-auto rounded bg-gray-100 p-2 text-sm">{{ JSON.stringify(selectedLog.new_values, null, 2) }}</pre>
                </dd>
              </div>
            </dl>
          </div>

          <div class="flex justify-end border-t border-gray-200 px-6 py-4">
            <button
              @click="selectedLog = null"
              class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 "
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authSupabase'
import { supabase } from '@/services/supabase'
import { formatDateTime } from '@/utils/formatters'

interface AuditLog {
  id: number
  user_id: string
  action: string
  table_name?: string
  record_id?: string
  old_values?: any
  new_values?: any
  old_amount?: number
  new_amount?: number
  old_status?: string
  new_status?: string
  ip_address?: string
  user_agent?: string
  created_at: string
  user?: {
    full_name: string
  }
}

interface User {
  user_id: string
  full_name: string
}

const authStore = useAuthStore()

const logs = ref<AuditLog[]>([])
const users = ref<User[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedLog = ref<AuditLog | null>(null)
const currentPage = ref(1)
const pageSize = ref(20)

const filters = ref({
  startDate: '',
  endDate: '',
  userId: '',
  action: ''
})

// Computed
const filteredLogs = computed(() => {
  let filtered = logs.value

  // Apply search
  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase()
    filtered = filtered.filter(log =>
      log.action.toLowerCase().includes(search) ||
      log.table_name?.toLowerCase().includes(search) ||
      log.record_id?.toLowerCase().includes(search) ||
      log.user?.full_name.toLowerCase().includes(search) ||
      log.user_id.toLowerCase().includes(search)
    )
  }

  return filtered
})

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredLogs.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredLogs.value.length / pageSize.value)
})

// Methods
// formatDateTime is already imported from utils/formatters

const getActionClass = (action: string) => {
  switch (action) {
    case 'login':
      return 'bg-green-100 text-green-800'
    case 'logout':
      return 'bg-gray-100 text-gray-800'
    case 'create':
      return 'bg-blue-100 text-blue-800'
    case 'update':
      return 'bg-yellow-100 text-yellow-800'
    case 'delete':
      return 'bg-red-100 text-red-800'
    case 'view':
      return 'bg-purple-100 text-purple-800'
    case 'export':
      return 'bg-indigo-100 text-indigo-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getActionLabel = (action: string) => {
  switch (action) {
    case 'login': return '登入'
    case 'logout': return '登出'
    case 'create': return '新增'
    case 'update': return '更新'
    case 'delete': return '刪除'
    case 'view': return '查看'
    case 'export': return '匯出'
    default: return action
  }
}

const fetchLogs = async () => {
  loading.value = true
  try {
    // Build query
    let query = supabase.from('audit_logs').select(`
      *,
      user:users!audit_logs_user_id_fkey (full_name)
    `)

    // Apply filters
    if (filters.value.startDate) {
      query = query.gte('created_at', filters.value.startDate)
    }
    if (filters.value.endDate) {
      query = query.lte('created_at', `${filters.value.endDate}T23:59:59`)
    }
    if (filters.value.userId) {
      query = query.eq('user_id', filters.value.userId)
    }
    if (filters.value.action) {
      query = query.eq('action', filters.value.action)
    }

    // Order by created_at desc
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) throw error

    logs.value = data || []
  } catch (error) {
    console.error('Failed to fetch logs:', error)
    // Show error message to user
    alert(`無法載入系統日誌：${(error as any).message}`)
  } finally {
    loading.value = false
  }
}

const fetchUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, full_name')
      .order('full_name')

    if (error) throw error

    users.value = data || []
  } catch (error) {
    console.error('Failed to fetch users:', error)
  }
}

const applyFilters = () => {
  currentPage.value = 1
  fetchLogs()
}

const resetFilters = () => {
  filters.value = {
    startDate: '',
    endDate: '',
    userId: '',
    action: ''
  }
  searchQuery.value = ''
  currentPage.value = 1
  fetchLogs()
}

let searchTimeout: any
const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
  }, 300)
}

const showDetails = (log: AuditLog) => {
  selectedLog.value = log
}

const exportLogs = () => {
  // Create CSV content
  const headers = ['時間', '使用者', '操作', '目標資料表', '記錄ID', 'IP位址']
  const rows = filteredLogs.value.map(log => [
    formatDateTime(log.created_at),
    log.user?.full_name || log.user_id,
    getActionLabel(log.action),
    log.table_name || '',
    log.record_id || '',
    log.ip_address || ''
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  // Create and download file
  const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Lifecycle
onMounted(() => {
  // Check admin permission
  if (!authStore.hasRole('ADMIN')) {
    console.error('Unauthorized access to audit logs')
    return
  }

  fetchLogs()
  fetchUsers()
})
</script>
