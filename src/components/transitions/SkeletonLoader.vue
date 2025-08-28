<template>
  <div class="skeleton-loader" :class="containerClass">
    <!-- 文字骨架屏 -->
    <template v-if="type === 'text'">
      <div
        v-for="line in lines"
        :key="line"
        class="skeleton-line"
        :class="[
          'skeleton-loading',
          lineClass,
          { 'skeleton-line-last': line === lines && lastLineWidth }
        ]"
        :style="{
          width: line === lines && lastLineWidth ? lastLineWidth : '100%',
          height: lineHeight
        }"
      />
    </template>

    <!-- 卡片骨架屏 -->
    <template v-else-if="type === 'card'">
      <div class="skeleton-card">
        <!-- 頭像/圖片區域 -->
        <div
          v-if="showAvatar"
          class="skeleton-avatar skeleton-loading"
          :style="{ width: avatarSize, height: avatarSize }"
        />

        <!-- 內容區域 -->
        <div class="skeleton-content" :class="{ 'skeleton-content-with-avatar': showAvatar }">
          <!-- 標題 -->
          <div
            class="skeleton-title skeleton-loading"
            :style="{ height: titleHeight, width: titleWidth }"
          />

          <!-- 描述行 -->
          <div
            v-for="line in descriptionLines"
            :key="line"
            class="skeleton-description skeleton-loading"
            :class="{ 'skeleton-description-last': line === descriptionLines }"
            :style="{
              height: descriptionHeight,
              width: line === descriptionLines ? '75%' : '100%'
            }"
          />
        </div>
      </div>
    </template>

    <!-- 表格骨架屏 -->
    <template v-else-if="type === 'table'">
      <div class="skeleton-table">
        <!-- 表頭 -->
        <div class="skeleton-table-header">
          <div
            v-for="col in columns"
            :key="col"
            class="skeleton-table-header-cell skeleton-loading"
            :style="{ height: headerHeight }"
          />
        </div>

        <!-- 表格行 -->
        <div
          v-for="row in rows"
          :key="row"
          class="skeleton-table-row"
        >
          <div
            v-for="col in columns"
            :key="col"
            class="skeleton-table-cell skeleton-loading"
            :style="{ height: cellHeight }"
          />
        </div>
      </div>
    </template>

    <!-- 列表骨架屏 -->
    <template v-else-if="type === 'list'">
      <div
        v-for="item in items"
        :key="item"
        class="skeleton-list-item"
      >
        <div
          v-if="showListAvatar"
          class="skeleton-list-avatar skeleton-loading"
          :style="{ width: listAvatarSize, height: listAvatarSize }"
        />
        <div class="skeleton-list-content">
          <div
            class="skeleton-list-title skeleton-loading"
            :style="{ height: listTitleHeight, width: listTitleWidth }"
          />
          <div
            class="skeleton-list-subtitle skeleton-loading"
            :style="{ height: listSubtitleHeight, width: listSubtitleWidth }"
          />
        </div>
      </div>
    </template>

    <!-- 自定義骨架屏 -->
    <template v-else-if="type === 'custom'">
      <slot />
    </template>

    <!-- 默認骨架屏 -->
    <template v-else>
      <div
        class="skeleton-default skeleton-loading"
        :style="{ width, height }"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'

// 骨架屏類型
type SkeletonType = 'text' | 'card' | 'table' | 'list' | 'custom' | 'default'

// Props
const props = defineProps({
  // 骨架屏類型
  type: {
    type: String as PropType<SkeletonType>,
    default: 'default'
  },

  // 通用屬性
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '1rem'
  },

  // 文字骨架屏屬性
  lines: {
    type: Number,
    default: 3
  },
  lineHeight: {
    type: String,
    default: '1rem'
  },
  lastLineWidth: {
    type: String,
    default: '75%'
  },

  // 卡片骨架屏屬性
  showAvatar: {
    type: Boolean,
    default: true
  },
  avatarSize: {
    type: String,
    default: '3rem'
  },
  titleHeight: {
    type: String,
    default: '1.25rem'
  },
  titleWidth: {
    type: String,
    default: '60%'
  },
  descriptionLines: {
    type: Number,
    default: 2
  },
  descriptionHeight: {
    type: String,
    default: '1rem'
  },

  // 表格骨架屏屬性
  columns: {
    type: Number,
    default: 4
  },
  rows: {
    type: Number,
    default: 5
  },
  headerHeight: {
    type: String,
    default: '2.5rem'
  },
  cellHeight: {
    type: String,
    default: '3rem'
  },

  // 列表骨架屏屬性
  items: {
    type: Number,
    default: 5
  },
  showListAvatar: {
    type: Boolean,
    default: true
  },
  listAvatarSize: {
    type: String,
    default: '2.5rem'
  },
  listTitleHeight: {
    type: String,
    default: '1.25rem'
  },
  listTitleWidth: {
    type: String,
    default: '70%'
  },
  listSubtitleHeight: {
    type: String,
    default: '1rem'
  },
  listSubtitleWidth: {
    type: String,
    default: '50%'
  },

  // 樣式類
  containerClass: {
    type: String,
    default: ''
  },
  lineClass: {
    type: String,
    default: ''
  }
})

// 計算屬性
const containerClass = computed(() => {
  return [
    'skeleton-loader',
    `skeleton-${props.type}`,
    props.containerClass
  ].filter(Boolean).join(' ')
})
</script>

<style scoped>
.skeleton-loader {
  @apply animate-pulse;
}

/* 基礎骨架屏樣式 */
.skeleton-loading {
  @apply bg-gray-200 rounded;
  background: linear-gradient(
    90deg,
    theme('colors.gray.200') 25%,
    theme('colors.gray.100') 50%,
    theme('colors.gray.200') 75%
  );
  background-size: 200px 100%;
  animation: skeleton-shimmer 1.5s infinite;
}

.dark .skeleton-loading {
  @apply bg-gray-700;
  background: linear-gradient(
    90deg,
    theme('colors.gray.700') 25%,
    theme('colors.gray.600') 50%,
    theme('colors.gray.700') 75%
  );
  background-size: 200px 100%;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

/* 文字骨架屏 */
.skeleton-text .skeleton-line {
  @apply mb-2 last:mb-0;
}

.skeleton-line-last {
  width: 75% !important;
}

/* 卡片骨架屏 */
.skeleton-card {
  @apply flex space-x-4;
}

.skeleton-avatar {
  @apply rounded-full flex-shrink-0;
}

.skeleton-content {
  @apply flex-1 space-y-2;
}

.skeleton-content-with-avatar {
  @apply pt-1;
}

.skeleton-title {
  @apply rounded;
}

.skeleton-description {
  @apply rounded;
}

.skeleton-description:not(.skeleton-description-last) {
  @apply mb-2;
}

.skeleton-description-last {
  width: 75% !important;
}

/* 表格骨架屏 */
.skeleton-table {
  @apply w-full;
}

.skeleton-table-header {
  @apply flex space-x-2 mb-4;
}

.skeleton-table-header-cell {
  @apply flex-1 rounded;
}

.skeleton-table-row {
  @apply flex space-x-2 mb-3;
}

.skeleton-table-cell {
  @apply flex-1 rounded;
}

/* 列表骨架屏 */
.skeleton-list-item {
  @apply flex items-center space-x-3 mb-4 last:mb-0;
}

.skeleton-list-avatar {
  @apply rounded-full flex-shrink-0;
}

.skeleton-list-content {
  @apply flex-1 space-y-2;
}

.skeleton-list-title {
  @apply rounded;
}

.skeleton-list-subtitle {
  @apply rounded;
}

/* 默認骨架屏 */
.skeleton-default {
  @apply rounded;
}

/* 響應式調整 */
@media (max-width: 768px) {
  .skeleton-card {
    @apply flex-col space-x-0 space-y-3;
  }

  .skeleton-avatar {
    @apply self-center;
  }

  .skeleton-table-header,
  .skeleton-table-row {
    @apply flex-col space-x-0 space-y-2;
  }

  .skeleton-list-item {
    @apply flex-col items-start space-x-0 space-y-2;
  }

  .skeleton-list-avatar {
    @apply self-center;
  }
}

/* 減少動畫偏好支援 */
@media (prefers-reduced-motion: reduce) {
  .skeleton-loading {
    animation: none;
  }

  .skeleton-loader {
    @apply animate-none;
  }
}
</style>
