<template>
  <article class="contact-card">
    <div class="flex items-start justify-between">
      <!-- 聯絡人主要資訊 -->
      <div class="flex-1">
        <ContactHeader
          :name="contact.contact?.full_name"
          :relationship="contact.relationship"
        />
        <ContactDetails :contact="contact" />
      </div>

      <!-- 聯絡人標籤 -->
      <ContactBadges :contact="contact" />
    </div>
  </article>
</template>

<script setup lang="ts">
import ContactHeader from './ContactHeader.vue'
import ContactDetails from './ContactDetails.vue'
import ContactBadges from './ContactBadges.vue'
import type { StudentContact } from '@/types'

// Props 定義
interface Props {
  /** 學生聯絡人資料 */
  contact: StudentContact
}

defineProps<Props>()
</script>

<style scoped>
.contact-card {
  @apply border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow;
}
</style>
