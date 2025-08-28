import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DashboardView from '../DashboardView.vue'
import { useAuthStore } from '@/stores/authSupabase'
import { nextTick } from 'vue'

// Mock 路由
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock composables
const mockLoadTodaySchedules = vi.fn(() => Promise.resolve())
const mockLoadTrackingItems = vi.fn(() => Promise.resolve())
const mockLoadHandoverNotes = vi.fn(() => Promise.resolve())
const mockHandleItemComplete = vi.fn(() => Promise.resolve())
const mockHandleAddNote = vi.fn(() => Promise.resolve())
const mockHandleMarkRead = vi.fn(() => Promise.resolve())
const mockHandleDeleteNote = vi.fn(() => Promise.resolve())
const mockHandleMentionClicked = vi.fn(() => Promise.resolve())

vi.mock('@/composables/dashboard/useScheduleData', () => ({
  useScheduleData: () => ({
    todaySchedules: { value: [] },
    scheduleStudents: { value: new Map() },
    attendanceRecords: { value: new Map() },
    loading: { value: false },
    loadTodaySchedules: mockLoadTodaySchedules,
    attendanceRate: { value: 0 }
  })
}))

vi.mock('@/composables/dashboard/useTrackingData', () => ({
  useTrackingData: () => ({
    trackingItems: { value: [] },
    trackingLoading: { value: false },
    loadTrackingItems: mockLoadTrackingItems,
    handleItemComplete: mockHandleItemComplete
  })
}))

vi.mock('@/composables/dashboard/useHandoverData', () => ({
  useHandoverData: () => ({
    handoverNotes: { value: [] },
    loadHandoverNotes: mockLoadHandoverNotes,
    handleAddNote: mockHandleAddNote,
    handleMarkRead: mockHandleMarkRead,
    handleDeleteNote: mockHandleDeleteNote,
    handleMentionClicked: mockHandleMentionClicked
  })
}))

describe('DashboardView', () => {
  let wrapper: any
  let authStore: any

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    authStore.user = {
      user_id: 'test-user',
      full_name: '測試使用者'
    }

    // Clear all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('組件結構', () => {
    it('應該正確渲染主要區塊', async () => {
      wrapper = mount(DashboardView, {
        global: {
          stubs: {
            MainLayout: { template: '<div><slot /></div>' },
            TodaySchedules: { template: '<div class="today-schedules">今日課程</div>' },
            DashboardTrackingList: { template: '<div class="dashboard-tracking-list">追蹤名單</div>' },
            HandoverNotes: { template: '<div class="handover-notes">交班記錄</div>' },
            StudentSearchBox: true,
            RouterLink: { template: '<a><slot /></a>' }
          }
        }
      })

      await nextTick()

      // 檢查標題
      expect(wrapper.text()).toContain('今日學生管理')

      // 檢查主要區塊是否存在
      expect(wrapper.find('.today-schedules').exists()).toBe(true)
      expect(wrapper.find('.dashboard-tracking-list').exists()).toBe(true)
      expect(wrapper.find('.handover-notes').exists()).toBe(true)

      // 檢查操作按鈕 - RouterLink 被 stub 了，檢查 RouterLink 存在且有正確的 to 屬性
      expect(wrapper.find('router-link-stub[to="/students/create"]').exists()).toBe(true)
      expect(wrapper.find('router-link-stub[to="/orders/create"]').exists()).toBe(true)
    })

    it('應該顯示當前日期和使用者名稱', async () => {
      wrapper = mount(DashboardView, {
        global: {
          stubs: {
            MainLayout: { template: '<div><slot /></div>' },
            TodaySchedules: true,
            DashboardTrackingList: true,
            HandoverNotes: true,
            StudentSearchBox: true,
            RouterLink: { template: '<a><slot /></a>' }
          }
        }
      })

      await nextTick()

      expect(wrapper.text()).toContain('測試使用者')
    })
  })

  describe('資料載入', () => {
    it('應該在掛載時載入所有必要資料', async () => {
      wrapper = mount(DashboardView, {
        global: {
          stubs: {
            MainLayout: { template: '<div><slot /></div>' },
            TodaySchedules: true,
            DashboardTrackingList: true,
            HandoverNotes: true,
            StudentSearchBox: true,
            RouterLink: { template: '<a><slot /></a>' }
          }
        }
      })

      await nextTick()

      // 確認各個載入函數被調用
      expect(mockLoadTodaySchedules).toHaveBeenCalledTimes(1)
      expect(mockLoadTrackingItems).toHaveBeenCalledTimes(1)
      expect(mockLoadHandoverNotes).toHaveBeenCalledTimes(1)
    })
  })

  describe('互動功能', () => {
    it('應該處理學生選擇事件', async () => {
      wrapper = mount(DashboardView, {
        global: {
          stubs: {
            MainLayout: { template: '<div><slot /></div>' },
            TodaySchedules: true,
            DashboardTrackingList: true,
            HandoverNotes: true,
            StudentSearchBox: {
              name: 'StudentSearchBox',
              template: '<div class="student-search-box" @click="handleClick"></div>',
              emits: ['select'],
              methods: {
                handleClick() {
                  this.$emit('select', { student_id: 'STU001' })
                }
              }
            },
            RouterLink: { template: '<a><slot /></a>' }
          }
        }
      })

      // Find and click the student search box
      const studentSearchBox = wrapper.find('.student-search-box')
      await studentSearchBox.trigger('click')
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(mockPush).toHaveBeenCalledWith('/students/STU001')
    })
  })

  describe('定時更新', () => {
    it('應該設置定時器更新資料', async () => {
      vi.useFakeTimers()
      const setIntervalSpy = vi.spyOn(window, 'setInterval')

      wrapper = mount(DashboardView, {
        global: {
          stubs: {
            MainLayout: { template: '<div><slot /></div>' },
            TodaySchedules: true,
            DashboardTrackingList: true,
            HandoverNotes: true,
            StudentSearchBox: true,
            RouterLink: { template: '<a><slot /></a>' }
          }
        }
      })

      // Run pending timers to trigger onMounted
      await vi.runOnlyPendingTimersAsync()

      // 應該設置兩個定時器：時間更新（每秒）和資料更新（每5分鐘）
      expect(setIntervalSpy).toHaveBeenCalledTimes(2)
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000)
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 300000)

      vi.useRealTimers()
    })

    it('應該在卸載時清理定時器', async () => {
      vi.useFakeTimers()
      const clearIntervalSpy = vi.spyOn(window, 'clearInterval')

      wrapper = mount(DashboardView, {
        global: {
          stubs: {
            MainLayout: { template: '<div><slot /></div>' },
            TodaySchedules: true,
            DashboardTrackingList: true,
            HandoverNotes: true,
            StudentSearchBox: true,
            RouterLink: { template: '<a><slot /></a>' }
          }
        }
      })

      // Run pending timers to trigger onMounted
      await vi.runOnlyPendingTimersAsync()

      // Unmount the component
      wrapper.unmount()
      wrapper = null

      // 應該清理兩個定時器
      expect(clearIntervalSpy).toHaveBeenCalledTimes(2)

      vi.useRealTimers()
    })
  })
})
