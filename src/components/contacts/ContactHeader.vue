<template>
  <header class="contact-header">
    <h4 class="contact-name">{{ name }}</h4>
    <span class="contact-relationship">({{ relationship }})</span>
  </header>
</template>

<script setup lang="ts">
// Props 定義
interface Props {
  /** 聯絡人姓名 */
  name?: string
  /** 關係 */
  relationship: string
}

defineProps<Props>()
</script>

<style scoped>
.contact-header {
  @apply flex items-center;
}

.contact-name {
  @apply text-base font-medium text-gray-900;
}

.contact-relationship {
  @apply ml-2 text-sm text-gray-500;
}
</style>
