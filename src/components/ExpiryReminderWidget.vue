<template>
  <div class="relative">
    <!-- Widget Button -->
    <button
      @click="toggleDropdown"
      data-testid="expiry-reminder-widget"
      class="relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
      :class="{ 'bg-yellow-50 text-yellow-700': hasExpiring }"
    >
      <BellAlertIcon
        data-testid="expiry-icon"
        class="size-6"
      />

      <!-- Count Badge -->
      <span
        v-if="hasExpiring"
        data-testid="expiry-count-badge"
        class="absolute -right-1 -top-1 inline-flex items-center justify-center rounded-full bg-red-600 px-2 py-1 text-xs font-bold leading-none text-white"
      >
        {{ expiringCount }}
      </span>
    </button>

    <!-- Dropdown -->
    <div
      v-if="showDropdown"
      data-testid="expiry-dropdown"
      class="absolute right-0 z-50 mt-2 w-96 rounded-lg border border-gray-200 bg-white shadow-lg"
    >
      <div class="border-b border-gray-200 p-4">
        <h3 class="text-lg font-semibold text-gray-900">即將到期提醒</h3>
        <p class="mt-1 text-sm text-gray-500">以下課程即將在 7 天內到期</p>
      </div>

      <div class="max-h-96 overflow-y-auto">
        <div
          v-for="enrollment in expiringEnrollments"
          :key="enrollment.enrollment_id"
          data-testid="reminder-item"
          class="border-b border-gray-100 p-4 transition-colors hover:bg-gray-50"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="font-medium text-gray-900">
                {{ enrollment.student?.chinese_name }} - {{ enrollment.course?.course_name }}
              </h4>
              <p class="mt-1 text-sm text-gray-600">
                到期日：{{ enrollment.valid_until }}
              </p>
              <p class="text-sm text-gray-500">
                剩餘堂數：{{ enrollment.remaining_sessions }} 堂
              </p>
            </div>
            <router-link
              :to="`/students/${enrollment.student_id}`"
              class="ml-4 text-sm text-blue-600 hover:text-blue-800"
            >
              查看
            </router-link>
          </div>
        </div>
      </div>

      <div v-if="expiringEnrollments.length === 0" class="p-8 text-center text-gray-500">
        <BellSlashIcon class="mx-auto mb-3 size-12 text-gray-300" />
        <p>目前沒有即將到期的課程</p>
      </div>

      <div class="border-t border-gray-200 bg-gray-50 p-3">
        <router-link
          to="/reports?filter=expiring"
          class="block text-center text-sm text-blue-600 hover:text-blue-800"
        >
          查看完整報告
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { BellAlertIcon, BellSlashIcon } from '@heroicons/vue/24/outline'
import { useExpiryReminder } from '@/composables/useExpiryReminder'

const { expiringEnrollments, checkExpiringEnrollments } = useExpiryReminder()

const showDropdown = ref(false)

const hasExpiring = computed(() => expiringEnrollments.value.length > 0)
const expiringCount = computed(() => expiringEnrollments.value.length)

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('[data-testid="expiry-reminder-widget"]') &&
      !target.closest('[data-testid="expiry-dropdown"]')) {
    showDropdown.value = false
  }
}

onMounted(() => {
  // Check for expiring enrollments on mount
  checkExpiringEnrollments(7)

  // Set up click outside listener
  document.addEventListener('click', handleClickOutside)
})

// Clean up
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
