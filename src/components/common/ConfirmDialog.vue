<template>
  <TransitionRoot appear :show="modelValue" as="template">
    <Dialog as="div" class="relative z-10" @close="$emit('update:modelValue', false)">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-25" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <!-- 標題區域 -->
              <div v-if="message" class="flex items-center">
                <div
                  :class="[
                    'flex size-12 shrink-0 items-center justify-center rounded-full',
                    type === 'danger' ? 'bg-red-100' :
                    type === 'warning' ? 'bg-yellow-100' :
                    type === 'success' ? 'bg-green-100' :
                    'bg-blue-100'
                  ]"
                >
                  <ExclamationTriangleIcon
                    v-if="type === 'danger' || type === 'warning'"
                    :class="[
                      'size-6',
                      type === 'danger' ? 'text-red-600' : 'text-yellow-600'
                    ]"
                  />
                  <CheckCircleIcon
                    v-else-if="type === 'success'"
                    class="size-6 text-green-600"
                  />
                  <InformationCircleIcon
                    v-else
                    class="size-6 text-blue-600"
                  />
                </div>
                <div class="ml-4">
                  <DialogTitle
                    as="h3"
                    class="text-lg font-medium leading-6 text-gray-900"
                  >
                    {{ title }}
                  </DialogTitle>
                  <div class="mt-2">
                    <p class="text-sm text-gray-500">
                      {{ message }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- 僅標題模式 -->
              <div v-else class="mb-4">
                <DialogTitle
                  as="h3"
                  class="text-lg font-medium leading-6 text-gray-900"
                >
                  {{ title }}
                </DialogTitle>
              </div>

              <!-- 插槽內容 -->
              <div class="mt-4">
                <slot />
              </div>

              <!-- 按鈕區域 -->
              <div v-if="showCancel || showConfirm" class="mt-6 flex justify-end space-x-3">
                <button
                  v-if="showCancel"
                  type="button"
                  @click="$emit('update:modelValue', false); $emit('cancel')"
                  class="btn btn-secondary"
                >
                  {{ cancelText }}
                </button>
                <button
                  v-if="showConfirm"
                  type="button"
                  @click="$emit('confirm')"
                  :class="[
                    'btn',
                    type === 'danger' ? 'btn-danger' :
                    type === 'warning' ? 'btn-warning' :
                    type === 'success' ? 'btn-success' :
                    'btn-primary'
                  ]"
                >
                  {{ confirmText }}
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
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionRoot,
  TransitionChild,
} from '@headlessui/vue'
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'

// 定義 props
interface Props {
  modelValue: boolean
  title: string
  message?: string
  type?: 'info' | 'success' | 'warning' | 'danger'
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  showConfirm?: boolean
}

withDefaults(defineProps<Props>(), {
  type: 'info',
  confirmText: '確認',
  cancelText: '取消',
  showCancel: true,
  showConfirm: true,
  message: ''
})

// 定義事件
defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()
</script>

<style scoped>
/* 確認對話框特定樣式 */
.btn-warning {
  @apply bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500;
}

.btn-success {
  @apply bg-green-600 hover:bg-green-700 text-white focus:ring-green-500;
}
</style>
