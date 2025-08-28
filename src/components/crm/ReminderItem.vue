<template>
  <div
    @click="$emit('click')"
    class="cursor-pointer border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-gray-50"
  >
    <div class="flex items-start space-x-3">
      <div class="shrink-0">
        <div :class="[
          'flex size-8 items-center justify-center rounded-full',
          getReminderClass(reminder)
        ]">
          <component :is="getTypeIcon(reminder.followUp.type)" class="size-4" />
        </div>
      </div>

      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-gray-900">
          {{ reminder.lead?.full_name || '未知客戶' }}
        </p>
        <p class="truncate text-sm text-gray-500">
          {{ reminder.followUp.subject }}
        </p>
        <div class="mt-1 flex items-center space-x-2">
          <span :class="[
            'text-xs font-medium',
            reminder.isOverdue ? 'text-red-600' : 'text-gray-500'
          ]">
            {{ getReminderText(reminder) }}
          </span>
          <span class="text-xs text-gray-400">•</span>
          <span class="text-xs text-gray-500">
            {{ getTypeText(reminder.followUp.type) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  UserGroupIcon,
  EllipsisHorizontalIcon
} from '@heroicons/vue/24/outline'
import { useFollowUpReminder } from '@/composables/useFollowUpReminder'
import type { FollowUpReminder } from '@/composables/useFollowUpReminder'
import type { FollowUpType } from '@/types/crm'

interface Props {
  reminder: FollowUpReminder
}

defineProps<Props>()
defineEmits(['click'])

const { getReminderText, getReminderClass } = useFollowUpReminder()

function getTypeIcon(type: FollowUpType) {
  const icons = {
    phone_call: PhoneIcon,
    message: ChatBubbleLeftRightIcon,
    email: EnvelopeIcon,
    visit: BuildingOfficeIcon,
    trial_class: AcademicCapIcon,
    meeting: UserGroupIcon,
    other: EllipsisHorizontalIcon
  }
  return icons[type] || EllipsisHorizontalIcon
}

function getTypeText(type: FollowUpType) {
  const texts = {
    phone_call: '電話聯絡',
    message: '簡訊/Line',
    email: '電子郵件',
    visit: '到場參觀',
    trial_class: '試聽課程',
    meeting: '面談',
    other: '其他'
  }
  return texts[type] || type
}
</script>
