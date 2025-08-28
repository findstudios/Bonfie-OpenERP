import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CourseFormView from '../CourseFormView.vue'
import { supabase } from '@/services/supabase'

// Mock the router - 只 mock 路由相關功能
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { id: undefined },
    meta: { title: '課程管理' },
    path: '/courses/create',
    fullPath: '/courses/create',
    matched: []
  }),
  useRouter: () => ({
    push: mockPush
  })
}))

// 設置測試用的 localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => '{"user_id": "test-user", "full_name": "測試用戶"}'),
    setItem: vi.fn(),
    removeItem: vi.fn()
  },
  writable: true
})

describe('CourseFormView', () => {
  let testStudentData: any[] = []

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(async () => {
    // 清理測試資料
    if (testStudentData.length > 0) {
      await supabase
        .from('students')
        .delete()
        .in('id', testStudentData.map(s => s.id))
      testStudentData = []
    }
  })

  it('renders student management section', async () => {
    const wrapper = mount(CourseFormView)
    await new Promise(resolve => setTimeout(resolve, 100)) // 等待組件初始化

    expect(wrapper.find('[data-testid="student-management"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('學生名單管理')
  })

  it('shows student count correctly', async () => {
    const wrapper = mount(CourseFormView)
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(wrapper.text()).toContain('已選擇 0 名學生')
  })

  it('can search for students', async () => {
    const wrapper = mount(CourseFormView)
    await new Promise(resolve => setTimeout(resolve, 100))

    const searchInput = wrapper.find('#student_search')
    expect(searchInput.exists()).toBe(true)
    expect(searchInput.attributes('placeholder')).toBe('輸入學生姓名或編號搜尋')

    await searchInput.setValue('張三')
    expect(wrapper.vm.studentSearch).toBe('張三')
  })

  it('shows empty state when no students selected', async () => {
    const wrapper = mount(CourseFormView)
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(wrapper.text()).toContain('尚未選擇任何學生')
    expect(wrapper.text()).toContain('使用上方搜尋功能添加學生到課程中')
  })

  it('can add students to the course', async () => {
    const wrapper = mount(CourseFormView)
    await new Promise(resolve => setTimeout(resolve, 100))

    const mockStudent = {
      id: 999,
      student_id: 'TEST001',
      chinese_name: '測試學生',
      english_name: 'Test Student',
      is_active: true
    }

    wrapper.vm.addStudent(mockStudent)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.selectedStudents).toContain(mockStudent)
    expect(wrapper.text()).toContain('已選擇 1 名學生')
  })

  it('can remove students from the course', async () => {
    const wrapper = mount(CourseFormView)
    await new Promise(resolve => setTimeout(resolve, 100))

    const mockStudent = {
      id: 999,
      student_id: 'TEST001',
      chinese_name: '測試學生',
      is_active: true
    }

    wrapper.vm.addStudent(mockStudent)
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.selectedStudents.length).toBe(1)

    wrapper.vm.removeStudent(999)
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.selectedStudents.length).toBe(0)
  })

  it('respects maximum student limit', async () => {
    const wrapper = mount(CourseFormView)
    await new Promise(resolve => setTimeout(resolve, 100))

    // 設定最大人數為 2
    wrapper.vm.form.max_students = 2

    const mockStudent1 = { id: 997, chinese_name: '測試學生1', student_id: 'TEST001', is_active: true }
    const mockStudent2 = { id: 998, chinese_name: '測試學生2', student_id: 'TEST002', is_active: true }
    const mockStudent3 = { id: 999, chinese_name: '測試學生3', student_id: 'TEST003', is_active: true }

    wrapper.vm.addStudent(mockStudent1)
    wrapper.vm.addStudent(mockStudent2)
    wrapper.vm.addStudent(mockStudent3) // 這個不應該被添加
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.selectedStudents.length).toBe(2)
    expect(wrapper.text()).toContain('已達到課程人數上限')
  })

  it('prevents adding duplicate students', async () => {
    const wrapper = mount(CourseFormView)
    await new Promise(resolve => setTimeout(resolve, 100))

    const mockStudent = {
      id: 999,
      student_id: 'TEST001',
      chinese_name: '測試學生',
      is_active: true
    }

    wrapper.vm.addStudent(mockStudent)
    wrapper.vm.addStudent(mockStudent) // 嘗試重複添加
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.selectedStudents.length).toBe(1)
  })

  it('checks if student is selected correctly', async () => {
    const wrapper = mount(CourseFormView)
    await new Promise(resolve => setTimeout(resolve, 100))

    const mockStudent = {
      id: 999,
      student_id: 'TEST001',
      chinese_name: '測試學生',
      is_active: true
    }

    expect(wrapper.vm.isStudentSelected(999)).toBe(false)

    wrapper.vm.addStudent(mockStudent)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isStudentSelected(999)).toBe(true)
  })
})

describe('CourseFormView - New Fields', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should display course category selection', async () => {
    const wrapper = mount(CourseFormView, {
      global: {
        mocks: {
          $route: {
            params: { id: undefined },
            meta: { title: '課程管理' },
            path: '/courses/create',
            fullPath: '/courses/create',
            matched: []
          }
        }
      }
    })
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check if course category select exists
    const categorySelect = wrapper.find('[data-testid="course-category-select"]')
    expect(categorySelect.exists()).toBe(true)

    // Check if both options are available
    const options = categorySelect.findAll('option')
    expect(options.length).toBe(3) // Including default empty option
    expect(options[1].text()).toBe('主題課程')
    expect(options[1].attributes('value')).toBe('theme')
    expect(options[2].text()).toBe('常態課程')
    expect(options[2].attributes('value')).toBe('regular')
  })

  it('should show package purchase toggle for regular courses', async () => {
    const wrapper = mount(CourseFormView, {
      global: {
        mocks: {
          $route: {
            params: { id: undefined },
            meta: { title: '課程管理' },
            path: '/courses/create',
            fullPath: '/courses/create',
            matched: []
          }
        }
      }
    })
    await new Promise(resolve => setTimeout(resolve, 100))

    // Initially should not show package toggle
    let packageToggle = wrapper.find('[data-testid="package-purchase-toggle"]')
    expect(packageToggle.exists()).toBe(false)

    // Select regular course
    const categorySelect = wrapper.find('[data-testid="course-category-select"]')
    await categorySelect.setValue('regular')
    await wrapper.vm.$nextTick()

    // Now should show package toggle
    packageToggle = wrapper.find('[data-testid="package-purchase-toggle"]')
    expect(packageToggle.exists()).toBe(true)

    // Check label
    const label = wrapper.find('[data-testid="package-purchase-label"]')
    expect(label.text()).toContain('允許套餐購買')
  })

  // TODO: This test needs proper mocking of the supabase database call in edit mode
  it.skip('should show package management link when package purchase is enabled', async () => {
    const wrapper = mount(CourseFormView, {
      global: {
        mocks: {
          $route: {
            params: { id: '123' }, // Editing mode
            meta: { title: '課程管理' },
            path: '/courses/123/edit',
            fullPath: '/courses/123/edit',
            matched: []
          }
        }
      }
    })
    await new Promise(resolve => setTimeout(resolve, 100))

    // Select regular course
    wrapper.vm.form.course_category = 'regular'
    await wrapper.vm.$nextTick()

    // Enable package purchase
    wrapper.vm.form.allow_package_purchase = true
    await wrapper.vm.$nextTick()

    // Check if package management link exists
    const packageLink = wrapper.find('[data-testid="package-management-link"]')
    expect(packageLink.exists()).toBe(true)
    expect(packageLink.text()).toContain('管理套餐')
  })
})
