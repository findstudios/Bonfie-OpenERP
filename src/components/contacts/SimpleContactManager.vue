<template>
  <div class="simple-contact-manager">
    <!-- 標題和操作區域 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h3 class="text-lg font-medium text-gray-900">聯絡人資料</h3>
        <p class="mt-1 text-sm text-gray-500">
          管理學生的聯絡人資訊
        </p>
      </div>

      <div class="flex items-center space-x-2">
        <!-- 新增聯絡人按鈕 -->
        <button
          v-if="!readonly && contacts.length < maxContacts"
          type="button"
          @click="addContact"
          class="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          ➕ 新增聯絡人
        </button>

        <!-- 儲存按鈕 -->
        <button
          v-if="!readonly && isDirty"
          type="button"
          @click="saveContacts"
          :disabled="saving"
          class="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          <template v-if="saving">
            ⏳ 儲存中...
          </template>
          <template v-else>
            💾 儲存變更
          </template>
        </button>
      </div>
    </div>

    <!-- 錯誤提示 -->
    <div v-if="error" class="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
      <div class="flex">
        <div class="shrink-0">
          <span class="text-red-400">⚠️</span>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">發生錯誤</h3>
          <p class="mt-1 text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- 載入狀態 -->
    <div v-if="loading" class="py-12 text-center">
      <div class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700">
        <svg class="-ml-1 mr-3 size-5 animate-spin text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        載入聯絡人資料中...
      </div>
    </div>

    <!-- 聯絡人列表 -->
    <div v-else-if="contacts.length === 0" class="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center">
      <h3 class="mb-2 text-lg font-medium text-gray-900">尚未新增任何聯絡人</h3>
      <p class="mb-4 text-gray-500">學生至少需要一個聯絡人資料</p>
      <button
        v-if="!readonly"
        type="button"
        @click="addContact"
        class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        ➕ 新增第一個聯絡人
      </button>
    </div>

    <div v-else class="space-y-6">
      <SimpleContactForm
        v-for="(contact, index) in contacts"
        :key="`contact-${index}-${contact.contact_id || 'new'}`"
        :contact="contact"
        :readonly="readonly || loading"
        :show-remove-button="contacts.length > 1"
        @update:contact="updateContact(index, $event)"
        @remove="removeContact(index)"
      />
    </div>

    <!-- 底部說明 -->
    <div v-if="contacts.length > 0" class="mt-6 text-sm text-gray-500">
      <p>
        📋 目前共有 {{ contacts.length }} 個聯絡人
        <template v-if="!readonly">
          (最多可新增 {{ maxContacts }} 個)
        </template>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import SimpleContactForm from './SimpleContactForm.vue'
import { contactService } from '@/services/contactService'
import { useAuthStore } from '@/stores/authSupabase'
import type { ContactFormData, ContactUpdateResult } from './types'

// Props
interface Props {
  studentId: string
  initialContacts?: ContactFormData[]
  readonly?: boolean
  maxContacts?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialContacts: () => [],
  readonly: false,
  maxContacts: 5
})

// Emits
interface Emits {
  (e: 'contacts-updated', contacts: ContactFormData[]): void
  (e: 'save-success', result: ContactUpdateResult): void
  (e: 'save-error', error: Error): void
}

const emit = defineEmits<Emits>()

// Stores
const authStore = useAuthStore()

// State
const contacts = ref<ContactFormData[]>([])
const originalContacts = ref<ContactFormData[]>([])
const saving = ref(false)
const loading = ref(false)
const error = ref('')
const isInitialized = ref(false)

// Computed
const isDirty = computed(() => {
  return JSON.stringify(contacts.value) !== JSON.stringify(originalContacts.value)
})

// Methods
function addContact() {
  const newContact: ContactFormData = {
    full_name: '',
    phone: '',
    email: '',
    address: '',
    relationship: '父親',
    is_primary: contacts.value.length === 0, // 第一個聯絡人預設為主要聯絡人
    is_emergency: false,
    is_billing: false,
    notes: ''
  }

  contacts.value.push(newContact)
  emit('contacts-updated', [...contacts.value])
}

function removeContact(index: number) {
  contacts.value.splice(index, 1)

  // 如果刪除後沒有主要聯絡人，自動設定第一個為主要聯絡人
  if (contacts.value.length > 0 && !contacts.value.some(c => c.is_primary)) {
    contacts.value[0].is_primary = true
  }

  emit('contacts-updated', [...contacts.value])
}

function updateContact(index: number, updatedContact: ContactFormData) {
  // 如果設定為主要聯絡人，取消其他聯絡人的主要聯絡人狀態
  if (updatedContact.is_primary) {
    contacts.value.forEach((contact, i) => {
      if (i !== index) {
        contact.is_primary = false
      }
    })
  }

  contacts.value[index] = updatedContact
  emit('contacts-updated', [...contacts.value])
}

async function saveContacts() {
  if (!props.studentId || props.studentId.trim() === '') {
    emit('save-error', new Error('缺少學生 ID 或學生資料尚未載入'))
    return
  }

  saving.value = true
  error.value = ''

  try {
    // 驗證聯絡人資料
    const validationErrors = contactService.validateStudentContacts(contacts.value)
    if (validationErrors.length > 0) {
      error.value = validationErrors.join(', ')
      emit('save-error', new Error(validationErrors.join(', ')))
      return
    }

    // 使用直接的 Supabase 操作，類似 ContactFormView 的策略
    await saveContactsDirectly()

    // 更新原始資料以反映儲存狀態，避免重新載入觸發導航
    originalContacts.value = JSON.parse(JSON.stringify(contacts.value))

    const result = { added: 0, updated: 0, deleted: 0, errors: [] }
    emit('save-success', result)
  } catch (saveError) {
    console.error('儲存聯絡人失敗:', saveError)
    error.value = saveError instanceof Error ? saveError.message : '儲存失敗'
    emit('save-error', saveError instanceof Error ? saveError : new Error('儲存失敗'))
  } finally {
    saving.value = false
  }
}

// 直接保存聯絡人的方法（類似 ContactFormView）
async function saveContactsDirectly() {
  const { supabase } = await import('@/services/supabase')

  // 1. 先刪除該學生的所有聯絡人關聯
  const { error: deleteError } = await supabase
    .from('student_contacts')
    .delete()
    .eq('student_id', props.studentId)

  if (deleteError) {
    throw deleteError
  }

  // 2. 為每個聯絡人創建或更新記錄
  for (const contact of contacts.value) {
    let contactId = contact.contact_id

    if (!contactId) {
      // 新聯絡人：生成 ID 並創建
      contactId = generateContactId()
      const { error: createError } = await supabase
        .from('contacts')
        .insert({
          contact_id: contactId,
          full_name: contact.full_name,
          phone: contact.phone,
          email: contact.email || null,
          address: contact.address || null,
          notes: contact.notes || null,
          is_active: true,
          last_modified_by: authStore.user?.user_id
        })

      if (createError) {
        throw createError
      }
    } else {
      // 現有聯絡人：更新
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          full_name: contact.full_name,
          phone: contact.phone,
          email: contact.email || null,
          address: contact.address || null,
          notes: contact.notes || null,
          last_modified_by: authStore.user?.user_id
        })
        .eq('contact_id', contactId)

      if (updateError) {
        throw updateError
      }
    }

    // 3. 創建學生-聯絡人關聯
    const { error: relationError } = await supabase
      .from('student_contacts')
      .insert({
        student_id: props.studentId,
        contact_id: contactId,
        relationship: contact.relationship,
        is_primary: contact.is_primary,
        is_emergency: contact.is_emergency,
        is_billing: contact.is_billing,
        notes: contact.notes || null,
        last_modified_by: authStore.user?.user_id
      })

    if (relationError) {
      throw relationError
    }
  }
}

// 生成聯絡人 ID（類似 ContactFormView）
function generateContactId(): string {
  const year = new Date().getFullYear()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 4).toUpperCase()
  return `C${year}${timestamp}${random}`
}

// 載入聯絡人資料
async function loadContacts() {
  if (!props.studentId || loading.value) return

  loading.value = true
  error.value = ''

  try {
    const loadedContacts = await contactService.getStudentContacts(props.studentId)
    contacts.value = loadedContacts
    originalContacts.value = JSON.parse(JSON.stringify(loadedContacts))

    // 如果沒有聯絡人且不是只讀模式，自動新增一個
    if (contacts.value.length === 0 && !props.readonly) {
      addContact()
    }

    // 只在初始化完成後才發送事件，避免無限循環
    if (isInitialized.value) {
      emit('contacts-updated', [...contacts.value])
    }
  } catch (loadError) {
    console.error('載入聯絡人失敗:', loadError)
    error.value = '載入聯絡人資料失敗'

    // 如果載入失敗且不是只讀模式，仍然自動新增一個聯絡人
    if (contacts.value.length === 0 && !props.readonly) {
      addContact()
    }
  } finally {
    loading.value = false
  }
}

// 監聽 studentId 變化，重新載入資料
watch(() => props.studentId, (newStudentId, oldStudentId) => {
  if (newStudentId && newStudentId !== oldStudentId) {
    // 重置初始化狀態
    isInitialized.value = false
    loadContacts()
  }
}, { immediate: true })

// 監聽 initialContacts 變化
watch(() => props.initialContacts, (newInitialContacts, oldInitialContacts) => {
  // 只在初始化時或真正有變化時處理
  if (newInitialContacts && newInitialContacts.length > 0 &&
      JSON.stringify(newInitialContacts) !== JSON.stringify(oldInitialContacts) &&
      JSON.stringify(newInitialContacts) !== JSON.stringify(contacts.value)) {
    contacts.value = [...newInitialContacts]
    originalContacts.value = JSON.parse(JSON.stringify(newInitialContacts))

    // 只在初始化完成後才發送事件
    if (isInitialized.value) {
      emit('contacts-updated', [...contacts.value])
    }
  }
}, { immediate: true, deep: true })

// 組件掛載時載入資料
onMounted(async () => {
  // 如果有 initialContacts，優先使用它們，否則從 API 載入
  if (props.initialContacts.length > 0) {
    contacts.value = [...props.initialContacts]
    originalContacts.value = JSON.parse(JSON.stringify(props.initialContacts))
  } else if (props.studentId) {
    await loadContacts()
  }

  // 初始化完成，後續可以正常發送事件
  isInitialized.value = true
})
</script>
