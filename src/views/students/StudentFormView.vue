<template>
  <MainLayout>
    <div class="mx-auto max-w-6xl space-y-6">
      <!-- 頁面標題和操作 -->
      <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {{ isEdit ? '編輯學生' : '新增學生' }}
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            {{ isEdit ? '修改學生的基本資料和聯絡資訊' : '新增學生的基本資料和聯絡資訊' }}
          </p>
        </div>
        <div class="mt-4 flex md:ml-4 md:mt-0">
          <router-link
            :to="isEdit ? `/students/${route.params.id}` : '/students'"
            class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {{ isEdit ? '返回詳情' : '返回列表' }}
          </router-link>
        </div>
      </div>

      <!-- 成功提示 -->
      <div v-if="successMessage" class="rounded-md border border-green-200 bg-green-50 p-4">
        <h3 class="text-sm font-medium text-green-800">操作成功</h3>
        <p class="mt-1 text-sm text-green-700">{{ successMessage }}</p>
      </div>

      <!-- 錯誤提示 -->
      <div v-if="error" class="rounded-md border border-red-200 bg-red-50 p-4">
        <h3 class="text-sm font-medium text-red-800">發生錯誤</h3>
        <p class="mt-1 text-sm text-red-700">{{ error }}</p>
      </div>

      <!-- 學生表單 -->
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- 基本資料 -->
        <div class="card p-6">
          <div class="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
            <h3 class="text-lg font-medium text-gray-900">基本資料</h3>
            <!-- 更新按鈕（僅編輯模式） -->
            <button
              v-if="isEdit"
              type="button"
              @click="handleUpdateStudentData"
              :disabled="loading || !isFormValid"
              class="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ loading ? '更新中...' : '更新基本資料' }}
            </button>
          </div>
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label for="chinese_name" class="mb-2 block text-sm font-medium text-gray-700">
                中文姓名 <span class="text-red-500">*</span>
              </label>
              <input
                id="chinese_name"
                v-model="form.chinese_name"
                type="text"
                required
                class="input mt-1 h-11 w-full px-4"
                placeholder="請輸入中文姓名"
                :disabled="loading"
              />
            </div>
            <div>
              <label for="english_name" class="mb-2 block text-sm font-medium text-gray-700">
                英文姓名
              </label>
              <input
                id="english_name"
                v-model="form.english_name"
                type="text"
                class="input mt-1 h-11 w-full px-4"
                placeholder="請輸入英文姓名"
                :disabled="loading"
              />
            </div>
            <div>
              <label for="birth_date" class="mb-2 block text-sm font-medium text-gray-700">
                出生日期
              </label>
              <input
                id="birth_date"
                v-model="form.birth_date"
                type="date"
                class="input mt-1 h-11 w-full px-4"
                :disabled="loading"
              />
            </div>
            <div>
              <label for="student_id" class="mb-2 block text-sm font-medium text-gray-700">
                學生編號
              </label>
              <input
                id="student_id"
                v-model="form.student_id"
                type="text"
                class="input mt-1 h-11 w-full px-4"
                placeholder="系統自動生成"
                :disabled="true"
              />
            </div>
          </div>
        </div>

        <!-- 聯絡人資料 -->
        <div v-if="isEdit" class="card p-6">
          <ContactDataModule
            :student-db-id="parseInt(route.params.id as string)"
            :student-id="form.student_id"
          />
        </div>

        <!-- 新增模式的聯絡人說明 -->
        <div v-else class="card p-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">聯絡人資料</h3>
          <p class="text-gray-500">請先儲存學生基本資料，然後再編輯聯絡人資訊。</p>
        </div>

        <!-- 表單按鈕（僅新增模式） -->
        <div v-if="!isEdit" class="flex justify-end space-x-4 border-t border-gray-200 pt-6">
          <router-link to="/students" class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            取消
          </router-link>
          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ loading ? '儲存中...' : '新增學生' }}
          </button>
        </div>
      </form>
    </div>

    <!-- 確認對話框 -->
    <div v-if="showConfirmDialog" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
        <!-- 背景遮罩 -->
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="cancelUpdate"></div>

        <!-- 對話框 -->
        <div class="inline-block overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div class="text-center sm:text-left">
              <h3 class="mb-2 text-lg font-medium leading-6 text-gray-900">確認更新</h3>
              <p class="text-sm text-gray-500">
                您確定要更新學生的基本資料嗎？此操作將會保存當前的修改。
              </p>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              @click="confirmUpdate"
              class="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
            >
              確認更新
            </button>
            <button
              type="button"
              @click="cancelUpdate"
              class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authSupabase'
import { db, supabase } from '@/services/supabase'
import MainLayout from '@/components/layout/MainLayout.vue'
import ContactDataModule from '@/components/contacts/ContactDataModule.vue'
import type { Student, StudentForm } from '@/types'

// 路由和狀態管理
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 表單狀態
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const showConfirmDialog = ref(false)
const isEdit = computed(() => !!route.params.id)

// 表單資料
const form = reactive<StudentForm>({
  student_id: '',
  chinese_name: '',
  english_name: '',
  birth_date: ''
})

// 計算屬性
const isFormValid = computed(() => {
  return form.chinese_name.trim() !== ''
})

// 確認更新基本資料
function handleUpdateStudentData() {
  showConfirmDialog.value = true
}

function confirmUpdate() {
  showConfirmDialog.value = false
  handleSubmit()
}

function cancelUpdate() {
  showConfirmDialog.value = false
}

// 聯絡人資料現在由 ContactDataModule 獨立處理


// 載入學生資料（編輯模式）
async function loadStudent() {
  if (!isEdit.value) return

  loading.value = true
  error.value = ''

  try {
    const studentId = parseInt(route.params.id as string)
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    if (!student) {
      throw new Error('找不到學生資料')
    }

    // 填入表單資料
    form.student_id = student.student_id || ''
    form.chinese_name = student.chinese_name
    form.english_name = student.english_name || ''
    form.birth_date = student.birth_date || ''

  } catch (err) {
    console.error('載入學生資料失敗:', err)
    error.value = err instanceof Error ? err.message : '載入學生資料失敗'
  } finally {
    loading.value = false
  }
}

// 生成學生編號
async function generateStudentId(): Promise<string> {
  try {
    console.log('[StudentForm] 開始生成學生編號')
    
    // 查詢數據庫中最大的學生編號
    const { data: students, error } = await supabase
      .from('students')
      .select('student_id')
      .like('student_id', 'S%')
      .order('student_id', { ascending: false })
      .limit(1)

    if (error) {
      console.error('[StudentForm] 查詢學生編號失敗:', error)
      // 使用時間戳作為備用方案
      const timestamp = Date.now().toString().slice(-6)
      return `S${timestamp}`
    }

    let nextNumber = 1

    if (students && students.length > 0) {
      const lastId = students[0].student_id
      console.log('[StudentForm] 最後一個編號:', lastId)
      
      // 從 S000001 格式中提取數字部分
      const match = lastId.match(/^S(\d+)$/)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }

    // 格式化為 S000001 格式（6位數字，不足補0）
    const newId = `S${nextNumber.toString().padStart(6, '0')}`
    console.log('[StudentForm] 生成的新編號:', newId)
    return newId
  } catch (error) {
    console.error('[StudentForm] 生成學生編號異常:', error)
    // 使用時間戳作為備用方案
    const timestamp = Date.now().toString().slice(-6)
    return `S${timestamp}`
  }
}

// 處理表單提交
async function handleSubmit() {
  if (!isFormValid.value) {
    error.value = '請填寫所有必填欄位'
    return
  }

  loading.value = true
  error.value = ''
  successMessage.value = ''

  try {
    // 顯示環境資訊以協助除錯
    console.log('[StudentForm] 提交表單 - 環境資訊:', {
      browser: navigator.userAgent,
      platform: navigator.platform,
      online: navigator.onLine,
      user: authStore.user?.email,
      role: authStore.user?.role?.role_code
    })
    
    if (isEdit.value) {
      await updateStudent()
      // 編輯模式：顯示成功訊息但不重定向，讓用戶確認更新結果
      successMessage.value = '學生資料更新成功！'
    } else {
      await createStudent()
      // 新增模式：成功後重定向到學生列表
      successMessage.value = '學生新增成功！'
      
      // 稍微延遲後再重定向，讓用戶看到成功訊息
      setTimeout(() => {
        router.push('/students')
      }, 1500)
    }
  } catch (err) {
    console.error('[StudentForm] 儲存學生資料失敗:', err)
    
    // 提供更詳細的錯誤訊息
    const errorMessage = err instanceof Error ? err.message : '儲存學生資料失敗'
    error.value = `${errorMessage}\n\n如果問題持續，請聯絡系統管理員。`
    
    // 在 console 顯示完整錯誤
    console.error('[StudentForm] 完整錯誤資訊:', {
      error: err,
      formData: form,
      timestamp: new Date().toISOString()
    })
  } finally {
    loading.value = false
  }
}

// 新增學生
async function createStudent() {
  console.log('[StudentForm] 開始新增學生')
  
  try {
    // 檢查用戶權限
    if (!authStore.user) {
      throw new Error('用戶未登入')
    }
    
    const userRole = authStore.user?.role?.role_code
    console.log('[StudentForm] 當前用戶角色:', userRole)
    
    if (!['ADMIN', 'STAFF'].includes(userRole)) {
      throw new Error(`權限不足：您的角色 ${userRole} 無法新增學生`)
    }
    
    // 檢查並處理日期格式
    if (form.birth_date && form.birth_date.trim() !== '') {
      // 驗證日期格式 (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(form.birth_date)) {
        // 嘗試轉換常見的日期格式
        const dateValue = new Date(form.birth_date)
        if (isNaN(dateValue.getTime())) {
          throw new Error('出生日期格式不正確，請使用 YYYY-MM-DD 格式（例如：2010-05-15）')
        }
        // 自動轉換為正確格式
        const year = dateValue.getFullYear()
        const month = String(dateValue.getMonth() + 1).padStart(2, '0')
        const day = String(dateValue.getDate()).padStart(2, '0')
        form.birth_date = `${year}-${month}-${day}`
        console.log('[StudentForm] 自動轉換日期格式為:', form.birth_date)
      }
      
      // 驗證日期是否合理
      const birthDate = new Date(form.birth_date)
      const today = new Date()
      const minDate = new Date('1900-01-01')
      
      if (birthDate > today) {
        throw new Error('出生日期不能是未來的日期')
      }
      if (birthDate < minDate) {
        throw new Error('出生日期不能早於 1900 年')
      }
    }
    
    // 生成學生編號
    const studentId = await generateStudentId()
    console.log('[StudentForm] 生成的學生編號:', studentId)
    
    // 準備學生資料
    const studentData: any = {
      student_id: studentId,
      chinese_name: form.chinese_name.trim(),
      english_name: form.english_name?.trim() || null,
      birth_date: form.birth_date || null,
      is_active: true
    }
    
    console.log('[StudentForm] 準備寫入的資料:', studentData)
    
    // 設定請求超時時間
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('請求超時：資料庫回應時間過長')), 30000) // 30秒超時
    })
    
    // 使用 Promise.race 來處理超時
    const insertPromise = supabase
      .from('students')
      .insert(studentData)
      .select()
      .single()
    
    const result = await Promise.race([insertPromise, timeoutPromise]) as any
    
    if (result.error) {
      console.error('[StudentForm] Supabase 寫入錯誤:', result.error)
      
      // 提供更詳細的錯誤訊息
      if (result.error.code === '42501') {
        throw new Error('權限不足：資料庫拒絕寫入。請確認您的帳號權限。')
      } else if (result.error.code === '23505') {
        throw new Error('學生編號重複，請重新操作')
      } else if (result.error.code === '22007') {
        throw new Error('日期格式錯誤：請檢查出生日期格式')
      } else if (result.error.message?.includes('network')) {
        throw new Error('網路連線問題，請檢查網路後重試')
      } else {
        throw new Error(`新增失敗: ${result.error.message || '未知錯誤'}`)
      }
    }
    
    const student = result.data
    
    if (!student) {
      throw new Error('新增失敗：未返回學生資料')
    }
    
    console.log('[StudentForm] 學生新增成功:', student)
    
    // 記錄稽核日誌 (如果函數存在)
    if (typeof authStore.logAudit === 'function') {
      try {
        await authStore.logAudit('create', 'students', student.id.toString(), studentData)
      } catch (auditError) {
        console.warn('[StudentForm] 稽核日誌記錄失敗:', auditError)
        // 不中斷流程
      }
    }
    
    return student
  } catch (error) {
    console.error('[StudentForm] 新增學生失敗:', error)
    throw error
  }
}

// 更新學生
async function updateStudent() {
  const studentId = parseInt(route.params.id as string)

  // 檢查並處理日期格式
  if (form.birth_date && form.birth_date.trim() !== '') {
    // 驗證日期格式 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(form.birth_date)) {
      // 嘗試轉換常見的日期格式
      const dateValue = new Date(form.birth_date)
      if (isNaN(dateValue.getTime())) {
        throw new Error('出生日期格式不正確，請使用 YYYY-MM-DD 格式（例如：2010-05-15）')
      }
      // 自動轉換為正確格式
      const year = dateValue.getFullYear()
      const month = String(dateValue.getMonth() + 1).padStart(2, '0')
      const day = String(dateValue.getDate()).padStart(2, '0')
      form.birth_date = `${year}-${month}-${day}`
      console.log('[StudentForm] 自動轉換日期格式為:', form.birth_date)
    }
    
    // 驗證日期是否合理
    const birthDate = new Date(form.birth_date)
    const today = new Date()
    const minDate = new Date('1900-01-01')
    
    if (birthDate > today) {
      throw new Error('出生日期不能是未來的日期')
    }
    if (birthDate < minDate) {
      throw new Error('出生日期不能早於 1900 年')
    }
  }

  // 準備更新資料
  const updateData: any = {
    chinese_name: form.chinese_name,
    english_name: form.english_name || null,
    birth_date: form.birth_date || null,
    updated_at: new Date().toISOString()
  }

  console.log('[StudentForm] 準備更新的資料:', updateData)

  // 設定請求超時時間
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('請求超時：資料庫回應時間過長')), 30000) // 30秒超時
  })

  // 使用 Promise.race 來處理超時
  const updatePromise = supabase
    .from('students')
    .update(updateData)
    .eq('id', studentId)
    .select()
    .single()

  const result = await Promise.race([updatePromise, timeoutPromise]) as any

  if (result.error) {
    console.error('[StudentForm] 更新學生資料失敗:', result.error)
    
    // 提供更詳細的錯誤訊息
    if (result.error.code === '22007') {
      throw new Error('日期格式錯誤：請檢查出生日期格式')
    } else if (result.error.message?.includes('network')) {
      throw new Error('網路連線問題，請檢查網路後重試')
    } else {
      throw new Error(`更新失敗: ${result.error.message || '未知錯誤'}`)
    }
  }

  const student = result.data

  if (!student) {
    throw new Error('更新失敗：未返回學生資料')
  }

  console.log('[StudentForm] 學生資料更新成功:', student)

  // 記錄稽核日誌 (如果函數存在)
  if (typeof authStore.logAudit === 'function') {
    await authStore.logAudit('update', 'students', route.params.id as string, updateData)
  }

  // 聯絡人更新由 ContactManager 組件自動處理
}

// 組件掛載時執行
onMounted(() => {
  if (isEdit.value) {
    loadStudent()
  }
  // 新增模式的聯絡人由 ContactManager 組件自動處理
})
</script>

<style scoped>
/* 表單特定樣式 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
