<template>
  <div class="overflow-hidden rounded-lg border border-gray-200">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            功能模組
          </th>
          <th class="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
            管理員
          </th>
          <th class="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
            職員
          </th>
          <th class="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
            教師
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 bg-white">
        <tr v-for="module in modules" :key="module.name">
          <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
            {{ module.name }}
          </td>
          <td class="whitespace-nowrap px-6 py-4 text-center">
            <CheckIcon v-if="module.admin" class="mx-auto size-5 text-green-500" />
            <XMarkIcon v-else class="mx-auto size-5 text-gray-300" />
          </td>
          <td class="whitespace-nowrap px-6 py-4 text-center">
            <CheckIcon v-if="module.staff" class="mx-auto size-5 text-green-500" />
            <XMarkIcon v-else class="mx-auto size-5 text-gray-300" />
          </td>
          <td class="whitespace-nowrap px-6 py-4 text-center">
            <CheckIcon v-if="module.teacher" class="mx-auto size-5 text-green-500" />
            <XMarkIcon v-else class="mx-auto size-5 text-gray-300" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { CheckIcon, XMarkIcon } from '@heroicons/vue/24/outline'

interface Module {
  name: string
  admin: boolean
  staff: boolean
  teacher: boolean
}

interface Props {
  modules: Module[]
}

defineProps<Props>()
</script>
