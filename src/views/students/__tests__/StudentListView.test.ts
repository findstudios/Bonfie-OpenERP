import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import StudentListView from '../StudentListView.vue'

// Mock Supabase
vi.mock('@/services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({
            data: [
              {
                id: 1,
                student_id: 'STU001',
                chinese_name: '張小明',
                english_name: 'John Zhang',
                created_at: '2024-01-15',
                student_contacts: [{
                  is_primary: true,
                  relationship: '母親',
                  contacts: {
                    full_name: '張媽媽',
                    phone: '0912345678'
                  }
                }],
                enrollments: [{
                  enrollment_id: 'ENR001',
                  status: 'active',
                  remaining_sessions: 5,
                  validity_end_date: '2024-06-30',
                  course: {
                    course_id: 'CRS001',
                    course_name: '數學基礎班'
                  }
                }]
              },
              {
                id: 2,
                student_id: 'STU002',
                chinese_name: '李小華',
                english_name: 'Amy Lee',
                created_at: '2024-01-20',
                student_contacts: [{
                  is_primary: true,
                  relationship: '父親',
                  contacts: {
                    full_name: '李爸爸',
                    phone: '0923456789'
                  }
                }],
                enrollments: [{
                  enrollment_id: 'ENR002',
                  status: 'active',
                  remaining_sessions: 10,
                  validity_end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  course: {
                    course_id: 'CRS002',
                    course_name: '英文會話班'
                  }
                }]
              }
            ],
            error: null
          }))
        }))
      }))
    }))
  },
  db: {
    delete: vi.fn()
  }
}))

// Mock Heroicons
vi.mock('@heroicons/vue/24/outline', () => ({
  PlusIcon: { template: '<div>PlusIcon</div>' },
  UserGroupIcon: { template: '<div>UserGroupIcon</div>' },
  TableCellsIcon: { template: '<div>TableCellsIcon</div>' },
  ChevronUpIcon: { template: '<div>ChevronUpIcon</div>' },
  ChevronDownIcon: { template: '<div>ChevronDownIcon</div>' },
  Squares2X2Icon: { template: '<div>Squares2X2Icon</div>' }
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => JSON.stringify({ id: 'user123', role: 'ADMIN' })),
  setItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('StudentListView - Validity Period Display', () => {
  let wrapper: any
  let router: any

  beforeEach(() => {
    // Create router
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/students', component: { template: '<div></div>' } },
        { path: '/students/:id', component: { template: '<div></div>' } }
      ]
    })

    // Create pinia
    const pinia = createPinia()
  })

  it('should display validity end date for each enrollment', async () => {
    wrapper = mount(StudentListView, {
      global: {
        plugins: [router, createPinia()],
        stubs: {
          MainLayout: { template: '<div><slot /></div>' },
          ResponsiveTable: {
            template: `
              <div>
                <table>
                  <tbody>
                    <tr v-for="item in data" :key="item.id">
                      <td>
                        <slot name="cell-student_info" :item="item" />
                      </td>
                      <td>
                        <slot name="cell-validity_period" :item="item" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            `,
            props: ['data']
          },
          ConfirmDialog: { template: '<div></div>' }
        }
      }
    })

    // Wait for component to mount and data to load
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check if validity period is displayed
    const validityPeriods = wrapper.findAll('[data-testid="validity-period"]')
    expect(validityPeriods.length).toBe(2)

    // Check first student's validity period
    expect(validityPeriods[0].text()).toContain('2024年6月30日')

    // Check second student's validity period (we just need to check it exists since date is dynamic)
    expect(validityPeriods[1].text()).toBeTruthy()
  })

  it('should highlight validity periods expiring soon', async () => {
    wrapper = mount(StudentListView, {
      global: {
        plugins: [router, createPinia()],
        stubs: {
          MainLayout: { template: '<div><slot /></div>' },
          ResponsiveTable: {
            template: `
              <div>
                <table>
                  <tbody>
                    <tr v-for="item in data" :key="item.id">
                      <td>
                        <slot name="cell-validity_period" :item="item" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            `,
            props: ['data']
          },
          ConfirmDialog: { template: '<div></div>' }
        }
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check if expiring soon enrollments are highlighted
    const expiringItems = wrapper.findAll('[data-testid="validity-expiring-soon"]')
    expect(expiringItems.length).toBeGreaterThan(0)
  })

  it('should show "no validity period" for enrollments without end date', async () => {
    // Mock data with enrollment without validity_end_date
    const { supabase } = await import('@/services/supabase')
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({
            data: [{
              id: 3,
              student_id: 'STU003',
              chinese_name: '王小寶',
              enrollments: [{
                enrollment_id: 'ENR003',
                status: 'active',
                remaining_sessions: 20,
                validity_end_date: null,
                course: {
                  course_id: 'CRS003',
                  course_name: '鋼琴課'
                }
              }]
            }],
            error: null
          }))
        }))
      }))
    } as any)

    wrapper = mount(StudentListView, {
      global: {
        plugins: [router, createPinia()],
        stubs: {
          MainLayout: { template: '<div><slot /></div>' },
          ResponsiveTable: {
            template: `
              <div>
                <table>
                  <tbody>
                    <tr v-for="item in data" :key="item.id">
                      <td>
                        <slot name="cell-validity_period" :item="item" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            `,
            props: ['data']
          },
          ConfirmDialog: { template: '<div></div>' }
        }
      }
    })

    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    const noValidityText = wrapper.find('[data-testid="no-validity-period"]')
    expect(noValidityText.exists()).toBe(true)
    expect(noValidityText.text()).toBe('無期限')
  })
})
