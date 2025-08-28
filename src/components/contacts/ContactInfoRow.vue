<template>
  <tr class="contact-info-row">
    <!-- 圖示列 -->
    <td :class="iconCellClasses">
      <component :is="icon" :class="iconClasses" />
    </td>

    <!-- 內容列 -->
    <td :class="contentCellClasses">
      <a
        v-if="href"
        :href="href"
        :class="linkClasses"
        :aria-label="ariaLabel"
      >
        {{ text }}
      </a>
      <span
        v-else
        :class="textClasses"
      >
        {{ text }}
      </span>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'

// Props 定義
interface Props {
  /** 圖示組件 */
  icon: Component
  /** 顯示文字 */
  text: string
  /** 連結 URL（可選） */
  href?: string
  /** 對齊方式 */
  align?: 'top' | 'middle'
  /** 保留空白字符 */
  preserveWhitespace?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  align: 'middle',
  preserveWhitespace: false
})

// 計算屬性：CSS 類別
const iconCellClasses = computed(() => [
  'w-6 pr-2',
  props.align === 'top' ? 'align-top pb-1' : 'align-middle pb-1'
])

const iconClasses = computed(() => [
  'h-4 w-4 text-gray-400',
  props.align === 'top' ? 'mt-0.5' : ''
])

const contentCellClasses = computed(() => [
  props.align === 'top' ? 'align-top' : 'align-middle',
  'pb-1'
])

const linkClasses = computed(() => [
  'text-sm text-gray-600 hover:text-blue-600 transition-colors'
])

const textClasses = computed(() => [
  'text-sm text-gray-600',
  props.preserveWhitespace ? 'whitespace-pre-wrap' : ''
])

// 計算屬性：無障礙標籤
const ariaLabel = computed(() => {
  if (!props.href) return undefined

  if (props.href.startsWith('tel:')) {
    return `撥打電話給 ${props.text}`
  }
  if (props.href.startsWith('mailto:')) {
    return `發送郵件給 ${props.text}`
  }
  return undefined
})
</script>

<style scoped>
.contact-info-row:last-child td {
  @apply pb-0;
}
</style>
