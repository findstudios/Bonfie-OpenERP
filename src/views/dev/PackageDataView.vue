<template>
  <MainLayout>
    <div class="space-y-6">
      <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Supabase 套餐資料檢視
          </h2>
        </div>
        <div class="mt-4 flex md:ml-4 md:mt-0">
          <button
            @click="loadData"
            :disabled="loading"
            class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <ArrowPathIcon class="mr-2 size-4" :class="{ 'animate-spin': loading }" />
            重新載入
          </button>
        </div>
      </div>

      <!-- 統計資訊 -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div class="card p-6">
          <dt class="text-sm font-medium text-gray-500">總套餐數</dt>
          <dd class="mt-1 text-3xl font-semibold text-gray-900">{{ stats.totalPackages }}</dd>
        </div>
        <div class="card p-6">
          <dt class="text-sm font-medium text-gray-500">有套餐的課程</dt>
          <dd class="mt-1 text-3xl font-semibold text-gray-900">{{ stats.coursesWithPackages }}</dd>
        </div>
        <div class="card p-6">
          <dt class="text-sm font-medium text-gray-500">啟用套餐購買的課程</dt>
          <dd class="mt-1 text-3xl font-semibold text-gray-900">{{ stats.coursesWithPackagePurchase }}</dd>
        </div>
      </div>

      <!-- 課程套餐列表 -->
      <div class="card p-6">
        <h3 class="mb-4 text-lg font-medium text-gray-900">課程套餐詳情</h3>

        <div v-if="loading" class="py-8 text-center">
          <div class="mx-auto size-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p class="mt-4 text-gray-500">載入中...</p>
        </div>

        <div v-else-if="coursesWithPackages.length === 0" class="py-8 text-center text-gray-500">
          目前沒有任何套餐資料
        </div>

        <div v-else class="space-y-8">
          <div v-for="course in coursesWithPackages" :key="course.course_id" class="rounded-lg border p-6">
            <div class="mb-4 flex items-start justify-between">
              <div>
                <h4 class="text-lg font-medium text-gray-900">{{ course.course_name }}</h4>
                <p class="text-sm text-gray-500">課程 ID: {{ course.course_id }}</p>
                <p class="text-sm" :class="course.allow_package_purchase ? 'text-green-600' : 'text-gray-500'">
                  套餐購買: {{ course.allow_package_purchase ? '已啟用' : '未啟用' }}
                </p>
              </div>
              <router-link
                :to="`/courses/${course.course_id}/packages`"
                class="text-sm text-blue-600 hover:text-blue-500"
              >
                管理套餐 →
              </router-link>
            </div>

            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="pkg in course.packages"
                :key="pkg.package_id"
                class="rounded-lg border p-4"
                :class="pkg.is_active ? 'border-gray-300' : 'border-gray-200 bg-gray-50 opacity-60'"
              >
                <div class="mb-2 flex items-start justify-between">
                  <h5 class="font-medium text-gray-900">{{ pkg.package_name }}</h5>
                  <span
                    class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
                    :class="pkg.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                  >
                    {{ pkg.is_active ? '啟用' : '停用' }}
                  </span>
                </div>
                <dl class="space-y-1 text-sm">
                  <div>
                    <dt class="inline text-gray-500">堂數:</dt>
                    <dd class="ml-1 inline font-medium">{{ pkg.session_count }} 堂</dd>
                  </div>
                  <div>
                    <dt class="inline text-gray-500">價格:</dt>
                    <dd class="ml-1 inline font-medium">${{ pkg.price.toLocaleString() }}</dd>
                  </div>
                  <div>
                    <dt class="inline text-gray-500">折扣:</dt>
                    <dd class="ml-1 inline font-medium">{{ pkg.discount_percentage || 0 }}%</dd>
                  </div>
                  <div>
                    <dt class="inline text-gray-500">有效期:</dt>
                    <dd class="ml-1 inline font-medium">{{ pkg.validity_days }} 天</dd>
                  </div>
                  <div class="mt-2 text-xs text-gray-400">
                    ID: {{ pkg.package_id }}
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 使用套餐的訂單 -->
      <div class="card p-6">
        <h3 class="mb-4 text-lg font-medium text-gray-900">最近使用套餐的訂單</h3>

        <div v-if="recentPackageOrders.length === 0" class="py-8 text-center text-gray-500">
          目前沒有使用套餐的訂單
        </div>

        <div v-else class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table class="min-w-full divide-y divide-gray-300">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  訂單 ID
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  套餐 ID
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  項目名稱
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  價格
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="order in recentPackageOrders" :key="`${order.order_id}-${order.package_id}`">
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {{ order.order_id }}
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {{ order.package_id }}
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {{ order.item_name }}
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  ${{ order.final_price.toLocaleString() }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import MainLayout from '@/components/layout/MainLayout.vue'
import { supabase } from '@/services/supabase'

interface PackageData {
  package_id: string
  course_id: string
  package_name: string
  session_count: number
  price: number
  discount_percentage: number
  validity_days: number
  is_active: boolean
  sort_order: number
  created_at: string
}

interface CourseWithPackages {
  course_id: string
  course_name: string
  allow_package_purchase: boolean
  packages: PackageData[]
}

const loading = ref(false)
const coursesWithPackages = ref<CourseWithPackages[]>([])
const recentPackageOrders = ref<any[]>([])
const stats = ref({
  totalPackages: 0,
  coursesWithPackages: 0,
  coursesWithPackagePurchase: 0
})

async function loadData() {
  loading.value = true
  try {
    // 1. 載入所有套餐
    const { data: packages, error: packagesError } = await supabase
      .from('course_packages')
      .select('*')
      .order('course_id')
      .order('sort_order')

    if (packagesError) throw packagesError

    // 2. 載入所有課程
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('course_id, course_name, allow_package_purchase')

    if (coursesError) throw coursesError

    // 3. 組合資料
    const courseMap = new Map<string, CourseWithPackages>()

    // 先建立課程映射
    courses?.forEach(course => {
      courseMap.set(course.course_id, {
        ...course,
        packages: []
      })
    })

    // 將套餐分配到對應課程
    packages?.forEach(pkg => {
      const course = courseMap.get(pkg.course_id)
      if (course) {
        course.packages.push(pkg)
      }
    })

    // 轉換為陣列並過濾出有套餐的課程
    coursesWithPackages.value = Array.from(courseMap.values())
      .filter(course => course.packages.length > 0)
      .sort((a, b) => b.packages.length - a.packages.length)

    // 4. 載入最近使用套餐的訂單
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('*')
      .not('package_id', 'is', null)
      .order('id', { ascending: false })
      .limit(10)

    if (!orderItemsError && orderItems) {
      recentPackageOrders.value = orderItems
    }

    // 5. 更新統計
    stats.value = {
      totalPackages: packages?.length || 0,
      coursesWithPackages: coursesWithPackages.value.length,
      coursesWithPackagePurchase: courses?.filter(c => c.allow_package_purchase).length || 0
    }

  } catch (error) {
    console.error('載入資料失敗:', error)
    alert('載入資料失敗，請查看控制台')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
