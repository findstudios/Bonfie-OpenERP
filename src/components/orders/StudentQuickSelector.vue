<template>
  <div class="relative">
    <!-- 已選擇的學生顯示 -->
    <div v-if="selectedStudent" class="mb-4 flex items-center justify-between rounded-lg bg-blue-50 p-3">
      <div>
        <div class="font-medium text-gray-900">{{ selectedStudent.chinese_name }}</div>
        <div class="text-sm text-gray-600">學號: {{ selectedStudent.student_id }}</div>
      </div>
      <button
        @click="clearSelection"
        class="text-sm text-blue-600 hover:text-blue-800"
      >
        更換學生
      </button>
    </div>

    <!-- 搜尋輸入框 -->
    <div v-else>
      <div class="relative">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon class="size-5 text-gray-400" />
        </div>
        <input
          v-model="searchQuery"
          @input="onSearchInput"
          @focus="showSuggestions = true"
          @blur="hideSuggestions"
          placeholder="輸入學生姓名或學號..."
          class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          autocomplete="off"
        />
      </div>

      <!-- 建議下拉清單 -->
      <div
        v-if="showSuggestions && (filteredStudents.length > 0 || searchQuery)"
        class="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg"
      >
        <div
          v-for="student in filteredStudents"
          :key="student.student_id"
          @mousedown="selectStudent(student)"
          class="cursor-pointer border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-blue-50"
        >
          <div class="flex items-start justify-between">
            <div>
              <div class="font-medium text-gray-900">{{ student.chinese_name }}</div>
              <div class="text-sm text-gray-500">
                學號: {{ student.student_id }}
                <span v-if="student.english_name" class="ml-2">{{ student.english_name }}</span>
              </div>
            </div>
            <div v-if="student.active_enrollments" class="text-xs text-green-600">
              {{ student.active_enrollments }}個有效課程
            </div>
          </div>
        </div>

        <!-- 無搜尋結果 -->
        <div
          v-if="searchQuery && filteredStudents.length === 0"
          class="px-4 py-3 text-center text-gray-500"
        >
          找不到符合的學生
        </div>
      </div>

      <!-- 最近學生快選 -->
      <div v-if="!searchQuery && recentStudents.length > 0" class="mt-3">
        <p class="mb-2 text-sm text-gray-600">最近選擇：</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="student in recentStudents"
            :key="student.student_id"
            @click="selectStudent(student)"
            class="rounded-full bg-gray-100 px-3 py-1 text-sm transition-colors hover:bg-gray-200"
          >
            {{ student.chinese_name }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { supabase } from '@/services/supabase'
import type { Student } from '@/types'

interface Props {
  modelValue?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const searchQuery = ref('')
const showSuggestions = ref(false)
const students = ref<Student[]>([])
const selectedStudent = ref<Student | null>(null)
const recentStudents = ref<Student[]>([])

// 過濾學生列表
const filteredStudents = computed(() => {
  if (!searchQuery.value) {
    return students.value.slice(0, 10)
  }

  const query = searchQuery.value.toLowerCase()
  return students.value.filter(student =>
    student.chinese_name.toLowerCase().includes(query) ||
    student.english_name?.toLowerCase().includes(query) ||
    student.student_id.toLowerCase().includes(query)
  ).slice(0, 10)
})

// 載入學生資料
async function loadStudents() {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('is_active', true)
      .order('chinese_name')

    if (error) throw error

    console.log('載入的學生資料:', data)

    // 直接使用學生資料，暫時不計算有效課程數
    students.value = data || []

    console.log('處理後的學生資料:', students.value)
  } catch (error) {
    console.error('載入學生資料失敗:', error)
  }
}

// 載入最近選擇的學生
function loadRecentStudents() {
  const recent = localStorage.getItem('recentStudents')
  if (recent) {
    const recentIds = JSON.parse(recent)
    recentStudents.value = students.value
      .filter(s => recentIds.includes(s.student_id))
      .slice(0, 5)
  }
}

// 儲存最近選擇的學生
function saveRecentStudent(studentId: string) {
  const recent = localStorage.getItem('recentStudents')
  let recentIds = recent ? JSON.parse(recent) : []

  // 移除重複的，並加到最前面
  recentIds = [studentId, ...recentIds.filter((id: string) => id !== studentId)].slice(0, 10)

  localStorage.setItem('recentStudents', JSON.stringify(recentIds))
}

// 搜尋輸入事件
function onSearchInput() {
  console.log('搜尋輸入:', searchQuery.value)
  console.log('目前學生數量:', students.value.length)
  showSuggestions.value = true
}

// 選擇學生
function selectStudent(student: Student) {
  selectedStudent.value = student
  searchQuery.value = ''
  showSuggestions.value = false
  emit('update:modelValue', student.student_id)
  emit('change', student.student_id)
  saveRecentStudent(student.student_id)
}

// 清除選擇
function clearSelection() {
  selectedStudent.value = null
  emit('update:modelValue', '')
  emit('change', '')
  loadRecentStudents()
}

// 隱藏建議列表
function hideSuggestions() {
  setTimeout(() => {
    showSuggestions.value = false
  }, 150)
}

onMounted(async () => {
  await loadStudents()
  loadRecentStudents()

  // 如果有預設值，載入對應的學生
  if (props.modelValue) {
    const student = students.value.find(s => s.student_id === props.modelValue)
    if (student) {
      selectedStudent.value = student
    }
  }
})
</script>
