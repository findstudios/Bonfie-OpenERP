# 補習班管理系統 - 完整 API 文檔

## 📋 概述

本文檔定義補習班管理系統的完整 API 規格，包含所有資料表操作、服務層介面、資料格式標準和最佳實踐。

---

## 🏗️ 系統架構

### 技術棧
- **前端**: Vue 3 + TypeScript + Tailwind CSS
- **後端**: Supabase (PostgreSQL + REST API)
- **認證**: Supabase Auth (JWT Token)
- **即時更新**: Supabase Realtime
- **檔案存儲**: Supabase Storage

### 服務層設計
```typescript
// 服務層文件結構
src/services/
├── supabase.ts      // 主要 Supabase 客戶端
├── mockData.ts      // Mock 資料服務 (開發用)
└── mockAuth.ts      // Mock 認證服務 (開發用)
```

---

## 🔐 認證與授權

### 認證 API (`auth`)

#### 登入
```typescript
POST /auth/sign-in
Content-Type: application/json

// 請求
{
  "email": "user@example.com",
  "password": "password123"
}

// 響應
{
  "user": User,
  "session": Session
}
```

#### 登出
```typescript
POST /auth/sign-out

// 響應: 204 No Content
```

#### 獲取當前會話
```typescript
GET /auth/session

// 響應
{
  "session": Session | null
}
```

#### 重設密碼
```typescript
POST /auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

---

## 👥 用戶管理 API

### 資料表: `users`

#### 用戶資料結構
```typescript
interface User {
  id: number
  user_id: string          // 業務主鍵 (U20250001)
  username: string
  password_hash: string
  full_name: string
  role_id: number         // 1=ADMIN, 2=STAFF, 3=TEACHER
  phone?: string
  email?: string
  status: 'active' | 'inactive'
  last_login_at?: string
  created_at: string
  updated_at: string
}
```

#### API 操作

**獲取用戶列表**
```typescript
// 使用統一服務層
const users = await db.findMany<User>('users', {
  columns: 'user_id, full_name, role_id, status',
  filters: { status: 'active' },
  orderBy: 'full_name',
  limit: 50
})

// 直接 Supabase 查詢
const { data } = await supabase
  .from('users')
  .select('user_id, full_name, role_id')
  .eq('status', 'active')
  .order('full_name')
```

**獲取單一用戶**
```typescript
const user = await db.findOne<User>('users', userId)
```

**創建用戶**
```typescript
const newUser = await db.create<User>('users', userData)
```

**更新用戶**
```typescript
const updatedUser = await db.update<User>('users', userId, updateData)
```

**刪除用戶**
```typescript
await db.delete('users', userId)
```

---

## 🎓 學生管理 API

### 資料表: `students`

#### 學生資料結構
```typescript
interface Student {
  id: number
  student_id: string       // 業務主鍵 (S20250001)
  chinese_name: string
  english_name?: string
  birth_date?: string      // YYYY-MM-DD
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
  contacts?: StudentContact[]
}
```

#### API 操作模式

**獲取學生列表 (含分頁)**
```typescript
// 實際使用範例 (來自 StudentListView.vue:459)
const { data } = await supabase
  .from('students')
  .select(`
    id,
    student_id,
    chinese_name,
    english_name,
    birth_date,
    is_active,
    created_at
  `)
  .eq('is_active', true)
  .order('chinese_name')
  .range(startIndex, endIndex)
```

**獲取學生詳情 (含聯絡人)**
```typescript
const { data } = await supabase
  .from('students')
  .select(`
    *,
    student_contacts (
      relationship,
      is_primary,
      is_emergency,
      is_billing,
      contacts (
        contact_id,
        full_name,
        phone,
        email,
        address
      )
    )
  `)
  .eq('student_id', studentId)
  .single()
```

**創建學生**
```typescript
const studentData = {
  student_id: generateStudentId(), // S20250001
  chinese_name: '張小明',
  english_name: 'Ming Zhang',
  birth_date: '2010-03-15',
  notes: '數學基礎較弱',
  is_active: true
}

const newStudent = await db.create<Student>('students', studentData)
```

**更新學生**
```typescript
await db.update<Student>('students', studentId, {
  chinese_name: '新姓名',
  notes: '更新備註'
})
```

**刪除學生**
```typescript
// 實際使用範例 (來自 StudentListView.vue:577)
await db.delete('students', selectedStudent.value.id)
```

---

## 📚 課程管理 API

### 資料表: `courses`

#### 課程資料結構
```typescript
interface Course {
  id: number
  course_id: string        // 業務主鍵 (CO20250001)
  course_name: string
  instructor_id: string    // 關聯到 users.user_id
  course_type: 'regular' | 'intensive' | 'makeup'
  category: string
  total_sessions: number
  price_per_session: number
  max_students: number
  status: 'planning' | 'active' | 'full' | 'ended'
  schedule_pattern: SchedulePattern  // JSON 格式
  description?: string
  created_at: string
  updated_at: string
  instructor?: User
  enrolled_count?: number
}
```

#### 課程排程模式 (schedule_pattern)
```typescript
interface SchedulePattern {
  type: 'weekly' | 'monthly' | 'intensive' | 'irregular'
  days: number[]           // [1,3,5] = 星期一三五
  start_time: string       // "19:00"
  end_time: string         // "20:30"
  duration: number         // 90 (分鐘)
  classroom?: string       // "A教室"
  effective_date: string   // "2025-07-21"
  end_date?: string | null // "2025-12-31" 或 null
}
```

#### API 操作模式

**獲取課程列表**
```typescript
// 實際使用範例 (來自 CourseListView.vue)
const courses = await db.findMany<Course>('courses', {
  columns: `
    course_id,
    course_name,
    instructor_id,
    course_type,
    category,
    total_sessions,
    max_students,
    status,
    schedule_pattern
  `,
  filters: { status: 'active' },
  orderBy: 'course_name'
})

// 載入教師資料
const instructorIds = courses.map(c => c.instructor_id).filter(Boolean)
const { data: instructors } = await supabase
  .from('users')
  .select('user_id, full_name')
  .in('user_id', instructorIds)
```

**獲取課程詳情**
```typescript
// 實際使用範例 (來自 CourseDetailView.vue:307)
const { data: course } = await supabase
  .from('courses')
  .select('*')
  .eq('course_id', courseId)
  .single()

// 載入教師資料
if (course.instructor_id) {
  const { data: instructor } = await supabase
    .from('users')
    .select('user_id, full_name')
    .eq('user_id', course.instructor_id)
    .single()
}

// 載入報名學生
const { data: enrollments } = await supabase
  .from('enrollments')
  .select(`
    enrollment_id,
    purchased_sessions,
    remaining_sessions,
    status,
    students (
      student_id,
      chinese_name,
      english_name
    )
  `)
  .eq('course_id', courseId)
  .eq('status', 'active')

// 載入課程安排
const { data: schedules } = await supabase
  .from('schedules')
  .select('*')
  .eq('course_id', courseId)
  .order('class_datetime')
```

**創建課程**
```typescript
// 實際使用範例 (來自 CourseFormView.vue:592)
const courseData = {
  course_id: generateCourseId(), // CO20250001
  course_name: '國小數學基礎班',
  instructor_id: 'U20250001',
  course_type: 'regular',
  category: '數學',
  total_sessions: 20,
  price_per_session: 600,
  max_students: 12,
  status: 'active',
  schedule_pattern: {
    type: 'weekly',
    days: [1, 3],
    start_time: '19:00',
    end_time: '20:30',
    duration: 90,
    classroom: 'A教室',
    effective_date: '2025-07-21',
    end_date: null
  },
  description: '針對國小4-6年級學生，加強數學基本概念'
}

const { data: newCourse } = await supabase
  .from('courses')
  .insert([courseData])
  .select()
  .single()
```

**更新課程**
```typescript
// 實際使用範例 (來自 CourseFormView.vue:566)
const { data: updatedCourse } = await supabase
  .from('courses')
  .update(courseUpdateData)
  .eq('course_id', courseId)
  .select()
  .single()
```

**刪除課程**
```typescript
await db.delete('courses', courseId)
```

---

## 📅 課程安排 API

### 資料表: `schedules`

#### 課程安排資料結構
```typescript
interface Schedule {
  id: number
  schedule_id: string      // 業務主鍵 (SCH2025072101)
  course_id: string        // 關聯到 courses.course_id
  class_datetime: string   // ISO 格式 "2025-07-21T11:00:00.000Z"
  end_datetime: string     // ISO 格式 "2025-07-21T12:30:00.000Z"
  session_number: number   // 第幾堂課
  classroom: string        // "A教室"
  status: 'scheduled' | 'completed' | 'cancelled'
  is_makeup: boolean       // 是否為補課
  makeup_for_schedule_id?: string  // 補課對應的原課程ID
  notes?: string
  created_at: string
  updated_at: string
  course?: Course
  attendance?: Attendance[]
}
```

#### API 操作模式

**獲取課程安排列表**
```typescript
// 獲取指定日期範圍的課程安排
const { data } = await supabase
  .from('schedules')
  .select(`
    schedule_id,
    course_id,
    class_datetime,
    end_datetime,
    session_number,
    classroom,
    status,
    courses (
      course_name,
      category
    )
  `)
  .gte('class_datetime', startDate)
  .lt('class_datetime', endDate)
  .order('class_datetime')
```

**獲取特定課程的安排**
```typescript
const schedules = await db.findMany<Schedule>('schedules', {
  filters: { course_id: courseId },
  orderBy: 'class_datetime'
})
```

**創建課程安排**
```typescript
const scheduleData = {
  schedule_id: generateScheduleId(), // SCH2025072101
  course_id: 'CO20250001',
  class_datetime: '2025-07-21T11:00:00.000Z',
  end_datetime: '2025-07-21T12:30:00.000Z',
  session_number: 1,
  classroom: 'A教室',
  status: 'scheduled',
  is_makeup: false,
  notes: '國小數學基礎班 - 第1堂課'
}

const newSchedule = await db.create<Schedule>('schedules', scheduleData)
```

**批量創建課程安排**
```typescript
// 根據課程的 schedule_pattern 生成多個安排
const schedules = generateSchedulesFromPattern(course.schedule_pattern, course.course_id)

const { data } = await supabase
  .from('schedules')
  .insert(schedules)
  .select()
```

---

## 📋 報名管理 API

### 資料表: `enrollments`

#### 報名資料結構
```typescript
interface Enrollment {
  id: number
  enrollment_id: string    // 業務主鍵 (EN20250001)
  student_id: string       // 關聯到 students.student_id
  course_id: string        // 關聯到 courses.course_id
  purchased_sessions: number
  remaining_sessions: number
  bonus_sessions: number
  status: 'active' | 'paused' | 'cancelled' | 'completed'
  source: 'manual' | 'line' | 'api'
  notes?: string
  created_at: string
  updated_at: string
  student?: Student
  course?: Course
}
```

#### API 操作模式

**獲取學生的報名記錄**
```typescript
const { data } = await supabase
  .from('enrollments')
  .select(`
    enrollment_id,
    purchased_sessions,
    remaining_sessions,
    bonus_sessions,
    status,
    courses (
      course_id,
      course_name,
      category
    )
  `)
  .eq('student_id', studentId)
  .eq('status', 'active')
```

**獲取課程的報名學生**
```typescript
// 實際使用範例 (來自 CourseDetailView.vue:345)
const { data } = await supabase
  .from('enrollments')
  .select(`
    enrollment_id,
    purchased_sessions,
    remaining_sessions,
    status,
    students (
      student_id,
      chinese_name,
      english_name
    )
  `)
  .eq('course_id', courseId)
  .eq('status', 'active')
```

**創建報名記錄**
```typescript
const enrollmentData = {
  enrollment_id: generateEnrollmentId(), // EN20250001
  student_id: 'S20250001',
  course_id: 'CO20250001',
  purchased_sessions: 20,
  remaining_sessions: 20,
  bonus_sessions: 0,
  status: 'active',
  source: 'manual',
  notes: '早鳥優惠報名'
}

const newEnrollment = await db.create<Enrollment>('enrollments', enrollmentData)
```

---

## ✅ 聯絡人管理 API

### 資料表: `contacts`, `student_contacts`

#### 聯絡人資料結構
```typescript
interface Contact {
  id: number
  contact_id: string       // 業務主鍵 (C20250001)
  full_name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
  student_relationships?: StudentContact[]
}
```

#### 學生聯絡人關係資料結構
```typescript
interface StudentContact {
  id: number
  student_id: string       // 關聯到 students.student_id
  contact_id: string       // 關聯到 contacts.contact_id
  relationship: '父親' | '母親' | '監護人' | '本人' | '其他'
  is_primary: boolean      // 是否為主要聯絡人
  is_emergency: boolean    // 是否為緊急聯絡人
  is_billing: boolean      // 是否為帳單聯絡人
  created_at: string
  updated_at: string
  student?: Student
  contact?: Contact
}
```

#### API 操作模式

**獲取聯絡人列表**
```typescript
// 基本聯絡人列表
const contacts = await db.findMany<Contact>('contacts', {
  columns: 'id, contact_id, full_name, phone, email, address, notes, is_active, created_at, updated_at',
  orderBy: 'created_at',
  ascending: false
})

// 含學生關係的聯絡人列表
const { data } = await supabase
  .from('contacts')
  .select(`
    id,
    contact_id,
    full_name,
    phone,
    email,
    address,
    notes,
    is_active,
    created_at,
    updated_at,
    student_contacts (
      student_id,
      relationship,
      is_primary,
      is_emergency,
      is_billing,
      students (
        student_id,
        chinese_name,
        english_name
      )
    )
  `)
  .order('created_at', { ascending: false })
```

**獲取聯絡人詳情**
```typescript
const { data } = await supabase
  .from('contacts')
  .select(`
    *,
    student_contacts (
      student_id,
      relationship,
      is_primary,
      is_emergency,
      is_billing,
      students (
        student_id,
        chinese_name,
        english_name,
        birth_date
      )
    )
  `)
  .eq('contact_id', contactId)
  .single()
```

**創建聯絡人**
```typescript
const contactData = {
  contact_id: generateContactId(), // C20250001
  full_name: '王大明',
  phone: '0912-345-678',
  email: 'wang@example.com',
  address: '台北市中正區中山路1號',
  notes: '學生家長',
  is_active: true
}

const newContact = await db.create<Contact>('contacts', contactData)
```

**建立學生聯絡人關係**
```typescript
const relationshipData = {
  student_id: 'S20250001',
  contact_id: 'C20250001', 
  relationship: '父親',
  is_primary: true,
  is_emergency: true,
  is_billing: true
}

const newRelationship = await db.create<StudentContact>('student_contacts', relationshipData)
```

**更新聯絡人資料**
```typescript
const updateData = {
  full_name: '王大明先生',
  phone: '0912-345-678',
  email: 'wang.new@example.com',
  address: '台北市中正區中山路2號',
  notes: '學生家長，晚上聯絡較佳'
}

const updatedContact = await db.update<Contact>('contacts', contactId, updateData)
```

**刪除聯絡人 (軟刪除)**
```typescript
// 建議軟刪除：設定為非啟用狀態
await db.update('contacts', contactId, { is_active: false })

// 硬刪除 (需先刪除關聯記錄)
await db.delete('student_contacts', { contact_id: contactId })
await db.delete('contacts', contactId)
```

**學生聯絡人關係查詢 (在學生頁面使用)**
```typescript
// 實際使用範例 (來自 StudentListView.vue:437)
const { data: allContacts } = await supabase
  .from('student_contacts')
  .select(`
    student_id,
    id,
    relationship,
    is_primary,
    contacts (
      id,
      full_name,
      phone,
      email
    )
  `)
  .in('student_id', studentIds)
```

**聯絡人關聯學生查詢 (在聯絡人頁面使用)**
```typescript
const { data: relationshipData } = await supabase
  .from('student_contacts')
  .select(`
    student_id,
    contact_id,
    relationship,
    is_primary,
    students (
      student_id,
      chinese_name
    )
  `)
  .in('contact_id', contactIds)
```

#### ID 生成規則
- **聯絡人 ID**: `C + YYYY + 4位序號` (例: C20250001)
- **關係記錄**: 使用自動遞增 ID

#### 驗證規則
- `full_name`: 必填，不可為空
- `phone` 或 `email`: 至少一個必填
- `contact_id`: 系統自動生成，不可重複
- `relationship`: 必須為預定義值之一
- `is_primary`: 每個學生只能有一個主要聯絡人

---

## ✅ 出席管理 API

### 資料表: `attendance`

#### 出席記錄資料結構
```typescript
interface Attendance {
  id: number
  schedule_id: string      // 關聯到 schedules.schedule_id
  student_id: string       // 關聯到 students.student_id
  enrollment_id: string    // 關聯到 enrollments.enrollment_id
  status: 'present' | 'absent' | 'late' | 'early_leave'
  session_deducted: boolean // 是否已扣除課程堂數
  teacher_notes?: string
  marked_at?: string       // 點名時間
  marked_by?: string       // 點名者
  created_at: string
  updated_at: string
  student?: Student
  enrollment?: Enrollment
  schedule?: Schedule
}
```

#### API 操作模式

**獲取課程的報名學生名單**
```typescript
// 實際使用範例 (來自 ScheduleView.vue:920)
const { data: enrolledStudents } = await supabase
  .from('enrollments')
  .select('student_id, chinese_name, english_name')
  .eq('course_id', schedule.course_id)
  .eq('status', 'active')
```

**創建出席記錄**
```typescript
const attendanceData = {
  schedule_id: 'SCH2025072101',
  student_id: 'S20250001',
  enrollment_id: 'EN20250001',
  status: 'present',
  session_deducted: true,
  teacher_notes: '表現良好',
  marked_at: new Date().toISOString(),
  marked_by: currentUser.user_id
}

const newAttendance = await db.create<Attendance>('attendance', attendanceData)
```

**更新出席記錄**
```typescript
// 實際使用範例 (來自 AttendanceListView.vue:746)
await db.update('attendance', recordId, {
  status: 'late',
  teacher_notes: '遲到15分鐘',
  session_deducted: false
})
```

**刪除出席記錄**
```typescript
// 實際使用範例 (來自 AttendanceTakeView.vue:627)
await db.delete('attendance', existingRecord.id)
```

**更新課程狀態**
```typescript
// 實際使用範例 (來自 AttendanceTakeView.vue:674)
await db.update('schedules', scheduleId, {
  status: 'completed'
})
```

---

## 🛒 訂單管理 API

### 資料表: `orders`

#### 訂單資料結構
```typescript
interface Order {
  id: number
  order_id: string         // 業務主鍵 (OR20250001)
  student_id: string       // 關聯到 students.student_id
  contact_id: string       // 關聯到 contacts.contact_id
  item_type: 'enrollment' | 'material' | 'activity'
  original_amount: number
  discount_amount: number
  final_amount: number
  status: 'pending' | 'confirmed' | 'cancelled'
  discount_reason?: string
  created_by: string       // 建立者 user_id
  created_at: string
  updated_at: string
  student?: Student
  contact?: Contact
  items?: OrderItem[]
  payments?: Payment[]
}
```

#### API 操作模式

**確認訂單**
```typescript
// 實際使用範例 (來自 OrderListView.vue:638)
await db.update('orders', orderId, { status: 'confirmed' })
```

**取消訂單**
```typescript
// 實際使用範例 (來自 OrderListView.vue:657)
await db.update('orders', orderId, { status: 'cancelled' })
```

---

## 🔧 統一服務層 API (`db`)

### 通用 CRUD 操作

#### findOne - 獲取單筆資料
```typescript
async findOne<T>(table: string, id: string | number, columns = '*'): Promise<T>

// 使用範例
const student = await db.findOne<Student>('students', 'S20250001')
const course = await db.findOne<Course>('courses', 'CO20250001', 'course_name, status')
```

#### findMany - 獲取多筆資料
```typescript
async findMany<T>(table: string, options: {
  columns?: string
  filters?: Record<string, any>
  orderBy?: string
  ascending?: boolean
  limit?: number
  offset?: number
}): Promise<T[]>

// 使用範例
const activeCourses = await db.findMany<Course>('courses', {
  columns: 'course_id, course_name, status',
  filters: { status: 'active' },
  orderBy: 'course_name',
  limit: 20
})
```

#### create - 創建資料
```typescript
async create<T>(table: string, data: Partial<T>): Promise<T>

// 使用範例
const newStudent = await db.create<Student>('students', {
  student_id: 'S20250001',
  chinese_name: '張小明',
  is_active: true
})
```

#### update - 更新資料
```typescript
async update<T>(table: string, id: string | number, data: Partial<T>): Promise<T>

// 使用範例
const updatedCourse = await db.update<Course>('courses', 'CO20250001', {
  status: 'ended',
  notes: '課程已結束'
})
```

#### delete - 刪除資料
```typescript
async delete(table: string, id: string | number): Promise<boolean>

// 使用範例
await db.delete('students', 'S20250001')
```

---

## 🔄 即時更新 API (`realtime`)

### 訂閱資料變化
```typescript
// 訂閱課程表變化
const channel = realtime.subscribe(
  'courses',
  (payload) => {
    console.log('課程資料變化:', payload)
    // 更新本地狀態
  },
  'status.eq.active' // 可選篩選條件
)

// 取消訂閱
realtime.unsubscribe(channel)
```

---

## 📁 檔案存儲 API (`storage`)

### 上傳檔案
```typescript
const uploadResult = await storage.upload(
  'student-photos',    // bucket 名稱
  `${studentId}.jpg`,  // 檔案路徑
  photoFile           // File 物件
)
```

### 獲取公開 URL
```typescript
const photoUrl = storage.getPublicUrl('student-photos', `${studentId}.jpg`)
```

### 刪除檔案
```typescript
await storage.remove('student-photos', [`${studentId}.jpg`])
```

---

## 🚫 錯誤處理

### 標準錯誤格式
```typescript
interface ApiError {
  message: string
  code?: string
  details?: any
  hint?: string
}

// 錯誤處理範例
try {
  const result = await db.create('students', studentData)
} catch (error) {
  if (error.code === '23505') {
    // 重複鍵錯誤
    console.error('學生ID已存在')
  } else {
    console.error('創建學生失敗:', error.message)
  }
}
```

### 常見錯誤代碼
- `23505`: 重複鍵違反 (Unique constraint violation)
- `23503`: 外鍵違反 (Foreign key constraint violation)
- `42P01`: 資料表不存在 (Table does not exist)
- `PGRST116`: 沒有找到記錄 (No rows found)

---

## 📊 資料驗證規則

### 課程ID格式
- 格式: `CO + YYYY + 4位數字` (例: CO20250001)
- 長度: 10 字元
- 必須唯一

### 學生ID格式
- 格式: `S + YYYY + 4位數字` (例: S20250001)
- 長度: 9 字元
- 必須唯一

### 時間格式
- 所有時間欄位使用 ISO 8601 格式
- 時區: UTC
- 範例: `2025-07-21T11:00:00.000Z`

### 狀態值約束
```typescript
// 課程狀態
type CourseStatus = 'planning' | 'active' | 'full' | 'ended'

// 報名狀態
type EnrollmentStatus = 'active' | 'paused' | 'cancelled' | 'completed'

// 出席狀態
type AttendanceStatus = 'present' | 'absent' | 'late' | 'early_leave'
```

---

## 🔧 最佳實踐

### 1. 使用統一服務層
```typescript
// ✅ 推薦: 使用 db helper
const students = await db.findMany<Student>('students', {
  filters: { is_active: true }
})

// ❌ 避免: 直接使用 Supabase (除非需要複雜查詢)
const { data } = await supabase.from('students').select('*')
```

### 2. 錯誤處理
```typescript
// ✅ 推薦: 完整錯誤處理
try {
  const result = await db.create('courses', courseData)
  return { success: true, data: result }
} catch (error) {
  console.error('創建課程失敗:', error)
  return { success: false, error: error.message }
}
```

### 3. 資料關聯查詢
```typescript
// ✅ 推薦: 使用 Supabase 的關聯查詢
const { data } = await supabase
  .from('enrollments')
  .select(`
    *,
    students (chinese_name, english_name),
    courses (course_name, category)
  `)
  .eq('status', 'active')
```

### 4. 分頁查詢
```typescript
// ✅ 推薦: 使用 range 進行分頁
const pageSize = 20
const startIndex = (page - 1) * pageSize
const endIndex = startIndex + pageSize - 1

const { data, count } = await supabase
  .from('students')
  .select('*', { count: 'exact' })
  .range(startIndex, endIndex)
```

---

## 📝 更新記錄

| 版本 | 日期 | 變更說明 |
|------|------|----------|
| 1.0.0 | 2025-07-20 | 初始版本，完整API文檔建立 |
| 1.0.1 | 2025-07-20 | 新增課程排程模式標準格式 |

---

*📅 文檔生成時間: 2025-07-20*  
*🔄 最後更新: 完整API規格文檔完成*  
*👥 維護者: 開發團隊*