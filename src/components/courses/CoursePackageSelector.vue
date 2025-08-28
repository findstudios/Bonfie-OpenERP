<template>
  <div class="package-selector">
    <h3 class="mb-4 text-lg font-semibold">選擇課程方案</h3>

    <div v-if="loading" class="py-8 text-center">
      <div class="inline-flex items-center">
        <svg class="mr-3 size-5 animate-spin" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        載入中...
      </div>
    </div>

    <div v-else-if="packages.length === 0" class="py-8 text-center text-gray-500">
      此課程暫無課程方案
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="pkg in packages"
        :key="pkg.package_id"
        :class="[
          'cursor-pointer rounded-lg border p-4 transition-all',
          selectedPackageId === pkg.package_id
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        ]"
        @click="selectPackage(pkg)"
      >
        <div class="mb-3 flex items-start justify-between">
          <h4 class="text-lg font-medium">{{ pkg.package_name }}</h4>
          <span
            v-if="pkg.discount_percentage > 0"
            class="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800"
          >
            省 {{ pkg.discount_percentage }}%
          </span>
        </div>

        <div class="space-y-2 text-sm text-gray-600">
          <p>堂數：{{ pkg.session_count }} 堂</p>
          <p>有效期：{{ pkg.validity_days }} 天</p>
        </div>

        <div class="mt-3 border-t pt-3">
          <div class="flex items-end justify-between">
            <div>
              <p class="text-xs text-gray-500">方案價格</p>
              <p class="text-xl font-bold text-gray-900">
                NT$ {{ pkg.price.toLocaleString() }}
              </p>
            </div>
            <p class="text-xs text-gray-500">
              每堂 NT$ {{ Math.round(pkg.price / pkg.session_count) }}
            </p>
          </div>
        </div>

        <div
          v-if="selectedPackageId === pkg.package_id"
          class="mt-3 flex justify-center"
        >
          <svg class="size-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
    </div>

    <div v-if="selectedPackage" class="mt-6 rounded-lg bg-gray-50 p-4">
      <h4 class="mb-2 font-medium">已選擇方案</h4>
      <p class="text-sm text-gray-600">
        {{ selectedPackage.package_name }} - {{ selectedPackage.session_count }} 堂
      </p>
      <p class="mt-1 text-lg font-bold">
        總價：NT$ {{ selectedPackage.price.toLocaleString() }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { CoursePackage } from '@/types'
import { coursePackageService } from '@/services/coursePackageService'

const props = defineProps<{
  courseId: string
  modelValue?: CoursePackage | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CoursePackage | null]
  'change': [value: CoursePackage | null]
}>()

const packages = ref<CoursePackage[]>([])
const loading = ref(false)
const selectedPackageId = ref<string | null>(null)

const selectedPackage = computed(() => {
  return packages.value.find(pkg => pkg.package_id === selectedPackageId.value) || null
})

const loadPackages = async () => {
  if (!props.courseId) return

  loading.value = true
  try {
    packages.value = await coursePackageService.getPackagesByCourse(props.courseId)
  } catch (error) {
    console.error('Failed to load packages:', error)
  } finally {
    loading.value = false
  }
}

const selectPackage = (pkg: CoursePackage) => {
  selectedPackageId.value = pkg.package_id
  emit('update:modelValue', pkg)
  emit('change', pkg)
}

watch(() => props.courseId, () => {
  loadPackages()
}, { immediate: true })

watch(() => props.modelValue, (newValue) => {
  selectedPackageId.value = newValue?.package_id || null
})
</script>

<style scoped>
.package-selector {
  @apply w-full;
}
</style>
