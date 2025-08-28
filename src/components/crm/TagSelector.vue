<template>
  <div class="tag-selector">
    <label class="mb-2 block text-sm font-medium text-gray-700">標籤</label>
    <div class="mb-3 flex flex-wrap gap-2">
      <!-- 已選擇的標籤 -->
      <span
        v-for="tag in selectedTags"
        :key="tag.tag_id"
        :data-testid="`selected-tag-${tag.tag_id}`"
        data-testid="selected-tag"
        class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
        :style="{ backgroundColor: tag.color + '20', color: tag.color }"
      >
        {{ tag.name }}
        <button
          @click="removeTag(tag.tag_id)"
          :data-testid="`remove-tag-${tag.tag_id}`"
          class="ml-1.5 inline-flex size-4 items-center justify-center rounded-full hover:bg-gray-200"
        >
          <XMarkIcon class="size-3" />
        </button>
      </span>

      <!-- 添加標籤按鈕 -->
      <button
        @click="showDropdown = !showDropdown"
        data-testid="tag-dropdown-button"
        class="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <PlusIcon class="mr-1 size-4" />
        新增標籤
      </button>
    </div>

    <!-- 標籤下拉選單 -->
    <div v-if="showDropdown" class="relative" data-testid="tag-dropdown">
      <div class="absolute z-10 mt-1 w-64 rounded-md bg-white shadow-lg">
        <div class="p-2">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜尋或建立標籤..."
            data-testid="tag-search-input"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            @keydown.enter="handleEnter"
          >
        </div>

        <div class="max-h-48 overflow-y-auto">
          <!-- 現有標籤列表 -->
          <div v-if="filteredTags.length > 0" class="py-1">
            <button
              v-for="tag in filteredTags"
              :key="tag.tag_id"
              @click="selectTag(tag)"
              :data-testid="`tag-option-${tag.tag_id}`"
              class="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-100"
            >
              <span class="flex items-center">
                <span
                  class="mr-2 size-3 rounded-full"
                  :style="{ backgroundColor: tag.color }"
                ></span>
                {{ tag.name }}
              </span>
              <CheckIcon
                v-if="isSelected(tag.tag_id)"
                class="size-4 text-primary-600"
              />
            </button>
          </div>

          <!-- 創建新標籤選項 -->
          <div
            v-if="searchQuery && !exactMatch"
            class="border-t border-gray-200 py-2"
          >
            <button
              @click="createNewTag"
              data-testid="create-tag-option"
              class="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-gray-100"
            >
              <PlusCircleIcon class="mr-2 size-4 text-primary-600" />
              建立新標籤 "{{ searchQuery }}"
            </button>
          </div>
        </div>

        <!-- 標籤管理 -->
        <div class="border-t border-gray-200 p-2">
          <button
            @click="showManageModal = true"
            class="text-sm text-primary-600 hover:text-primary-700"
          >
            管理標籤
          </button>
        </div>
      </div>
    </div>

    <!-- 標籤管理 Modal -->
    <TagManageModal
      v-if="showManageModal"
      @close="showManageModal = false"
      @updated="loadTags"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { XMarkIcon, PlusIcon, CheckIcon, PlusCircleIcon } from '@heroicons/vue/24/outline'
import { crmService } from '@/services/crmService'
import type { Tag } from '@/types/crm'
import TagManageModal from './TagManageModal.vue'

interface Props {
  modelValue: Tag[]
  leadId?: string
}

interface Emits {
  (e: 'update:modelValue', tags: Tag[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 狀態
const allTags = ref<Tag[]>([])
const selectedTags = ref<Tag[]>([])
const showDropdown = ref(false)
const showManageModal = ref(false)
const searchQuery = ref('')

// 計算屬性
const filteredTags = computed(() => {
  if (!searchQuery.value) return allTags.value

  const query = searchQuery.value.toLowerCase()
  return allTags.value.filter(tag =>
    tag.name.toLowerCase().includes(query)
  )
})

const exactMatch = computed(() => {
  return allTags.value.some(tag =>
    tag.name.toLowerCase() === searchQuery.value.toLowerCase()
  )
})

// 監聽 modelValue 變化
watch(() => props.modelValue, (newTags) => {
  selectedTags.value = [...newTags]
}, { immediate: true })

// 方法
async function loadTags() {
  try {
    allTags.value = await crmService.getTags()
  } catch (error) {
    console.error('載入標籤失敗:', error)
  }
}

function selectTag(tag: Tag) {
  if (!isSelected(tag.tag_id)) {
    selectedTags.value.push(tag)
    emit('update:modelValue', selectedTags.value)
  }
  showDropdown.value = false
  searchQuery.value = ''
}

function removeTag(tagId: string) {
  selectedTags.value = selectedTags.value.filter(t => t.tag_id !== tagId)
  emit('update:modelValue', selectedTags.value)
}

function isSelected(tagId: string): boolean {
  return selectedTags.value.some(t => t.tag_id === tagId)
}

async function createNewTag() {
  try {
    // 生成隨機顏色
    const colors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#F59E0B', // yellow
      '#EF4444', // red
      '#8B5CF6', // purple
      '#EC4899', // pink
      '#14B8A6', // teal
      '#F97316', // orange
    ]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    const newTag = await crmService.createTag({
      name: searchQuery.value,
      color: randomColor
    })

    allTags.value.push(newTag)
    selectTag(newTag)
  } catch (error) {
    console.error('建立標籤失敗:', error)
    alert('建立標籤失敗')
  }
}

function handleEnter() {
  if (!exactMatch.value && searchQuery.value) {
    createNewTag()
  }
}

// 點擊外部關閉下拉選單
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.tag-selector')) {
    showDropdown.value = false
  }
}

// 生命週期
onMounted(() => {
  loadTags()
  document.addEventListener('click', handleClickOutside)
})

// 清理
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
