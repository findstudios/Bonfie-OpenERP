<template>
  <div class="space-y-6">
    <!-- 標題和說明 -->
    <div>
      <h3 class="text-lg font-semibold text-gray-900">課程方案設定</h3>
      <p class="mt-1 text-sm text-gray-600">
        設定常態課程的標準方案模板，開設新課程時可直接套用這些預設方案
      </p>
    </div>

    <!-- 方案說明 -->
    <div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div class="flex">
        <InformationCircleIcon class="mt-0.5 size-5 text-blue-400" />
        <div class="ml-3">
          <h4 class="text-sm font-medium text-blue-800">使用說明</h4>
          <div class="mt-2 text-sm text-blue-700">
            <ul class="list-inside list-disc space-y-1">
              <li>這裡設定的是全域方案模板，適用於所有常態課程</li>
              <li>建立新課程時，可以選擇套用這些預設方案</li>
              <li>方案包含堂數、建議折扣和有效期限等資訊</li>
              <li>實際價格會根據課程的單堂價格自動計算</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 方案模板列表 -->
    <div class="space-y-4">
      <!-- 操作按鈕 -->
      <div class="flex items-center justify-between">
        <h4 class="text-base font-medium text-gray-900">方案模板列表</h4>
        <div class="flex gap-2">
          <button
            @click="resetToDefaultTemplates"
            class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowPathIcon class="mr-2 size-4" />
            重置為預設
          </button>
          <button
            @click="showPackageForm = true; editingPackage = null"
            class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <PlusIcon class="mr-2 size-4" />
            新增方案
          </button>
        </div>
      </div>

      <!-- 套餐卡片列表 -->
      <div v-if="loading" class="py-8 text-center">
        <div class="inline-flex items-center text-gray-500">
          <ArrowPathIcon class="mr-2 size-5 animate-spin" />
          載入中...
        </div>
      </div>

      <div v-else-if="packageTemplates.length === 0" class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-8 text-center">
        <AcademicCapIcon class="mx-auto mb-4 size-12 text-gray-400" />
        <p class="text-gray-600">尚未設定任何方案模板</p>
        <button
          @click="resetToDefaultTemplates"
          class="mt-4 inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          建立預設模板
        </button>
      </div>

      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="(template, index) in packageTemplates"
          :key="template.id || index"
          :class="[
            'relative rounded-lg border-2 bg-white p-6 transition-shadow hover:shadow-lg',
            template.is_active ? 'border-gray-200' : 'border-gray-100 bg-gray-50 opacity-60'
          ]"
        >
          <!-- 停用標記 -->
          <div v-if="!template.is_active" class="absolute right-2 top-2">
            <span class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
              已停用
            </span>
          </div>

          <!-- 方案內容 -->
          <div class="space-y-4">
            <div>
              <h5 class="text-lg font-semibold text-gray-900">{{ template.name }}</h5>
              <p class="mt-1 text-sm text-gray-600">{{ template.session_count }} 堂課</p>
            </div>

            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">建議折扣</span>
                <span class="font-medium text-green-600">{{ template.discount_percentage }}% OFF</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">有效期限</span>
                <span class="font-medium">{{ template.validity_days }} 天</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">排序順序</span>
                <span class="font-medium">{{ template.sort_order }}</span>
              </div>
            </div>

            <!-- 操作按鈕 -->
            <div class="flex gap-2 pt-2">
              <button
                @click="editTemplate(template)"
                class="flex-1 rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
              >
                編輯
              </button>
              <button
                v-if="template.is_active"
                @click="toggleTemplateStatus(template)"
                class="flex-1 rounded-md bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                停用
              </button>
              <button
                v-else
                @click="toggleTemplateStatus(template)"
                class="flex-1 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-100"
              >
                啟用
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/編輯方案彈窗 -->
    <TransitionRoot :show="showPackageForm" as="template">
      <Dialog @close="showPackageForm = false" class="relative z-50">
        <TransitionChild
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
              enter="ease-out duration-300"
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel class="relative overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <form @submit.prevent="savePackage">
                  <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <h3 class="mb-4 text-lg font-semibold text-gray-900">
                      {{ editingTemplate ? '編輯方案模板' : '新增方案模板' }}
                    </h3>

                    <div class="space-y-4">
                      <!-- 模板名稱 -->
                      <div>
                        <label class="mb-1 block text-sm font-medium text-gray-700">
                          模板名稱 <span class="text-red-500">*</span>
                        </label>
                        <input
                          v-model="formData.name"
                          type="text"
                          required
                          placeholder="例如：基礎方案、優惠方案"
                          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <!-- 堂數 -->
                      <div>
                        <label class="mb-1 block text-sm font-medium text-gray-700">
                          堂數 <span class="text-red-500">*</span>
                        </label>
                        <input
                          v-model.number="formData.session_count"
                          type="number"
                          min="1"
                          required
                          placeholder="10"
                          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <!-- 折扣設定 -->
                      <div>
                        <label class="mb-1 block text-sm font-medium text-gray-700">
                          建議折扣百分比 (%)
                        </label>
                        <input
                          v-model.number="formData.discount_percentage"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="10"
                          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p class="mt-1 text-xs text-gray-500">開課時可以參考此折扣設定</p>
                      </div>

                      <!-- 有效天數 -->
                      <div>
                        <label class="mb-1 block text-sm font-medium text-gray-700">
                          有效天數 <span class="text-red-500">*</span>
                        </label>
                        <input
                          v-model.number="formData.validity_days"
                          type="number"
                          min="1"
                          required
                          placeholder="180"
                          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p class="mt-1 text-xs text-gray-500">學生購買後可使用的天數</p>
                      </div>

                      <!-- 排序順序 -->
                      <div>
                        <label class="mb-1 block text-sm font-medium text-gray-700">
                          顯示順序
                        </label>
                        <input
                          v-model.number="formData.sort_order"
                          type="number"
                          min="0"
                          placeholder="0"
                          class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p class="mt-1 text-xs text-gray-500">數字越小顯示越前面</p>
                      </div>
                    </div>
                  </div>

                  <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="submit"
                      :disabled="saving"
                      class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 sm:ml-3 sm:w-auto"
                    >
                      {{ saving ? '儲存中...' : '儲存' }}
                    </button>
                    <button
                      type="button"
                      @click="showPackageForm = false"
                      class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    >
                      取消
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { PlusIcon, ArrowPathIcon, AcademicCapIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import { supabase } from '@/services/supabase'
import { formatCurrency } from '@/utils/formatters'

// 全域方案模板類型
interface PackageTemplate {
  id?: string
  name: string
  session_count: number
  discount_percentage: number
  validity_days: number
  sort_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

// 狀態
const packageTemplates = ref<PackageTemplate[]>([])
const loading = ref(false)
const saving = ref(false)
const showPackageForm = ref(false)
const editingTemplate = ref<PackageTemplate | null>(null)

// 表單資料
const formData = ref<Partial<PackageTemplate>>({
  name: '',
  session_count: 10,
  discount_percentage: 0,
  validity_days: 180,
  sort_order: 0,
  is_active: true
})

// 預設方案模板
const DEFAULT_TEMPLATES: Omit<PackageTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  { name: '體驗方案', session_count: 1, discount_percentage: 0, validity_days: 30, sort_order: 0, is_active: true },
  { name: '基礎方案', session_count: 10, discount_percentage: 5, validity_days: 90, sort_order: 1, is_active: true },
  { name: '標準方案', session_count: 20, discount_percentage: 10, validity_days: 180, sort_order: 2, is_active: true },
  { name: '優惠方案', session_count: 40, discount_percentage: 15, validity_days: 365, sort_order: 3, is_active: true }
]

// 方法
const loadPackageTemplates = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('tutoring_center_settings')
      .select('setting_value')
      .eq('setting_key', 'package_templates')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('載入方案模板失敗:', error)
    }

    if (data?.setting_value) {
      packageTemplates.value = data.setting_value as PackageTemplate[]
    } else {
      // 如果沒有設定，使用預設模板
      await resetToDefaultTemplates()
    }
  } catch (error) {
    console.error('載入方案模板失敗:', error)
  } finally {
    loading.value = false
  }
}

const resetToDefaultTemplates = async () => {
  if (packageTemplates.value.length > 0 &&
      !confirm('確定要重置為預設方案模板嗎？這將會覆蓋現有的所有設定。')) {
    return
  }

  loading.value = true
  try {
    const templates: PackageTemplate[] = DEFAULT_TEMPLATES.map((template, index) => ({
      ...template,
      id: `template_${Date.now()}_${index}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    await savePackageTemplates(templates)
    packageTemplates.value = templates
  } catch (error) {
    console.error('重置方案模板失敗:', error)
    alert('重置失敗，請稍後再試')
  } finally {
    loading.value = false
  }
}

const savePackageTemplates = async (templates: PackageTemplate[]) => {
  const { data: existing } = await supabase
    .from('tutoring_center_settings')
    .select('id')
    .eq('setting_key', 'package_templates')
    .single()

  const query = existing
    ? supabase
      .from('tutoring_center_settings')
      .update({
        setting_value: templates,
        description: '課程方案模板設定',
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', 'package_templates')
    : supabase
      .from('tutoring_center_settings')
      .insert({
        setting_key: 'package_templates',
        setting_value: templates,
        description: '課程方案模板設定',
        updated_at: new Date().toISOString()
      })

  const { error } = await query
  if (error) throw error
}

const editTemplate = (template: PackageTemplate) => {
  editingTemplate.value = template
  formData.value = { ...template }
  showPackageForm.value = true
}

const savePackage = async () => {
  saving.value = true
  try {
    let updatedTemplates: PackageTemplate[]

    if (editingTemplate.value) {
      // 更新現有模板
      updatedTemplates = packageTemplates.value.map(t =>
        t.id === editingTemplate.value!.id ? { ...formData.value, id: t.id } as PackageTemplate : t
      )
    } else {
      // 新增模板
      const newTemplate: PackageTemplate = {
        ...formData.value,
        id: `template_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as PackageTemplate
      updatedTemplates = [...packageTemplates.value, newTemplate]
    }

    await savePackageTemplates(updatedTemplates)
    packageTemplates.value = updatedTemplates
    showPackageForm.value = false
  } catch (error) {
    console.error('儲存模板失敗:', error)
    alert('儲存失敗，請稍後再試')
  } finally {
    saving.value = false
  }
}

const toggleTemplateStatus = async (template: PackageTemplate) => {
  const action = template.is_active ? '停用' : '啟用'
  if (!confirm(`確定要${action}「${template.name}」嗎？`)) return

  try {
    const updatedTemplates = packageTemplates.value.map(t =>
      t.id === template.id ? { ...t, is_active: !t.is_active } : t
    )
    await savePackageTemplates(updatedTemplates)
    packageTemplates.value = updatedTemplates
  } catch (error) {
    console.error(`${action}模板失敗:`, error)
    alert(`${action}失敗，請稍後再試`)
  }
}


// 重置表單
watch(showPackageForm, (newVal) => {
  if (!newVal) {
    formData.value = {
      name: '',
      session_count: 10,
      discount_percentage: 0,
      validity_days: 180,
      sort_order: 0,
      is_active: true
    }
    editingTemplate.value = null
  }
})

// 初始化
onMounted(() => {
  loadPackageTemplates()
})
</script>
