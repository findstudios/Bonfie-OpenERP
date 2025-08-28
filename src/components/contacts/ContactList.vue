<template>
  <div class="contact-list">
    <!-- 聯絡人列表 -->
    <div v-if="hasContacts" class="space-y-6">
      <ContactCard
        v-for="contact in contacts"
        :key="contact.id"
        :contact="contact"
      />
    </div>

    <!-- 空狀態 -->
    <ContactEmptyState
      v-else
      :message="emptyMessage"
      :show-hint="showAddHint"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ContactCard from './ContactCard.vue'
import ContactEmptyState from './ContactEmptyState.vue'
import type { StudentContact } from '@/types'

// Props 介面定義
interface Props {
  /** 聯絡人列表 */
  contacts?: StudentContact[]
  /** 空狀態顯示訊息 */
  emptyMessage?: string
  /** 是否顯示新增提示 */
  showAddHint?: boolean
}

// Props 預設值
const props = withDefaults(defineProps<Props>(), {
  contacts: () => [],
  emptyMessage: '暫無聯絡人資料',
  showAddHint: true
})

// 計算屬性
const hasContacts = computed(() =>
  props.contacts && props.contacts.length > 0
)
</script>

