<template>
  <div class="relative">
    <!-- 提醒圖標按鈕 -->
    <button
      @click="showDropdown = !showDropdown"
      class="relative rounded-md p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      <BellIcon class="size-6" />

      <!-- 提醒數量標記 -->
      <span
        v-if="totalCount > 0"
        data-testid="reminder-badge"
        :class="[
          'absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full text-xs font-medium text-white',
          urgentCount > 0 ? 'bg-red-500' : 'bg-blue-500'
        ]"
      >
        {{ totalCount }}
      </span>
    </button>

    <!-- 下拉選單 -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="showDropdown"
        v-click-outside="closeDropdown"
        data-testid="reminder-dropdown"
        class="absolute right-0 z-50 mt-2 w-96 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
      >
        <div class="py-1">
          <!-- 標題 -->
          <div class="border-b border-gray-200 px-4 py-2">
            <h3 class="text-sm font-medium text-gray-900">跟進提醒</h3>
            <p class="mt-1 text-xs text-gray-500">
              {{ reminders.overdue.length }} 個逾期，{{ reminders.today.length }} 個今日到期
            </p>
          </div>

          <!-- 載入狀態 -->
          <div v-if="loading" class="px-4 py-8 text-center">
            <div class="inline-flex items-center">
              <svg class="-ml-1 mr-3 size-5 animate-spin text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              載入中...
            </div>
          </div>

          <!-- 提醒列表 -->
          <div v-else-if="totalCount > 0" class="max-h-96 overflow-y-auto">
            <!-- 逾期提醒 -->
            <div v-if="reminders.overdue.length > 0">
              <div class="bg-red-50 px-4 py-2 text-xs font-medium text-red-800">
                <ExclamationCircleIcon class="mr-1 inline-block size-4" />
                逾期
              </div>
              <div
                v-for="followUp in reminders.overdue"
                :key="followUp.follow_up_id"
                :data-testid="`reminder-item-${followUp.follow_up_id}`"
                @click="handleReminderClick(followUp)"
                class="cursor-pointer border-b border-gray-100 px-4 py-3 hover:bg-gray-50"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">{{ followUp.subject }}</p>
                    <p class="mt-1 text-xs text-gray-500">
                      {{ (followUp as any).leads?.full_name || '未知客戶' }}
                      <span v-if="followUp.next_follow_up" class="ml-2">
                        {{ formatDate(followUp.next_follow_up) }}
                      </span>
                    </p>
                  </div>
                  <ChevronRightIcon class="ml-2 size-4 shrink-0 text-gray-400" />
                </div>
              </div>
            </div>

            <!-- 今日提醒 -->
            <div v-if="reminders.today.length > 0">
              <div class="bg-yellow-50 px-4 py-2 text-xs font-medium text-yellow-800">
                <CalendarIcon class="mr-1 inline-block size-4" />
                今日
              </div>
              <div
                v-for="followUp in reminders.today"
                :key="followUp.follow_up_id"
                :data-testid="`reminder-item-${followUp.follow_up_id}`"
                @click="handleReminderClick(followUp)"
                class="cursor-pointer border-b border-gray-100 px-4 py-3 hover:bg-gray-50"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">{{ followUp.subject }}</p>
                    <p class="mt-1 text-xs text-gray-500">
                      {{ (followUp as any).leads?.full_name || '未知客戶' }}
                    </p>
                  </div>
                  <ChevronRightIcon class="ml-2 size-4 shrink-0 text-gray-400" />
                </div>
              </div>
            </div>

            <!-- 即將到期提醒 -->
            <div v-if="reminders.upcoming.length > 0">
              <div class="bg-blue-50 px-4 py-2 text-xs font-medium text-blue-800">
                <ClockIcon class="mr-1 inline-block size-4" />
                即將到期
              </div>
              <div
                v-for="followUp in reminders.upcoming"
                :key="followUp.follow_up_id"
                :data-testid="`reminder-item-${followUp.follow_up_id}`"
                @click="handleReminderClick(followUp)"
                class="cursor-pointer border-b border-gray-100 px-4 py-3 hover:bg-gray-50"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">{{ followUp.subject }}</p>
                    <p class="mt-1 text-xs text-gray-500">
                      {{ (followUp as any).leads?.full_name || '未知客戶' }}
                      <span v-if="followUp.next_follow_up" class="ml-2">
                        {{ formatDate(followUp.next_follow_up) }}
                      </span>
                    </p>
                  </div>
                  <ChevronRightIcon class="ml-2 size-4 shrink-0 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          <!-- 無提醒 -->
          <div v-else class="px-4 py-8 text-center text-gray-500">
            <BellSlashIcon class="mx-auto mb-2 size-8 text-gray-400" />
            <p class="text-sm">暫無待跟進事項</p>
          </div>

          <!-- 底部連結 -->
          <div class="border-t border-gray-200 px-4 py-2">
            <router-link
              to="/crm/follow-ups"
              data-testid="view-all-link"
              class="hover:text-primary-900 text-sm text-primary-600"
              @click="showDropdown = false"
            >
              查看所有跟進事項 →
            </router-link>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  BellIcon,
  BellSlashIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'
import { useFollowUpReminder } from '@/composables/useFollowUpReminder'
import type { FollowUp } from '@/types/crm'

const router = useRouter()
const showDropdown = ref(false)

const {
  reminders,
  loading,
  totalCount,
  urgentCount
} = useFollowUpReminder()

// 點擊外部關閉下拉選單
const vClickOutside = {
  mounted(el: HTMLElement, binding: any) {
    el.__clickOutside__ = (event: MouseEvent) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value()
      }
    }
    document.addEventListener('click', el.__clickOutside__)
  },
  unmounted(el: any) {
    document.removeEventListener('click', el.__clickOutside__)
    delete el.__clickOutside__
  }
}

function closeDropdown() {
  showDropdown.value = false
}

function handleReminderClick(followUp: FollowUp) {
  // 導航到潛在客戶詳情頁
  router.push(`/crm/leads/${followUp.lead_id}`)
  showDropdown.value = false
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '/')
}
</script>
