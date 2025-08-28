<template>
  <div class="size-full">
    <component
      v-if="chartData && chartData.labels && chartData.datasets"
      :is="chartComponent"
      :data="chartData"
      :options="mergedOptions"
    />
    <div v-else class="flex h-full items-center justify-center text-gray-500">
      <div class="text-center">
        <div class="mx-auto mb-2 size-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
        <p class="text-sm">載入圖表中...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler
} from 'chart.js'
import { Bar, Line, Pie, Doughnut } from 'vue-chartjs'
import type { ChartData } from '@/types/reports'

// Register ChartJS components
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler
)

interface Props {
  type: 'bar' | 'line' | 'pie' | 'doughnut'
  data?: ChartData
  options?: any
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 300
})

const chartComponent = computed(() => {
  const components = {
    bar: Bar,
    line: Line,
    pie: Pie,
    doughnut: Doughnut
  }
  return components[props.type]
})

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: {
        family: 'Inter, system-ui, sans-serif',
        size: 13
      },
      bodyFont: {
        family: 'Inter, system-ui, sans-serif',
        size: 12
      }
    }
  },
  scales: props.type === 'bar' || props.type === 'line' ? {
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 11
        }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 11
        }
      }
    }
  } : undefined
}

const mergedOptions = computed(() => ({
  ...defaultOptions,
  ...props.options
}))

const chartData = computed(() => props.data)
</script>
