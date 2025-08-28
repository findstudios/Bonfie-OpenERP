<template>
  <div class="student-search-box relative">
    <div class="flex items-center gap-4">
      <MagnifyingGlassIcon class="size-6 shrink-0 text-gray-400" />
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        class="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        @input="handleSearch"
        @focus="showResults = true"
      @blur="handleBlur"
        @keydown="handleKeydown"
      />
    </div>

    <!-- 搜尋結果 -->
    <div
      v-if="showResults && (searchResults.length > 0 || loading)"
      class="absolute z-10 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
    >
      <!-- 載入中 -->
      <div v-if="loading" class="p-4 text-center text-gray-500">
        <div class="inline-flex items-center">
          <svg class="mr-2 size-5 animate-spin text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          搜尋中...
        </div>
      </div>

      <!-- 搜尋結果列表 -->
      <div v-else-if="searchResults.length > 0" class="max-h-80 overflow-y-auto">
        <div
          v-for="(student, index) in searchResults"
          :key="student.student_id"
          class="flex cursor-pointer items-center justify-between p-4 transition-colors duration-150 hover:bg-gray-50"
          :class="{ 'bg-gray-50': selectedIndex === index }"
          @click="selectStudent(student)"
        >
          <div>
            <p class="text-base font-semibold text-gray-900">
              {{ student.chinese_name }}
              <span v-if="student.english_name" class="ml-1 font-normal text-gray-600">({{ student.english_name }})</span>
            </p>
            <p class="mt-0.5 text-sm text-gray-500">{{ student.student_id }}</p>
            <p v-if="showContactInfo && student.matchedPhone" class="mt-1 text-xs text-gray-400">
              聯絡人電話：{{ student.matchedPhone }}
            </p>
          </div>
          <ChevronRightIcon class="size-5 text-gray-400" />
        </div>
      </div>

      <!-- 無結果 -->
      <div v-else class="p-4 text-center text-gray-500">
        找不到符合的學生
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { MagnifyingGlassIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { studentSearchService } from '@/services/studentSearchService'
import { debounce } from '@/utils/debounce'

interface Student {
  student_id: string
  chinese_name: string
  english_name?: string
  matchedPhone?: string
}

interface Props {
  placeholder?: string
  showContactInfo?: boolean
  limit?: number
  autoFocus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '快速搜尋學生（姓名、學號、聯絡人電話）',
  showContactInfo: true,
  limit: 5,
  autoFocus: false
})

const emit = defineEmits<{
  'select': [student: Student]
  'search': [query: string]
}>()

const searchQuery = ref('')
const searchResults = ref<Student[]>([])
const loading = ref(false)
const showResults = ref(false)
const selectedIndex = ref(-1)

// 處理搜尋
const handleSearch = debounce(async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  loading.value = true
  try {
    const results = await studentSearchService.searchStudents(searchQuery.value, props.limit)
    searchResults.value = results
    selectedIndex.value = -1
  } catch (error) {
    console.error('搜尋學生失敗:', error)
    searchResults.value = []
  } finally {
    loading.value = false
  }

  emit('search', searchQuery.value)
}, 300)

// 處理鍵盤事件
function handleKeydown(event: KeyboardEvent) {
  if (!showResults.value || searchResults.value.length === 0) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, searchResults.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedIndex.value >= 0) {
        selectStudent(searchResults.value[selectedIndex.value])
      }
      break
    case 'Escape':
      showResults.value = false
      selectedIndex.value = -1
      break
  }
}

// 選擇學生
function selectStudent(student: Student) {
  emit('select', student)
  searchQuery.value = ''
  searchResults.value = []
  showResults.value = false
  selectedIndex.value = -1
}

// 處理失去焦點
function handleBlur() {
  // 延遲關閉以允許點擊結果
  setTimeout(() => {
    showResults.value = false
  }, 200)
}

// 點擊外部關閉
function handleClickOutside(event: MouseEvent) {
  const target = event.target as Element
  if (!target.closest('.student-search-box')) {
    showResults.value = false
  }
}

// 監聽點擊事件
watch(showResults, (isVisible) => {
  if (isVisible) {
    document.addEventListener('click', handleClickOutside)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})

// 自動獲得焦點
onMounted(() => {
  if (props.autoFocus) {
    const input = document.querySelector('.student-search-box input') as HTMLInputElement
    input?.focus()
  }
})
</script>

<style scoped>
.student-search-box {
  position: relative;
}
</style>
