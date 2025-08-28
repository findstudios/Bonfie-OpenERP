<template>
  <aside class="contact-badges">
    <ContactBadge
      v-if="contact.is_primary"
      type="primary"
      :text="badgeTexts.primary"
    />

    <ContactBadge
      v-if="contact.is_emergency"
      type="emergency"
      :text="badgeTexts.emergency"
    />

    <ContactBadge
      v-if="contact.is_billing"
      type="billing"
      :text="badgeTexts.billing"
    />
  </aside>
</template>

<script setup lang="ts">
import ContactBadge from './ContactBadge.vue'
import type { StudentContact } from '@/types'

// Props 定義
interface Props {
  /** 學生聯絡人資料 */
  contact: StudentContact
}

defineProps<Props>()

// 標籤文字配置
const badgeTexts = {
  primary: '⭐ 主要聯絡人',
  emergency: '🚨 緊急聯絡人',
  billing: '💳 帳務聯絡人'
} as const
</script>

<style scoped>
.contact-badges {
  @apply flex flex-col space-y-2 ml-6;
}
</style>
