<template>
  <MainLayout>
    <div class="mx-auto max-w-6xl space-y-6">
      <!-- 頁面標題和操作 -->
      <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {{ isEdit ? '編輯聯絡人' : '新增聯絡人' }}
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            {{ isEdit ? '修改聯絡人的基本資料和關聯資訊' : '新增聯絡人的基本資料和關聯資訊' }}
          </p>
        </div>
        <div class="mt-4 flex md:ml-4 md:mt-0">
          <router-link
            to="/"
            class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            返回首頁
          </router-link>
        </div>
      </div>

      <!-- 錯誤提示 -->
      <div v-if="error" class="rounded-md border border-red-200 bg-red-50 p-4">
        <div class="flex">
          <div class="shrink-0">
            <ExclamationTriangleIcon class="size-5 text-red-400" />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">發生錯誤</h3>
            <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- 聯絡人表單 -->
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- 基本資料 -->
        <div class="card p-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">基本資料</h3>
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label for="full_name" class="block text-sm font-medium text-gray-700">
                姓名 <span class="text-red-500">*</span>
              </label>
              <input
                id="full_name"
                v-model="form.full_name"
                type="text"
                required
                class="input mt-1 h-11 px-4"
                placeholder="請輸入聯絡人姓名"
                :disabled="loading"
              />
            </div>
            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700">
                手機號碼 <span class="text-red-500">*</span>
              </label>
              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                required
                class="input mt-1 h-11 px-4"
                placeholder="請輸入手機號碼"
                :disabled="loading"
              />
            </div>
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">
                電子郵件
              </label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                class="input mt-1 px-4"
                placeholder="請輸入電子郵件"
                :disabled="loading"
              />
            </div>
            <div>
              <label for="is_active" class="block text-sm font-medium text-gray-700">
                狀態
              </label>
              <select
                id="is_active"
                v-model="form.is_active"
                class="input mt-1 px-4"
                :disabled="loading"
              >
                <option :value="true">啟用</option>
                <option :value="false">停用</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 聯絡資訊 -->
        <div class="card p-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">聯絡資訊</h3>
          <div class="space-y-4">
            <div>
              <label for="address" class="block text-sm font-medium text-gray-700">
                聯絡地址
              </label>
              <textarea
                id="address"
                v-model="form.address"
                rows="3"
                class="input mt-1 px-4 py-3"
                placeholder="請輸入聯絡地址"
                :disabled="loading"
              />
            </div>
            <div>
              <label for="notes" class="block text-sm font-medium text-gray-700">
                備註
              </label>
              <textarea
                id="notes"
                v-model="form.notes"
                rows="3"
                class="input mt-1 px-4 py-3"
                placeholder="備註資訊"
                :disabled="loading"
              />
            </div>
          </div>
        </div>

        <!-- 關聯學生 -->
        <div class="card p-6">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">關聯學生</h3>
            <button
              type="button"
              @click="addStudentRelationship"
              class="inline-flex min-h-[2.5rem] items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              :disabled="loading"
            >
              <PlusIcon class="mr-2 size-4" />
              新增關聯
            </button>
          </div>

          <div v-if="studentRelationships.length === 0" class="py-6 text-center text-gray-500">
            <UserGroupIcon class="mx-auto size-12 text-gray-400" />
            <p class="mt-2 text-sm">尚未關聯任何學生</p>
            <p class="text-xs">點擊「新增關聯」建立學生關係</p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(relationship, index) in studentRelationships"
              :key="index"
              class="rounded-lg border border-gray-200 p-4"
            >
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <div>
                  <label :for="`student_${index}`" class="block text-sm font-medium text-gray-700">
                    學生 <span class="text-red-500">*</span>
                  </label>
                  <select
                    :id="`student_${index}`"
                    v-model="relationship.student_id"
                    class="input mt-1 px-4"
                    required
                    :disabled="loading"
                  >
                    <option value="">請選擇學生</option>
                    <option
                      v-for="student in students"
                      :key="student.student_id"
                      :value="student.student_id"
                    >
                      {{ student.chinese_name }} ({{ student.student_id }})
                    </option>
                  </select>
                </div>
                <div>
                  <label :for="`relationship_${index}`" class="block text-sm font-medium text-gray-700">
                    關係 <span class="text-red-500">*</span>
                  </label>
                  <select
                    :id="`relationship_${index}`"
                    v-model="relationship.relationship_type"
                    class="input mt-1 px-4"
                    required
                    :disabled="loading"
                  >
                    <option value="">請選擇關係</option>
                    <option value="父親">父親</option>
                    <option value="母親">母親</option>
                    <option value="監護人">監護人</option>
                    <option value="本人">本人</option>
                  </select>
                </div>
                <div class="mt-6 flex items-center space-x-4">
                  <label class="flex items-center">
                    <input
                      v-model="relationship.is_primary"
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      :disabled="loading"
                    />
                    <span class="ml-2 text-sm text-gray-700">主要聯絡人</span>
                  </label>
                  <label class="flex items-center">
                    <input
                      v-model="relationship.is_emergency"
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      :disabled="loading"
                    />
                    <span class="ml-2 text-sm text-gray-700">緊急聯絡人</span>
                  </label>
                  <label class="flex items-center">
                    <input
                      v-model="relationship.is_billing"
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      :disabled="loading"
                    />
                    <span class="ml-2 text-sm text-gray-700">帳單聯絡人</span>
                  </label>
                </div>
                <div class="mt-6 flex items-center justify-end">
                  <button
                    type="button"
                    @click="removeStudentRelationship(index)"
                    class="rounded-md p-2 text-red-600 hover:bg-red-50 hover:text-red-800"
                    :disabled="loading"
                    title="移除關聯"
                  >
                    <TrashIcon class="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 表單按鈕 -->
        <div class="flex justify-end space-x-4 border-t border-gray-200 pt-6">
          <router-link
            to="/"
            class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            返回首頁
          </router-link>
          <button
            type="submit"
            class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            :disabled="loading"
          >
            <LoadingSpinner v-if="loading" class="mr-2 size-4" />
            {{ isEdit ? '更新聯絡人' : '新增聯絡人' }}
          </button>
        </div>
      </form>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import {
  ExclamationTriangleIcon,
  PlusIcon,
  UserGroupIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

import type { Contact, Student, StudentContact } from '@/types'
import { db, supabase } from '@/services/supabase'

interface ContactForm {
  full_name: string
  phone: string
  email: string
  address: string
  notes: string
  is_active: boolean
}

interface StudentRelationshipForm {
  student_id: string
  relationship_type: string
  is_primary: boolean
  is_emergency: boolean
  is_billing: boolean
}

interface StudentWithRelationship extends Student {
  id: number
}

const route = useRoute()
const router = useRouter()

// 響應式資料
const loading = ref(false)
const error = ref('')
const students = ref<StudentWithRelationship[]>([])

// 表單資料
const form = ref<ContactForm>({
  full_name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  is_active: true
})

const studentRelationships = ref<StudentRelationshipForm[]>([])

// 計算屬性
const isEdit = computed(() => !!route.params.id)
const contactId = computed(() => route.params.id as string)

// 方法
const loadStudents = async () => {
  try {
    students.value = await db.findMany<StudentWithRelationship>('students', {
      columns: 'id, student_id, chinese_name, english_name',
      filters: { is_active: true },
      orderBy: 'chinese_name',
      ascending: true
    })
  } catch (err) {
    console.error('載入學生列表失敗:', err)
    error.value = err instanceof Error ? err.message : '載入學生列表失敗'
  }
}

const loadContact = async () => {
  if (!isEdit.value) return

  try {
    loading.value = true

    // 載入聯絡人基本資料 - 使用 contact_id 欄位
    const contact = await db.findOne<Contact>('contacts', { contact_id: contactId.value }, '*')

    if (!contact) {
      error.value = '聯絡人不存在'
      return
    }

    form.value = {
      full_name: contact.full_name,
      phone: contact.phone || '',
      email: contact.email || '',
      address: contact.address || '',
      notes: contact.notes || '',
      is_active: contact.is_active
    }

    // 載入學生關聯關係
    const relationships = await db.findMany<StudentContact>('student_contacts', {
      columns: `*,
                student:students(student_id, chinese_name, english_name)`,
      filters: { contact_id: contactId.value },
      orderBy: 'created_at',
      ascending: true
    })

    studentRelationships.value = relationships.map(rel => ({
      student_id: rel.student_id,
      relationship_type: rel.relationship,
      is_primary: rel.is_primary,
      is_emergency: rel.is_emergency,
      is_billing: rel.is_billing
    }))

  } catch (err) {
    console.error('載入聯絡人失敗:', err)
    error.value = err instanceof Error ? err.message : '載入聯絡人資料失敗'
  } finally {
    loading.value = false
  }
}

const addStudentRelationship = () => {
  studentRelationships.value.push({
    student_id: '',
    relationship_type: '',
    is_primary: false,
    is_emergency: false,
    is_billing: false
  })
}

const removeStudentRelationship = (index: number) => {
  studentRelationships.value.splice(index, 1)
}

const validateForm = (): boolean => {
  error.value = ''

  if (!form.value.full_name.trim()) {
    error.value = '請輸入聯絡人姓名'
    return false
  }

  if (!form.value.phone.trim()) {
    error.value = '請輸入手機號碼'
    return false
  }

  // 驗證學生關聯
  for (let i = 0; i < studentRelationships.value.length; i++) {
    const relationship = studentRelationships.value[i]
    if (!relationship.student_id) {
      error.value = `第 ${i + 1} 個學生關聯請選擇學生`
      return false
    }
    if (!relationship.relationship_type) {
      error.value = `第 ${i + 1} 個學生關聯請選擇關係類型`
      return false
    }
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    loading.value = true

    let contact: Contact

    if (isEdit.value) {
      // 更新聯絡人 - 使用 Supabase 直接查詢
      const { data: updatedContact, error: updateError } = await supabase
        .from('contacts')
        .update({
          full_name: form.value.full_name,
          phone: form.value.phone,
          email: form.value.email || null,
          address: form.value.address || null,
          notes: form.value.notes || null,
          is_active: form.value.is_active
        })
        .eq('contact_id', contactId.value)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      contact = updatedContact

      // 刪除現有學生關聯
      const { error: deleteError } = await supabase
        .from('student_contacts')
        .delete()
        .eq('contact_id', contactId.value)

      if (deleteError) {
        throw deleteError
      }
    } else {
      // 生成聯絡人 ID (根據 API 文檔: C + YYYY + 4位序號)
      const year = new Date().getFullYear()
      const currentCount = await db.findMany('contacts', {
        columns: 'contact_id',
        filters: {}
      })
      const nextNumber = currentCount.length + 1
      const contactId = `C${year}${nextNumber.toString().padStart(4, '0')}`

      // 建立聯絡人
      contact = await db.create<Contact>('contacts', {
        contact_id: contactId,
        full_name: form.value.full_name,
        phone: form.value.phone,
        email: form.value.email || null,
        address: form.value.address || null,
        notes: form.value.notes || null,
        is_active: form.value.is_active
      })
    }

    // 建立學生關聯關係
    if (studentRelationships.value.length > 0) {
      const relationshipData = studentRelationships.value.map(rel => ({
        student_id: rel.student_id,
        contact_id: contact.contact_id,
        relationship: rel.relationship_type,
        is_primary: rel.is_primary,
        is_emergency: rel.is_emergency,
        is_billing: rel.is_billing
      }))

      const { error: relationshipError } = await supabase
        .from('student_contacts')
        .insert(relationshipData)

      if (relationshipError) {
        throw relationshipError
      }
    }

    // 成功後返回首頁
    router.push('/')

  } catch (error) {
    console.error('儲存聯絡人失敗:', error)
    error.value = '儲存聯絡人失敗，請重試'
  } finally {
    loading.value = false
  }
}

// 組件掛載
onMounted(() => {
  loadStudents()
  loadContact()
})
</script>
