<template>
  <div
    class="contact-form rounded-lg border border-gray-200 p-6"
    :data-contact-index="index"
  >
    <!-- 聯絡人標題和操作 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h4 class="text-lg font-medium text-gray-900">
          {{ contact.full_name || `聯絡人 ${index + 1}` }}
        </h4>
          <div class="mt-1 flex items-center space-x-2">
            <span
              v-if="contact.relationship"
              class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
            >
              {{ getRelationshipIcon(contact.relationship) }} {{ contact.relationship }}
            </span>
            <span
              v-if="contact.is_primary"
              class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
            >
              ⭐ 主要聯絡人
            </span>
            <span
              v-if="contact.is_emergency"
              class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"
            >
              🚨 緊急聯絡人
            </span>
            <span
              v-if="contact.is_billing"
              class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
            >
              💳 帳務聯絡人
            </span>
          </div>
      </div>

      <button
        v-if="!readonly"
        type="button"
        @click="$emit('remove')"
        class="flex size-8 items-center justify-center rounded-full text-red-600 transition-colors hover:bg-red-50 hover:text-red-800"
        title="移除此聯絡人"
      >
        <TrashIcon class="size-5" />
      </button>
    </div>

    <!-- 表單欄位 -->
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <!-- 姓名 -->
      <div>
        <label class="mb-2 block text-sm font-medium text-gray-700">
          姓名 <span class="text-red-500">*</span>
        </label>
        <input
          v-model="localContact.full_name"
          name="full_name"
          type="text"
          :readonly="readonly"
          @change="handleInputChange"
          :class="[
            'mt-1 block w-full rounded-md border px-4 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm',
            errors.full_name ? 'border-red-300 bg-red-50' : 'border-gray-300',
            readonly ? 'bg-gray-50 text-gray-500' : 'bg-white'
          ]"
          placeholder="請輸入聯絡人姓名"
        />
        <div v-if="errors.full_name" class="mt-1">
          <p v-for="error in errors.full_name" :key="error" class="text-sm text-red-600">
            {{ error }}
          </p>
        </div>
      </div>

      <!-- 電話 -->
      <div>
        <label class="mb-2 block text-sm font-medium text-gray-700">
          電話 <span class="text-red-500">*</span>
        </label>
        <input
          v-model="localContact.phone"
          name="phone"
          type="tel"
          :readonly="readonly"
          @input="handleInputChange"
          :class="[
            'mt-1 block w-full rounded-md border px-4 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm',
            errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300',
            readonly ? 'bg-gray-50 text-gray-500' : 'bg-white'
          ]"
          placeholder="請輸入聯絡電話"
        />
        <div v-if="errors.phone" class="mt-1">
          <p v-for="error in errors.phone" :key="error" class="text-sm text-red-600">
            {{ error }}
          </p>
        </div>
      </div>

      <!-- 關係 -->
      <div>
        <label class="mb-2 block text-sm font-medium text-gray-700">
          關係
        </label>
        <select
          v-model="localContact.relationship"
          :disabled="readonly"
          @change="handleInputChange"
          :class="[
            'mt-1 block w-full rounded-md border px-4 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm',
            readonly ? 'bg-gray-50 text-gray-500' : 'border-gray-300 bg-white'
          ]"
        >
          <option v-for="option in relationshipOptions" :key="option.value" :value="option.value">
            {{ option.icon }} {{ option.label }}
          </option>
        </select>
      </div>

      <!-- 電子郵件 -->
      <div>
        <label class="mb-2 block text-sm font-medium text-gray-700">
          電子郵件
        </label>
        <input
          v-model="localContact.email"
          name="email"
          type="email"
          :readonly="readonly"
          @input="handleInputChange"
          :class="[
            'mt-1 block w-full rounded-md border px-4 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm',
            errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300',
            readonly ? 'bg-gray-50 text-gray-500' : 'bg-white'
          ]"
          placeholder="請輸入電子郵件"
        />
        <div v-if="errors.email" class="mt-1">
          <p v-for="error in errors.email" :key="error" class="text-sm text-red-600">
            {{ error }}
          </p>
        </div>
      </div>

      <!-- 地址 -->
      <div class="sm:col-span-2">
        <label class="mb-2 block text-sm font-medium text-gray-700">
          地址
        </label>
        <input
          v-model="localContact.address"
          name="address"
          type="text"
          :readonly="readonly"
          @input="handleInputChange"
          :class="[
            'mt-1 block w-full rounded-md border px-4 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm',
            readonly ? 'bg-gray-50 text-gray-500' : 'border-gray-300 bg-white'
          ]"
          placeholder="請輸入地址"
        />
      </div>

      <!-- 備註 -->
      <div class="sm:col-span-2">
        <label class="mb-2 block text-sm font-medium text-gray-700">
          備註
        </label>
        <textarea
          v-model="localContact.notes"
          name="notes"
          rows="3"
          :readonly="readonly"
          @input="handleInputChange"
          :class="[
            'mt-1 block w-full resize-none rounded-md border px-4 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm',
            readonly ? 'bg-gray-50 text-gray-500' : 'border-gray-300 bg-white'
          ]"
          placeholder="請輸入備註資訊..."
        />
      </div>
    </div>

    <!-- 聯絡人類型選項 -->
    <div class="mt-6">
      <label class="mb-3 block text-sm font-medium text-gray-700">
        聯絡人類型
      </label>
      <div class="flex flex-wrap gap-4">
        <label class="flex items-center">
          <input
            v-model="localContact.is_primary"
            type="checkbox"
            :disabled="readonly"
            @change="handleInputChange"
            class="size-4 rounded border-gray-300 text-blue-600 transition-colors focus:ring-blue-500 disabled:opacity-50"
          />
          <span class="ml-2 text-sm text-gray-700">⭐ 主要聯絡人</span>
        </label>
        <label class="flex items-center">
          <input
            v-model="localContact.is_emergency"
            type="checkbox"
            :disabled="readonly"
            @change="handleInputChange"
            class="size-4 rounded border-gray-300 text-red-600 transition-colors focus:ring-red-500 disabled:opacity-50"
          />
          <span class="ml-2 text-sm text-gray-700">🚨 緊急聯絡人</span>
        </label>
        <label class="flex items-center">
          <input
            v-model="localContact.is_billing"
            type="checkbox"
            :disabled="readonly"
            @change="handleInputChange"
            class="size-4 rounded border-gray-300 text-green-600 transition-colors focus:ring-green-500 disabled:opacity-50"
          />
          <span class="ml-2 text-sm text-gray-700">💳 帳務聯絡人</span>
        </label>
      </div>
    </div>

    <!-- 聯絡人資訊預覽 (唯讀模式) -->
    <div v-if="readonly && hasContactInfo" class="mt-6 rounded-lg bg-gray-50 p-4">
      <h5 class="mb-2 text-sm font-medium text-gray-900">聯絡資訊</h5>
      <div class="space-y-1 text-sm text-gray-600">
        <div v-if="contact.phone" class="flex items-center">
          <PhoneIcon class="mr-2 size-4 text-gray-400" />
          <a :href="`tel:${contact.phone}`" class="hover:text-blue-600">{{ contact.phone }}</a>
        </div>
        <div v-if="contact.email" class="flex items-center">
          <EnvelopeIcon class="mr-2 size-4 text-gray-400" />
          <a :href="`mailto:${contact.email}`" class="hover:text-blue-600">{{ contact.email }}</a>
        </div>
        <div v-if="contact.address" class="flex items-start">
          <MapPinIcon class="mr-2 mt-0.5 size-4 shrink-0 text-gray-400" />
          <span>{{ contact.address }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import {
  UserIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon
} from '@heroicons/vue/24/outline'

import type { ContactFormData } from './types'
import { RELATIONSHIP_OPTIONS } from './types'

// Props
interface Props {
  contact: ContactFormData
  index: number
  readonly?: boolean
  errors?: Record<string, string[]>
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  errors: () => ({})
})

// Emits
interface Emits {
  (e: 'update:contact', contact: ContactFormData): void
  (e: 'remove'): void
}

const emit = defineEmits<Emits>()

// Local state
const localContact = ref<ContactFormData>({ ...props.contact })

// Computed
const relationshipOptions = computed(() => RELATIONSHIP_OPTIONS)

const hasContactInfo = computed(() => {
  return Boolean(props.contact.phone || props.contact.email || props.contact.address)
})

// Methods
function getRelationshipIcon(relationship: ContactFormData['relationship']): string {
  const option = relationshipOptions.value.find(opt => opt.value === relationship)
  return option?.icon || '👤'
}

// 只監聽 props 變化，更新本地狀態，不自動發射事件
watch(() => props.contact, (newContact) => {
  localContact.value = { ...newContact }
}, { deep: true, immediate: true })

// 手動觸發更新事件
function handleInputChange() {
  emit('update:contact', { ...localContact.value })
}
</script>

<style scoped>
.contact-form {
  transition: all 0.3s ease;
}

.contact-form:hover {
  @apply shadow-md;
}

.contact-form:focus-within {
  @apply ring-2 ring-blue-500 ring-opacity-50;
}

/* 自訂 checkbox 樣式 */
input[type="checkbox"]:checked {
  background-size: 16px 16px;
}

/* 響應式調整 */
@media (max-width: 640px) {
  .contact-form .grid {
    @apply grid-cols-1;
  }
}
</style>
