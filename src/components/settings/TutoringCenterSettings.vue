<template>
  <div class="space-y-8">
    <!-- 頁面標題 -->
    <div class="border-b border-gray-200 pb-4">
      <h1 class="text-3xl font-bold text-gray-900">系統設定</h1>
    </div>

    <!-- 設定選單 -->
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-4">
      <!-- 側邊選單 -->
      <SettingsSidebar
        v-model:activeSection="activeSection"
        :sections="settingSections"
      />

      <!-- 設定內容 -->
      <div class="lg:col-span-3">
        <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">

          <!-- 基本資訊設定 -->
          <SystemInfoSettings
            v-if="activeSection === 'basic'"
            v-model="settings.basic"
            :logo-file="logoUpload.file.value"
            :logo-preview="logoUpload.preview.value"
            :uploading="logoUpload.uploading.value"
            :upload-message="uploadMessage"
            @update:logo-file="logoUpload.file.value = $event"
            @update:logo-preview="logoUpload.preview.value = $event"
            @handle-logo-change="logoUpload.handleFileChange"
            @remove-logo="handleRemoveLogo"
            @trigger-file-input="triggerFileInput"
          />

          <!-- 收據設定 -->
          <ReceiptSettings
            v-if="activeSection === 'templates'"
            :templates="templates"
            :basic-settings="settings.basic"
            @show-template-form="templateModal.open()"
            @delete-template="deleteTemplate"
            @select-template="selectTemplate"
            @reset-templates="handleResetTemplates"
          />

          <!-- 教室管理 -->
          <ClassroomSettings
            v-if="activeSection === 'classrooms'"
            :classrooms="settings.classrooms"
            :loading="settingsManager.loading.value"
            @update:classrooms="settings.classrooms = $event"
            @add-classroom="addClassroom"
            @remove-classroom="removeClassroom"
          />

          <!-- 課程分類管理 -->
          <CategorySettings
            v-if="activeSection === 'categories'"
            :categories="settings.categories"
            :loading="settingsManager.loading.value"
            :color-picker="colorPicker"
            @update:categories="settings.categories = $event"
            @add-category="addCategory"
            @remove-category="removeCategory"
          />

          <!-- 課程方案設定 -->
          <CoursePackageSettings
            v-if="activeSection === 'packages'"
          />

          <!-- 用戶權限管理 -->
          <UserPermissionSettings
            v-if="activeSection === 'users'"
            :user-management="userManagement"
            :permission-modules="permissionModules"
          />

          <!-- 系統日誌 -->
          <AuditLogViewer v-if="activeSection === 'logs'" />

          <!-- 資料匯入 -->
          <DataImport v-if="activeSection === 'import'" />

          <!-- 儲存按鈕 -->
          <SaveSettingsBar
            v-if="!['logs', 'import', 'packages'].includes(activeSection)"
            :saving="saving"
            @save="saveSettings"
            @reset="resetSettings"
          />
        </div>
      </div>
    </div>

    <!-- 成功提示 -->
    <SuccessMessageToast
      :show="successMessage.show.value"
      :message="successMessage.message.value"
      :type="successMessage.type.value"
    />

    <!-- 模板表單 Modal -->
    <TemplateUploadModal
      :show="templateModal.isOpen.value"
      @close="templateModal.close"
      @submit="handleTemplateSubmit"
    />

    <!-- 用戶表單 Modal -->
    <UserFormModal
      v-if="userManagement.userModal.isOpen.value"
      :modal="userManagement.userModal"
      :avatar-upload="userManagement.avatarUpload"
      :roles="userManagement.roles.value"
      :editing-user="userManagement.editingUser.value"
      @save="handleSaveUser"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authSupabase'
import { db, queries, supabase } from '@/services/supabase'

// Composables
import { useSettingsManager } from '@/composables/useSettingsManager'
import { useColorPicker } from '@/composables/useColorPicker'
import { useFileUpload } from '@/composables/useFileUpload'
import { useFormModal } from '@/composables/useFormModal'
import { useSuccessMessage } from '@/composables/useSuccessMessage'
import { useUserManagement } from '@/composables/useUserManagement'

// Components
import AuditLogViewer from './AuditLogViewer.vue'
import DataImport from './DataImport.vue'
import ReceiptSettings from './ReceiptSettings.vue'
import TemplateUploadModal from './TemplateUploadModal.vue'
import SystemInfoSettings from './SystemInfoSettings.vue'
import ClassroomSettings from './ClassroomSettings.vue'
import CategorySettings from './CategorySettings.vue'
import CoursePackageSettings from './CoursePackageSettings.vue'
import UserPermissionSettings from './UserPermissionSettings.vue'
import UserFormModal from './UserFormModal.vue'
import SettingsSidebar from './SettingsSidebar.vue'
import SaveSettingsBar from './SaveSettingsBar.vue'
import SuccessMessageToast from '@/components/ui/SuccessMessageToast.vue'

// Services
import {
  loadTemplates,
  deleteTemplate as deleteTemplateById,
  uploadCustomTemplate,
  resetBuiltInTemplates
} from '@/services/templateService'

// Icons
import {
  BuildingOfficeIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  TagIcon,
  CurrencyDollarIcon
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()

// State
const activeSection = ref('basic')
const saving = ref(false)
const templates = ref<any[]>([])

// Settings data
const settings = ref({
  basic: {
    name: '',
    tax_id: '',
    address: '',
    phone: '',
    email: '',
    director: '',
    business_hours: '',
    logo_url: ''
  },
  classrooms: [] as { classroom_id?: string; name: string; capacity: number; is_active?: boolean }[],
  categories: [] as { id?: string; name: string; description?: string; color?: string; is_active?: boolean }[]
})

// Composables
const settingsManager = useSettingsManager<typeof settings.value>()
const colorPicker = useColorPicker()
const successMessage = useSuccessMessage()
const userManagement = useUserManagement()

// Logo upload
const logoUpload = useFileUpload({
  bucket: 'logos',
  maxSize: 2 * 1024 * 1024,
  allowedTypes: ['image/'],
  generateFileName: (file) => `logo.${file.name.split('.').pop()}`
})

// Template modal
const templateModal = useFormModal({
  defaultValues: {
    name: '',
    description: '',
    file: null as File | null
  }
})

// Upload message for logo
const uploadMessage = ref({
  show: false,
  type: 'success' as 'success' | 'error',
  text: ''
})

// Settings sections configuration
const settingSections = [
  {
    key: 'basic',
    name: '基本資訊',
    icon: BuildingOfficeIcon
  },
  {
    key: 'templates',
    name: '收據設定',
    icon: DocumentTextIcon
  },
  {
    key: 'classrooms',
    name: '教室管理',
    icon: BuildingOffice2Icon
  },
  {
    key: 'categories',
    name: '課程分類',
    icon: TagIcon
  },
  {
    key: 'packages',
    name: '課程方案',
    icon: CurrencyDollarIcon
  },
  {
    key: 'users',
    name: '權限管理',
    icon: UserGroupIcon
  },
  {
    key: 'logs',
    name: '系統日誌',
    icon: DocumentTextIcon
  },
  {
    key: 'import',
    name: '資料匯入',
    icon: CloudArrowUpIcon
  }
]

// Permission modules configuration
const permissionModules = [
  { name: '儀表板', admin: true, staff: true, teacher: true },
  { name: '學生管理', admin: true, staff: true, teacher: true },
  { name: '聯絡人管理', admin: true, staff: true, teacher: false },
  { name: '課程管理', admin: true, staff: true, teacher: true },
  { name: '課程安排', admin: true, staff: true, teacher: true },
  { name: '出勤管理', admin: true, staff: true, teacher: true },
  { name: '訂單管理', admin: true, staff: true, teacher: false },
  { name: '收費管理', admin: true, staff: true, teacher: false },
  { name: '客戶關係', admin: true, staff: true, teacher: false },
  { name: '報表分析', admin: true, staff: true, teacher: false },
  { name: '系統設定', admin: true, staff: false, teacher: false }
]

// Settings configurations
const settingsConfig = {
  basic: {
    key: 'basic_info',
    defaultValue: settings.value.basic,
    description: '基本資訊設定'
  },
  categories: {
    key: 'course_categories',
    defaultValue: settings.value.categories,
    description: '課程分類設定'
  }
}

// Methods
const loadSettings = async () => {
  try {
    // Load settings using the settings manager
    const loadedSettings = await settingsManager.loadAllSettings(settingsConfig)
    settings.value.basic = loadedSettings.basic
    settings.value.categories = loadedSettings.categories

    // Load classrooms separately
    await loadClassrooms()
  } catch (error) {
    console.error('載入設定失敗:', error)
    // 使用預設值以確保系統可以運作
    console.log('使用預設設定值')
    if (!settings.value.categories || settings.value.categories.length === 0) {
      settings.value.categories = [
        { name: '數學', description: '各年級數學課程', color: '#3B82F6', is_active: true },
        { name: '英文', description: '英語聽說讀寫課程', color: '#10B981', is_active: true }
      ]
    }
  }
}

const loadClassrooms = async () => {
  try {
    const classrooms = await queries.getClassrooms()
    settings.value.classrooms = classrooms.map(room => ({
      classroom_id: room.classroom_id,
      name: room.classroom_name,
      capacity: room.capacity,
      is_active: room.is_active
    }))
  } catch (error) {
    console.error('載入教室數據失敗:', error)
    settings.value.classrooms = []
  }
}

const saveSettings = async () => {
  saving.value = true

  try {
    // Upload logo if needed
    if (logoUpload.file.value) {
      const result = await logoUpload.upload()
      if (result) {
        settings.value.basic.logo_url = result.url
        showUploadMessage('success', 'LOGO上傳成功！')
      }
    }

    // Save settings using the settings manager
    await settingsManager.saveAllSettings(settingsConfig, {
      basic: settings.value.basic,
      categories: settings.value.categories
    })

    // Save classrooms separately
    await saveClassrooms()

    successMessage.success('設定已儲存')
  } catch (error) {
    console.error('儲存設定失敗:', error)
    successMessage.error('儲存設定失敗，請稍後再試')
  } finally {
    saving.value = false
  }
}

const saveClassrooms = async () => {
  for (const classroom of settings.value.classrooms) {
    if (classroom.classroom_id) {
      // Update existing classroom
      const { error } = await supabase
        .from('classrooms')
        .update({
          classroom_name: classroom.name,
          capacity: classroom.capacity,
          is_active: classroom.is_active ?? true,
          updated_at: new Date().toISOString()
        })
        .eq('classroom_id', classroom.classroom_id)

      if (error) throw error
    } else {
      // Create new classroom
      const timestamp = Date.now().toString(36)
      const random = Math.random().toString(36).substr(2, 5)
      const shortId = `CR_${timestamp}_${random}`.substring(0, 20)

      const newClassroom = await db.create('classrooms', {
        classroom_id: shortId,
        classroom_name: classroom.name,
        capacity: classroom.capacity,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      classroom.classroom_id = newClassroom.classroom_id
    }
  }
}

const resetSettings = () => {
  loadSettings()
}

const addClassroom = () => {
  settings.value.classrooms.push({
    name: '',
    capacity: 10,
    is_active: true
  })
}

const removeClassroom = async (index: number) => {
  const classroom = settings.value.classrooms[index]

  if (classroom.classroom_id) {
    if (confirm(`確定要刪除教室 "${classroom.name}" 嗎？此操作將標記為非活躍狀態。`)) {
      try {
        const { error } = await supabase
          .from('classrooms')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('classroom_id', classroom.classroom_id)

        if (error) throw error

        settings.value.classrooms.splice(index, 1)
      } catch (error) {
        console.error('停用教室失敗:', error)
        successMessage.error('停用教室失敗')
      }
    }
  } else {
    settings.value.classrooms.splice(index, 1)
  }
}

const addCategory = () => {
  settings.value.categories.push({
    name: '',
    description: '',
    color: '#3B82F6',
    is_active: true
  })
}

const removeCategory = async (index: number) => {
  const category = settings.value.categories[index]

  if (category.id) {
    if (confirm(`確定要刪除分類 "${category.name}" 嗎？請確保沒有課程正在使用此分類。`)) {
      settings.value.categories.splice(index, 1)
    }
  } else {
    settings.value.categories.splice(index, 1)
  }
}

const handleRemoveLogo = () => {
  logoUpload.reset()
  settings.value.basic.logo_url = ''
  showUploadMessage('success', 'LOGO已移除，請點擊「儲存設定」來確認變更')
}

const showUploadMessage = (type: 'success' | 'error', text: string) => {
  uploadMessage.value = { show: true, type, text }
  setTimeout(() => {
    uploadMessage.value.show = false
  }, 5000)
}

const triggerFileInput = () => {
  // Will be handled by SystemInfoSettings component
}

// PDF Templates
const loadPDFTemplates = async () => {
  try {
    console.log('開始載入PDF模板...')
    const templateList = await loadTemplates()
    console.log('載入的模板列表:', templateList)

    // 如果沒有載入到任何模板，嘗試重置為預設模板
    if (!templateList || templateList.length === 0) {
      console.log('沒有找到模板，嘗試重置為預設模板...')
      const defaultTemplates = await resetBuiltInTemplates()
      templates.value = defaultTemplates
    } else {
      templates.value = templateList
    }
  } catch (error) {
    console.error('載入PDF模板失敗:', error)
    // 如果載入失敗，嘗試使用預設模板
    try {
      const defaultTemplates = await resetBuiltInTemplates()
      templates.value = defaultTemplates
    } catch (resetError) {
      console.error('重置預設模板也失敗:', resetError)
      templates.value = []
    }
  }
}

const handleTemplateSubmit = async (data: { name: string; description: string; file: File }) => {
  try {
    const htmlContent = await readFileAsText(data.file)
    await uploadCustomTemplate(
      data.name,
      data.description || '自定義HTML模板',
      htmlContent,
      'receipt'
    )

    await loadPDFTemplates()
    templateModal.close()
    successMessage.success('模板上傳成功')
  } catch (error) {
    console.error('上傳模板失敗:', error)
    successMessage.error('上傳模板失敗')
  }
}

const deleteTemplate = async (templateId: string) => {
  if (confirm('確定要刪除這個模板嗎？此操作無法復原。')) {
    try {
      await deleteTemplateById(templateId)
      await loadPDFTemplates()
      successMessage.success('模板已刪除')
    } catch (error) {
      console.error('刪除模板失敗:', error)
      successMessage.error('刪除模板失敗')
    }
  }
}

const selectTemplate = async (template: any) => {
  try {
    console.log('選擇模板:', template.name)

    // 儲存當前選擇的收據模板到資料庫
    const { error } = await supabase
      .from('tutoring_center_settings')
      .upsert({
        setting_key: 'current_receipt_template',
        setting_value: template,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key'
      })

    if (error) {
      // 如果是 RLS 錯誤，至少儲存到 localStorage
      if (error.message?.includes('row-level security')) {
        console.warn('RLS 權限錯誤，儲存到本地儲存')
        localStorage.setItem('current_receipt_template_cache', JSON.stringify(template))
        successMessage.success(`已選擇模板：${template.name}（本地儲存）`)
      } else {
        throw error
      }
    } else {
      // 同步到 localStorage
      localStorage.setItem('current_receipt_template_cache', JSON.stringify(template))
      successMessage.success(`已選擇模板：${template.name}`)
    }
  } catch (error) {
    console.error('選擇模板失敗:', error)
    successMessage.error('選擇模板失敗')
  }
}

const handleResetTemplates = async () => {
  try {
    console.log('重置模板...')
    const defaultTemplates = await resetBuiltInTemplates()
    templates.value = defaultTemplates
    successMessage.success('模板已重置為預設值')
  } catch (error) {
    console.error('重置模板失敗:', error)
    successMessage.error('重置模板失敗')
  }
}

const handleSaveUser = async () => {
  try {
    await userManagement.saveUser()
    successMessage.success('用戶已儲存')
  } catch (error) {
    console.error('儲存用戶失敗:', error)
    successMessage.error('儲存用戶失敗')
  }
}

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

// Lifecycle
onMounted(async () => {
  await loadSettings()
  await userManagement.loadRoles()
  await userManagement.loadUsers()
  await loadPDFTemplates()

  // Setup color picker click outside handler
  colorPicker.setupClickOutsideHandler()
})
</script>
