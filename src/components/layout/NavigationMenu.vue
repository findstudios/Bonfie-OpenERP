<template>
  <div class="navigation-menu space-y-1 px-2">
    <!-- 0. 儀表板 -->
    <NavItem
      to="/dashboard"
      :icon="DashboardIcon"
      :is-collapsed="isCollapsed"
      :is-active="$route.path === '/dashboard'"
      @click="$emit('item-click')"
    >
      儀表板
    </NavItem>

    <!-- 1. 課程管理 -->
    <NavGroup
      v-if="canAccessCourses"
      :is-collapsed="isCollapsed"
      :is-mobile="isMobile"
      :is-expanded="courseMenuOpen"
      :is-active="$route.path.startsWith('/courses') || $route.path.startsWith('/schedule')"
      :icon="CoursesIcon"
      @toggle="toggleCourseMenu"
      @click="handleCourseGroupClick"
    >
      <template #title>課程管理</template>
      <template #items>
        <NavItem
          to="/schedule"
          :is-sub-item="true"
          @click="$emit('item-click')"
        >
          課程行事曆
        </NavItem>
        <NavItem
          to="/courses"
          :is-sub-item="true"
          @click="$emit('item-click')"
        >
          課程列表
        </NavItem>
      </template>
    </NavGroup>

    <!-- 2. 出席管理 -->
    <NavGroup
      v-if="canAccessAttendance"
      :is-collapsed="isCollapsed"
      :is-mobile="isMobile"
      :is-expanded="attendanceMenuOpen"
      :is-active="$route.path.startsWith('/attendance')"
      :icon="AttendanceIcon"
      @toggle="toggleAttendanceMenu"
      @click="handleAttendanceGroupClick"
    >
      <template #title>出席管理</template>
      <template #items>
        <NavItem
          to="/attendance"
          :is-sub-item="true"
          @click="$emit('item-click')"
        >
          出席記錄
        </NavItem>
        <NavItem
          to="/attendance/take"
          :is-sub-item="true"
          @click="$emit('item-click')"
        >
          課程點名
        </NavItem>
      </template>
    </NavGroup>

    <!-- 3. 學生管理 -->
    <NavGroup
      v-if="canAccessStudents"
      :is-collapsed="isCollapsed"
      :is-mobile="isMobile"
      :is-expanded="studentMenuOpen"
      :is-active="$route.path.startsWith('/students')"
      :icon="StudentsIcon"
      @toggle="toggleStudentMenu"
      @click="handleStudentGroupClick"
    >
      <template #title>學生管理</template>
      <template #items>
        <NavItem
          to="/students"
          :is-sub-item="true"
          @click="$emit('item-click')"
        >
          學生列表
        </NavItem>
        <NavItem
          v-if="canCreateStudents"
          to="/students/create"
          :is-sub-item="true"
          @click="$emit('item-click')"
        >
          新增學生
        </NavItem>
      </template>
    </NavGroup>

    <!-- 4. 聯絡人管理 -->
    <NavGroup
      v-if="canAccessContacts"
      :is-collapsed="isCollapsed"
      :is-mobile="isMobile"
      :is-expanded="contactMenuOpen"
      :is-active="$route.path.startsWith('/contacts')"
      :icon="ContactsIcon"
      @toggle="toggleContactMenu"
      @click="handleContactGroupClick"
    >
      <template #title>聯絡人管理</template>
      <template #items>
        <NavItem
          to="/contacts"
          :is-sub-item="true"
          @click="$emit('item-click')"
        >
          聯絡人列表
        </NavItem>
        <NavItem
          v-if="canCreateContacts"
          to="/contacts/create"
          :is-sub-item="true"
          @click="$emit('item-click')"
        >
          新增聯絡人
        </NavItem>
      </template>
    </NavGroup>

    <!-- 5. 訂單管理 -->
    <NavGroup
      v-if="canAccessOrders"
      :is-collapsed="isCollapsed"
      :is-mobile="isMobile"
      :is-expanded="orderMenuOpen"
      :is-active="$route.path.startsWith('/orders')"
      :icon="OrdersIcon"
      @toggle="toggleOrderMenu"
      @click="handleOrderGroupClick"
    >
      <template #title>訂單管理</template>
      <template #items>
        <NavItem
          to="/orders"
          :is-sub-item="true"
          @click="$emit('item-click')"
        >
          訂單列表
        </NavItem>
        <NavItem
          v-if="canCreateOrders"
          to="/orders/create"
          :is-sub-item="true"
          @click="$emit('item-click')"
        >
          新增訂單
        </NavItem>
      </template>
    </NavGroup>

    <!-- 8. 客戶關係 -->
    <NavGroup
      v-if="canAccessCRM"
      :is-collapsed="isCollapsed"
      :is-mobile="isMobile"
      :is-expanded="crmMenuOpen"
      :is-active="$route.path.startsWith('/crm')"
      :icon="CRMIcon"
      @toggle="toggleCRMMenu"
      @click="handleCRMGroupClick"
    >
      <template #title>客戶關係</template>
      <template #items>
        <NavItem
          to="/crm"
          :is-sub-item="true"
          @click="$emit('item-click')"
        >
          CRM 儀表板
        </NavItem>
        <NavItem
          to="/crm/leads"
          :is-sub-item="true"
          @click="$emit('item-click')"
        >
          潛在客戶
        </NavItem>
        <NavItem
          to="/crm/follow-ups"
          :is-sub-item="true"
          @click="$emit('item-click')"
        >
          追蹤記錄
        </NavItem>
        <NavItem
          to="/crm/trials"
          :is-sub-item="true"
          @click="$emit('item-click')"
        >
          試聽課程
        </NavItem>
      </template>
    </NavGroup>

    <!-- 9. 報表統計 -->
    <NavItem
      v-if="canAccessReports"
      to="/reports"
      :icon="ReportsIcon"
      :is-collapsed="isCollapsed"
      :is-active="$route.path === '/reports'"
      @click="$emit('item-click')"
    >
      報表統計
    </NavItem>

    <!-- 10. 系統設定 (僅限管理員) -->
    <NavItem
      v-if="canAccessSettings"
      to="/settings"
      :icon="SettingsIcon"
      :is-collapsed="isCollapsed"
      :is-active="$route.path.startsWith('/settings')"
      @click="$emit('item-click')"
    >
      系統設定
    </NavItem>

  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavItem from './NavItem.vue'
import NavGroup from './NavGroup.vue'
import { useResponsive } from '@/composables/useResponsive'
import { useAuthStore } from '@/stores/authSupabase'

// 圖標組件
import {
  DashboardIcon,
  StudentsIcon,
  CoursesIcon,
  ContactsIcon,
  CRMIcon,
  AttendanceIcon,
  OrdersIcon,
  CreditCardIcon,
  ReportsIcon,
  SettingsIcon
} from './icons'

interface Props {
  isCollapsed: boolean
  isMobile: boolean
}

interface Emits {
  (e: 'item-click'): void
  (e: 'expand-sidebar'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const router = useRouter()
const { toggleSidebarCollapse } = useResponsive()
const authStore = useAuthStore()

const route = useRoute()

// 角色權限檢查
const canAccessStudents = computed(() => authStore.hasAnyRole(['ADMIN', 'STAFF']))
const canAccessCourses = computed(() => authStore.hasAnyRole(['ADMIN', 'STAFF', 'TEACHER']))
const canAccessContacts = computed(() => authStore.hasAnyRole(['ADMIN', 'STAFF']))
const canAccessCRM = computed(() => authStore.hasAnyRole(['ADMIN', 'STAFF'])) // CRM 僅限 ADMIN 和 STAFF
const canAccessAttendance = computed(() => authStore.hasAnyRole(['ADMIN', 'STAFF', 'TEACHER']))
const canAccessOrders = computed(() => authStore.hasAnyRole(['ADMIN', 'STAFF']))
const canAccessReports = computed(() => authStore.hasAnyRole(['ADMIN', 'STAFF']))
const canAccessSettings = computed(() => authStore.hasRole('ADMIN')) // 僅限最高權限管理員

// 細分權限檢查
const canCreateStudents = computed(() => authStore.hasAnyRole(['ADMIN', 'STAFF']))
const canCreateCourses = computed(() => authStore.hasAnyRole(['ADMIN', 'STAFF']))
const canCreateContacts = computed(() => authStore.hasAnyRole(['ADMIN', 'STAFF']))
const canCreateOrders = computed(() => authStore.hasAnyRole(['ADMIN', 'STAFF']))

// 菜單展開狀態
const studentMenuOpen = ref(false)
const courseMenuOpen = ref(false)
const contactMenuOpen = ref(false)
const crmMenuOpen = ref(false)
const attendanceMenuOpen = ref(false)
const orderMenuOpen = ref(false)



// 根據當前路由自動展開對應菜單
watch(() => route.path, (newPath) => {
  // 重置所有菜單
  studentMenuOpen.value = false
  courseMenuOpen.value = false
  contactMenuOpen.value = false
  crmMenuOpen.value = false
  attendanceMenuOpen.value = false
  orderMenuOpen.value = false

  // 展開當前路由對應的菜單（僅在有權限時）
  if (newPath.startsWith('/students') && canAccessStudents.value) {
    studentMenuOpen.value = true
  } else if ((newPath.startsWith('/courses') || newPath.startsWith('/schedule')) && canAccessCourses.value) {
    courseMenuOpen.value = true
  } else if (newPath.startsWith('/contacts') && canAccessContacts.value) {
    contactMenuOpen.value = true
  } else if (newPath.startsWith('/crm') && canAccessCRM.value) {
    crmMenuOpen.value = true
  } else if (newPath.startsWith('/attendance') && canAccessAttendance.value) {
    attendanceMenuOpen.value = true
  } else if (newPath.startsWith('/orders') && canAccessOrders.value) {
    orderMenuOpen.value = true
  }
}, { immediate: true })

function toggleStudentMenu() {
  studentMenuOpen.value = !studentMenuOpen.value
}

function toggleCourseMenu() {
  courseMenuOpen.value = !courseMenuOpen.value
}

function toggleContactMenu() {
  contactMenuOpen.value = !contactMenuOpen.value
}

function toggleCRMMenu() {
  crmMenuOpen.value = !crmMenuOpen.value
}

function toggleAttendanceMenu() {
  attendanceMenuOpen.value = !attendanceMenuOpen.value
}

function toggleOrderMenu() {
  orderMenuOpen.value = !orderMenuOpen.value
}

// 處理收合狀態下的導航組點擊
function handleStudentGroupClick() {
  if (!canAccessStudents.value) return

  if (props.isCollapsed && !props.isMobile) {
    // 展開側邊欄
    emit('expand-sidebar')
    // 導航到第一個子項目
    router.push('/students')
    // 展開子菜單
    studentMenuOpen.value = true
  } else {
    // 正常切換展開狀態
    toggleStudentMenu()
  }
  emit('item-click')
}

function handleCourseGroupClick() {
  if (!canAccessCourses.value) return

  if (props.isCollapsed && !props.isMobile) {
    emit('expand-sidebar')
    router.push('/courses')
    courseMenuOpen.value = true
  } else {
    toggleCourseMenu()
  }
  emit('item-click')
}

function handleContactGroupClick() {
  if (!canAccessContacts.value) return

  if (props.isCollapsed && !props.isMobile) {
    emit('expand-sidebar')
    router.push('/contacts')
    contactMenuOpen.value = true
  } else {
    toggleContactMenu()
  }
  emit('item-click')
}

function handleCRMGroupClick() {
  if (!canAccessCRM.value) return

  if (props.isCollapsed && !props.isMobile) {
    emit('expand-sidebar')
    router.push('/crm')
    crmMenuOpen.value = true
  } else {
    toggleCRMMenu()
  }
  emit('item-click')
}

function handleAttendanceGroupClick() {
  if (!canAccessAttendance.value) return

  if (props.isCollapsed && !props.isMobile) {
    emit('expand-sidebar')
    router.push('/attendance')
    attendanceMenuOpen.value = true
  } else {
    toggleAttendanceMenu()
  }
  emit('item-click')
}

function handleOrderGroupClick() {
  if (!canAccessOrders.value) return

  if (props.isCollapsed && !props.isMobile) {
    emit('expand-sidebar')
    router.push('/orders')
    orderMenuOpen.value = true
  } else {
    toggleOrderMenu()
  }
  emit('item-click')
}
</script>

<style scoped>
.navigation-menu {
  /* 確保導航選單有適當的間距 */
  padding-bottom: 2rem;
}

/* 確保在收合狀態下選單項目居中 */
.navigation-menu.collapsed {
  padding-left: 0.25rem;
  padding-right: 0.25rem;
}
</style>
