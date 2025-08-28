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
          @input="validateAndUpdateField('full_name', $event)"
          @blur="validateField('full_name')"
          :class="[
            'mt-1 block w-full rounded-md border px-4 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm',
            validationErrors.full_name ? 'border-red-300 bg-red-50' : 'border-gray-300',
            readonly ? 'bg-gray-50 text-gray-500' : 'bg-white'
          ]"
          placeholder="請輸入聯絡人姓名"
          maxlength="50"
        />
        <div v-if="validationErrors.full_name" class="mt-1">
          <p v-for="error in validationErrors.full_name" :key="error" class="text-sm text-red-600">
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
          @input="validateAndUpdateField('phone', $event)"
          @blur="validateField('phone')"
          :class="[
            'mt-1 block w-full rounded-md border px-4 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm',
            validationErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300',
            readonly ? 'bg-gray-50 text-gray-500' : 'bg-white'
          ]"
          placeholder="請輸入聯絡電話"
          maxlength="20"
        />
        <div v-if="validationErrors.phone" class="mt-1">
          <p v-for="error in validationErrors.phone" :key="error" class="text-sm text-red-600">
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
          @change="validateAndUpdateField('relationship', $event)"
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
          @input="validateAndUpdateField('email', $event)"
          @blur="validateField('email')"
          :class="[
            'mt-1 block w-full rounded-md border px-4 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm',
            validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300',
            readonly ? 'bg-gray-50 text-gray-500' : 'bg-white'
          ]"
          placeholder="請輸入電子郵件"
          maxlength="255"
        />
        <div v-if="validationErrors.email" class="mt-1">
          <p v-for="error in validationErrors.email" :key="error" class="text-sm text-red-600">
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
          @input="validateAndUpdateField('address', $event)"
          @blur="validateField('address')"
          :class="[
            'mt-1 block w-full rounded-md border px-4 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm',
            validationErrors.address ? 'border-red-300 bg-red-50' : 'border-gray-300',
            readonly ? 'bg-gray-50 text-gray-500' : 'bg-white'
          ]"
          placeholder="請輸入地址"
          maxlength="200"
        />
        <div v-if="validationErrors.address" class="mt-1">
          <p v-for="error in validationErrors.address" :key="error" class="text-sm text-red-600">
            {{ error }}
          </p>
        </div>
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
          @input="validateAndUpdateField('notes', $event)"
          @blur="validateField('notes')"
          :class="[
            'mt-1 block w-full resize-none rounded-md border px-4 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm',
            validationErrors.notes ? 'border-red-300 bg-red-50' : 'border-gray-300',
            readonly ? 'bg-gray-50 text-gray-500' : 'bg-white'
          ]"
          placeholder="請輸入備註資訊..."
          maxlength="1000"
        />
        <div v-if="validationErrors.notes" class="mt-1">
          <p v-for="error in validationErrors.notes" :key="error" class="text-sm text-red-600">
            {{ error }}
          </p>
        </div>
        <div class="mt-1 text-right">
          <span class="text-xs text-gray-500">
            {{ localContact.notes?.length || 0 }} / 1000
          </span>
        </div>
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
import { ref, computed, watch } from 'vue'
import {
  UserIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon
} from '@heroicons/vue/24/outline'
import { z } from 'zod'
import {
  contactSchema,
  validateWithSchema,
  sanitizers
} from '@/utils/validation'
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
  (e: 'validation-change', errors: Record<string, string[]>): void
}

const emit = defineEmits<Emits>()

// Local state
const localContact = ref<ContactFormData>({ ...props.contact })
const validationErrors = ref<Record<string, string[]>>({})

// 單個欄位的 schema
const fieldSchemas = {
  full_name: contactSchema.shape.full_name,
  phone: contactSchema.shape.phone.optional(),
  email: contactSchema.shape.email.optional(),
  address: contactSchema.shape.address,
  notes: contactSchema.shape.notes
}

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

// 驗證單個欄位
function validateField(fieldName: keyof typeof fieldSchemas): boolean {
  const schema = fieldSchemas[fieldName]
  const value = localContact.value[fieldName]

  if (!schema) return true

  const result = schema.safeParse(value)

  if (result.success) {
    delete validationErrors.value[fieldName]
  } else {
    validationErrors.value[fieldName] = result.error.issues.map(issue => issue.message)
  }

  emit('validation-change', validationErrors.value)
  return result.success
}

// 驗證並更新欄位
function validateAndUpdateField(fieldName: string, event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  let value = target.value

  // 根據欄位類型進行清理
  switch (fieldName) {
    case 'full_name':
      value = sanitizers.html.strip(value)
      break
    case 'phone':
      value = sanitizers.data.phone(value)
      break
    case 'email':
      value = sanitizers.data.email(value)
      break
    case 'address':
      value = sanitizers.html.strip(value)
      break
    case 'notes':
      value = sanitizers.html.basic(value)
      break
  }

  // 更新本地值
  localContact.value[fieldName] = value
  target.value = value // 更新輸入框顯示

  // 即時驗證
  if (fieldName in fieldSchemas) {
    validateField(fieldName as keyof typeof fieldSchemas)
  }

  // 發送更新事件
  handleInputChange()
}

// 驗證整個表單
function validateForm(): boolean {
  let isValid = true

  for (const fieldName in fieldSchemas) {
    const fieldValid = validateField(fieldName as keyof typeof fieldSchemas)
    if (!fieldValid) {
      isValid = false
    }
  }

  return isValid
}

// 只監聽 props 變化，更新本地狀態
watch(() => props.contact, (newContact) => {
  localContact.value = { ...newContact }
}, { deep: true, immediate: true })

// 合併外部錯誤和內部驗證錯誤
watch([() => props.errors, validationErrors], ([externalErrors, internalErrors]) => {
  const merged = { ...externalErrors, ...internalErrors }
  emit('validation-change', merged)
}, { deep: true })

// 手動觸發更新事件
function handleInputChange() {
  emit('update:contact', { ...localContact.value })
}

// 暴露方法給父組件
defineExpose({
  validateForm
})
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
