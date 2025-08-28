<template>
  <TransitionRoot :show="true" as="template">
    <Dialog as="div" class="relative z-10" @close="$emit('close')">
      <TransitionChild
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <TransitionChild
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel class="relative overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div class="sm:flex sm:items-start">
                  <div class="bg-primary-100 mx-auto flex size-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:size-10">
                    <TagIcon class="size-6 text-primary-600" />
                  </div>
                  <div class="mt-3 flex-1 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <DialogTitle as="h3" class="text-base font-semibold leading-6 text-gray-900">
                      管理標籤
                    </DialogTitle>

                    <div class="mt-4">
                      <!-- 新增標籤表單 -->
                      <div class="mb-4 rounded-lg bg-gray-50 p-4">
                        <h4 class="mb-3 text-sm font-medium text-gray-700">新增標籤</h4>
                        <form @submit.prevent="createTag" class="flex gap-2">
                          <input
                            v-model="newTagName"
                            type="text"
                            placeholder="標籤名稱"
                            required
                            class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                          <input
                            v-model="newTagColor"
                            type="color"
                            class="size-10 cursor-pointer rounded border border-gray-300"
                          >
                          <button
                            type="submit"
                            class="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                          >
                            新增
                          </button>
                        </form>
                      </div>

                      <!-- 標籤列表 -->
                      <div class="max-h-64 overflow-y-auto">
                        <h4 class="mb-3 text-sm font-medium text-gray-700">現有標籤</h4>
                        <div v-if="tags.length > 0" class="space-y-2">
                          <div
                            v-for="tag in tags"
                            :key="tag.tag_id"
                            class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
                          >
                            <div class="flex items-center">
                              <span
                                class="mr-3 size-4 rounded-full"
                                :style="{ backgroundColor: tag.color }"
                              ></span>
                              <input
                                v-if="editingTag === tag.tag_id"
                                v-model="editingName"
                                @blur="saveEdit(tag)"
                                @keyup.enter="saveEdit(tag)"
                                @keyup.escape="cancelEdit"
                                class="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                              >
                              <span v-else class="text-sm font-medium text-gray-900">
                                {{ tag.name }}
                              </span>
                            </div>

                            <div class="flex items-center gap-2">
                              <button
                                v-if="editingTag !== tag.tag_id"
                                @click="startEdit(tag)"
                                class="text-gray-400 hover:text-gray-600"
                              >
                                <PencilIcon class="size-4" />
                              </button>
                              <input
                                v-if="editingTag === tag.tag_id"
                                v-model="editingColor"
                                type="color"
                                @change="saveEdit(tag)"
                                class="size-6 cursor-pointer rounded border border-gray-300"
                              >
                              <button
                                @click="deleteTag(tag)"
                                class="text-red-400 hover:text-red-600"
                              >
                                <TrashIcon class="size-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <p v-else class="py-4 text-center text-sm text-gray-500">
                          尚無標籤
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  @click="$emit('close')"
                  class="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 sm:ml-3 sm:w-auto"
                >
                  完成
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { TagIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { crmService } from '@/services/crmService'
import type { Tag } from '@/types/crm'

interface Emits {
  (e: 'close'): void
  (e: 'updated'): void
}

const emit = defineEmits<Emits>()

// 狀態
const tags = ref<Tag[]>([])
const newTagName = ref('')
const newTagColor = ref('#3B82F6')
const editingTag = ref<string | null>(null)
const editingName = ref('')
const editingColor = ref('')

// 方法
async function loadTags() {
  try {
    tags.value = await crmService.getTags()
  } catch (error) {
    console.error('載入標籤失敗:', error)
  }
}

async function createTag() {
  try {
    const newTag = await crmService.createTag({
      name: newTagName.value,
      color: newTagColor.value
    })

    tags.value.push(newTag)
    newTagName.value = ''
    newTagColor.value = '#3B82F6'
    emit('updated')
  } catch (error) {
    console.error('建立標籤失敗:', error)
    alert('建立標籤失敗')
  }
}

function startEdit(tag: Tag) {
  editingTag.value = tag.tag_id
  editingName.value = tag.name
  editingColor.value = tag.color
}

function cancelEdit() {
  editingTag.value = null
  editingName.value = ''
  editingColor.value = ''
}

async function saveEdit(tag: Tag) {
  if (!editingName.value.trim()) {
    cancelEdit()
    return
  }

  try {
    const updated = await crmService.updateTag(tag.tag_id, {
      name: editingName.value,
      color: editingColor.value
    })

    const index = tags.value.findIndex(t => t.tag_id === tag.tag_id)
    if (index !== -1) {
      tags.value[index] = updated
    }

    cancelEdit()
    emit('updated')
  } catch (error) {
    console.error('更新標籤失敗:', error)
    alert('更新標籤失敗')
  }
}

async function deleteTag(tag: Tag) {
  if (!confirm(`確定要刪除標籤「${tag.name}」嗎？`)) {
    return
  }

  try {
    await crmService.deleteTag(tag.tag_id)
    tags.value = tags.value.filter(t => t.tag_id !== tag.tag_id)
    emit('updated')
  } catch (error) {
    console.error('刪除標籤失敗:', error)
    alert('刪除標籤失敗')
  }
}

// 生命週期
onMounted(() => {
  loadTags()
})
</script>
