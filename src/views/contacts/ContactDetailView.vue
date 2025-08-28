<template>
  <MainLayout>
    <div class="mx-auto max-w-4xl space-y-6">
      <!-- 載入狀態 -->
      <LoadingSpinner v-if="loading" />

      <template v-else-if="contact">
        <!-- 頁面標題和操作 -->
        <div class="md:flex md:items-center md:justify-between">
          <div class="min-w-0 flex-1">
            <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              {{ contact.full_name }}
            </h2>
            <div class="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
              <div class="mt-2 flex items-center text-sm text-gray-500">
                <UserIcon class="mr-1.5 size-5 shrink-0 text-gray-400" />
                聯絡人編號：{{ contact.contact_id }}
              </div>
              <div class="mt-2 flex items-center text-sm text-gray-500">
                <CalendarIcon class="mr-1.5 size-5 shrink-0 text-gray-400" />
                建立時間：{{ formatDate(contact.created_at) }}
              </div>
            </div>
          </div>
          <div class="mt-4 flex space-x-3 md:ml-4 md:mt-0">
            <router-link
              :to="`/contacts/${contact.contact_id}/edit`"
              class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <PencilIcon class="mr-2 size-4" />
              編輯
            </router-link>
            <button
              @click="confirmDelete"
              class="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
            >
              <TrashIcon class="mr-2 size-4" />
              刪除
            </button>
          </div>
        </div>

        <!-- 狀態標籤 -->
        <div class="flex items-center space-x-3">
          <span
            :class="[
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              contact.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            ]"
          >
            {{ contact.is_active ? '啟用' : '停用' }}
          </span>
        </div>

        <!-- 基本資訊 -->
        <div class="card p-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">基本資訊</h3>
          <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt class="text-sm font-medium text-gray-500">姓名</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ contact.full_name }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">聯絡人編號</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ contact.contact_id }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">手機號碼</dt>
              <dd class="mt-1 text-sm text-gray-900">
                <div v-if="contact.phone" class="flex items-center">
                  <PhoneIcon class="mr-2 size-4 text-gray-400" />
                  <a :href="`tel:${contact.phone}`" class="text-blue-600 hover:text-blue-800">
                    {{ contact.phone }}
                  </a>
                </div>
                <span v-else class="text-gray-400">未提供</span>
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">電子郵件</dt>
              <dd class="mt-1 text-sm text-gray-900">
                <div v-if="contact.email" class="flex items-center">
                  <EnvelopeIcon class="mr-2 size-4 text-gray-400" />
                  <a :href="`mailto:${contact.email}`" class="text-blue-600 hover:text-blue-800">
                    {{ contact.email }}
                  </a>
                </div>
                <span v-else class="text-gray-400">未提供</span>
              </dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-sm font-medium text-gray-500">聯絡地址</dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ contact.address || '未提供' }}
              </dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-sm font-medium text-gray-500">備註</dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ contact.notes || '無' }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- 關聯學生 -->
        <div class="card p-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">關聯學生</h3>

          <div v-if="studentRelationships.length === 0" class="py-6 text-center">
            <UserGroupIcon class="mx-auto size-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900">尚未關聯學生</h3>
            <p class="mt-1 text-sm text-gray-500">此聯絡人目前沒有關聯任何學生</p>
          </div>

          <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="relationship in studentRelationships"
              :key="relationship.student_id"
              class="rounded-lg border border-gray-200 p-4"
            >
              <div class="mb-3">
                <p class="text-sm font-medium text-gray-900">
                  {{ relationship.student_name }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ relationship.student_id }}
                </p>
              </div>

              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">關係：</span>
                  <span class="text-sm font-medium text-gray-900">
                    {{ relationship.relationship_type }}
                  </span>
                </div>

                <div class="flex flex-wrap gap-1">
                  <span
                    v-if="relationship.is_primary"
                    class="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                  >
                    主要聯絡人
                  </span>
                  <span
                    v-if="relationship.is_emergency"
                    class="inline-flex items-center rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800"
                  >
                    緊急聯絡人
                  </span>
                  <span
                    v-if="relationship.is_billing"
                    class="inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                  >
                    帳單聯絡人
                  </span>
                </div>
              </div>

              <div class="mt-3 border-t border-gray-200 pt-3">
                <router-link
                  :to="`/students/${relationship.student_id}`"
                  class="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  查看學生詳情 →
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作記錄 -->
        <div class="card p-6">
          <h3 class="mb-4 text-lg font-medium text-gray-900">操作記錄</h3>
          <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt class="text-sm font-medium text-gray-500">建立時間</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ formatDateTime(contact.created_at) }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">最後更新</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ formatDateTime(contact.updated_at) }}</dd>
            </div>
          </dl>
        </div>
      </template>

      <!-- 找不到資料 -->
      <div v-else class="py-12 text-center">
        <ExclamationCircleIcon class="mx-auto size-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">找不到聯絡人</h3>
        <p class="mt-1 text-sm text-gray-500">
          指定的聯絡人不存在或已被刪除
        </p>
        <div class="mt-6">
          <router-link
            to="/contacts"
            class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            返回聯絡人列表
          </router-link>
        </div>
      </div>
    </div>

    <!-- 刪除確認彈窗 -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="刪除聯絡人"
      :message="`確定要刪除聯絡人「${contact?.full_name}」嗎？此操作無法復原。`"
      confirm-text="刪除"
      cancel-text="取消"
      type="danger"
      @confirm="deleteContact"
      @cancel="showDeleteDialog = false"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import {
  UserIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/24/outline'

import type { Contact, StudentContact } from '@/types'
import { db, supabase } from '@/services/supabase'

interface StudentRelationshipDetail extends StudentContact {
  student_name: string
}

const route = useRoute()
const router = useRouter()

// 響應式資料
const loading = ref(true)
const contact = ref<Contact | null>(null)
const studentRelationships = ref<StudentRelationshipDetail[]>([])
const showDeleteDialog = ref(false)

// 計算屬性
const contactId = computed(() => route.params.id as string)

// 方法
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-TW')
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Taipei'
  })
}

const loadContact = async () => {
  try {
    loading.value = true

    // 載入聯絡人基本資料
    contact.value = await db.findOne<Contact>('contacts', contactId.value, '*')

    if (!contact.value) {
      return
    }

    // 載入學生關聯關係，包含學生姓名
    const { data: relationships, error: relationshipsError } = await supabase
      .from('student_contacts')
      .select(`
        *,
        students!inner (
          student_id,
          chinese_name
        )
      `)
      .eq('contact_id', contactId.value)
      .order('created_at')

    if (relationshipsError) {
      throw relationshipsError
    }

    studentRelationships.value = relationships?.map(rel => ({
      id: rel.id,
      student_id: rel.student_id,
      student_name: rel.students.chinese_name,
      contact_id: rel.contact_id,
      relationship_type: rel.relationship,
      is_primary: rel.is_primary,
      is_emergency: rel.is_emergency,
      is_billing: rel.is_billing,
      created_at: rel.created_at,
      updated_at: rel.updated_at
    })) || []

  } catch (error) {
    console.error('載入聯絡人失敗:', error)
    contact.value = null
  } finally {
    loading.value = false
  }
}

const confirmDelete = () => {
  showDeleteDialog.value = true
}

const deleteContact = async () => {
  try {
    console.log('ContactDetailView - 開始刪除聯絡人:', contactId.value)

    // 使用統一服務層API刪除聯絡人
    await db.delete('contacts', contact.value?.id)

    console.log('ContactDetailView - 聯絡人刪除成功')

    // 成功後返回列表
    router.push('/contacts')

  } catch (error) {
    console.error('刪除聯絡人失敗:', error)
    alert(`刪除聯絡人失敗: ${error.message || '未知錯誤'}`)
  } finally {
    showDeleteDialog.value = false
  }
}

// 組件掛載
onMounted(() => {
  loadContact()
})
</script>
