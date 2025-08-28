<template>
  <div class="space-y-2">
    <!-- 方案選項 -->
    <div class="grid grid-cols-1 gap-2 md:grid-cols-3">
      <button
        v-for="pkg in packages"
        :key="pkg.package_id"
        @click="selectPackage(pkg)"
        :class="[
          'rounded-lg border p-3 text-left transition-all',
          value === pkg.package_id
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
        ]"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="font-medium text-gray-900">{{ pkg.package_name }}</div>
            <div class="mt-1 text-sm text-gray-600">
              {{ pkg.session_count }}堂 / 有效期{{ pkg.validity_days }}天
            </div>
            <div class="mt-1 text-lg font-bold text-blue-600">
              ${{ formatCurrency(pkg.price) }}
            </div>
          </div>
          <CheckCircleIcon
            v-if="value === pkg.package_id"
            class="size-5 shrink-0 text-blue-600"
          />
        </div>
      </button>
    </div>

    <!-- 無方案提示 -->
    <div v-if="packages.length === 0 && !loading" class="py-4 text-center text-gray-500">
      <p>此課程尚未設定課程方案</p>
      <p class="mt-1 text-sm">請先為課程設定方案或改為單堂計費</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { CheckCircleIcon } from '@heroicons/vue/24/solid'
import { coursePackageService } from '@/services/coursePackageService'
import { formatCurrency } from '@/utils/formatters'
import { supabase } from '@/services/supabase'
import type { CoursePackage } from '@/types'

interface Props {
  courseId: string
  value?: string | null
}

interface Emits {
  (e: 'change', value: CoursePackage | null): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const packages = ref<CoursePackage[]>([])
const loading = ref(false)

// 載入方案資料
async function loadPackages() {
  if (!props.courseId) return

  loading.value = true
  try {
    // 先檢查課程是否允許方案購買
    const { data: course } = await supabase
      .from('courses')
      .select('allow_package_purchase, course_name')
      .eq('course_id', props.courseId)
      .single()

    if (!course?.allow_package_purchase) {
      packages.value = []
      return
    }

    const data = await coursePackageService.getCoursePackages(props.courseId)
    packages.value = data.filter(pkg => pkg.is_active)
      .sort((a, b) => a.sort_order - b.sort_order || a.session_count - b.session_count)
  } catch (error) {
    console.error('載入方案失敗:', error)
    packages.value = []
  } finally {
    loading.value = false
  }
}

// 選擇方案
function selectPackage(pkg: CoursePackage) {
  emit('change', pkg)
}

// 監聽課程ID變化
watch(() => props.courseId, () => {
  loadPackages()
}, { immediate: true })

// 如果有預設值，觸發一次change事件
watch(() => props.value, (newValue) => {
  if (newValue && packages.value.length > 0) {
    const selected = packages.value.find(p => p.package_id === newValue)
    if (selected) {
      emit('change', selected)
    }
  }
}, { immediate: true })
</script>
