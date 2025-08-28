import type { Meta, StoryObj } from '@storybook/vue3'
import { action } from '@storybook/addon-actions'
import { UserIcon, EnvelopeIcon, LockClosedIcon, PhoneIcon } from '@heroicons/vue/24/outline'
import SmartForm from './SmartForm.vue'
import SmartFormField from './SmartFormField.vue'
import type { ValidationRule } from './types'

const meta: Meta<typeof SmartForm> = {
  title: 'UI Components/SmartForm',
  component: SmartForm,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: '智能表單組件，支援自動佈局、驗證、進度指示和自動保存功能。'
      }
    }
  },
  argTypes: {
    layout: {
      control: 'select',
      options: ['vertical', 'horizontal', 'grid']
    },
    spacing: {
      control: 'select',
      options: ['compact', 'normal', 'relaxed']
    },
    maxWidth: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl']
    },
    mobileLayout: {
      control: 'select',
      options: ['stack', 'grid']
    },
    mobileActionsLayout: {
      control: 'select',
      options: ['stack', 'horizontal']
    }
  }
}

export default meta
type Story = StoryObj<typeof SmartForm>

// 基本表單
export const Basic: Story = {
  render: (args) => ({
    components: { SmartForm, SmartFormField },
    setup() {
      const initialValues = {
        username: '',
        email: '',
        password: ''
      }

      const validationRules: Record<string, ValidationRule[]> = {
        username: [
          { required: true, message: '用戶名為必填項' },
          { minLength: 3, message: '用戶名至少需要3個字符' }
        ],
        email: [
          { required: true, message: '電子郵件為必填項' },
          { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '請輸入有效的電子郵件地址' }
        ],
        password: [
          { required: true, message: '密碼為必填項' },
          { minLength: 6, message: '密碼至少需要6個字符' }
        ]
      }

      return {
        args,
        initialValues,
        validationRules,
        UserIcon,
        EnvelopeIcon,
        LockClosedIcon,
        onSubmit: action('submit'),
        onCancel: action('cancel'),
        onAutoSave: action('auto-save')
      }
    },
    template: `
      <SmartForm
        v-bind="args"
        :initial-values="initialValues"
        :validation-rules="validationRules"
        @submit="onSubmit"
        @cancel="onCancel"
        @auto-save="onAutoSave"
      >
        <SmartFormField
          name="username"
          label="用戶名"
          placeholder="請輸入用戶名"
          :prefix-icon="UserIcon"
          required
        />
        
        <SmartFormField
          name="email"
          label="電子郵件"
          type="email"
          placeholder="請輸入電子郵件"
          :prefix-icon="EnvelopeIcon"
          help="我們將向此郵箱發送驗證信息"
          required
        />
        
        <SmartFormField
          name="password"
          label="密碼"
          type="password"
          placeholder="請輸入密碼"
          :prefix-icon="LockClosedIcon"
          required
        />
      </SmartForm>
    `
  }),
  args: {
    title: '用戶註冊',
    description: '請填寫以下信息完成註冊',
    submitText: '註冊',
    cancelText: '取消'
  }
}

// 網格佈局表單
export const GridLayout: Story = {
  render: (args) => ({
    components: { SmartForm, SmartFormField },
    setup() {
      const initialValues = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: ''
      }

      const validationRules: Record<string, ValidationRule[]> = {
        firstName: [{ required: true, message: '名字為必填項' }],
        lastName: [{ required: true, message: '姓氏為必填項' }],
        email: [
          { required: true, message: '電子郵件為必填項' },
          { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '請輸入有效的電子郵件地址' }
        ]
      }

      return {
        args,
        initialValues,
        validationRules,
        PhoneIcon,
        EnvelopeIcon,
        onSubmit: action('submit')
      }
    },
    template: `
      <SmartForm
        v-bind="args"
        :initial-values="initialValues"
        :validation-rules="validationRules"
        @submit="onSubmit"
      >
        <SmartFormField
          name="firstName"
          label="名字"
          placeholder="請輸入名字"
          required
        />
        
        <SmartFormField
          name="lastName"
          label="姓氏"
          placeholder="請輸入姓氏"
          required
        />
        
        <SmartFormField
          name="email"
          label="電子郵件"
          type="email"
          placeholder="請輸入電子郵件"
          :prefix-icon="EnvelopeIcon"
          required
        />
        
        <SmartFormField
          name="phone"
          label="電話號碼"
          placeholder="請輸入電話號碼"
          :prefix-icon="PhoneIcon"
        />
        
        <SmartFormField
          name="address"
          label="地址"
          placeholder="請輸入地址"
          :span="2"
        />
        
        <SmartFormField
          name="city"
          label="城市"
          placeholder="請輸入城市"
        />
      </SmartForm>
    `
  }),
  args: {
    title: '個人信息',
    description: '請填寫您的個人信息',
    layout: 'grid',
    tabletCols: 2,
    desktopCols: 3,
    submitText: '保存'
  }
}

// 水平佈局表單
export const HorizontalLayout: Story = {
  render: (args) => ({
    components: { SmartForm, SmartFormField },
    setup() {
      const initialValues = {
        username: '',
        email: '',
        bio: ''
      }

      const validationRules: Record<string, ValidationRule[]> = {
        username: [{ required: true, message: '用戶名為必填項' }],
        email: [{ required: true, message: '電子郵件為必填項' }]
      }

      return {
        args,
        initialValues,
        validationRules,
        UserIcon,
        EnvelopeIcon,
        onSubmit: action('submit')
      }
    },
    template: `
      <SmartForm
        v-bind="args"
        :initial-values="initialValues"
        :validation-rules="validationRules"
        @submit="onSubmit"
      >
        <SmartFormField
          name="username"
          label="用戶名"
          placeholder="請輸入用戶名"
          :prefix-icon="UserIcon"
          layout="horizontal"
          label-width="6rem"
          required
        />
        
        <SmartFormField
          name="email"
          label="電子郵件"
          type="email"
          placeholder="請輸入電子郵件"
          :prefix-icon="EnvelopeIcon"
          layout="horizontal"
          label-width="6rem"
          required
        />
        
        <SmartFormField
          name="bio"
          label="個人簡介"
          placeholder="請輸入個人簡介"
          layout="horizontal"
          label-width="6rem"
        >
          <template #default="{ fieldId, value, inputClasses, onInput, onBlur }">
            <textarea
              :id="fieldId"
              :value="value"
              :class="inputClasses"
              placeholder="請輸入個人簡介"
              rows="3"
              @input="onInput"
              @blur="onBlur"
            />
          </template>
        </SmartFormField>
      </SmartForm>
    `
  }),
  args: {
    title: '用戶資料',
    layout: 'horizontal',
    submitText: '更新'
  }
}

// 帶進度的表單
export const WithProgress: Story = {
  render: (args) => ({
    components: { SmartForm, SmartFormField },
    setup() {
      const initialValues = {
        name: '',
        email: '',
        preferences: ''
      }

      const validationRules: Record<string, ValidationRule[]> = {
        name: [{ required: true, message: '姓名為必填項' }],
        email: [{ required: true, message: '電子郵件為必填項' }]
      }

      return {
        args,
        initialValues,
        validationRules,
        onSubmit: action('submit')
      }
    },
    template: `
      <SmartForm
        v-bind="args"
        :initial-values="initialValues"
        :validation-rules="validationRules"
        @submit="onSubmit"
      >
        <SmartFormField
          name="name"
          label="姓名"
          placeholder="請輸入姓名"
          required
        />
        
        <SmartFormField
          name="email"
          label="電子郵件"
          type="email"
          placeholder="請輸入電子郵件"
          required
        />
        
        <SmartFormField
          name="preferences"
          label="偏好設置"
          placeholder="請輸入偏好設置"
        />
      </SmartForm>
    `
  }),
  args: {
    title: '設置向導',
    description: '請按步驟完成設置',
    showProgress: true,
    totalSteps: 3,
    currentStep: 2,
    submitText: '下一步'
  }
}

// 自動保存表單
export const WithAutoSave: Story = {
  render: (args) => ({
    components: { SmartForm, SmartFormField },
    setup() {
      const initialValues = {
        title: '',
        content: '',
        tags: ''
      }

      const validationRules: Record<string, ValidationRule[]> = {
        title: [{ required: true, message: '標題為必填項' }],
        content: [{ required: true, message: '內容為必填項' }]
      }

      return {
        args,
        initialValues,
        validationRules,
        onSubmit: action('submit'),
        onAutoSave: action('auto-save')
      }
    },
    template: `
      <SmartForm
        v-bind="args"
        :initial-values="initialValues"
        :validation-rules="validationRules"
        @submit="onSubmit"
        @auto-save="onAutoSave"
      >
        <SmartFormField
          name="title"
          label="標題"
          placeholder="請輸入標題"
          required
        />
        
        <SmartFormField
          name="content"
          label="內容"
          placeholder="請輸入內容"
          required
        >
          <template #default="{ fieldId, value, inputClasses, onInput, onBlur }">
            <textarea
              :id="fieldId"
              :value="value"
              :class="inputClasses"
              placeholder="請輸入內容"
              rows="6"
              @input="onInput"
              @blur="onBlur"
            />
          </template>
        </SmartFormField>
        
        <SmartFormField
          name="tags"
          label="標籤"
          placeholder="請輸入標籤，用逗號分隔"
          help="例如：教育, 學習, 課程"
        />
      </SmartForm>
    `
  }),
  args: {
    title: '編輯文章',
    description: '您的更改將自動保存',
    autoSave: {
      enabled: true,
      interval: 3000,
      onlyOnChange: true
    },
    submitText: '發布'
  }
}

// 緊湊間距表單
export const CompactSpacing: Story = {
  render: (args) => ({
    components: { SmartForm, SmartFormField },
    setup() {
      const initialValues = {
        username: '',
        password: '',
        remember: false
      }

      const validationRules: Record<string, ValidationRule[]> = {
        username: [{ required: true, message: '用戶名為必填項' }],
        password: [{ required: true, message: '密碼為必填項' }]
      }

      return {
        args,
        initialValues,
        validationRules,
        UserIcon,
        LockClosedIcon,
        onSubmit: action('submit')
      }
    },
    template: `
      <SmartForm
        v-bind="args"
        :initial-values="initialValues"
        :validation-rules="validationRules"
        @submit="onSubmit"
      >
        <SmartFormField
          name="username"
          label="用戶名"
          placeholder="請輸入用戶名"
          :prefix-icon="UserIcon"
          size="sm"
          required
        />
        
        <SmartFormField
          name="password"
          label="密碼"
          type="password"
          placeholder="請輸入密碼"
          :prefix-icon="LockClosedIcon"
          size="sm"
          required
        />
        
        <SmartFormField
          name="remember"
          label="記住我"
          size="sm"
        >
          <template #default="{ fieldId, value, onInput }">
            <label class="flex items-center space-x-2">
              <input
                :id="fieldId"
                type="checkbox"
                :checked="value"
                @change="onInput"
                class="rounded border-[var(--color-border-primary)] text-[var(--color-primary-500)] focus:ring-[var(--color-primary-500)]"
              />
              <span class="text-sm text-[var(--color-text-primary)]">
                記住我的登錄狀態
              </span>
            </label>
          </template>
        </SmartFormField>
      </SmartForm>
    `
  }),
  args: {
    title: '登錄',
    spacing: 'compact',
    maxWidth: 'md',
    submitText: '登錄',
    showCancel: false
  }
}

// 載入狀態表單
export const Loading: Story = {
  render: (args) => ({
    components: { SmartForm, SmartFormField },
    setup() {
      const initialValues = {
        email: 'user@example.com',
        message: '正在處理您的請求...'
      }

      return {
        args,
        initialValues,
        onSubmit: action('submit')
      }
    },
    template: `
      <SmartForm
        v-bind="args"
        :initial-values="initialValues"
        @submit="onSubmit"
      >
        <SmartFormField
          name="email"
          label="電子郵件"
          type="email"
          disabled
        />
        
        <SmartFormField
          name="message"
          label="狀態"
          disabled
        />
      </SmartForm>
    `
  }),
  args: {
    title: '處理中',
    description: '請稍候，正在處理您的請求',
    loading: true,
    submitText: '處理中...',
    showCancel: false
  }
}
