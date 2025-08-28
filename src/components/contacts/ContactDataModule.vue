<template>
  <div class="contact-data-module">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-medium text-gray-900">聯絡人資料</h3>
      <button
        v-if="contacts.length < maxContacts"
        type="button"
        @click="addContact"
        class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        新增聯絡人
      </button>
    </div>

    <!-- 載入狀態 -->
    <div v-if="loading" class="py-8 text-center">
      <p class="text-gray-500">載入聯絡人資料中...</p>
    </div>

    <!-- 空狀態 -->
    <div v-else-if="contacts.length === 0" class="rounded-lg border-2 border-dashed border-gray-300 py-8 text-center">
      <p class="mb-4 text-gray-500">尚未新增任何聯絡人</p>
      <button
        type="button"
        @click="addContact"
        class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        新增第一個聯絡人
      </button>
    </div>

    <!-- 聯絡人列表 -->
    <div v-else class="space-y-4">
      <div
        v-for="(contact, index) in contacts"
        :key="index"
        class="rounded-lg border border-gray-200 p-4"
      >
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              姓名 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="contact.full_name"
              type="text"
              class="w-full rounded-md border border-gray-300 px-3 py-2"
              @input="markDirty"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              電話 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="contact.phone"
              type="tel"
              class="w-full rounded-md border border-gray-300 px-3 py-2"
              @input="markDirty"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              關係
            </label>
            <select
              v-model="contact.relationship"
              class="w-full rounded-md border border-gray-300 px-3 py-2"
              @change="markDirty"
            >
              <option value="父親">父親</option>
              <option value="母親">母親</option>
              <option value="監護人">監護人</option>
              <option value="本人">本人</option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              電子郵件
            </label>
            <input
              v-model="contact.email"
              type="email"
              class="w-full rounded-md border border-gray-300 px-3 py-2"
              @input="markDirty"
            />
          </div>
        </div>

        <div class="mt-4">
          <label class="mb-1 block text-sm font-medium text-gray-700">
            地址
          </label>
          <textarea
            v-model="contact.address"
            rows="2"
            class="w-full rounded-md border border-gray-300 px-3 py-2"
            @input="markDirty"
          ></textarea>
        </div>

        <div class="mt-4 flex items-center space-x-4">
          <label class="flex items-center">
            <input
              v-model="contact.is_primary"
              type="checkbox"
              class="mr-2"
              @change="handlePrimaryChange(index)"
            />
            主要聯絡人
          </label>

          <label class="flex items-center">
            <input
              v-model="contact.is_emergency"
              type="checkbox"
              class="mr-2"
              @change="markDirty"
            />
            緊急聯絡人
          </label>

          <label class="flex items-center">
            <input
              v-model="contact.is_billing"
              type="checkbox"
              class="mr-2"
              @change="markDirty"
            />
            帳務聯絡人
          </label>
        </div>

        <div v-if="contacts.length > 1" class="mt-4">
          <button
            type="button"
            @click="removeContact(index)"
            class="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
          >
            移除
          </button>
        </div>
      </div>
    </div>

    <!-- 儲存按鈕 -->
    <div v-if="isDirty && contacts.length > 0" class="mt-4">
      <button
        type="button"
        @click="saveContacts"
        :disabled="saving"
        class="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
      >
        {{ saving ? '儲存中...' : '儲存變更' }}
      </button>
    </div>

    <!-- 錯誤訊息 -->
    <div v-if="error" class="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
      <p class="text-sm text-red-700">{{ error }}</p>
    </div>

    <!-- 成功訊息 -->
    <div v-if="successMessage" class="mt-4 rounded-md border border-green-200 bg-green-50 p-3">
      <p class="text-sm text-green-700">{{ successMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/authSupabase'

interface ContactData {
  contact_id?: string
  full_name: string
  phone: string
  email?: string
  address?: string
  relationship: '父親' | '母親' | '監護人' | '本人'
  is_primary: boolean
  is_emergency: boolean
  is_billing: boolean
  notes?: string
}

interface Props {
  studentDbId: number
  studentId: string
  maxContacts?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxContacts: 5
})

const authStore = useAuthStore()

// 狀態
const contacts = ref<ContactData[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const successMessage = ref('')
const isDirty = ref(false)

// 方法
function addContact() {
  const newContact: ContactData = {
    full_name: '',
    phone: '',
    email: '',
    address: '',
    relationship: '父親',
    is_primary: contacts.value.length === 0,
    is_emergency: false,
    is_billing: false,
    notes: ''
  }

  contacts.value.push(newContact)
  markDirty()
}

function removeContact(index: number) {
  contacts.value.splice(index, 1)

  // 如果刪除的是主要聯絡人且還有其他聯絡人，設定第一個為主要
  if (contacts.value.length > 0 && !contacts.value.some(c => c.is_primary)) {
    contacts.value[0].is_primary = true
  }

  markDirty()
}

function handlePrimaryChange(index: number) {
  // 只能有一個主要聯絡人
  contacts.value.forEach((contact, i) => {
    if (i !== index) {
      contact.is_primary = false
    }
  })
  markDirty()
}

function markDirty() {
  isDirty.value = true
}

async function loadContacts() {
  if (!props.studentDbId) return

  loading.value = true
  error.value = ''

  try {
    const { data, error: fetchError } = await supabase
      .from('students')
      .select(`
        contacts:student_contacts(
          id,
          relationship,
          is_primary,
          is_emergency,
          is_billing,
          notes,
          contact:contacts(
            contact_id,
            full_name,
            phone,
            email,
            address
          )
        )
      `)
      .eq('id', props.studentDbId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    contacts.value = data?.contacts?.map((sc: any) => ({
      contact_id: sc.contact?.contact_id,
      full_name: sc.contact?.full_name || '',
      phone: sc.contact?.phone || '',
      email: sc.contact?.email || '',
      address: sc.contact?.address || '',
      relationship: sc.relationship,
      is_primary: sc.is_primary,
      is_emergency: sc.is_emergency,
      is_billing: sc.is_billing,
      notes: sc.notes || ''
    })) || []

    isDirty.value = false

  } catch (err) {
    console.error('載入聯絡人失敗:', err)
    error.value = '載入聯絡人資料失敗'
  } finally {
    loading.value = false
  }
}

async function saveContacts() {
  if (!props.studentId) {
    error.value = '缺少學生 ID'
    return
  }

  saving.value = true
  error.value = ''
  successMessage.value = ''

  console.log('開始儲存聯絡人，學生ID:', props.studentId)
  console.log('當前用戶:', authStore.user)
  console.log('聯絡人資料:', contacts.value)

  try {
    // 1. 刪除現有的學生聯絡人關聯
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
        // 新聯絡人：創建
        contactId = generateContactId()
        const contactData: any = {
          contact_id: contactId,
          full_name: contact.full_name,
          phone: contact.phone,
          is_active: true
        }

        // 只添加有值的可選欄位
        if (contact.email) contactData.email = contact.email
        if (contact.address) contactData.address = contact.address
        if (contact.notes) contactData.notes = contact.notes
        if (authStore.user?.user_id) contactData.last_modified_by = authStore.user.user_id

        const { error: createError } = await supabase
          .from('contacts')
          .insert(contactData)

        if (createError) {
          console.error('創建聯絡人錯誤:', createError)
          throw createError
        }
      } else {
        // 現有聯絡人：更新
        const updateData: any = {
          full_name: contact.full_name,
          phone: contact.phone
        }

        // 只添加有值的可選欄位
        if (contact.email !== undefined) updateData.email = contact.email || null
        if (contact.address !== undefined) updateData.address = contact.address || null
        if (contact.notes !== undefined) updateData.notes = contact.notes || null
        if (authStore.user?.user_id) updateData.last_modified_by = authStore.user.user_id

        const { error: updateError } = await supabase
          .from('contacts')
          .update(updateData)
          .eq('contact_id', contactId)

        if (updateError) {
          console.error('更新聯絡人錯誤:', updateError)
          throw updateError
        }
      }

      // 3. 創建學生-聯絡人關聯
      const relationData: any = {
        student_id: props.studentId,
        contact_id: contactId,
        relationship: contact.relationship,
        is_primary: contact.is_primary || false,
        is_emergency: contact.is_emergency || false,
        is_billing: contact.is_billing || false
      }

      // 只添加有值的可選欄位
      if (contact.notes) relationData.notes = contact.notes
      if (authStore.user?.user_id) relationData.last_modified_by = authStore.user.user_id

      const { error: relationError } = await supabase
        .from('student_contacts')
        .insert(relationData)

      if (relationError) {
        console.error('創建學生聯絡人關聯錯誤:', relationError)
        throw relationError
      }
    }

    isDirty.value = false
    successMessage.value = '聯絡人資料儲存成功！'

    // 清除成功訊息
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)

  } catch (err: any) {
    console.error('儲存聯絡人失敗:', err)
    console.error('錯誤詳情:', {
      message: err?.message,
      details: err?.details,
      hint: err?.hint,
      code: err?.code
    })
    error.value = err?.message || err?.details || '儲存失敗'
  } finally {
    saving.value = false
  }
}

function generateContactId(): string {
  // 生成短的唯一 ID，確保不超過 20 個字元
  const timestamp = Date.now().toString(36).toUpperCase() // 轉為 36 進制以縮短長度
  const random = Math.random().toString(36).substr(2, 4).toUpperCase()
  return `C${timestamp}${random}`.substr(0, 20) // 確保不超過 20 個字元
}

// 監聽 studentDbId 變化
watch(() => props.studentDbId, (newId) => {
  if (newId) {
    loadContacts()
  }
}, { immediate: true })

// 掛載時載入資料
onMounted(() => {
  if (props.studentDbId) {
    loadContacts()
  }
})
</script>
