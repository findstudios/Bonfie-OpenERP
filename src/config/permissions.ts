/**
 * 補習班權限系統配置
 * 根據補習班實際需求重新設計三種角色的權限
 */

// 系統模組定義
export enum Module {
  DASHBOARD = 'dashboard',           // 儀表板
  STUDENTS = 'students',             // 學生管理
  CONTACTS = 'contacts',             // 聯絡人管理
  COURSES = 'courses',               // 課程管理
  SCHEDULES = 'schedules',           // 課程安排
  ATTENDANCE = 'attendance',         // 出勤管理
  ORDERS = 'orders',                 // 訂單管理
  PAYMENTS = 'payments',             // 收費管理
  CRM = 'crm',                       // 客戶關係管理
  REPORTS = 'reports',               // 報表分析
  SETTINGS = 'settings',             // 系統設定
  USER_MANAGEMENT = 'user_management' // 用戶管理
}

// 操作權限定義
export enum Permission {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  IMPORT = 'import'
}

// 角色定義
export enum Role {
  ADMIN = 'ADMIN',       // 管理員 - 完整系統權限
  STAFF = 'STAFF',       // 職員 - 日常營運管理
  TEACHER = 'TEACHER'    // 教師 - 教學相關功能
}

// 權限矩陣配置
export const PERMISSION_MATRIX = {
  [Role.ADMIN]: {
    // 管理員擁有所有權限
    [Module.DASHBOARD]: [Permission.READ],
    [Module.STUDENTS]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.EXPORT, Permission.IMPORT],
    [Module.CONTACTS]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.EXPORT, Permission.IMPORT],
    [Module.COURSES]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.EXPORT],
    [Module.SCHEDULES]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.EXPORT],
    [Module.ATTENDANCE]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.EXPORT],
    [Module.ORDERS]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.EXPORT],
    [Module.PAYMENTS]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.EXPORT],
    [Module.CRM]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.EXPORT],
    [Module.REPORTS]: [Permission.READ, Permission.EXPORT],
    [Module.SETTINGS]: [Permission.READ, Permission.UPDATE],
    [Module.USER_MANAGEMENT]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.DELETE]
  },

  [Role.STAFF]: {
    // 職員負責日常營運，不能訪問系統設定和用戶管理
    [Module.DASHBOARD]: [Permission.READ],
    [Module.STUDENTS]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.EXPORT],
    [Module.CONTACTS]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.EXPORT],
    [Module.COURSES]: [Permission.READ, Permission.CREATE, Permission.UPDATE],
    [Module.SCHEDULES]: [Permission.READ, Permission.CREATE, Permission.UPDATE],
    [Module.ATTENDANCE]: [Permission.READ, Permission.UPDATE, Permission.EXPORT],
    [Module.ORDERS]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.EXPORT],
    [Module.PAYMENTS]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.EXPORT],
    [Module.CRM]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.EXPORT],
    [Module.REPORTS]: [Permission.READ, Permission.EXPORT]
  },

  [Role.TEACHER]: {
    // 教師只能訪問教學相關功能
    [Module.DASHBOARD]: [Permission.READ],
    [Module.STUDENTS]: [Permission.READ],
    [Module.COURSES]: [Permission.READ],
    [Module.SCHEDULES]: [Permission.READ],
    [Module.ATTENDANCE]: [Permission.READ, Permission.CREATE, Permission.UPDATE, Permission.EXPORT]
  }
}

/**
 * 檢查用戶是否有指定模組的權限
 */
export function hasModulePermission(
  userRole: Role,
  module: Module,
  permission: Permission
): boolean {
  const modulePermissions = PERMISSION_MATRIX[userRole]?.[module]
  return modulePermissions?.includes(permission) ?? false
}

/**
 * 檢查用戶是否可以訪問指定模組
 */
export function canAccessModule(userRole: Role, module: Module): boolean {
  return !!PERMISSION_MATRIX[userRole]?.[module]
}

/**
 * 獲取用戶可以訪問的所有模組
 */
export function getAccessibleModules(userRole: Role): Module[] {
  return Object.keys(PERMISSION_MATRIX[userRole] || {}) as Module[]
}

/**
 * 獲取模組的所有可用權限
 */
export function getModulePermissions(userRole: Role, module: Module): Permission[] {
  return PERMISSION_MATRIX[userRole]?.[module] || []
}

// 導航菜單配置 - 根據權限動態顯示
export const NAVIGATION_CONFIG = {
  [Module.DASHBOARD]: {
    title: '儀表板',
    icon: 'HomeIcon',
    path: '/dashboard',
    requiredRoles: [Role.ADMIN, Role.STAFF, Role.TEACHER]
  },
  [Module.STUDENTS]: {
    title: '學生管理',
    icon: 'AcademicCapIcon',
    path: '/students',
    requiredRoles: [Role.ADMIN, Role.STAFF, Role.TEACHER]
  },
  [Module.CONTACTS]: {
    title: '聯絡人',
    icon: 'UserGroupIcon',
    path: '/contacts',
    requiredRoles: [Role.ADMIN, Role.STAFF]
  },
  [Module.COURSES]: {
    title: '課程管理',
    icon: 'BookOpenIcon',
    path: '/courses',
    requiredRoles: [Role.ADMIN, Role.STAFF, Role.TEACHER]
  },
  [Module.SCHEDULES]: {
    title: '課程安排',
    icon: 'CalendarIcon',
    path: '/schedules',
    requiredRoles: [Role.ADMIN, Role.STAFF, Role.TEACHER]
  },
  [Module.ATTENDANCE]: {
    title: '出勤管理',
    icon: 'ClipboardDocumentCheckIcon',
    path: '/attendance',
    requiredRoles: [Role.ADMIN, Role.STAFF, Role.TEACHER]
  },
  [Module.ORDERS]: {
    title: '訂單管理',
    icon: 'ShoppingCartIcon',
    path: '/orders',
    requiredRoles: [Role.ADMIN, Role.STAFF]
  },
  [Module.PAYMENTS]: {
    title: '收費管理',
    icon: 'BanknotesIcon',
    path: '/payments',
    requiredRoles: [Role.ADMIN, Role.STAFF]
  },
  [Module.CRM]: {
    title: '客戶關係',
    icon: 'UserPlusIcon',
    path: '/crm',
    requiredRoles: [Role.ADMIN, Role.STAFF]
  },
  [Module.REPORTS]: {
    title: '報表分析',
    icon: 'ChartBarIcon',
    path: '/reports',
    requiredRoles: [Role.ADMIN, Role.STAFF]
  },
  [Module.SETTINGS]: {
    title: '系統設定',
    icon: 'CogIcon',
    path: '/settings',
    requiredRoles: [Role.ADMIN]
  }
}

/**
 * 獲取用戶可訪問的導航菜單
 */
export function getAccessibleNavigation(userRole: Role) {
  return Object.entries(NAVIGATION_CONFIG)
    .filter(([module, config]) => config.requiredRoles.includes(userRole))
    .map(([module, config]) => ({
      module: module as Module,
      ...config
    }))
}
