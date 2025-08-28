<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">課程分類管理</h3>
      <button
        @click="$emit('add-category')"
        class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        <PlusIcon class="mr-2 size-4" />
        新增分類
      </button>
    </div>

    <div v-if="loading" class="p-8 text-center">
      <div class="mx-auto size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600">載入分類數據中...</p>
    </div>
    <div v-else class="space-y-4">
      <CategoryItem
        v-for="(category, index) in categories"
        :key="index"
        :category="category"
        :index="index"
        :color-picker="colorPicker"
        @update="updateCategory(index, $event)"
        @remove="$emit('remove-category', index)"
      />

      <div v-if="categories.length === 0" class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-8 text-center text-gray-500">
        <TagIcon class="mx-auto mb-2 size-12 text-gray-400" />
        <p class="mb-1 text-lg font-medium">尚未新增任何課程分類</p>
        <p class="text-sm">點擊上方按鈕新增第一個課程分類</p>
      </div>
    </div>

    <!-- 預設分類說明 -->
    <div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div class="flex">
        <InformationCircleIcon class="mr-3 mt-0.5 size-5 text-blue-400" />
        <div>
          <h4 class="text-sm font-medium text-blue-800">關於課程分類</h4>
          <div class="mt-2 text-sm text-blue-700">
            <ul class="list-inside list-disc space-y-1">
              <li>課程分類用於組織和管理不同類型的課程</li>
              <li>每個分類可以設定顏色標籤，方便在課表中識別</li>
              <li>分類一旦使用後，建議不要刪除，以免影響既有課程</li>
              <li>可以隨時新增新的分類來適應業務需求</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon, TagIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import CategoryItem from './CategoryItem.vue'

interface Category {
  id?: string
  name: string
  description?: string
  color?: string
  is_active?: boolean
}

interface Props {
  categories: Category[]
  loading: boolean
  colorPicker: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:categories': [value: Category[]]
  'add-category': []
  'remove-category': [index: number]
}>()

const updateCategory = (index: number, updatedCategory: Category) => {
  const newCategories = [...props.categories]
  newCategories[index] = updatedCategory
  emit('update:categories', newCategories)
}
</script>
