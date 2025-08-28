import type { Meta, StoryObj } from '@storybook/vue3'
import AdaptiveDataTable from './AdaptiveDataTable.vue'
import type { TableColumn, TableFilter } from './types'

const meta: Meta<typeof AdaptiveDataTable> = {
  title: 'UI Components/AdaptiveDataTable',
  component: AdaptiveDataTable,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
AdaptiveDataTable 是一個功能豐富的自適應數據表格組件，支援：

- 🔍 **智能搜尋**：即時搜尋和防抖處理
- 🎛️ **多重篩選**：支援多種篩選器類型
- 📊 **靈活排序**：可排序的欄位支援
- 📱 **響應式設計**：桌面版表格和移動版卡片無縫切換
- ⚡ **虛擬滾動**：高效處理大數據集
- 📄 **智能分頁**：可配置的分頁控制
- ✅ **行選擇**：支援單選和多選
- 🎨 **欄位控制**：動態顯示/隱藏欄位
- ♿ **無障礙支援**：完整的鍵盤導航和螢幕閱讀器支援
        `
      }
    }
  },
  argTypes: {
    data: {
      description: '表格數據陣列',
      control: { type: 'object' }
    },
    columns: {
      description: '表格欄位配置',
      control: { type: 'object' }
    },
    rowKey: {
      description: '行的唯一標識符字段',
      control: { type: 'text' }
    },
    loading: {
      description: '載入狀態',
      control: { type: 'boolean' }
    },
    searchable: {
      description: '是否顯示搜尋框',
      control: { type: 'boolean' }
    },
    filterable: {
      description: '是否啟用篩選功能',
      control: { type: 'boolean' }
    },
    sortable: {
      description: '是否啟用排序功能',
      control: { type: 'boolean' }
    },
    paginated: {
      description: '是否啟用分頁',
      control: { type: 'boolean' }
    },
    selectable: {
      description: '是否啟用行選擇',
      control: { type: 'boolean' }
    },
    columnSelectable: {
      description: '是否啟用欄位選擇',
      control: { type: 'boolean' }
    },
    stickyHeader: {
      description: '是否固定表頭',
      control: { type: 'boolean' }
    },
    showToolbar: {
      description: '是否顯示工具欄',
      control: { type: 'boolean' }
    }
  }
}

export default meta
type Story = StoryObj<typeof AdaptiveDataTable>

// 示例數據
const generateSampleData = (count: number) => {
  const departments = ['技術部', '行銷部', '業務部', '人資部']
  const positions = ['經理', '主管', '專員', '助理']
  const statuses = ['active', 'inactive', 'pending']

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `用戶${i + 1}`,
    email: `user${i + 1}@example.com`,
    department: departments[Math.floor(Math.random() * departments.length)],
    position: positions[Math.floor(Math.random() * positions.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    salary: Math.floor(Math.random() * 50000) + 30000,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  }))
}

const sampleColumns: TableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'name', label: '姓名', sortable: true },
  { key: 'email', label: '電子郵件', sortable: true },
  { key: 'department', label: '部門', sortable: true },
  { key: 'position', label: '職位', sortable: true },
  { key: 'status', label: '狀態', sortable: true, width: '100px' },
  { key: 'salary', label: '薪資', sortable: true, align: 'right' },
  { key: 'createdAt', label: '建立時間', sortable: true }
]

const sampleFilters: TableFilter[] = [
  {
    key: 'status',
    label: '狀態',
    type: 'select',
    options: [
      { label: '啟用', value: 'active' },
      { label: '停用', value: 'inactive' },
      { label: '待審', value: 'pending' }
    ]
  },
  {
    key: 'department',
    label: '部門',
    type: 'select',
    options: [
      { label: '技術部', value: '技術部' },
      { label: '行銷部', value: '行銷部' },
      { label: '業務部', value: '業務部' },
      { label: '人資部', value: '人資部' }
    ]
  }
]

// 基本用法
export const Default: Story = {
  args: {
    data: generateSampleData(50),
    columns: sampleColumns,
    rowKey: 'id',
    searchable: true,
    filterable: true,
    sortable: true,
    paginated: true,
    selectable: false,
    columnSelectable: true,
    filters: sampleFilters,
    stickyHeader: true,
    showToolbar: true
  }
}

// 載入狀態
export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true,
    loadingText: '正在載入用戶資料...'
  }
}

// 空狀態
export const Empty: Story = {
  args: {
    ...Default.args,
    data: [],
    emptyText: '暫無用戶資料'
  }
}

// 可選擇行
export const Selectable: Story = {
  args: {
    ...Default.args,
    selectable: true,
    multiSelect: true
  }
}

// 大數據集（虛擬滾動）
export const LargeDataset: Story = {
  args: {
    ...Default.args,
    data: generateSampleData(10000),
    virtualScrolling: {
      enabled: true,
      itemHeight: 60,
      bufferSize: 10,
      threshold: 100
    }
  },
  parameters: {
    docs: {
      description: {
        story: '展示虛擬滾動處理大數據集的能力，這裡有 10,000 筆資料。'
      }
    }
  }
}

// 簡化版本（無工具欄）
export const Minimal: Story = {
  args: {
    ...Default.args,
    data: generateSampleData(20),
    searchable: false,
    filterable: false,
    columnSelectable: false,
    showToolbar: false,
    paginated: false
  }
}

// 自定義欄位渲染
export const CustomCellRendering: Story = {
  args: {
    ...Default.args,
    data: generateSampleData(30)
  },
  render: (args) => ({
    components: { AdaptiveDataTable },
    setup() {
      const getStatusClasses = (status: string) => {
        const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'

        switch (status) {
          case 'active':
            return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`
          case 'inactive':
            return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`
          case 'pending':
            return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`
          default:
            return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`
        }
      }

      const getStatusText = (status: string) => {
        switch (status) {
          case 'active': return '啟用'
          case 'inactive': return '停用'
          case 'pending': return '待審'
          default: return '未知'
        }
      }

      const formatSalary = (salary: number) => {
        return new Intl.NumberFormat('zh-TW', {
          style: 'currency',
          currency: 'TWD'
        }).format(salary)
      }

      const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('zh-TW')
      }

      return { args, getStatusClasses, getStatusText, formatSalary, formatDate }
    },
    template: `
      <AdaptiveDataTable v-bind="args">
        <template #cell-status="{ value }">
          <span :class="getStatusClasses(value)">
            {{ getStatusText(value) }}
          </span>
        </template>
        
        <template #cell-salary="{ value }">
          <span class="font-mono text-right">
            {{ formatSalary(value) }}
          </span>
        </template>
        
        <template #cell-createdAt="{ value }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ formatDate(value) }}
          </span>
        </template>
      </AdaptiveDataTable>
    `
  })
}

// 移動版卡片模式
export const MobileCardMode: Story = {
  args: {
    ...Default.args,
    data: generateSampleData(20),
    mobileCardTemplate: {
      title: (item: any) => item.name,
      subtitle: (item: any) => `${item.department} - ${item.position}`,
      description: (item: any) => item.email,
      status: (item: any) => item.status,
      date: (item: any) => new Date(item.createdAt).toLocaleDateString('zh-TW'),
      actions: [
        {
          key: 'edit',
          label: '編輯',
          variant: 'primary' as const,
          handler: (item: any) => console.log('編輯', item)
        },
        {
          key: 'delete',
          label: '刪除',
          variant: 'danger' as const,
          handler: (item: any) => console.log('刪除', item)
        }
      ]
    }
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: '在移動設備上會自動切換為卡片模式，提供更好的觸控體驗。'
      }
    }
  }
}

// 性能測試
export const PerformanceTest: Story = {
  args: {
    ...Default.args,
    data: generateSampleData(50000),
    virtualScrolling: {
      enabled: true,
      itemHeight: 60,
      bufferSize: 20,
      threshold: 200
    },
    searchDebounce: 500
  },
  parameters: {
    docs: {
      description: {
        story: '性能測試版本，包含 50,000 筆資料，展示組件在極大數據集下的表現。'
      }
    }
  }
}

// 無分頁模式
export const WithoutPagination: Story = {
  args: {
    ...Default.args,
    data: generateSampleData(100),
    paginated: false,
    virtualScrolling: {
      enabled: true,
      itemHeight: 60,
      bufferSize: 10,
      threshold: 50
    }
  }
}

// 自定義工具欄
export const CustomToolbar: Story = {
  args: {
    ...Default.args,
    data: generateSampleData(30),
    selectable: true
  },
  render: (args) => ({
    components: { AdaptiveDataTable },
    setup() {
      const handleBatchAction = (selectedRows: any[], action: string) => {
        console.log(`批量${action}`, selectedRows)
      }

      const handleExport = () => {
        console.log('匯出資料')
      }

      return { args, handleBatchAction, handleExport }
    },
    template: `
      <AdaptiveDataTable v-bind="args">
        <template #toolbar-actions="{ selectedRows }">
          <div class="flex gap-2">
            <button
              v-if="selectedRows.length > 0"
              @click="handleBatchAction(selectedRows, '刪除')"
              class="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              批量刪除 ({{ selectedRows.length }})
            </button>
            <button
              v-if="selectedRows.length > 0"
              @click="handleBatchAction(selectedRows, '匯出')"
              class="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              匯出選中
            </button>
            <button
              @click="handleExport"
              class="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
            >
              匯出全部
            </button>
          </div>
        </template>
      </AdaptiveDataTable>
    `
  })
}
