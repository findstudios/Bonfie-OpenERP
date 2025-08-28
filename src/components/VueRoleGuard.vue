<template>
  <div>
    <!-- 根據權限顯示內容 -->
    <div v-if="hasPermission">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authSupabase'

interface Props {
  allowedRoles?: string[]
}

const props = defineProps<Props>()
const authStore = useAuthStore()

// 計算是否有權限
const hasPermission = computed(() => {
  // 未登入則無權限
  if (!authStore.isAuthenticated) {
    return false
  }

  // 如果指定了允許的角色，檢查用戶角色是否在列表中
  if (props.allowedRoles && props.allowedRoles.length > 0) {
    const currentUserRole = authStore.userRole?.role_code
    return currentUserRole ? props.allowedRoles.includes(currentUserRole) : false
  }

  // 默認已登入用戶有權限
  return true
})
</script>
