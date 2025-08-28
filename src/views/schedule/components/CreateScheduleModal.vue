<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-screen items-center justify-center px-4">
      <div class="fixed inset-0 bg-black opacity-50" @click="$emit('close')"></div>

      <div class="relative w-full max-w-md rounded-lg bg-white p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900">新增臨時課程</h3>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
            <XMarkIcon class="size-5" />
          </button>
        </div>

        <form @submit.prevent="$emit('save')" class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">課程名稱</label>
            <input
              v-model="newSchedule.course_name"
              type="text"
              required
              placeholder="請輸入課程名稱（例如：調課、私人預約、補課等）"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">上課日期</label>
            <input
              v-model="newSchedule.date"
              type="date"
              required
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">開始時間</label>
              <input
                v-model="newSchedule.start_time"
                type="time"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">結束時間</label>
              <input
                v-model="newSchedule.end_time"
                type="time"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">教室</label>
            <select
              v-model="newSchedule.classroom"
              required
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">請選擇教室</option>
              <option
                v-for="classroom in classrooms"
                :key="classroom"
                :value="classroom"
              >
                {{ classroom }}
              </option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">備註</label>
            <textarea
              v-model="newSchedule.notes"
              rows="3"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="輸入課程備註或特殊說明"
            ></textarea>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="$emit('close')"
              class="btn btn-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="creating"
              class="btn btn-primary"
            >
              <div v-if="creating" class="mr-2 size-4 animate-spin rounded-full border-b-2 border-white"></div>
              建立安排
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { db } from '@/services/supabase'
import type { Course } from '@/types'

// Props
interface Props {
  courses: Course[]
  newSchedule: {
    course_id: string
    course_name: string
    date: string
    start_time: string
    end_time: string
    classroom: string
    notes: string
  }
  creating: boolean
}

defineProps<Props>()

// Emits
defineEmits<{
  'close': []
  'save': []
}>()

// 教室選項
const classrooms = ref<string[]>([])

// ==================== 載入教室列表 ====================
async function loadClassrooms() {
  try {
    // 使用標準 API 載入教室
    const data = await db.findMany('classrooms', {
      columns: 'classroom_name',
      filters: { is_active: true },
      orderBy: 'classroom_name',
      ascending: true
    })

    classrooms.value = data.map(item => item.classroom_name) || []

    // 如果沒有找到教室，提供預設選項
    if (classrooms.value.length === 0) {
      classrooms.value = ['小教室 A', '小教室 B', '小教室 C', '會議室']
    }
  } catch (error) {
    console.error('載入教室列表失敗:', error)
    // 提供預設教室選項
    classrooms.value = ['小教室 A', '小教室 B', '小教室 C', '會議室']
  }
}

// 組件掛載時載入教室
onMounted(() => {
  loadClassrooms()
})
</script>

<style scoped>
.btn {
  @apply px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary {
  @apply text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-blue-500;
}
</style>
