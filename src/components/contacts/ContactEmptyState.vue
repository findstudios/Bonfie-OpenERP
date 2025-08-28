<template>
  <div class="empty-state">
    <UserGroupIcon class="empty-icon" />
    <p class="empty-message">{{ message }}</p>
    <p v-if="showHint" class="empty-hint">
      點擊「編輯」按鈕新增聯絡人資訊
    </p>
  </div>
</template>

<script setup lang="ts">
import { UserGroupIcon } from '@heroicons/vue/24/outline'

// Props 定義
interface Props {
  /** 空狀態訊息 */
  message: string
  /** 是否顯示提示 */
  showHint: boolean
}

defineProps<Props>()
</script>

<style scoped>
.empty-state {
  @apply text-center py-8 text-gray-500;
}

.empty-icon {
  @apply mx-auto h-12 w-12 text-gray-400;
}

.empty-message {
  @apply mt-2;
}

.empty-hint {
  @apply text-sm mt-1;
}
</style>
