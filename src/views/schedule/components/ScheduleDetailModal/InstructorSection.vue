<template>
  <div class="rounded-lg bg-blue-50 p-4">
    <h4 class="mb-3 flex items-center text-lg font-medium text-gray-900">
      <AcademicCapIcon class="mr-2 size-5 text-blue-600" />
      授課教師
    </h4>

    <!-- 載入中 -->
    <div v-if="loading" class="animate-pulse">
      <div class="mb-2 h-4 w-1/3 rounded bg-gray-200"></div>
      <div class="h-3 w-1/2 rounded bg-gray-200"></div>
    </div>

    <!-- 有教師資料 -->
    <div v-else-if="instructor" class="flex items-center">
      <Avatar
        :name="instructor.full_name"
        :size="48"
        class="mr-4"
        bg-color="bg-blue-100"
        text-color="text-blue-600"
      />
      <div>
        <p class="text-sm font-medium text-gray-900">
          {{ instructor.full_name }}
        </p>
      </div>
    </div>

    <!-- 無教師資料 -->
    <div v-else class="text-sm text-gray-500">
      暫未指派教師
    </div>
  </div>
</template>

<script setup lang="ts">
import { AcademicCapIcon } from '@heroicons/vue/24/outline'
import type { Instructor } from '@/types'
import Avatar from './Avatar.vue'

interface Props {
  instructor: Instructor | null
  loading: boolean
}

defineProps<Props>()
</script>
