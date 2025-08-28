<template>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="transform opacity-0 scale-95"
    enter-to-class="transform opacity-100 scale-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="transform opacity-100 scale-100"
    leave-to-class="transform opacity-0 scale-95"
  >
    <div v-if="show" class="fixed bottom-4 right-4 z-50">
      <div
        :class="[
          'flex items-center space-x-2 rounded-lg px-6 py-3 shadow-lg',
          typeClasses[type]
        ]"
      >
        <component :is="icons[type]" class="size-5" />
        <span>{{ message }}</span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import {
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'

interface Props {
  show: boolean
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

defineProps<Props>()

const typeClasses = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-500 text-white'
}

const icons = {
  success: CheckIcon,
  error: XMarkIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon
}
</script>
