<template>
  <div class="space-y-6">
    <!-- Revenue Summary Cards -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
      <ReportCard
        title="總收入"
        :value="totalRevenue"
        format="currency"
        icon="currency"
        color="green"
      />
      <ReportCard
        title="訂單數量"
        :value="totalOrders"
        format="number"
        icon="clipboard"
        color="blue"
      />
      <ReportCard
        title="平均訂單金額"
        :value="averageOrderValue"
        format="currency"
        icon="chart"
        color="primary"
      />
    </div>

    <!-- Revenue Charts -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Daily Revenue Chart -->
      <div class="card p-6">
        <h3 class="mb-4 text-lg font-medium text-gray-900">每日收入趨勢</h3>
        <div class="h-64">
          <ChartWrapper
            v-if="dailyRevenueChartData"
            type="bar"
            :data="dailyRevenueChartData"
            :options="barChartOptions"
          />
        </div>
      </div>

      <!-- Payment Method Distribution -->
      <div class="card p-6">
        <h3 class="mb-4 text-lg font-medium text-gray-900">付款方式分布</h3>
        <div class="h-64">
          <ChartWrapper
            v-if="paymentMethodChartData"
            type="pie"
            :data="paymentMethodChartData"
          />
        </div>
      </div>
    </div>

    <!-- Revenue Table -->
    <div class="card">
      <div class="border-b border-gray-200 px-6 py-4">
        <h3 class="text-lg font-medium text-gray-900">收入明細</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                日期
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                訂單數
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                總金額
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                平均金額
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="row in revenueTableData" :key="row.date">
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {{ formatDate(row.date) }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {{ row.orderCount }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {{ formatCurrency(row.amount) }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {{ formatCurrency(row.amount / row.orderCount) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ReportCard from '@/components/reports/ReportCard.vue'
import ChartWrapper from '@/components/reports/ChartWrapper.vue'
import { reportService } from '@/services/reportService'
import { supabase } from '@/services/supabase'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { DateRange, ChartData } from '@/types/reports'
import type { RevenueData } from '@/services/reportService'

interface Props {
  dateRange: DateRange
}

const props = defineProps<Props>()

const revenueData = ref<RevenueData[]>([])
const paymentMethodData = ref<{ method: string; amount: number }[]>([])

const totalRevenue = computed(() =>
  revenueData.value.reduce((sum, d) => sum + d.amount, 0)
)

const totalOrders = computed(() =>
  revenueData.value.reduce((sum, d) => sum + d.orderCount, 0)
)

const averageOrderValue = computed(() =>
  totalOrders.value > 0 ? totalRevenue.value / totalOrders.value : 0
)

const revenueTableData = computed(() =>
  revenueData.value.slice().reverse()
)

const dailyRevenueChartData = computed<ChartData | null>(() => {
  if (revenueData.value.length === 0) return null

  return {
    labels: revenueData.value.map(d => formatDate(d.date)),
    datasets: [{
      label: '每日收入',
      data: revenueData.value.map(d => d.amount),
      backgroundColor: 'rgba(34, 197, 94, 0.8)'
    }]
  }
})

const paymentMethodChartData = computed<ChartData | null>(() => {
  if (paymentMethodData.value.length === 0) return null

  return {
    labels: paymentMethodData.value.map(d => getPaymentMethodLabel(d.method)),
    datasets: [{
      label: '金額',
      data: paymentMethodData.value.map(d => d.amount),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ]
    }]
  }
})

const barChartOptions = {
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback(value: any) {
          return `$${value.toLocaleString()}`
        }
      }
    }
  }
}

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    cash: '現金',
    transfer: '轉帳',
    credit_card: '信用卡',
    other: '其他'
  }
  return labels[method] || method
}

const loadRevenueData = async () => {
  try {
    // Load daily revenue data
    revenueData.value = await reportService.getRevenueReport({
      startDate: props.dateRange.startDate,
      endDate: props.dateRange.endDate
    })

    // Load payment method distribution
    const { data: payments } = await supabase
      .from('payments')
      .select('payment_method, amount_paid')
      .gte('payment_date', props.dateRange.startDate)
      .lte('payment_date', props.dateRange.endDate)

    if (payments) {
      const methodMap = new Map<string, number>()
      payments.forEach(p => {
        const method = p.payment_method || 'other'
        methodMap.set(method, (methodMap.get(method) || 0) + Number(p.amount_paid))
      })

      paymentMethodData.value = Array.from(methodMap.entries())
        .map(([method, amount]) => ({ method, amount }))
        .sort((a, b) => b.amount - a.amount)
    }
  } catch (error) {
    console.error('Error loading revenue data:', error)
  }
}

onMounted(() => {
  loadRevenueData()
})

watch(() => props.dateRange, () => {
  loadRevenueData()
}, { deep: true })
</script>
