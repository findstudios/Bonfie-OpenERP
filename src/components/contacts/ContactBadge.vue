<template>
  <span :class="badgeClasses" role="status" :aria-label="text">
    {{ text }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 標籤類型定義
type BadgeType = 'primary' | 'emergency' | 'billing'

// Props 定義
interface Props {
  /** 標籤類型 */
  type: BadgeType
  /** 標籤文字 */
  text: string
}

const props = defineProps<Props>()

// 標籤樣式映射
const badgeStyleMap: Record<BadgeType, string> = {
  primary: 'bg-blue-100 text-blue-800',
  emergency: 'bg-red-100 text-red-800',
  billing: 'bg-green-100 text-green-800'
}

// 計算屬性：標籤樣式
const badgeClasses = computed(() => [
  'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
  badgeStyleMap[props.type]
])
</script>
