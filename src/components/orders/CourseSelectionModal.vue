<template>
  <TransitionRoot as="template" :show="true">
    <Dialog as="div" class="relative z-50" @close="$emit('close')">
      <TransitionChild
        as="template"
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
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel class="relative overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
              <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <!-- 標題 -->
                <div class="mb-4">
                  <h3 class="text-lg font-medium leading-6 text-gray-900">
                    選擇{{ categoryFilter === 'theme' ? '主題' : '常態' }}課程
                  </h3>
                </div>

                <!-- 搜尋框 -->
                <div class="mb-4">
                  <div class="relative">
                    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <MagnifyingGlassIcon class="size-5 text-gray-400" />
                    </div>
                    <input
                      v-model="searchQuery"
                      type="text"
                      placeholder="搜尋課程名稱..."
                      class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <!-- 課程列表 -->
                <div class="max-h-96 overflow-y-auto">
                  <div v-if="loading" class="py-8 text-center">
                    <div class="mx-auto size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                    <p class="mt-2 text-gray-500">載入中...</p>
                  </div>

                  <div v-else-if="filteredCourses.length === 0" class="py-8 text-center text-gray-500">
                    <AcademicCapIcon class="mx-auto size-12 text-gray-400" />
                    <p class="mt-2">找不到符合的課程</p>
                  </div>

                  <div v-else class="space-y-2">
                    <button
                      v-for="course in filteredCourses"
                      :key="course.course_id"
                      @click="selectCourse(course)"
                      class="group w-full rounded-lg border p-4 text-left transition-colors hover:border-blue-500 hover:bg-blue-50"
                    >
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <h4 class="font-medium text-gray-900 group-hover:text-blue-600">
                            {{ course.course_name }}
                          </h4>
                          <p class="mt-1 text-sm text-gray-600">
                            講師：{{ course.instructor?.full_name || '未指定' }}
                          </p>
                          <div class="mt-2 flex gap-4 text-sm text-gray-500">
                            <span v-if="course.course_category === 'theme'">
                              <CalendarIcon class="mr-1 inline size-4" />
                              {{ course.total_sessions }}堂
                            </span>
                            <span v-else>
                              <ClockIcon class="mr-1 inline size-4" />
                              常態課程
                            </span>
                            <span>
                              <UserGroupIcon class="mr-1 inline size-4" />
                              最多{{ course.max_students }}人
                            </span>
                          </div>
                        </div>
                        <div class="ml-4 text-right">
                          <div v-if="course.course_category === 'theme'" class="text-lg font-bold text-blue-600">
                            ${{ formatCurrency(course.price_per_session * course.total_sessions) }}
                          </div>
                          <div v-else class="text-sm text-gray-600">
                            <span v-if="course.allow_package_purchase">
                              方案購買
                            </span>
                            <span v-else>
                              ${{ formatCurrency(course.price_per_session) }}/堂
                            </span>
                          </div>
                          <div class="mt-1">
                            <span :class="[
                              'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
                              course.status === 'active' ? 'bg-green-100 text-green-800' :
                              course.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            ]">
                              {{ getStatusLabel(course.status) }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <!-- 底部按鈕 -->
              <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  @click="$emit('close')"
                  class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  取消
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
import { ref, computed, onMounted } from 'vue'
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import {
  MagnifyingGlassIcon,
  AcademicCapIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/vue/24/outline'
import { supabase } from '@/services/supabase'
import { formatCurrency } from '@/utils/formatters'
import type { Course } from '@/types'

interface Props {
  categoryFilter?: 'regular' | 'theme'
}

interface Emits {
  (e: 'select', course: Course): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const loading = ref(false)
const courses = ref<Course[]>([])
const searchQuery = ref('')

// 過濾課程
const filteredCourses = computed(() => {
  let filtered = courses.value

  // 按類別過濾
  if (props.categoryFilter) {
    filtered = filtered.filter(c => c.course_category === props.categoryFilter)
  }

  // 按搜尋詞過濾
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(c =>
      c.course_name.toLowerCase().includes(query) ||
      c.instructor?.full_name?.toLowerCase().includes(query)
    )
  }

  return filtered
})

// 載入課程
async function loadCourses() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        instructor:users!instructor_id(user_id, full_name)
      `)
      .in('status', ['active', 'planning'])
      .order('course_name')

    if (error) throw error
    courses.value = data || []
  } catch (error) {
    console.error('載入課程失敗:', error)
  } finally {
    loading.value = false
  }
}

// 選擇課程
function selectCourse(course: Course) {
  emit('select', course)
}

// 取得狀態標籤
function getStatusLabel(status: string): string {
  const statusMap = {
    planning: '規劃中',
    active: '進行中',
    completed: '已結束',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

onMounted(() => {
  loadCourses()
})
</script>
