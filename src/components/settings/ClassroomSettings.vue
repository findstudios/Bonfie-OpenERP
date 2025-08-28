<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">教室管理</h3>
      <button
        @click="$emit('add-classroom')"
        class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        <PlusIcon class="mr-2 size-4" />
        新增教室
      </button>
    </div>

    <div v-if="loading" class="p-8 text-center">
      <div class="mx-auto size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600">載入教室數據中...</p>
    </div>
    <div v-else class="space-y-4">
      <div
        v-for="(classroom, index) in classrooms"
        :key="index"
        class="rounded-lg border border-gray-200 p-4"
      >
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              教室名稱
            </label>
            <input
              :value="classroom.name"
              @input="updateClassroom(index, 'name', $event.target.value)"
              type="text"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="例：A教室"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              容納人數
            </label>
            <input
              :value="classroom.capacity"
              @input="updateClassroom(index, 'capacity', Number($event.target.value))"
              type="number"
              min="1"
              class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="10"
            />
          </div>
          <div class="flex items-end">
            <button
              @click="$emit('remove-classroom', index)"
              class="rounded-md px-3 py-2 text-red-600 hover:bg-red-50 hover:text-red-800"
            >
              <TrashIcon class="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="classrooms.length === 0" class="py-8 text-center text-gray-500">
        尚未新增任何教室，點擊上方按鈕新增教室
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'

interface Classroom {
  classroom_id?: string
  name: string
  capacity: number
  is_active?: boolean
}

interface Props {
  classrooms: Classroom[]
  loading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:classrooms': [classrooms: Classroom[]]
  'add-classroom': []
  'remove-classroom': [index: number]
}>()

const updateClassroom = (index: number, field: keyof Classroom, value: any) => {
  const updatedClassrooms = [...props.classrooms]
  updatedClassrooms[index] = {
    ...updatedClassrooms[index],
    [field]: value
  }
  emit('update:classrooms', updatedClassrooms)
}
</script>
