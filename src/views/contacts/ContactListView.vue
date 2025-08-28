<template>
  <MainLayout>
    <div class="mx-auto max-w-6xl space-y-6">
      <!-- 頁面標題和操作 -->
      <div class="sm:flex sm:items-center sm:justify-between">
        <div class="min-w-0 flex-1">
          <h2 class="text-xl font-bold leading-7 text-gray-900 sm:text-2xl sm:tracking-tight lg:text-3xl">
            聯絡人管理
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            管理所有聯絡人的基本資料和關聯學生資訊
          </p>
        </div>
        <div class="mt-4 sm:ml-4 sm:mt-0">
          <router-link
            to="/contacts/create"
            class="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon class="mr-2 size-4" />
            新增聯絡人
          </router-link>
        </div>
      </div>

      <!-- 搜尋和篩選 -->
      <div class="card p-4 md:p-6">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div class="sm:col-span-2 lg:col-span-1">
            <label for="search" class="block text-sm font-medium text-gray-700">
              搜尋聯絡人
            </label>
            <div class="mt-1">
              <input
                id="search"
                v-model="filters.search"
                type="text"
                class="input w-full px-4"
                placeholder="輸入聯絡人姓名、電話或 Email"
                @input="debounceSearch"
              />
            </div>
          </div>
          <div>
            <label for="status" class="block text-sm font-medium text-gray-700">
              狀態
            </label>
            <div class="mt-1">
              <select
                id="status"
                v-model="filters.status"
                class="input w-full px-4"
                @change="applyFilters"
              >
                <option value="">全部狀態</option>
                <option value="active">啟用</option>
                <option value="inactive">停用</option>
              </select>
            </div>
          </div>
          <div>
            <label for="relationship" class="block text-sm font-medium text-gray-700">
              關係類型
            </label>
            <div class="mt-1">
              <select
                id="relationship"
                v-model="filters.relationship"
                class="input w-full px-4"
                @change="applyFilters"
              >
                <option value="">全部關係</option>
                <option value="父親">父親</option>
                <option value="母親">母親</option>
                <option value="監護人">監護人</option>
                <option value="本人">本人</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 載入狀態 -->
      <LoadingSpinner v-if="loading" />

      <!-- 聯絡人列表 -->
      <div v-else class="card overflow-hidden">
        <div class="px-4 py-5 sm:p-0">
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:pl-6">
                    聯絡人資訊
                  </th>
                  <th scope="col" class="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    聯絡方式
                  </th>
                  <th scope="col" class="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    關聯學生
                  </th>
                  <th scope="col" class="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    狀態
                  </th>
                  <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span class="sr-only">操作</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr
                  v-for="contact in paginatedContacts"
                  :key="contact.contact_id"
                  class="transition-colors duration-150 hover:bg-gray-50"
                >
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                    <div>
                      <div class="text-sm font-medium text-gray-900">
                        {{ contact.full_name }}
                      </div>
                      <div class="text-sm text-gray-500">
                        ID: {{ contact.contact_id }}
                      </div>
                    </div>
                  </td>
                  <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    <div class="space-y-1">
                      <div v-if="contact.phone" class="flex items-center">
                        <PhoneIcon class="mr-2 size-4 text-gray-400" />
                        {{ contact.phone }}
                      </div>
                      <div v-if="contact.email" class="flex items-center">
                        <EnvelopeIcon class="mr-2 size-4 text-gray-400" />
                        {{ contact.email }}
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="space-y-1">
                      <div
                        v-for="relationship in getContactRelationships(contact.contact_id)"
                        :key="relationship.student_id"
                        class="mb-1 mr-1 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                      >
                        {{ relationship.student_name }} ({{ relationship.relationship_type }})
                      </div>
                      <div v-if="getContactRelationships(contact.contact_id).length === 0" class="text-xs text-gray-400">
                        尚未關聯學生
                      </div>
                    </div>
                  </td>
                  <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
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
                  </td>
                  <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div class="flex items-center justify-end space-x-4">
                      <router-link
                        :to="`/contacts/${contact.contact_id}`"
                        class="flex size-8 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50 hover:text-blue-900"
                        title="查看詳情"
                      >
                        <EyeIcon class="size-5" />
                      </router-link>
                      <router-link
                        :to="`/contacts/${contact.contact_id}/edit`"
                        class="flex size-8 items-center justify-center rounded-full text-yellow-600 hover:bg-yellow-50 hover:text-yellow-900"
                        title="編輯"
                      >
                        <PencilIcon class="size-5" />
                      </router-link>
                      <button
                        @click="confirmDelete(contact)"
                        class="flex size-8 items-center justify-center rounded-full text-red-600 hover:bg-red-50 hover:text-red-900"
                        title="刪除"
                      >
                        <TrashIcon class="size-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 分頁 -->
        <div v-if="totalPages > 1" class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div class="flex flex-1 justify-between sm:hidden">
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              上一頁
            </button>
            <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              下一頁
            </button>
          </div>
          <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                顯示
                <span class="font-medium">{{ (currentPage - 1) * itemsPerPage + 1 }}</span>
                到
                <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, totalItems) }}</span>
                共
                <span class="font-medium">{{ totalItems }}</span>
                筆結果
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  @click="goToPage(currentPage - 1)"
                  :disabled="currentPage === 1"
                  class="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white p-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeftIcon class="size-5" />
                </button>
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  @click="goToPage(page)"
                  :class="[
                    'relative inline-flex items-center border px-4 py-2 text-sm font-medium',
                    page === currentPage
                      ? 'z-10 border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                  ]"
                >
                  {{ page }}
                </button>
                <button
                  @click="goToPage(currentPage + 1)"
                  :disabled="currentPage === totalPages"
                  class="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white p-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRightIcon class="size-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- 無資料狀態 -->
      <div v-if="!loading && filteredContacts.length === 0" class="py-12 text-center">
        <UserIcon class="mx-auto size-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">沒有聯絡人</h3>
        <p class="mt-1 text-sm text-gray-500">
          {{ hasFilters ? '沒有符合條件的聯絡人' : '開始新增第一個聯絡人' }}
        </p>
        <div v-if="!hasFilters" class="mt-6">
          <router-link
            to="/contacts/create"
            class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <PlusIcon class="mr-2 size-4" />
            新增聯絡人
          </router-link>
        </div>
      </div>
    </div>

    <!-- 刪除確認彈窗 -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="刪除聯絡人"
      :message="`確定要刪除聯絡人「${selectedContact?.full_name}」嗎？此操作無法復原。`"
      confirm-text="刪除"
      cancel-text="取消"
      type="danger"
      @confirm="deleteContact"
      @cancel="showDeleteDialog = false"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { db, supabase } from '@/services/supabase'
import MainLayout from '@/components/layout/MainLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import {
  PlusIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'

import type { Contact, StudentContact } from '@/types'

const router = useRouter()

// 響應式資料
const loading = ref(true)
const contacts = ref<Contact[]>([])
const studentContacts = ref<StudentContact[]>([])
const showDeleteDialog = ref(false)
const selectedContact = ref<Contact | null>(null)

// 搜尋和篩選
const filters = ref({
  search: '',
  status: '',
  relationship: ''
})

// 分頁
const currentPage = ref(1)
const itemsPerPage = ref(10)

// 計算屬性
const filteredContacts = computed(() => {
  let result = contacts.value

  // 搜尋篩選
  if (filters.value.search) {
    const searchTerm = filters.value.search.toLowerCase()
    result = result.filter(contact =>
      contact.full_name.toLowerCase().includes(searchTerm) ||
      contact.phone?.toLowerCase().includes(searchTerm) ||
      contact.email?.toLowerCase().includes(searchTerm) ||
      contact.contact_id.toLowerCase().includes(searchTerm)
    )
  }

  // 狀態篩選
  if (filters.value.status) {
    const isActive = filters.value.status === 'active'
    result = result.filter(contact => contact.is_active === isActive)
  }

  // 關係類型篩選
  if (filters.value.relationship) {
    const contactsWithRelationship = studentContacts.value
      .filter(sc => sc.relationship_type === filters.value.relationship)
      .map(sc => sc.contact_id)
    result = result.filter(contact => contactsWithRelationship.includes(contact.contact_id))
  }

  return result
})

const totalItems = computed(() => filteredContacts.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

const paginatedContacts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredContacts.value.slice(start, end)
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages = []

  if (total <= 5) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, 5)
    } else if (current >= total - 2) {
      pages.push(total - 4, total - 3, total - 2, total - 1, total)
    } else {
      pages.push(current - 2, current - 1, current, current + 1, current + 2)
    }
  }

  return pages
})

const hasFilters = computed(() => {
  return filters.value.search || filters.value.status || filters.value.relationship
})

// 搜尋防抖
let searchTimeout: ReturnType<typeof setTimeout> | null = null
const debounceSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    applyFilters()
  }, 300)
}

// 方法
const applyFilters = () => {
  currentPage.value = 1
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const getContactRelationships = (contactId: string) => {
  return studentContacts.value
    .filter(sc => sc.contact_id === contactId)
    .map(sc => ({
      student_id: sc.student_id,
      student_name: sc.student_name || '未知學生',
      relationship_type: sc.relationship_type
    }))
}

const confirmDelete = (contact: Contact) => {
  selectedContact.value = contact
  showDeleteDialog.value = true
}

const deleteContact = async () => {
  if (!selectedContact.value) return

  try {
    console.log('ContactListView - 開始刪除聯絡人:', selectedContact.value.contact_id)

    // 使用統一服務層API刪除聯絡人
    await db.delete('contacts', selectedContact.value.id)

    console.log('ContactListView - 聯絡人刪除成功')

    // 重新載入資料
    await loadContacts()

    showDeleteDialog.value = false
    selectedContact.value = null
  } catch (error) {
    console.error('刪除聯絡人失敗:', error)
    alert(`刪除聯絡人失敗: ${error.message || '未知錯誤'}`)
  }
}

const loadContacts = async () => {
  try {
    loading.value = true
    console.log('ContactListView - 開始載入聯絡人資料...')

    // 使用統一服務層API載入聯絡人資料
    const contactData = await db.findMany('contacts', {
      columns: 'id, contact_id, full_name, phone, email, address, notes, is_active, created_at, updated_at',
      orderBy: 'created_at',
      ascending: false
    })

    contacts.value = contactData
    console.log('ContactListView - 聯絡人資料載入成功:', contactData.length, '筆')

    // 載入學生聯絡人關係資料 (根據 API 文檔)
    if (contactData.length > 0) {
      const contactIds = contactData.map(contact => contact.contact_id)

      const { data: relationshipData, error: relationshipError } = await supabase
        .from('student_contacts')
        .select(`
          student_id,
          contact_id,
          relationship,
          is_primary,
          students (
            student_id,
            chinese_name
          )
        `)
        .in('contact_id', contactIds)

      if (!relationshipError && relationshipData) {
        studentContacts.value = relationshipData.map(item => ({
          id: 0, // 不需要用到
          student_id: item.student_id,
          student_name: item.students?.chinese_name || '未知學生',
          contact_id: item.contact_id,
          relationship_type: item.relationship,
          is_primary: item.is_primary,
          is_emergency: false, // 預設值
          is_billing: false, // 預設值
          created_at: '',
          updated_at: ''
        }))
        console.log('ContactListView - 學生關係資料載入成功:', relationshipData.length, '筆')
      }
    }

  } catch (error) {
    console.error('載入聯絡人失敗:', error)
    contacts.value = []
    studentContacts.value = []
  } finally {
    loading.value = false
  }
}

// 監聽路由變化，重新載入資料
watch(() => router.currentRoute.value.fullPath, () => {
  if (router.currentRoute.value.name === 'ContactList') {
    loadContacts()
  }
})

// 組件掛載時載入資料
onMounted(() => {
  loadContacts()
})
</script>
