<template>
  <div class="rounded-lg border border-gray-200 bg-white p-4">
    <div class="grid grid-cols-1 items-center gap-4 md:grid-cols-12">
      <div class="md:col-span-4">
        <label class="mb-1 block text-sm font-medium text-gray-700">
          分類名稱 <span class="text-red-500">*</span>
        </label>
        <input
          :value="category.name"
          @input="updateField('name', $event.target.value)"
          type="text"
          required
          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="例：數學"
        />
      </div>
      <div class="md:col-span-5">
        <label class="mb-1 block text-sm font-medium text-gray-700">
          分類說明
        </label>
        <input
          :value="category.description"
          @input="updateField('description', $event.target.value)"
          type="text"
          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="例：各年級數學課程"
        />
      </div>
      <div class="md:col-span-2">
        <label class="mb-1 block text-sm font-medium text-gray-700">
          顏色標籤
        </label>
        <ColorPickerButton
          :color="category.color || '#E5E7EB'"
          :index="index"
          :color-picker="colorPicker"
          @update:color="updateField('color', $event)"
        />
      </div>
      <div class="flex justify-end md:col-span-1">
        <button
          @click="$emit('remove')"
          class="rounded-md p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-800"
          title="刪除分類"
        >
          <TrashIcon class="size-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TrashIcon } from '@heroicons/vue/24/outline'
import ColorPickerButton from './ColorPickerButton.vue'

interface Category {
  id?: string
  name: string
  description?: string
  color?: string
  is_active?: boolean
}

interface Props {
  category: Category
  index: number
  colorPicker: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [category: Category]
  remove: []
}>()

const updateField = (field: keyof Category, value: any) => {
  emit('update', {
    ...props.category,
    [field]: value
  })
}
</script>
