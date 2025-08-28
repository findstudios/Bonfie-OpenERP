<template>
  <div class="flex flex-col gap-4 sm:flex-row">
    <div>
      <label for="start-date" class="mb-1 block text-sm font-medium text-gray-700">
        開始日期
      </label>
      <input
        id="start-date"
        v-model="localStartDate"
        type="date"
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        @change="handleDateChange"
      />
    </div>
    <div>
      <label for="end-date" class="mb-1 block text-sm font-medium text-gray-700">
        結束日期
      </label>
      <input
        id="end-date"
        v-model="localEndDate"
        type="date"
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        @change="handleDateChange"
      />
    </div>
    <div class="flex items-end gap-2">
      <button
        @click="setPreset('today')"
        class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
      >
        今天
      </button>
      <button
        @click="setPreset('week')"
        class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
      >
        本週
      </button>
      <button
        @click="setPreset('month')"
        class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
      >
        本月
      </button>
      <button
        @click="setPreset('year')"
        class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
      >
        本年
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DateRange } from '@/types/reports'

interface Props {
  modelValue: DateRange
}

interface Emits {
  (e: 'update:modelValue', value: DateRange): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localStartDate = ref(props.modelValue.startDate)
const localEndDate = ref(props.modelValue.endDate)

watch(() => props.modelValue, (newValue) => {
  localStartDate.value = newValue.startDate
  localEndDate.value = newValue.endDate
})

const handleDateChange = () => {
  emit('update:modelValue', {
    startDate: localStartDate.value,
    endDate: localEndDate.value
  })
}

const setPreset = (preset: 'today' | 'week' | 'month' | 'year') => {
  const today = new Date()
  let startDate: Date
  let endDate: Date = new Date()

  switch (preset) {
    case 'today':
      startDate = new Date(today)
      endDate = new Date(today)
      break
    case 'week':
      startDate = new Date(today)
      startDate.setDate(today.getDate() - today.getDay())
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      break
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      break
    case 'year':
      startDate = new Date(today.getFullYear(), 0, 1)
      endDate = new Date(today.getFullYear(), 11, 31)
      break
  }

  localStartDate.value = startDate.toISOString().split('T')[0]
  localEndDate.value = endDate.toISOString().split('T')[0]
  handleDateChange()
}
</script>
