<template>
  <div class="mt-8 border-t border-gray-200 pt-6">
    <div class="flex justify-end space-x-3">
      <button
        @click="$emit('reset')"
        class="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
      >
        重置
      </button>
      <button
        @click="$emit('save')"
        class="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        :disabled="saving"
      >
        {{ saving ? '儲存中...' : '儲存設定' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  saving: boolean
}

defineProps<Props>()

defineEmits<{
  save: []
  reset: []
}>()
</script>
