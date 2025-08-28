<template>
  <div class="rounded-lg bg-green-50 p-4">
    <h4 class="mb-3 flex items-center text-lg font-medium text-gray-900">
      <UserGroupIcon class="mr-2 size-5 text-green-600" />
      學生名單
      <span v-if="!loading" class="ml-2 text-sm text-gray-500">
        ({{ students.length }}人)
      </span>
    </h4>

    <!-- 載入中 -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="flex animate-pulse items-center">
        <div class="mr-3 size-10 rounded-full bg-gray-200"></div>
        <div class="flex-1">
          <div class="mb-1 h-4 w-1/3 rounded bg-gray-200"></div>
          <div class="h-3 w-1/2 rounded bg-gray-200"></div>
        </div>
      </div>
    </div>

    <!-- 有學生 -->
    <div v-else-if="students.length > 0" class="space-y-3">
      <StudentItem
        v-for="student in students"
        :key="student.id"
        :student="student"
      />
    </div>

    <!-- 無學生 -->
    <EmptyState v-else />
  </div>
</template>

<script setup lang="ts">
import { UserGroupIcon } from '@heroicons/vue/24/outline'
import type { Student } from '@/types'
import StudentItem from './StudentItem.vue'
import EmptyState from './EmptyState.vue'

interface Props {
  students: Student[]
  loading: boolean
}

defineProps<Props>()
</script>
