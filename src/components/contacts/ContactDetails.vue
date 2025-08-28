<template>
  <div class="contact-details">
    <table class="contact-info-table">
      <tbody>
        <!-- 電話 -->
        <ContactInfoRow
          v-if="contact.contact?.phone"
          :icon="PhoneIcon"
          :href="`tel:${contact.contact.phone}`"
          :text="contact.contact.phone"
          align="middle"
        />

        <!-- 電子郵件 -->
        <ContactInfoRow
          v-if="contact.contact?.email"
          :icon="EnvelopeIcon"
          :href="`mailto:${contact.contact.email}`"
          :text="contact.contact.email"
          align="middle"
        />

        <!-- 地址 -->
        <ContactInfoRow
          v-if="contact.contact?.address"
          :icon="MapPinIcon"
          :text="contact.contact.address"
          align="top"
        />

        <!-- 備註 -->
        <ContactInfoRow
          v-if="contact.notes"
          :icon="DocumentTextIcon"
          :text="contact.notes"
          align="top"
          preserve-whitespace
        />
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import {
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  DocumentTextIcon
} from '@heroicons/vue/24/outline'
import ContactInfoRow from './ContactInfoRow.vue'
import type { StudentContact } from '@/types'

// Props 定義
interface Props {
  /** 學生聯絡人資料 */
  contact: StudentContact
}

defineProps<Props>()
</script>

<style scoped>
.contact-details {
  @apply mt-3;
}

.contact-info-table {
  @apply w-full;
}
</style>
