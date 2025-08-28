<template>
  <div class="simple-contact-form rounded-lg border border-gray-200 p-6">
    <!-- 姓名 -->
    <div class="mb-4">
      <label class="mb-2 block text-sm font-medium text-gray-700">
        姓名 <span class="text-red-500">*</span>
      </label>
      <input
        name="full_name"
        type="text"
        :value="contact.full_name"
        :readonly="readonly"
        @input="updateField('full_name', ($event.target as HTMLInputElement).value)"
        class="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
        placeholder="請輸入聯絡人姓名"
      />
    </div>

    <!-- 電話 -->
    <div class="mb-4">
      <label class="mb-2 block text-sm font-medium text-gray-700">
        電話 <span class="text-red-500">*</span>
      </label>
      <input
        name="phone"
        type="tel"
        :value="contact.phone"
        :readonly="readonly"
        @input="updateField('phone', ($event.target as HTMLInputElement).value)"
        class="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
        placeholder="請輸入電話號碼"
      />
    </div>

    <!-- 關係 -->
    <div class="mb-4">
      <label class="mb-2 block text-sm font-medium text-gray-700">關係</label>
      <select
        name="relationship"
        :value="contact.relationship"
        :disabled="readonly"
        @change="updateField('relationship', ($event.target as HTMLSelectElement).value)"
        class="mt-1 block w-full rounded-md border border-gray-300 bg-white px-4 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
      >
        <option value="父親">👨 父親</option>
        <option value="母親">👩 母親</option>
        <option value="監護人">👤 監護人</option>
        <option value="本人">🧑‍🎓 本人</option>
      </select>
    </div>

    <!-- 電子郵件 -->
    <div class="mb-4">
      <label class="mb-2 block text-sm font-medium text-gray-700">電子郵件</label>
      <input
        name="email"
        type="email"
        :value="contact.email"
        :readonly="readonly"
        @input="updateField('email', ($event.target as HTMLInputElement).value)"
        class="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
        placeholder="請輸入電子郵件"
      />
    </div>

    <!-- 地址 -->
    <div class="mb-4">
      <label class="mb-2 block text-sm font-medium text-gray-700">地址</label>
      <input
        name="address"
        type="text"
        :value="contact.address"
        :readonly="readonly"
        @input="updateField('address', ($event.target as HTMLInputElement).value)"
        class="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
        placeholder="請輸入地址"
      />
    </div>

    <!-- 備註 -->
    <div class="mb-6">
      <label class="mb-2 block text-sm font-medium text-gray-700">備註</label>
      <textarea
        name="notes"
        rows="3"
        :value="contact.notes"
        :readonly="readonly"
        @input="updateField('notes', ($event.target as HTMLTextAreaElement).value)"
        class="mt-1 block w-full resize-none rounded-md border border-gray-300 px-4 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
        placeholder="請輸入備註資訊..."
      />
    </div>

    <!-- 聯絡人類型 -->
    <div class="space-y-3">
      <label class="block text-sm font-medium text-gray-700">聯絡人類型</label>
      <div class="flex flex-wrap gap-4">
        <label class="flex items-center">
          <input
            name="is_primary"
            type="checkbox"
            :checked="contact.is_primary"
            :disabled="readonly"
            @change="updateField('is_primary', ($event.target as HTMLInputElement).checked)"
            class="size-4 rounded border-gray-300 text-blue-600 transition-colors focus:ring-blue-500"
          />
          <span class="ml-2 text-sm text-gray-700">⭐ 主要聯絡人</span>
        </label>
        <label class="flex items-center">
          <input
            name="is_emergency"
            type="checkbox"
            :checked="contact.is_emergency"
            :disabled="readonly"
            @change="updateField('is_emergency', ($event.target as HTMLInputElement).checked)"
            class="size-4 rounded border-gray-300 text-red-600 transition-colors focus:ring-red-500"
          />
          <span class="ml-2 text-sm text-gray-700">🚨 緊急聯絡人</span>
        </label>
        <label class="flex items-center">
          <input
            name="is_billing"
            type="checkbox"
            :checked="contact.is_billing"
            :disabled="readonly"
            @change="updateField('is_billing', ($event.target as HTMLInputElement).checked)"
            class="size-4 rounded border-gray-300 text-green-600 transition-colors focus:ring-green-500"
          />
          <span class="ml-2 text-sm text-gray-700">💳 帳務聯絡人</span>
        </label>
      </div>
    </div>

    <!-- 移除按鈕 -->
    <div v-if="showRemoveButton && !readonly" class="mt-6 border-t border-gray-200 pt-4">
      <button
        type="button"
        @click="$emit('remove')"
        class="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        移除此聯絡人
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ContactFormData } from './types'

interface Props {
  contact: ContactFormData
  readonly?: boolean
  showRemoveButton?: boolean
}

interface Emits {
  (e: 'update:contact', contact: ContactFormData): void
  (e: 'remove'): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  showRemoveButton: false
})

const emit = defineEmits<Emits>()

function updateField(field: keyof ContactFormData, value: any) {
  if (props.readonly) return

  const updatedContact = { ...props.contact, [field]: value }
  emit('update:contact', updatedContact)
}
</script>
