<template>
  <div class="space-y-6">
    <div class="border-b border-gray-200 pb-4">
      <h2 class="text-xl font-semibold text-gray-900">備份還原</h2>
      <p class="mt-1 text-gray-600">系統資料備份與還原管理</p>
    </div>

    <!-- 備份操作 -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">立即備份</h3>

      <div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div class="flex items-start space-x-3">
          <div class="shrink-0">
            <ServerIcon class="size-6 text-blue-600" />
          </div>
          <div class="flex-1">
            <h4 class="text-sm font-medium text-blue-800">系統完整備份</h4>
            <p class="mt-1 text-sm text-blue-700">
              包含所有資料表、設定檔案和用戶資料
            </p>
            <div class="mt-3 space-y-2">
              <label class="flex items-center">
                <input
                  v-model="backupOptions.includeUserData"
                  type="checkbox"
                  class="mr-2"
                />
                <span class="text-sm text-blue-700">包含用戶資料</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="backupOptions.includeSystemSettings"
                  type="checkbox"
                  class="mr-2"
                />
                <span class="text-sm text-blue-700">包含系統設定</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="backupOptions.includeFileUploads"
                  type="checkbox"
                  class="mr-2"
                />
                <span class="text-sm text-blue-700">包含檔案上傳</span>
              </label>
            </div>
            <div class="mt-4">
              <SmartButton
                @click="createBackup"
                variant="primary"
                :loading="creatingBackup"
                :disabled="!canCreateBackup"
              >
                <CloudArrowDownIcon class="mr-2 size-4" />
                開始備份
              </SmartButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 自動備份設定 -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">自動備份設定</h3>

      <div class="rounded-lg bg-gray-50 p-4">
        <SmartForm
          :fields="autoBackupFields"
          v-model="autoBackupConfig"
          @submit="saveAutoBackupConfig"
        >
          <template #actions>
            <SmartButton
              type="submit"
              variant="primary"
              :loading="savingConfig"
            >
              儲存設定
            </SmartButton>
          </template>
        </SmartForm>
      </div>
    </div>

    <!-- 備份歷史 -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">備份歷史</h3>
        <SmartButton
          @click="refreshBackupList"
          variant="secondary"
          size="sm"
        >
          <ArrowPathIcon class="mr-2 size-4" />
          重新整理
        </SmartButton>
      </div>

      <div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <ResponsiveTable
          :columns="backupColumns"
          :data="backupHistory"
          :loading="loadingBackups"
        >
          <template #type="{ item }">
            <span
              :class="[
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                item.type === 'manual' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
              ]"
            >
              {{ item.type === 'manual' ? '手動備份' : '自動備份' }}
            </span>
          </template>

          <template #status="{ item }">
            <span
              :class="[
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                item.status === 'completed' ? 'bg-green-100 text-green-800' :
                item.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              ]"
            >
              {{ getStatusText(item.status) }}
            </span>
          </template>

          <template #size="{ item }">
            {{ formatFileSize(item.size) }}
          </template>

          <template #actions="{ item }">
            <div class="flex items-center space-x-2">
              <SmartButton
                v-if="item.status === 'completed'"
                @click="downloadBackup(item)"
                variant="secondary"
                size="sm"
              >
                下載
              </SmartButton>
              <SmartButton
                v-if="item.status === 'completed'"
                @click="restoreFromBackup(item)"
                variant="warning"
                size="sm"
              >
                還原
              </SmartButton>
              <SmartButton
                @click="deleteBackup(item)"
                variant="danger"
                size="sm"
              >
                刪除
              </SmartButton>
            </div>
          </template>
        </ResponsiveTable>
      </div>
    </div>

    <!-- 還原操作 -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">檔案還原</h3>

      <div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div class="flex items-start space-x-3">
          <div class="shrink-0">
            <ExclamationTriangleIcon class="size-6 text-yellow-600" />
          </div>
          <div class="flex-1">
            <h4 class="text-sm font-medium text-yellow-800">上傳備份檔案還原</h4>
            <p class="mt-1 text-sm text-yellow-700">
              ⚠️ 還原操作會覆蓋現有資料，請確保已備份當前資料
            </p>
            <div class="mt-4">
              <input
                ref="fileInput"
                type="file"
                accept=".sql,.zip,.tar.gz"
                @change="handleFileSelect"
                class="hidden"
              />
              <div class="flex space-x-3">
                <SmartButton
                  @click="$refs.fileInput?.click()"
                  variant="secondary"
                >
                  選擇備份檔案
                </SmartButton>
                <SmartButton
                  v-if="selectedFile"
                  @click="confirmRestore"
                  variant="warning"
                  :loading="restoring"
                >
                  <CloudArrowUpIcon class="mr-2 size-4" />
                  開始還原
                </SmartButton>
              </div>
              <p v-if="selectedFile" class="mt-2 text-sm text-gray-600">
                選中檔案: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 系統狀態 -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">系統狀態</h3>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <div class="text-2xl font-bold text-blue-600">{{ systemStats.totalBackups }}</div>
          <div class="text-sm text-gray-600">總備份數量</div>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <div class="text-2xl font-bold text-green-600">{{ formatFileSize(systemStats.totalSize) }}</div>
          <div class="text-sm text-gray-600">總備份大小</div>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <div class="text-2xl font-bold text-yellow-600">{{ systemStats.lastBackupDays }}</div>
          <div class="text-sm text-gray-600">天前最後備份</div>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <div class="text-2xl font-bold text-purple-600">{{ systemStats.availableSpace }}</div>
          <div class="text-sm text-gray-600">可用空間</div>
        </div>
      </div>
    </div>

    <!-- 還原確認彈窗 -->
    <ConfirmDialog
      v-model="showRestoreConfirm"
      title="確認還原"
      confirm-text="確認還原"
      cancel-text="取消"
      :confirm-loading="restoring"
      @confirm="executeRestore"
    >
      <div class="space-y-4">
        <div class="rounded-lg border border-red-200 bg-red-50 p-4">
          <div class="flex items-center">
            <ExclamationTriangleIcon class="mr-2 size-5 text-red-600" />
            <span class="font-medium text-red-800">危險操作警告</span>
          </div>
          <p class="mt-2 text-sm text-red-700">
            此操作會完全覆蓋現有的系統資料，且無法復原。
          </p>
        </div>

        <div v-if="selectedBackupItem">
          <h4 class="mb-2 font-medium text-gray-900">備份詳情：</h4>
          <ul class="space-y-1 text-sm text-gray-600">
            <li>檔案名稱: {{ selectedBackupItem.filename }}</li>
            <li>建立時間: {{ formatDateTime(selectedBackupItem.created_at) }}</li>
            <li>檔案大小: {{ formatFileSize(selectedBackupItem.size) }}</li>
            <li>備份類型: {{ selectedBackupItem.type === 'manual' ? '手動備份' : '自動備份' }}</li>
          </ul>
        </div>

        <div class="rounded-lg bg-gray-50 p-3">
          <label class="flex items-center">
            <input
              v-model="restoreConfirmed"
              type="checkbox"
              class="mr-2"
              required
            />
            <span class="text-sm text-gray-700">
              我了解此操作的風險，並已備份當前重要資料
            </span>
          </label>
        </div>
      </div>
    </ConfirmDialog>

    <!-- 進度提示 -->
    <div v-if="showProgress" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="mx-4 w-full max-w-sm rounded-lg bg-white p-6">
        <div class="text-center">
          <div class="mx-auto mb-4 size-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <h3 class="mb-2 text-lg font-medium text-gray-900">{{ progressMessage }}</h3>
          <p class="text-sm text-gray-600">請勿關閉瀏覽器或離開頁面</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ServerIcon,
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import SmartButton from '@/components/ui/SmartButton.vue'
import SmartForm from '@/components/ui/SmartForm.vue'
import ResponsiveTable from '@/components/common/ResponsiveTable.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const emit = defineEmits(['backup', 'restore'])

// 狀態管理
const creatingBackup = ref(false)
const loadingBackups = ref(false)
const savingConfig = ref(false)
const restoring = ref(false)
const showRestoreConfirm = ref(false)
const restoreConfirmed = ref(false)
const showProgress = ref(false)
const progressMessage = ref('')

// 檔案選擇
const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const selectedBackupItem = ref<any>(null)

// 備份選項
const backupOptions = ref({
  includeUserData: true,
  includeSystemSettings: true,
  includeFileUploads: false
})

// 自動備份設定
const autoBackupConfig = ref({
  enabled: true,
  frequency: 'daily',
  time: '02:00',
  retention_days: 30,
  max_backups: 10,
  include_user_data: true,
  include_system_settings: true,
  include_file_uploads: false
})

// 備份歷史
const backupHistory = ref([
  {
    id: 1,
    filename: 'backup_20240115_020000.sql',
    type: 'auto',
    status: 'completed',
    size: 15728640, // 15MB
    created_at: '2024-01-15T02:00:00Z',
    completed_at: '2024-01-15T02:05:32Z'
  },
  {
    id: 2,
    filename: 'backup_20240114_143022.sql',
    type: 'manual',
    status: 'completed',
    size: 15234816, // ~14.5MB
    created_at: '2024-01-14T14:30:22Z',
    completed_at: '2024-01-14T14:33:45Z'
  },
  {
    id: 3,
    filename: 'backup_20240113_020000.sql',
    type: 'auto',
    status: 'failed',
    size: 0,
    created_at: '2024-01-13T02:00:00Z',
    error_message: '磁碟空間不足'
  }
])

// 系統統計
const systemStats = ref({
  totalBackups: 12,
  totalSize: 180000000, // ~171MB
  lastBackupDays: 1,
  availableSpace: '2.5GB'
})

// 表格欄位
const backupColumns = computed(() => [
  { key: 'filename', label: '檔案名稱', sortable: true },
  { key: 'type', label: '類型' },
  { key: 'status', label: '狀態' },
  { key: 'size', label: '大小', sortable: true },
  { key: 'created_at', label: '建立時間', sortable: true },
  { key: 'actions', label: '操作' }
])

// 表單欄位
const autoBackupFields = computed(() => [
  {
    key: 'enabled',
    label: '啟用自動備份',
    type: 'checkbox'
  },
  {
    key: 'frequency',
    label: '備份頻率',
    type: 'select',
    options: [
      { value: 'daily', label: '每日' },
      { value: 'weekly', label: '每週' },
      { value: 'monthly', label: '每月' }
    ],
    disabled: !autoBackupConfig.value.enabled
  },
  {
    key: 'time',
    label: '執行時間',
    type: 'time',
    disabled: !autoBackupConfig.value.enabled
  },
  {
    key: 'retention_days',
    label: '保留天數',
    type: 'number',
    min: 7,
    max: 365,
    disabled: !autoBackupConfig.value.enabled
  },
  {
    key: 'max_backups',
    label: '最大備份數量',
    type: 'number',
    min: 3,
    max: 50,
    disabled: !autoBackupConfig.value.enabled
  },
  {
    key: 'include_user_data',
    label: '包含用戶資料',
    type: 'checkbox',
    disabled: !autoBackupConfig.value.enabled
  },
  {
    key: 'include_system_settings',
    label: '包含系統設定',
    type: 'checkbox',
    disabled: !autoBackupConfig.value.enabled
  },
  {
    key: 'include_file_uploads',
    label: '包含檔案上傳',
    type: 'checkbox',
    disabled: !autoBackupConfig.value.enabled
  }
])

// 計算屬性
const canCreateBackup = computed(() => {
  return backupOptions.value.includeUserData ||
         backupOptions.value.includeSystemSettings ||
         backupOptions.value.includeFileUploads
})

// 方法
const createBackup = async () => {
  creatingBackup.value = true
  showProgress.value = true
  progressMessage.value = '正在建立備份...'

  try {
    console.log('建立備份:', backupOptions.value)

    // 模擬備份過程
    await new Promise(resolve => setTimeout(resolve, 3000))

    emit('backup', backupOptions.value)

    // 重新整理備份列表
    await refreshBackupList()
  } catch (error) {
    console.error('備份失敗:', error)
  } finally {
    creatingBackup.value = false
    showProgress.value = false
  }
}

const saveAutoBackupConfig = async () => {
  savingConfig.value = true
  try {
    console.log('儲存自動備份設定:', autoBackupConfig.value)
    // TODO: 實際儲存設定
  } catch (error) {
    console.error('儲存設定失敗:', error)
  } finally {
    savingConfig.value = false
  }
}

const refreshBackupList = async () => {
  loadingBackups.value = true
  try {
    console.log('重新整理備份列表')
    // TODO: 從 API 獲取備份列表
    await new Promise(resolve => setTimeout(resolve, 1000))
  } catch (error) {
    console.error('載入備份列表失敗:', error)
  } finally {
    loadingBackups.value = false
  }
}

const downloadBackup = (backup: any) => {
  console.log('下載備份:', backup.filename)
  // TODO: 實現備份下載
}

const restoreFromBackup = (backup: any) => {
  selectedBackupItem.value = backup
  restoreConfirmed.value = false
  showRestoreConfirm.value = true
}

const deleteBackup = async (backup: any) => {
  if (confirm(`確定要刪除備份 "${backup.filename}" 嗎？`)) {
    console.log('刪除備份:', backup.filename)
    // TODO: 實際刪除備份
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
  }
}

const confirmRestore = () => {
  if (selectedFile.value) {
    selectedBackupItem.value = {
      filename: selectedFile.value.name,
      size: selectedFile.value.size,
      created_at: new Date().toISOString(),
      type: 'upload'
    }
    restoreConfirmed.value = false
    showRestoreConfirm.value = true
  }
}

const executeRestore = async () => {
  if (!restoreConfirmed.value) return

  restoring.value = true
  showProgress.value = true
  progressMessage.value = '正在還原資料...'

  try {
    if (selectedFile.value) {
      console.log('從檔案還原:', selectedFile.value.name)
      emit('restore', selectedFile.value)
    } else if (selectedBackupItem.value) {
      console.log('從備份還原:', selectedBackupItem.value.filename)
      emit('restore', selectedBackupItem.value)
    }

    // 模擬還原過程
    await new Promise(resolve => setTimeout(resolve, 5000))

    showRestoreConfirm.value = false
    selectedFile.value = null
    selectedBackupItem.value = null
  } catch (error) {
    console.error('還原失敗:', error)
  } finally {
    restoring.value = false
    showProgress.value = false
  }
}

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    completed: '完成',
    failed: '失敗',
    running: '執行中'
  }
  return statusMap[status] || status
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('zh-TW')
}

onMounted(() => {
  refreshBackupList()
  console.log('BackupRestore 組件已掛載')
})
</script>
