/**
 * SmartButton Storybook Stories
 * SmartButton組件故事書
 */

import type { Meta, StoryObj } from '@storybook/vue3'
import SmartButton from './SmartButton.vue'
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  HeartIcon,
  StarIcon
} from '@heroicons/vue/24/outline'

const meta: Meta<typeof SmartButton> = {
  title: 'UI Components/SmartButton',
  component: SmartButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
SmartButton 是一個功能豐富的智能按鈕組件，支援：

- 多種變體樣式（primary, secondary, tertiary, danger, success, warning, ghost, outline）
- 響應式尺寸配置
- 圖標支援（左側、右側、僅圖標）
- 載入狀態和禁用狀態
- 徽章顯示
- 觸控友好設計
- 完整的可訪問性支援
- 主題適配（淺色、高對比度）

該組件遵循 WCAG 2.1 AA 標準，確保在各種設備和使用情境下都能提供優秀的用戶體驗。
        `
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'tertiary', 'danger', 'success', 'warning', 'ghost', 'outline'],
      description: '按鈕變體樣式'
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: '按鈕尺寸'
    },
    type: {
      control: { type: 'select' },
      options: ['button', 'submit', 'reset'],
      description: '按鈕類型'
    },
    iconPosition: {
      control: { type: 'select' },
      options: ['left', 'right'],
      description: '圖標位置'
    },
    rounded: {
      control: { type: 'select' },
      options: ['none', 'sm', 'md', 'lg', 'full'],
      description: '圓角大小'
    },
    text: {
      control: { type: 'text' },
      description: '按鈕文字'
    },
    disabled: {
      control: { type: 'boolean' },
      description: '是否禁用'
    },
    loading: {
      control: { type: 'boolean' },
      description: '是否載入中'
    },
    iconOnly: {
      control: { type: 'boolean' },
      description: '是否僅顯示圖標'
    },
    fullWidth: {
      control: { type: 'boolean' },
      description: '是否全寬顯示'
    },
    badge: {
      control: { type: 'text' },
      description: '徽章內容'
    }
  },
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof meta>

// 基本故事
export const Default: Story = {
  args: {
    text: '默認按鈕',
    variant: 'primary',
    size: 'md'
  }
}

// 變體展示
export const Variants: Story = {
  render: () => ({
    components: { SmartButton },
    template: `
      <div class="space-y-4">
        <div class="space-x-4">
          <SmartButton text="Primary" variant="primary" />
          <SmartButton text="Secondary" variant="secondary" />
          <SmartButton text="Tertiary" variant="tertiary" />
          <SmartButton text="Ghost" variant="ghost" />
        </div>
        <div class="space-x-4">
          <SmartButton text="Danger" variant="danger" />
          <SmartButton text="Success" variant="success" />
          <SmartButton text="Warning" variant="warning" />
          <SmartButton text="Outline" variant="outline" />
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: '展示所有可用的按鈕變體樣式'
      }
    }
  }
}

// 尺寸展示
export const Sizes: Story = {
  render: () => ({
    components: { SmartButton },
    template: `
      <div class="flex items-end space-x-4">
        <SmartButton text="Extra Small" size="xs" />
        <SmartButton text="Small" size="sm" />
        <SmartButton text="Medium" size="md" />
        <SmartButton text="Large" size="lg" />
        <SmartButton text="Extra Large" size="xl" />
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: '展示所有可用的按鈕尺寸，注意觸控友好的最小高度設置'
      }
    }
  }
}

// 圖標按鈕
export const WithIcons: Story = {
  render: () => ({
    components: { SmartButton, PlusIcon, TrashIcon, PencilIcon },
    template: `
      <div class="space-y-4">
        <div class="space-x-4">
          <SmartButton text="添加" :icon="PlusIcon" icon-position="left" />
          <SmartButton text="刪除" :icon="TrashIcon" icon-position="left" variant="danger" />
          <SmartButton text="編輯" :icon="PencilIcon" icon-position="right" variant="secondary" />
        </div>
        <div class="space-x-4">
          <SmartButton text="添加" :icon="PlusIcon" icon-only aria-label="添加項目" />
          <SmartButton text="刪除" :icon="TrashIcon" icon-only variant="danger" aria-label="刪除項目" />
          <SmartButton text="編輯" :icon="PencilIcon" icon-only variant="secondary" aria-label="編輯項目" />
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: '展示帶圖標的按鈕，包括左側圖標、右側圖標和僅圖標模式'
      }
    }
  }
}

// 狀態展示
export const States: Story = {
  render: () => ({
    components: { SmartButton, CheckIcon },
    template: `
      <div class="space-y-4">
        <div class="space-x-4">
          <SmartButton text="正常狀態" />
          <SmartButton text="載入中" loading />
          <SmartButton text="禁用狀態" disabled />
        </div>
        <div class="space-x-4">
          <SmartButton text="載入中" :icon="CheckIcon" loading variant="success" />
          <SmartButton text="禁用" :icon="CheckIcon" disabled variant="secondary" />
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: '展示按鈕的不同狀態：正常、載入中、禁用'
      }
    }
  }
}

// 徽章展示
export const WithBadges: Story = {
  render: () => ({
    components: { SmartButton, InformationCircleIcon, HeartIcon },
    template: `
      <div class="space-x-4">
        <SmartButton text="消息" badge="5" />
        <SmartButton text="通知" badge="99+" variant="secondary" />
        <SmartButton text="收藏" :icon="HeartIcon" badge="NEW" variant="outline" />
        <SmartButton text="信息" :icon="InformationCircleIcon" badge="!" variant="ghost" />
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: '展示帶徽章的按鈕，支援數字和文字徽章'
      }
    }
  }
}

// 佈局選項
export const LayoutOptions: Story = {
  render: () => ({
    components: { SmartButton },
    template: `
      <div class="space-y-4 w-full max-w-md">
        <SmartButton text="全寬按鈕" full-width />
        <div class="space-x-4">
          <SmartButton text="無圓角" rounded="none" />
          <SmartButton text="小圓角" rounded="sm" />
          <SmartButton text="中圓角" rounded="md" />
          <SmartButton text="大圓角" rounded="lg" />
          <SmartButton text="完全圓角" rounded="full" />
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: '展示不同的佈局選項：全寬模式和圓角設置'
      }
    }
  }
}

// 響應式展示
export const Responsive: Story = {
  args: {
    text: '響應式按鈕',
    responsiveSize: {
      mobile: 'sm',
      tablet: 'md',
      desktop: 'lg'
    }
  },
  parameters: {
    docs: {
      description: {
        story: '展示響應式尺寸配置，在不同設備上顯示不同尺寸'
      }
    }
  }
}

// 可訪問性展示
export const Accessibility: Story = {
  render: () => ({
    components: { SmartButton, ExclamationTriangleIcon, CheckIcon },
    template: `
      <div class="space-y-4">
        <div class="space-x-4">
          <SmartButton 
            text="提交表單" 
            type="submit" 
            aria-label="提交用戶註冊表單"
            aria-describedby="submit-help"
          />
          <SmartButton 
            text="警告" 
            :icon="ExclamationTriangleIcon" 
            variant="warning"
            aria-label="顯示警告信息"
          />
        </div>
        <div class="space-x-4">
          <SmartButton 
            text="確認" 
            :icon="CheckIcon" 
            icon-only 
            aria-label="確認操作"
            variant="success"
          />
          <SmartButton 
            text="取消" 
            type="button" 
            variant="secondary"
            aria-label="取消當前操作"
          />
        </div>
        <p id="submit-help" class="text-sm text-gray-600">
          點擊提交按鈕將會保存您的信息
        </p>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: '展示可訪問性功能：aria-label、aria-describedby、適當的按鈕類型'
      }
    }
  }
}

// 主題適配展示
export const ThemeAdaptation: Story = {
  render: () => ({
    components: { SmartButton, StarIcon },
    template: `
      <div class="space-y-6">
        <!-- 淺色主題 -->
        <div data-theme="light" class="p-4 bg-white border rounded-lg">
          <h3 class="mb-4 text-lg font-semibold">淺色主題</h3>
          <div class="space-x-4">
            <SmartButton text="Primary" variant="primary" />
            <SmartButton text="Secondary" variant="secondary" />
            <SmartButton text="Outline" variant="outline" />
            <SmartButton text="收藏" :icon="StarIcon" badge="5" />
          </div>
        </div>
        
        <!-- 深色主題已移除 -->
        
        <!-- 高對比度主題 -->
        <div data-theme="highContrast" class="p-4 bg-white border-2 border-black rounded-lg">
          <h3 class="mb-4 text-lg font-semibold">高對比度主題</h3>
          <div class="space-x-4">
            <SmartButton text="Primary" variant="primary" />
            <SmartButton text="Secondary" variant="secondary" />
            <SmartButton text="Outline" variant="outline" />
            <SmartButton text="收藏" :icon="StarIcon" badge="5" />
          </div>
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: '展示按鈕在不同主題下的適配效果'
      }
    }
  }
}

// 交互式測試
export const Interactive: Story = {
  render: () => ({
    components: { SmartButton, PlusIcon },
    data() {
      return {
        clickCount: 0,
        isLoading: false
      }
    },
    methods: {
      handleClick() {
        this.clickCount++
      },
      async handleAsyncAction() {
        this.isLoading = true
        // 模擬異步操作
        await new Promise(resolve => setTimeout(resolve, 2000))
        this.isLoading = false
        this.clickCount++
      }
    },
    template: `
      <div class="space-y-4">
        <div class="space-x-4">
          <SmartButton 
            text="點擊計數" 
            @click="handleClick"
          />
          <SmartButton 
            text="異步操作" 
            :loading="isLoading"
            @click="handleAsyncAction"
            variant="secondary"
          />
        </div>
        <p class="text-sm text-gray-600">
          點擊次數: {{ clickCount }}
        </p>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: '交互式測試：點擊計數和異步操作載入狀態'
      }
    }
  }
}

// 複雜組合展示
export const ComplexCombinations: Story = {
  render: () => ({
    components: { SmartButton, PlusIcon, TrashIcon, CheckIcon, XMarkIcon },
    template: `
      <div class="space-y-6">
        <!-- 表單操作按鈕組 -->
        <div class="space-y-2">
          <h4 class="text-sm font-medium text-gray-700">表單操作</h4>
          <div class="flex space-x-3">
            <SmartButton 
              text="保存" 
              :icon="CheckIcon" 
              type="submit"
              variant="primary"
              size="lg"
            />
            <SmartButton 
              text="取消" 
              :icon="XMarkIcon" 
              type="button"
              variant="secondary"
              size="lg"
            />
          </div>
        </div>
        
        <!-- 工具欄按鈕組 -->
        <div class="space-y-2">
          <h4 class="text-sm font-medium text-gray-700">工具欄</h4>
          <div class="flex space-x-2">
            <SmartButton 
              text="新增" 
              :icon="PlusIcon" 
              icon-only
              size="sm"
              aria-label="新增項目"
            />
            <SmartButton 
              text="刪除" 
              :icon="TrashIcon" 
              icon-only
              variant="danger"
              size="sm"
              aria-label="刪除選中項目"
            />
            <SmartButton 
              text="批量操作" 
              badge="3"
              variant="outline"
              size="sm"
            />
          </div>
        </div>
        
        <!-- 移動端適配 -->
        <div class="space-y-2">
          <h4 class="text-sm font-medium text-gray-700">移動端適配</h4>
          <div class="space-y-3">
            <SmartButton 
              text="全寬主要操作" 
              full-width
              size="lg"
              variant="primary"
            />
            <div class="grid grid-cols-2 gap-3">
              <SmartButton 
                text="次要操作" 
                variant="secondary"
                size="lg"
              />
              <SmartButton 
                text="取消" 
                variant="ghost"
                size="lg"
              />
            </div>
          </div>
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: '展示複雜的按鈕組合使用場景：表單操作、工具欄、移動端適配'
      }
    }
  }
}
