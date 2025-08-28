<template>
  <div class="overflow-hidden rounded-lg bg-white shadow">
    <div class="p-5">
      <div class="flex items-center">
        <div class="shrink-0">
          <component
            :is="iconComponent"
            :class="[iconColorClass, 'size-6']"
            aria-hidden="true"
          />
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="truncate text-sm font-medium text-gray-500">
              {{ title }}
            </dt>
            <dd class="flex items-baseline">
              <div class="text-2xl font-semibold text-gray-900">
                {{ formattedValue }}
              </div>
              <div
                v-if="change !== undefined"
                :class="[
                  change >= 0 ? 'text-green-600' : 'text-red-600',
                  'ml-2 flex items-baseline text-sm font-semibold'
                ]"
              >
                <component
                  :is="change >= 0 ? ArrowUpIcon : ArrowDownIcon"
                  class="size-4 shrink-0 self-center"
                  :class="change >= 0 ? 'text-green-500' : 'text-red-500'"
                  aria-hidden="true"
                />
                <span class="sr-only">
                  {{ change >= 0 ? '增加' : '減少' }}
                </span>
                {{ Math.abs(change) }}%
              </div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
    <div v-if="$slots.footer" class="bg-gray-50 px-5 py-3">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon
} from '@heroicons/vue/20/solid'
import { formatCurrency } from '@/utils/formatters'
import type { ReportCard } from '@/types/reports'

interface Props extends ReportCard {
  format?: 'currency' | 'number' | 'percent'
}

const props = withDefaults(defineProps<Props>(), {
  format: 'number'
})

const iconMap: Record<string, any> = {
  currency: CurrencyDollarIcon,
  users: UserGroupIcon,
  academic: AcademicCapIcon,
  chart: ChartBarIcon,
  clipboard: ClipboardDocumentCheckIcon,
  calendar: CalendarDaysIcon
}

const iconComponent = computed(() => {
  return iconMap[props.icon || 'chart'] || ChartBarIcon
})

const iconColorClass = computed(() => {
  const colorMap: Record<string, string> = {
    primary: 'text-primary-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    gray: 'text-gray-600'
  }
  return colorMap[props.color || 'primary'] || 'text-primary-600'
})

const formattedValue = computed(() => {
  if (typeof props.value === 'string') {
    return props.value
  }

  switch (props.format) {
    case 'currency':
      return formatCurrency(props.value)
    case 'percent':
      return `${props.value}%`
    default:
      return props.value.toLocaleString()
  }
})
</script>
