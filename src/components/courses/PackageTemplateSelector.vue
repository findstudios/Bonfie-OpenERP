<template>
  <div class="space-y-4">
    <!-- 載入中 -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="size-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
    </div>

    <!-- 模板選擇網格 -->
    <div v-else-if="templates.length > 0" class="space-y-3">
      <p class="text-sm text-gray-600">
        選擇要套用的方案模板，系統會根據課程單價自動計算價格
      </p>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <button
          v-for="template in templates"
          :key="template.id"
          @click="toggleTemplate(template)"
          :class="[
            'relative rounded-lg border-2 p-4 text-left transition-all',
            isSelected(template.id)
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          ]"
        >
          <!-- 選中標記 -->
          <CheckCircleIcon
            v-if="isSelected(template.id)"
            class="absolute right-3 top-3 size-5 text-blue-600"
          />

          <!-- 模板內容 -->
          <div class="pr-8">
            <div class="font-medium text-gray-900">{{ template.name }}</div>
            <div class="mt-1 text-sm text-gray-600">{{ template.session_count }} 堂課</div>

            <!-- 折扣標籤 -->
            <div v-if="template.discount_percentage > 0" class="mt-2">
              <span class="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                省 {{ template.discount_percentage }}%
              </span>
            </div>

            <!-- 價格預估 -->
            <div v-if="pricePerSession > 0" class="mt-3 border-t border-gray-200 pt-3">
              <div class="text-xs text-gray-500">預估價格</div>
              <div class="text-lg font-bold text-blue-600">
                NT$ {{ calculatePrice(template).toLocaleString('zh-TW') }}
              </div>
              <div class="text-xs text-gray-500">
                每堂 NT$ {{ calculatePerSessionPrice(template).toLocaleString('zh-TW') }}
              </div>
            </div>

            <!-- 有效期限 -->
            <div class="mt-2 text-xs text-gray-500">
              有效期限 {{ template.validity_days }} 天
            </div>
          </div>
        </button>
      </div>

      <!-- 已選擇的模板摘要 -->
      <div v-if="selectedTemplateIds.length > 0" class="mt-4 rounded-lg bg-blue-50 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-blue-900">
              已選擇 {{ selectedTemplateIds.length }} 個方案模板
            </p>
            <p class="mt-1 text-sm text-blue-700">
              儲存課程後將自動建立這些方案
            </p>
          </div>
          <button
            @click="clearSelection"
            class="text-sm text-blue-600 hover:text-blue-800"
          >
            清除選擇
          </button>
        </div>
      </div>
    </div>

    <!-- 無模板提示 -->
    <div v-else class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-8 text-center">
      <CurrencyDollarIcon class="mx-auto size-12 text-gray-400" />
      <p class="mt-2 text-sm text-gray-600">尚未設定方案模板</p>
      <router-link
        to="/settings/tutoring-center"
        class="mt-3 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
      >
        前往系統設定建立模板
        <ArrowRightIcon class="ml-1 size-4" />
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { CheckCircleIcon, CurrencyDollarIcon, ArrowRightIcon } from '@heroicons/vue/24/solid'
import { supabase } from '@/services/supabase'

interface PackageTemplate {
  id: string
  name: string
  session_count: number
  discount_percentage: number
  validity_days: number
  sort_order: number
  is_active: boolean
}

interface Props {
  modelValue: string[] // 已選擇的模板ID陣列
  pricePerSession?: number // 課程單價，用於計算預估價格
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  pricePerSession: 0
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const templates = ref<PackageTemplate[]>([])
const loading = ref(false)
const selectedTemplateIds = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 載入方案模板
async function loadTemplates() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('tutoring_center_settings')
      .select('setting_value')
      .eq('setting_key', 'package_templates')
      .single()

    if (!error && data?.setting_value) {
      // 只載入啟用的模板，並按排序順序排列
      templates.value = (data.setting_value as PackageTemplate[])
        .filter(t => t.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)
    }
  } catch (error) {
    console.error('載入方案模板失敗:', error)
  } finally {
    loading.value = false
  }
}

// 切換模板選擇狀態
function toggleTemplate(template: PackageTemplate) {
  const index = selectedTemplateIds.value.indexOf(template.id)
  if (index > -1) {
    // 移除
    selectedTemplateIds.value = selectedTemplateIds.value.filter(id => id !== template.id)
  } else {
    // 新增
    selectedTemplateIds.value = [...selectedTemplateIds.value, template.id]
  }
}

// 檢查是否已選擇
function isSelected(templateId: string): boolean {
  return selectedTemplateIds.value.includes(templateId)
}

// 計算模板價格
function calculatePrice(template: PackageTemplate): number {
  const totalPrice = props.pricePerSession * template.session_count
  const discountAmount = totalPrice * (template.discount_percentage / 100)
  return Math.round(totalPrice - discountAmount)
}

// 計算每堂價格
function calculatePerSessionPrice(template: PackageTemplate): number {
  const totalPrice = calculatePrice(template)
  return Math.round(totalPrice / template.session_count)
}

// 清除所有選擇
function clearSelection() {
  selectedTemplateIds.value = []
}

onMounted(() => {
  loadTemplates()
})
</script>
