<template>
  <div class="space-y-6">
    <div class="border-b border-gray-200 pb-4">
      <h2 class="text-xl font-semibold text-gray-900">系統監控</h2>
      <p class="mt-1 text-gray-600">系統狀態監控與日誌查看</p>
    </div>

    <!-- 系統狀態總覽 -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">系統狀態總覽</h3>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <div class="flex items-center">
            <div class="shrink-0">
              <div
                :class="[
                  'size-4 rounded-full',
                  systemStatus.server === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                ]"
              ></div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-900">伺服器狀態</p>
              <p class="text-sm text-gray-600">{{ getStatusText(systemStatus.server) }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <div class="flex items-center">
            <div class="shrink-0">
              <div
                :class="[
                  'size-4 rounded-full',
                  systemStatus.database === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                ]"
              ></div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-900">資料庫狀態</p>
              <p class="text-sm text-gray-600">{{ getStatusText(systemStatus.database) }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <div class="flex items-center">
            <div class="shrink-0">
              <div
                :class="[
                  'size-4 rounded-full',
                  systemStatus.cache === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'
                ]"
              ></div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-900">快取狀態</p>
              <p class="text-sm text-gray-600">{{ getStatusText(systemStatus.cache) }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <div class="flex items-center">
            <div class="shrink-0">
              <div
                :class="[
                  'size-4 rounded-full',
                  systemStatus.storage === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'
                ]"
              ></div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-900">儲存空間</p>
              <p class="text-sm text-gray-600">{{ getStatusText(systemStatus.storage) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 效能監控 -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">效能監控</h3>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <!-- CPU 使用率 -->
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <h4 class="mb-3 font-medium text-gray-900">CPU 使用率</h4>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>目前使用率</span>
              <span class="font-medium">{{ performanceMetrics.cpu.current }}%</span>
            </div>
            <div class="h-2 w-full rounded-full bg-gray-200">
              <div
                class="h-2 rounded-full bg-blue-600 transition-all duration-300"
                :style="{ width: performanceMetrics.cpu.current + '%' }"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-gray-500">
              <span>平均: {{ performanceMetrics.cpu.average }}%</span>
              <span>峰值: {{ performanceMetrics.cpu.peak }}%</span>
            </div>
          </div>
        </div>

        <!-- 記憶體使用率 -->
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <h4 class="mb-3 font-medium text-gray-900">記憶體使用率</h4>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>已使用記憶體</span>
              <span class="font-medium">{{ performanceMetrics.memory.used }}GB / {{ performanceMetrics.memory.total }}GB</span>
            </div>
            <div class="h-2 w-full rounded-full bg-gray-200">
              <div
                class="h-2 rounded-full bg-green-600 transition-all duration-300"
                :style="{ width: (performanceMetrics.memory.used / performanceMetrics.memory.total * 100) + '%' }"
              ></div>
            </div>
            <div class="text-xs text-gray-500">
              使用率: {{ Math.round(performanceMetrics.memory.used / performanceMetrics.memory.total * 100) }}%
            </div>
          </div>
        </div>

        <!-- 磁碟使用率 -->
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <h4 class="mb-3 font-medium text-gray-900">磁碟使用率</h4>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>已使用空間</span>
              <span class="font-medium">{{ performanceMetrics.disk.used }}GB / {{ performanceMetrics.disk.total }}GB</span>
            </div>
            <div class="h-2 w-full rounded-full bg-gray-200">
              <div
                :class="[
                  'h-2 rounded-full transition-all duration-300',
                  (performanceMetrics.disk.used / performanceMetrics.disk.total * 100) > 80 ? 'bg-red-600' :
                  (performanceMetrics.disk.used / performanceMetrics.disk.total * 100) > 60 ? 'bg-yellow-600' : 'bg-green-600'
                ]"
                :style="{ width: (performanceMetrics.disk.used / performanceMetrics.disk.total * 100) + '%' }"
              ></div>
            </div>
            <div class="text-xs text-gray-500">
              剩餘空間: {{ performanceMetrics.disk.total - performanceMetrics.disk.used }}GB
            </div>
          </div>
        </div>

        <!-- 網路流量 -->
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <h4 class="mb-3 font-medium text-gray-900">網路流量</h4>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>上傳</span>
              <span class="font-medium">{{ performanceMetrics.network.upload }} MB/s</span>
            </div>
            <div class="flex justify-between text-sm">
              <span>下載</span>
              <span class="font-medium">{{ performanceMetrics.network.download }} MB/s</span>
            </div>
            <div class="text-xs text-gray-500">
              總流量: {{ performanceMetrics.network.total }}GB (今日)
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 系統日誌 -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">系統日誌</h3>
        <div class="flex space-x-2">
          <select
            v-model="logLevelFilter"
            class="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">所有等級</option>
            <option value="ERROR">錯誤</option>
            <option value="WARN">警告</option>
            <option value="INFO">資訊</option>
            <option value="DEBUG">調試</option>
          </select>
          <select
            v-model="logSourceFilter"
            class="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">所有來源</option>
            <option value="application">應用程式</option>
            <option value="database">資料庫</option>
            <option value="authentication">認證系統</option>
            <option value="system">系統</option>
          </select>
          <SmartButton
            @click="refreshLogs"
            variant="secondary"
            size="sm"
          >
            <ArrowPathIcon class="mr-2 size-4" />
            重新整理
          </SmartButton>
        </div>
      </div>

      <div class="rounded-lg border border-gray-200 bg-white">
        <div class="max-h-96 overflow-y-auto">
          <div v-if="loadingLogs" class="p-8 text-center">
            <div class="mx-auto size-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p class="mt-2 text-sm text-gray-600">載入系統日誌中...</p>
          </div>
          <div v-else-if="filteredLogs.length === 0" class="p-8 text-center text-gray-500">
            暫無系統日誌記錄
          </div>
          <div
            v-else
            v-for="log in filteredLogs"
            :key="log.id"
            class="border-b border-gray-100 p-4 font-mono text-sm hover:bg-gray-50"
          >
            <div class="flex items-start space-x-3">
              <span
                :class="[
                  'inline-flex items-center rounded px-2 py-1 text-xs font-medium',
                  getLogLevelColor(log.level)
                ]"
              >
                {{ log.level }}
              </span>
              <div class="flex-1">
                <div class="text-gray-900">{{ log.message }}</div>
                <div class="mt-1 text-xs text-gray-500">
                  {{ formatDateTime(log.timestamp) }} |
                  來源: {{ log.source }} |
                  用戶: {{ log.user || 'system' }}
                </div>
                <div v-if="log.stack_trace" class="mt-2 whitespace-pre-wrap text-xs text-gray-400">
                  {{ log.stack_trace }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 活躍會話 -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">活躍會話</h3>
        <SmartButton
          @click="refreshSessions"
          variant="secondary"
          size="sm"
        >
          <ArrowPathIcon class="mr-2 size-4" />
          重新整理
        </SmartButton>
      </div>

      <ResponsiveTable
        :columns="sessionColumns"
        :data="activeSessions"
        :loading="loadingSessions"
      >
        <template #status="{ item }">
          <span
            :class="[
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            ]"
          >
            {{ item.status === 'active' ? '活躍' : '非活躍' }}
          </span>
        </template>

        <template #last_activity="{ item }">
          {{ getRelativeTime(item.last_activity) }}
        </template>

        <template #actions="{ item }">
          <SmartButton
            @click="terminateSession(item)"
            variant="danger"
            size="sm"
          >
            終止會話
          </SmartButton>
        </template>
      </ResponsiveTable>
    </div>

    <!-- 系統警告 -->
    <div v-if="systemAlerts.length > 0" class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">系統警告</h3>

      <div class="space-y-3">
        <div
          v-for="alert in systemAlerts"
          :key="alert.id"
          :class="[
            'rounded-lg border-l-4 p-4',
            alert.severity === 'critical' ? 'border-red-400 bg-red-50' :
            alert.severity === 'warning' ? 'border-yellow-400 bg-yellow-50' :
            'border-blue-400 bg-blue-50'
          ]"
        >
          <div class="flex items-start justify-between">
            <div>
              <h4
                :class="[
                  'font-medium',
                  alert.severity === 'critical' ? 'text-red-800' :
                  alert.severity === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                ]"
              >
                {{ alert.title }}
              </h4>
              <p
                :class="[
                  'mt-1 text-sm',
                  alert.severity === 'critical' ? 'text-red-700' :
                  alert.severity === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                ]"
              >
                {{ alert.message }}
              </p>
              <p class="mt-2 text-xs text-gray-500">
                {{ formatDateTime(alert.created_at) }}
              </p>
            </div>
            <SmartButton
              @click="dismissAlert(alert)"
              variant="secondary"
              size="sm"
            >
              關閉
            </SmartButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import SmartButton from '@/components/ui/SmartButton.vue'
import ResponsiveTable from '@/components/common/ResponsiveTable.vue'
import { db } from '@/services/supabase'

// 狀態管理
const loadingSessions = ref(false)
const loadingLogs = ref(false)
const logLevelFilter = ref('')
const logSourceFilter = ref('')

// 系統狀態
const systemStatus = ref({
  server: 'healthy',
  database: 'healthy',
  cache: 'healthy',
  storage: 'warning'
})

// 效能指標
const performanceMetrics = ref({
  cpu: {
    current: 23,
    average: 18,
    peak: 45
  },
  memory: {
    used: 3.2,
    total: 8.0
  },
  disk: {
    used: 45,
    total: 100
  },
  network: {
    upload: 2.3,
    download: 8.7,
    total: 156
  }
})

// 系統日誌
const systemLogs = ref<any[]>([])

// 活躍會話
const activeSessions = ref<any[]>([])

// 系統警告
const systemAlerts = ref([
  {
    id: 1,
    severity: 'warning',
    title: '磁碟空間不足',
    message: '系統磁碟空間使用率已達 80%，建議清理日誌文件或擴充儲存空間',
    created_at: '2024-01-15T10:20:00Z'
  },
  {
    id: 2,
    severity: 'info',
    title: '系統更新可用',
    message: '發現新的系統更新版本 v2.1.3，建議在維護時間內進行更新',
    created_at: '2024-01-15T09:00:00Z'
  }
])

// 表格欄位
const sessionColumns = computed(() => [
  { key: 'user_name', label: '用戶名稱', sortable: true },
  { key: 'ip_address', label: 'IP 地址' },
  { key: 'user_agent', label: '瀏覽器' },
  { key: 'status', label: '狀態' },
  { key: 'last_activity', label: '最後活動' },
  { key: 'actions', label: '操作' }
])

// 計算屬性
const filteredLogs = computed(() => {
  let filtered = systemLogs.value

  if (logLevelFilter.value) {
    filtered = filtered.filter(log => log.level === logLevelFilter.value)
  }

  if (logSourceFilter.value) {
    filtered = filtered.filter(log => log.source === logSourceFilter.value)
  }

  return filtered.slice(0, 50) // 限制顯示最新 50 條
})

// 自動更新定時器
let updateTimer: NodeJS.Timeout | null = null

// 載入系統日誌
const loadSystemLogs = async () => {
  loadingLogs.value = true
  try {
    const logs = await db.findMany('audit_logs', {
      columns: 'id, user_id, action, table_name, record_id, ip_address, user_agent, created_at',
      orderBy: 'created_at',
      ascending: false,
      limit: 50
    })

    systemLogs.value = logs.map(log => ({
      id: log.id,
      level: mapActionToLevel(log.action),
      source: 'application',
      message: generateLogMessage(log),
      timestamp: log.created_at,
      user: log.user_id,
      stack_trace: null
    }))

    console.log('載入系統日誌成功:', systemLogs.value.length, '條記錄')
  } catch (error) {
    console.error('載入系統日誌失敗:', error)
  } finally {
    loadingLogs.value = false
  }
}

// 載入活躍會話
const loadActiveSessions = async () => {
  loadingSessions.value = true
  try {
    // 基於audit_logs表中的login記錄計算活躍會話
    const loginLogs = await db.findMany('audit_logs', {
      columns: 'user_id, ip_address, user_agent, created_at',
      filters: { action: 'login' },
      orderBy: 'created_at',
      ascending: false,
      limit: 20
    })

    // 模擬會話狀態（實際應用中可能需要會話表）
    const sessions = new Map()

    loginLogs.forEach(log => {
      if (!sessions.has(log.user_id)) {
        sessions.set(log.user_id, {
          id: sessions.size + 1,
          user_name: log.user_id,
          ip_address: log.ip_address || 'N/A',
          user_agent: extractBrowser(log.user_agent || ''),
          status: 'active',
          login_time: log.created_at,
          last_activity: log.created_at
        })
      }
    })

    activeSessions.value = Array.from(sessions.values()).slice(0, 10)
    console.log('載入活躍會話成功:', activeSessions.value.length, '個會話')
  } catch (error) {
    console.error('載入活躍會話失敗:', error)
  } finally {
    loadingSessions.value = false
  }
}

// 將操作映射為日誌級別
const mapActionToLevel = (action: string): string => {
  const actionMap: Record<string, string> = {
    'login': 'INFO',
    'logout': 'INFO',
    'create': 'INFO',
    'update': 'INFO',
    'delete': 'WARN',
    'error': 'ERROR'
  }
  return actionMap[action] || 'INFO'
}

// 生成日誌消息
const generateLogMessage = (log: any): string => {
  const actionMap: Record<string, string> = {
    'login': `用戶 ${log.user_id} 登入系統`,
    'logout': `用戶 ${log.user_id} 登出系統`,
    'create': `用戶 ${log.user_id} 建立了 ${log.table_name} 記錄`,
    'update': `用戶 ${log.user_id} 更新了 ${log.table_name} 記錄`,
    'delete': `用戶 ${log.user_id} 刪除了 ${log.table_name} 記錄`
  }
  return actionMap[log.action] || `用戶 ${log.user_id} 執行了 ${log.action} 操作`
}

// 提取瀏覽器信息
const extractBrowser = (userAgent: string): string => {
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('Edge')) return 'Edge'
  return 'Unknown'
}

// 方法
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    healthy: '正常',
    warning: '警告',
    error: '錯誤',
    offline: '離線'
  }
  return statusMap[status] || status
}

const getLogLevelColor = (level: string): string => {
  const colorMap: Record<string, string> = {
    ERROR: 'bg-red-100 text-red-800',
    WARN: 'bg-yellow-100 text-yellow-800',
    INFO: 'bg-blue-100 text-blue-800',
    DEBUG: 'bg-gray-100 text-gray-800'
  }
  return colorMap[level] || 'bg-gray-100 text-gray-800'
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

const getRelativeTime = (dateString: string): string => {
  const now = new Date()
  const time = new Date(dateString)
  const diffMs = now.getTime() - time.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return '剛才'
  if (diffMins < 60) return `${diffMins} 分鐘前`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} 小時前`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} 天前`
}

const refreshLogs = async () => {
  console.log('重新整理系統日誌')
  await loadSystemLogs()
}

const refreshSessions = async () => {
  console.log('重新整理活躍會話')
  await loadActiveSessions()
}

const terminateSession = async (session: any) => {
  if (confirm(`確定要終止用戶 "${session.user_name}" 的會話嗎？`)) {
    console.log('終止會話:', session.id)
    // TODO: 實際終止會話
  }
}

const dismissAlert = (alert: any) => {
  const index = systemAlerts.value.findIndex(a => a.id === alert.id)
  if (index > -1) {
    systemAlerts.value.splice(index, 1)
  }
}

const updateMetrics = () => {
  // 模擬更新效能指標
  performanceMetrics.value.cpu.current = Math.max(5, Math.min(95,
    performanceMetrics.value.cpu.current + (Math.random() - 0.5) * 10
  ))

  performanceMetrics.value.network.upload = Math.max(0,
    performanceMetrics.value.network.upload + (Math.random() - 0.5) * 2
  )

  performanceMetrics.value.network.download = Math.max(0,
    performanceMetrics.value.network.download + (Math.random() - 0.5) * 5
  )
}

onMounted(async () => {
  console.log('SystemMonitoring 組件已掛載')

  // 載入初始數據
  await Promise.all([
    loadSystemLogs(),
    loadActiveSessions()
  ])

  // 每 5 秒更新一次效能指標
  updateTimer = setInterval(updateMetrics, 5000)
})

onUnmounted(() => {
  if (updateTimer) {
    clearInterval(updateTimer)
  }
})
</script>
