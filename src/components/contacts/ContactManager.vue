<template>
  <div class="contact-manager">
    <!-- 標題和操作區域 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h3 class="text-lg font-medium text-gray-900">聯絡人資料</h3>
        <p class="mt-1 text-sm text-gray-500">
          管理學生的聯絡人資訊，包含家長、監護人等相關聯絡人
        </p>
      </div>

      <div class="flex items-center space-x-2">
        <!-- 新增聯絡人按鈕 -->
        <button
          v-if="!readonly && contacts.length < maxContacts"
          type="button"
          @click="addContact"
          :disabled="loading"
          class="inline-flex min-h-[2.5rem] items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          <PlusIcon class="mr-2 size-4" />
          新增聯絡人
        </button>

        <!-- 儲存按鈕 -->
        <button
          v-if="!readonly && isDirty"
          type="button"
          @click="saveContacts"
          :disabled="saving || !isValid"
          class="inline-flex min-h-[2.5rem] items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          <template v-if="saving">
            <svg class="-ml-1 mr-2 size-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            儲存中...
          </template>
          <template v-else>
            <CheckIcon class="mr-2 size-4" />
            儲存變更
          </template>
        </button>
      </div>
    </div>

    <!-- 全域驗證錯誤 -->
    <div v-if="globalErrors.length > 0" class="mb-6">
      <div class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <ExclamationTriangleIcon class="size-5 text-red-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">發現以下問題</h3>
            <div class="mt-2 text-sm text-red-700">
              <ul class="list-disc space-y-1 pl-5">
                <li v-for="error in globalErrors" :key="error">{{ error }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 聯絡人列表 -->
    <div v-if="contacts.length === 0" class="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center">
      <UserGroupIcon class="mx-auto mb-4 size-12 text-gray-400" />
      <h3 class="mb-2 text-lg font-medium text-gray-900">尚未新增任何聯絡人</h3>
      <p class="mb-4 text-gray-500">學生至少需要一個聯絡人資料</p>
      <button
        v-if="!readonly"
        type="button"
        @click="addContact"
        class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <PlusIcon class="mr-2 size-4" />
        新增第一個聯絡人
      </button>
    </div>

    <div v-else class="space-y-6">
      <ContactForm
        v-for="(contact, index) in contacts"
        :key="`contact-${index}-${contact.contact_id || 'new'}`"
        :contact="contact"
        :index="index"
        :readonly="readonly"
        :errors="fieldErrors[index] || {}"
        @update:contact="updateContact(index, $event)"
        @remove="removeContact(index)"
      />
    </div>

    <!-- 底部說明 -->
    <div v-if="contacts.length > 0" class="mt-6 text-sm text-gray-500">
      <p>
        <InformationCircleIcon class="mr-1 inline size-4" />
        目前共有 {{ contacts.length }} 個聯絡人
        <template v-if="!readonly">
          (最多可新增 {{ maxContacts }} 個)
        </template>
      </p>
      <p v-if="!readonly" class="mt-1">
        <span class="text-red-500">*</span> 標示為必填欄位，每個學生需要指定一個主要聯絡人
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import {
  PlusIcon,
  CheckIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'

import ContactForm from './ContactForm.vue'
import { contactService } from '@/services/contactService'
import { useAuthStore } from '@/stores/authSupabase'
import type {
  ContactFormData,
  ContactUpdateResult,
  ContactValidationResult,
  ContactManagerConfig
} from './types'
import { DEFAULT_CONTACT_CONFIG } from './types'

// Props
interface Props {
  studentId: string
  initialContacts?: ContactFormData[]
  readonly?: boolean
  maxContacts?: number
  autoSave?: boolean
  autoSaveDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialContacts: () => [],
  readonly: false,
  maxContacts: DEFAULT_CONTACT_CONFIG.maxContacts,
  autoSave: DEFAULT_CONTACT_CONFIG.autoSave,
  autoSaveDelay: DEFAULT_CONTACT_CONFIG.autoSaveDelay
})

// Emits
interface Emits {
  (e: 'contacts-updated', contacts: ContactFormData[]): void
  (e: 'validation-error', errors: string[]): void
  (e: 'save-success', result: ContactUpdateResult): void
  (e: 'save-error', error: Error): void
  (e: 'dirty-change', isDirty: boolean): void
}

const emit = defineEmits<Emits>()

// Stores
const authStore = useAuthStore()

// State
const contacts = ref<ContactFormData[]>([])
const loading = ref(false)
const saving = ref(false)
const fieldErrors = ref<Record<number, Record<string, string[]>>>({})
const globalErrors = ref<string[]>([])
const originalContacts = ref<ContactFormData[]>([])
const autoSaveTimer = ref<NodeJS.Timeout | null>(null)

// Computed
const isDirty = computed(() => {
  return JSON.stringify(contacts.value) !== JSON.stringify(originalContacts.value)
})

const isValid = computed(() => {
  return globalErrors.value.length === 0 &&
         Object.keys(fieldErrors.value).every(key =>
           Object.keys(fieldErrors.value[key]).length === 0
         )
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
  validateAllContacts()

  // 自動聚焦到新增的聯絡人表單
  nextTick(() => {
    const newIndex = contacts.value.length - 1
    const newContactElement = document.querySelector(`[data-contact-index="${newIndex}"] input[name="full_name"]`)
    if (newContactElement instanceof HTMLInputElement) {
      newContactElement.focus()
    }
  })
}

function removeContact(index: number) {
  contacts.value.splice(index, 1)

  // 清理對應的錯誤訊息
  const newFieldErrors = { ...fieldErrors.value }
  delete newFieldErrors[index]

  // 重新編號剩餘的錯誤訊息
  const reindexedErrors: Record<number, Record<string, string[]>> = {}
  Object.keys(newFieldErrors).forEach(key => {
    const numKey = parseInt(key)
    if (numKey > index) {
      reindexedErrors[numKey - 1] = newFieldErrors[numKey]
    } else {
      reindexedErrors[numKey] = newFieldErrors[numKey]
    }
  })

  fieldErrors.value = reindexedErrors
  validateAllContacts()

  // 如果刪除後沒有主要聯絡人，自動設定第一個為主要聯絡人
  if (contacts.value.length > 0 && !contacts.value.some(c => c.is_primary)) {
    contacts.value[0].is_primary = true
  }
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
  validateContact(index, updatedContact)
  validateAllContacts()
}

function validateContact(index: number, contact: ContactFormData) {
  const errors = contactService.validateContact(contact)

  if (errors.length > 0) {
    if (!fieldErrors.value[index]) {
      fieldErrors.value[index] = {}
    }

    // 將錯誤訊息分類到對應的欄位
    fieldErrors.value[index] = {}
    errors.forEach(error => {
      if (error.includes('姓名')) {
        if (!fieldErrors.value[index].full_name) fieldErrors.value[index].full_name = []
        fieldErrors.value[index].full_name.push(error)
      } else if (error.includes('電話')) {
        if (!fieldErrors.value[index].phone) fieldErrors.value[index].phone = []
        fieldErrors.value[index].phone.push(error)
      } else if (error.includes('電子郵件')) {
        if (!fieldErrors.value[index].email) fieldErrors.value[index].email = []
        fieldErrors.value[index].email.push(error)
      }
    })
  } else {
    delete fieldErrors.value[index]
  }
}

function validateAllContacts() {
  const errors = contactService.validateStudentContacts(contacts.value)
  globalErrors.value = errors

  if (errors.length > 0) {
    emit('validation-error', errors)
  }
}

async function saveContacts() {
  if (!isValid.value) {
    return
  }

  saving.value = true

  try {
    const result = await contactService.updateStudentContacts(
      props.studentId,
      contacts.value,
      // 從認證 store 獲取當前使用者 ID
      authStore.user?.user_id
    )

    if (result.errors.length > 0) {
      globalErrors.value = result.errors
      emit('save-error', new Error(result.errors.join(', ')))
    } else {
      // 更新原始資料，重置 dirty 狀態
      originalContacts.value = JSON.parse(JSON.stringify(contacts.value))
      globalErrors.value = []

      emit('save-success', result)
      emit('contacts-updated', [...contacts.value])
    }
  } catch (error) {
    console.error('儲存聯絡人失敗:', error)
    emit('save-error', error instanceof Error ? error : new Error('儲存失敗'))
  } finally {
    saving.value = false
  }
}

async function loadContacts() {
  if (!props.studentId) return

  loading.value = true

  try {
    const loadedContacts = await contactService.getStudentContacts(props.studentId)
    contacts.value = loadedContacts
    originalContacts.value = JSON.parse(JSON.stringify(loadedContacts))

    // 如果沒有聯絡人，自動新增一個
    if (contacts.value.length === 0 && !props.readonly) {
      addContact()
    }

    validateAllContacts()
  } catch (error) {
    console.error('載入聯絡人失敗:', error)
    globalErrors.value = ['載入聯絡人資料失敗']
  } finally {
    loading.value = false
  }
}

// 自動儲存
function scheduleAutoSave() {
  if (!props.autoSave || props.readonly) return

  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
  }

  autoSaveTimer.value = setTimeout(() => {
    if (isDirty.value && isValid.value) {
      saveContacts()
    }
  }, props.autoSaveDelay)
}

// Watchers
watch(() => props.initialContacts, (newContacts) => {
  if (newContacts && newContacts.length > 0) {
    contacts.value = [...newContacts]
    originalContacts.value = JSON.parse(JSON.stringify(newContacts))
    validateAllContacts()
  }
}, { immediate: true })

watch(() => props.studentId, () => {
  if (props.studentId && props.initialContacts.length === 0) {
    loadContacts()
  }
}, { immediate: true })

watch(isDirty, (newIsDirty) => {
  emit('dirty-change', newIsDirty)

  if (newIsDirty && props.autoSave) {
    scheduleAutoSave()
  }
})

watch(contacts, () => {
  emit('contacts-updated', [...contacts.value])
}, { deep: true })

// 組件卸載時清理定時器
import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
  }
})
</script>

<style scoped>
.contact-manager {
  @apply w-full;
}

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
