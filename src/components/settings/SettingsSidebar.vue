<template>
  <div class="lg:col-span-1">
    <nav class="space-y-2">
      <button
        v-for="section in sections"
        :key="section.key"
        @click="$emit('update:activeSection', section.key)"
        :class="[
          'flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left transition-colors duration-200',
          activeSection === section.key
            ? 'border-l-4 border-blue-500 bg-blue-50 text-blue-700'
            : 'text-gray-600 hover:bg-gray-50'
        ]"
      >
        <component :is="section.icon" class="size-5" />
        <div>
          <div class="font-medium">{{ section.name }}</div>
        </div>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

interface Section {
  key: string
  name: string
  icon: Component
}

interface Props {
  activeSection: string
  sections: Section[]
}

defineProps<Props>()

defineEmits<{
  'update:activeSection': [value: string]
}>()
</script>
