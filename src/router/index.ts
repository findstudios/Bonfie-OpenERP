import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authSupabase'
import type { RouteRecordRaw } from 'vue-router'
import { createLogger } from '@/utils/logger'

const log = createLogger('Router')

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: {
      requiresAuth: false,
      title: '登入'
    }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/views/ResetPasswordView.vue'),
    meta: {
      requiresAuth: false,
      title: '重設密碼'
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: {
      requiresAuth: true,
      title: '儀表板',
      roles: ['ADMIN', 'STAFF', 'TEACHER']
    }
  },
  {
    path: '/students',
    name: 'Students',
    children: [
      {
        path: '',
        name: 'StudentList',
        component: () => import('@/views/students/StudentListView.vue'),
        meta: {
          requiresAuth: true,
          title: '學生管理',
          roles: ['ADMIN', 'STAFF']
        }
      },
      {
        path: 'create',
        name: 'StudentCreate',
        component: () => import('@/views/students/StudentFormView.vue'),
        meta: {
          requiresAuth: true,
          title: '新增學生',
          roles: ['ADMIN', 'STAFF']
        }
      },
      {
        path: ':id/edit',
        name: 'StudentEdit',
        component: () => import('@/views/students/StudentFormView.vue'),
        meta: {
          requiresAuth: true,
          title: '編輯學生',
          roles: ['ADMIN', 'STAFF']
        }
      },
      {
        path: ':id',
        name: 'StudentDetail',
        component: () => import('@/views/students/StudentDetailView.vue'),
        meta: {
          requiresAuth: true,
          title: '學生詳情',
          roles: ['ADMIN', 'STAFF', 'TEACHER']
        }
      }
    ]
  },
  {
    path: '/courses',
    name: 'Courses',
    children: [
      {
        path: '',
        name: 'CourseList',
        component: () => import('@/views/courses/CourseListView.vue'),
        meta: {
          requiresAuth: true,
          title: '課程管理',
          roles: ['ADMIN', 'STAFF']
        }
      },
      {
        path: 'create',
        name: 'CourseCreate',
        component: () => import('@/views/courses/CourseFormView.vue'),
        meta: {
          requiresAuth: true,
          title: '新增課程',
          roles: ['ADMIN', 'STAFF']
        }
      },
      {
        path: ':id/edit',
        name: 'CourseEdit',
        component: () => import('@/views/courses/CourseFormView.vue'),
        meta: {
          requiresAuth: true,
          title: '編輯課程',
          roles: ['ADMIN', 'STAFF']
        }
      },
      {
        path: ':id/packages',
        name: 'CoursePackages',
        component: () => import('@/views/courses/CoursePackageManagement.vue'),
        meta: {
          requiresAuth: true,
          title: '方案管理',
          roles: ['ADMIN', 'STAFF']
        }
      },
      {
        path: ':id',
        name: 'CourseDetail',
        component: () => import('@/views/courses/CourseDetailView.vue'),
        meta: {
          requiresAuth: true,
          title: '課程詳情',
          roles: ['ADMIN', 'STAFF', 'TEACHER']
        }
      }
    ]
  },
  {
    path: '/schedule',
    name: 'Schedule',
    component: () => import('@/views/schedule/ScheduleView.vue'),
    meta: {
      requiresAuth: true,
      title: '課程行事曆',
      roles: ['ADMIN', 'STAFF', 'TEACHER']
    }
  },
  {
    path: '/attendance',
    name: 'Attendance',
    children: [
      {
        path: '',
        name: 'AttendanceList',
        component: () => import('@/views/attendance/AttendanceListView.vue'),
        meta: {
          requiresAuth: true,
          title: '出席管理',
          roles: ['ADMIN', 'STAFF', 'TEACHER']
        }
      },
      {
        path: 'take',
        name: 'AttendanceTake',
        component: () => import('@/views/attendance/AttendanceTakeView.vue'),
        meta: {
          requiresAuth: true,
          title: '課程點名',
          roles: ['ADMIN', 'STAFF', 'TEACHER']
        }
      },
      {
        path: 'take/:id',
        name: 'AttendanceTakeWithId',
        component: () => import('@/views/attendance/AttendanceTakeView.vue'),
        meta: {
          requiresAuth: true,
          title: '課程點名',
          roles: ['ADMIN', 'STAFF', 'TEACHER']
        }
      }
    ]
  },
  {
    path: '/contacts',
    name: 'Contacts',
    children: [
      {
        path: '',
        name: 'ContactList',
        component: () => import('@/views/contacts/ContactListView.vue'),
        meta: {
          requiresAuth: true,
          title: '聯絡人管理',
          roles: ['ADMIN', 'STAFF']
        }
      },
      {
        path: 'create',
        name: 'ContactCreate',
        component: () => import('@/views/contacts/ContactFormView.vue'),
        meta: {
          requiresAuth: true,
          title: '新增聯絡人',
          roles: ['ADMIN', 'STAFF']
        }
      },
      {
        path: ':id/edit',
        name: 'ContactEdit',
        component: () => import('@/views/contacts/ContactFormView.vue'),
        meta: {
          requiresAuth: true,
          title: '編輯聯絡人',
          roles: ['ADMIN', 'STAFF']
        }
      },
      {
        path: ':id',
        name: 'ContactDetail',
        component: () => import('@/views/contacts/ContactDetailView.vue'),
        meta: {
          requiresAuth: true,
          title: '聯絡人詳情',
          roles: ['ADMIN', 'STAFF']
        }
      }
    ]
  },
  {
    path: '/orders',
    name: 'Orders',
    children: [
      {
        path: '',
        name: 'OrderList',
        component: () => import('@/views/orders/OrderListView.vue'),
        meta: {
          requiresAuth: true,
          title: '訂單管理',
          roles: ['ADMIN', 'STAFF']
        }
      },
      {
        path: 'create',
        name: 'OrderCreate',
        component: () => import('@/views/orders/OrderFormView.vue'),
        meta: {
          requiresAuth: true,
          title: '新增訂單',
          roles: ['ADMIN', 'STAFF']
        }
      },
      {
        path: 'create-simplified',
        name: 'OrderCreateSimplified',
        component: () => import('@/views/orders/OrderFormSimplified.vue'),
        meta: {
          requiresAuth: true,
          title: '快速建立訂單',
          roles: ['ADMIN', 'STAFF']
        }
      },
      {
        path: ':id',
        name: 'OrderDetail',
        component: () => import('@/views/orders/OrderDetailView.vue'),
        meta: {
          requiresAuth: true,
          title: '訂單詳情',
          roles: ['ADMIN', 'STAFF']
        }
      }
    ]
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/views/reports/ReportsView.vue'),
    meta: {
      requiresAuth: true,
      title: '報表統計',
      roles: ['ADMIN', 'STAFF']
    }
  },
  {
    path: '/crm',
    name: 'CRM',
    children: [
      {
        path: '',
        name: 'CRMDashboard',
        component: () => import('@/views/crm/CRMDashboard.vue'),
        meta: {
          requiresAuth: true,
          title: '客戶關係管理',
          roles: ['ADMIN', 'STAFF']
        }
      },
      {
        path: 'leads',
        name: 'LeadList',
        component: () => import('@/views/crm/LeadListView.vue'),
        meta: {
          requiresAuth: true,
          title: '潛在客戶',
          roles: ['ADMIN', 'STAFF']
        }
      },
      {
        path: 'leads/:id',
        name: 'LeadDetail',
        component: () => import('@/views/crm/LeadDetailView.vue'),
        meta: {
          requiresAuth: true,
          title: '客戶詳情',
          roles: ['ADMIN', 'STAFF']
        }
      },
      {
        path: 'follow-ups',
        name: 'FollowUpList',
        component: () => import('@/views/crm/FollowUpListView.vue'),
        meta: {
          requiresAuth: true,
          title: '追蹤記錄',
          roles: ['ADMIN', 'STAFF']
        }
      },
      {
        path: 'trials',
        name: 'TrialClassList',
        component: () => import('@/views/crm/TrialClassListView.vue'),
        meta: {
          requiresAuth: true,
          title: '試聽課程',
          roles: ['ADMIN', 'STAFF']
        }
      },
      {
        path: 'trials/:id',
        name: 'TrialClassDetail',
        component: () => import('@/views/crm/TrialClassDetailView.vue'),
        meta: {
          requiresAuth: true,
          title: '試聽課程詳情',
          roles: ['ADMIN', 'STAFF']
        }
      }
    ]
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/settings/TutoringCenterSettingsView.vue'),
    meta: {
      requiresAuth: true,
      title: '系統設定',
      roles: ['ADMIN']
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/auth/ProfileView.vue'),
    meta: {
      requiresAuth: true,
      title: '個人資料',
      roles: ['ADMIN', 'STAFF', 'TEACHER']
    }
  },
  {
    path: '/dev/package-data',
    name: 'PackageData',
    component: () => import('@/views/dev/PackageDataView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Supabase 套餐資料',
      roles: ['ADMIN']
    }
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/errors/NotFoundView.vue'),
    meta: {
      requiresAuth: false,
      title: '頁面不存在'
    }
  }
]

// 創建路由實例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 返回保存的滾動位置或回到頂部
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 導入認證初始化
import { waitForAuth } from '@/utils/authInitializer'

// 定義公開路由清單（不需要登入的頁面）
const publicRoutes = ['/login', '/reset-password', '/404']

// 全局路由守衛
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false // 預設需要認證
  const requiredRoles = to.meta.roles as string[]

  // 設置頁面標題
  if (to.meta.title) {
    document.title = `${to.meta.title} - OpenERP管理系統`
  }

  // 檢查是否為公開路由
  const isPublicRoute = publicRoutes.some(route => to.path.startsWith(route))

  // 等待認證初始化完成
  log.log('檢查認證狀態...')
  const initialized = await waitForAuth()

  if (!initialized) {
    console.error('[Router] 認證初始化失敗')
    // 如果不是公開路由且需要認證，重定向到登入頁
    if (!isPublicRoute && requiresAuth) {
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 保存原本要訪問的路徑
      })
      return
    }
  }

  // 檢查是否需要認證
  if (requiresAuth && !isPublicRoute) {
    if (!authStore.isAuthenticated) {
      // 未登入，重定向到登入頁
      log.log('用戶未登入，重定向到登入頁')
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 保存原本要訪問的路徑
      })
      return
    }

    // 檢查角色權限
    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = authStore.user?.role?.role_code
      if (!userRole || !requiredRoles.includes(userRole)) {
        // 權限不足，重定向到儀表板或403頁面
        log.log('用戶權限不足，重定向到儀表板')
        next('/dashboard')
        return
      }
    }
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    // 已登入用戶訪問登入頁
    const redirectPath = to.query.redirect as string || '/dashboard'
    log.log('已登入用戶訪問登入頁，重定向到:', redirectPath)
    next(redirectPath)
    return
  }

  // 處理重設密碼頁面的特殊邏輯
  if (to.path === '/reset-password') {
    // 檢查是否有重設密碼的 token（來自 Supabase 的郵件連結）
    const hasResetToken = to.query.type === 'recovery' && to.query.access_token
    if (!hasResetToken && authStore.isAuthenticated) {
      // 已登入且沒有 reset token，重定向到個人資料頁
      next('/profile')
      return
    }
  }

  next()
})

// 全局後置守衛（用於清理或記錄）
router.afterEach((to, from) => {
  // 記錄路由切換
  log.log('路由切換:', from.path, '->', to.path)
})

export default router
