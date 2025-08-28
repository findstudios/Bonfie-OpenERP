<template>
  <MainLayout>
    <div class="space-y-6">
      <!-- 頁面標題 -->
      <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <div class="flex items-center">
            <router-link
              :to="`/courses/${courseId}/edit`"
              class="mr-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon class="mr-1 size-4" />
              返回課程
            </router-link>
            <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              方案管理
            </h2>
          </div>
          <p class="mt-1 text-sm text-gray-500">
            管理課程方案和優惠設定
          </p>
        </div>
      </div>

      <!-- 方案列表 -->
      <div class="card p-6">
        <div class="mb-6 flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900">課程方案</h3>
          <button
            @click="showForm = true"
            data-testid="add-package-button"
            class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PlusIcon class="mr-2 size-4" />
            新增方案
          </button>
        </div>

        <!-- 新增/編輯表單 -->
        <div v-if="showForm" data-testid="package-form" class="mb-6 rounded-lg border bg-gray-50 p-4">
          <h4 class="text-md mb-4 font-medium text-gray-900">
            {{ editingPackage ? '編輯方案' : '新增方案' }}
          </h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                方案名稱 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.package_name"
                data-testid="package-name-input"
                type="text"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="例：10堂優惠方案"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                堂數 <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="form.session_count"
                data-testid="session-count-input"
                type="number"
                min="1"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="10"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                價格 <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="form.price"
                data-testid="price-input"
                type="number"
                min="0"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="4500"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                有效天數 <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="form.validity_days"
                data-testid="validity-days-input"
                type="number"
                min="1"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="180"
              />
            </div>
          </div>
          <div class="mt-4 flex justify-end space-x-3">
            <button
              @click="cancelForm"
              type="button"
              class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              取消
            </button>
            <button
              @click="savePackage"
              type="button"
              class="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              儲存
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <div
            v-for="pkg in packages"
            :key="pkg.package_id"
            data-testid="package-item"
            class="rounded-lg border p-4 transition-shadow hover:shadow-md"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="text-lg font-medium text-gray-900">{{ pkg.package_name }}</h3>
                <div class="mt-2 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span class="text-gray-500">堂數：</span>
                    <span class="font-medium">{{ pkg.session_count }} 堂</span>
                  </div>
                  <div>
                    <span class="text-gray-500">價格：</span>
                    <span class="font-medium">${{ formatCurrency(pkg.price) }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">有效期：</span>
                    <span class="font-medium">{{ pkg.validity_days }} 天</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <!-- 狀態切換 -->
                <label class="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    :checked="pkg.is_active"
                    @change="togglePackageStatus(pkg)"
                    :data-testid="`status-toggle-${pkg.package_id}`"
                    class="peer sr-only"
                  />
                  <div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rtl:peer-checked:after:-translate-x-full"></div>
                </label>

                <!-- 編輯按鈕 -->
                <button
                  @click="editPackage(pkg)"
                  :data-testid="`edit-button-${pkg.package_id}`"
                  class="rounded-md p-2 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600"
                >
                  <PencilIcon class="size-4" />
                </button>

                <!-- 刪除按鈕 -->
                <button
                  @click="deletePackage(pkg)"
                  :data-testid="`delete-button-${pkg.package_id}`"
                  class="rounded-md p-2 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <TrashIcon class="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import { coursePackageService } from '@/services/coursePackageService'
import { ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'
import type { CoursePackage } from '@/types'

const route = useRoute()
const courseId = ref(route.params.id as string)
const packages = ref<CoursePackage[]>([])
const loading = ref(false)
const showForm = ref(false)
const editingPackage = ref<CoursePackage | null>(null)

const form = reactive({
  package_name: '',
  session_count: 0,
  price: 0,
  validity_days: 180,
  discount_percentage: 0,
  is_active: true,
  display_order: 1
})

// 載入方案列表
async function loadPackages() {
  loading.value = true
  try {
    packages.value = await coursePackageService.getPackagesByCourse(courseId.value)
  } catch (error) {
    console.error('載入方案失敗:', error)
  } finally {
    loading.value = false
  }
}

// 格式化貨幣
function formatCurrency(amount: number): string {
  return amount.toLocaleString('zh-TW')
}

// 取消表單
function cancelForm() {
  showForm.value = false
  editingPackage.value = null
  resetForm()
}

// 重置表單
function resetForm() {
  form.package_name = ''
  form.session_count = 0
  form.price = 0
  form.validity_days = 180
  form.discount_percentage = 0
  form.is_active = true
  form.display_order = packages.value.length + 1
}

// 儲存方案
async function savePackage() {
  try {
    if (editingPackage.value) {
      // 編輯模式
      await coursePackageService.updatePackage(editingPackage.value.package_id, {
        ...form
      })
    } else {
      // 新增模式
      await coursePackageService.createPackage({
        course_id: courseId.value,
        ...form
      })
    }

    await loadPackages()
    cancelForm()
  } catch (error) {
    console.error('儲存方案失敗:', error)
    alert('儲存方案失敗')
  }
}

// 編輯方案
function editPackage(pkg: CoursePackage) {
  editingPackage.value = pkg
  form.package_name = pkg.package_name
  form.session_count = pkg.session_count
  form.price = pkg.price
  form.validity_days = pkg.validity_days
  form.discount_percentage = pkg.discount_percentage || 0
  form.is_active = pkg.is_active
  form.display_order = pkg.display_order
  showForm.value = true
}

// 刪除方案
async function deletePackage(pkg: CoursePackage) {
  if (!confirm(`確定要刪除「${pkg.package_name}」嗎？`)) {
    return
  }

  try {
    await coursePackageService.deletePackage(pkg.package_id)
    await loadPackages()
  } catch (error) {
    console.error('刪除方案失敗:', error)
    alert('刪除方案失敗')
  }
}

// 切換方案狀態
async function togglePackageStatus(pkg: CoursePackage) {
  try {
    await coursePackageService.updatePackage(pkg.package_id, {
      is_active: !pkg.is_active
    })
    await loadPackages()
  } catch (error) {
    console.error('更新方案狀態失敗:', error)
    alert('更新方案狀態失敗')
  }
}

onMounted(() => {
  loadPackages()
})
</script>
