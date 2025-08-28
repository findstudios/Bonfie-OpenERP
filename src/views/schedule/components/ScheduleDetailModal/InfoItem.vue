<template>
  <div :class="fullWidth ? 'col-span-full' : ''">
    <span class="text-sm font-medium text-gray-500">{{ label }}</span>
    <div class="mt-1">
      <slot name="value">
        <p class="text-sm text-gray-900">{{ value }}</p>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label: string
  value?: string | number
  fullWidth?: boolean
}

defineProps<Props>()
</script>
