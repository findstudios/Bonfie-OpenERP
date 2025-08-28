<template>
  <MainLayout>
    <div class="mx-auto max-w-6xl space-y-6">
      <!-- 頁面標題與操作 -->
      <div class="md:flex md:items-center md:justify-between">
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            出席管理
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            管理學生出席記錄和補課安排
          </p>
        </div>
        <div class="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          <button
            @click="openCreateModal"
            class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PlusIcon class="mr-2 size-4" />
            手動新增
          </button>
          <router-link
            to="/attendance/take"
            class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <ClipboardDocumentCheckIcon class="mr-2 size-5" />
            點名
          </router-link>
        </div>
      </div>

      <!-- 篩選和搜尋 -->
      <div class="card p-6">
        <div class="grid grid-cols-12 gap-3">
          <!-- 姓名搜尋 (4欄) -->
          <div class="col-span-12 md:col-span-4">
            <label for="student_name" class="mb-1 block text-sm font-medium text-gray-700">
              學生姓名
            </label>
            <input
              id="student_name"
              v-model="filters.studentName"
              type="text"
              placeholder="輸入姓名搜尋..."
              class="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              @input="handleNameSearch"
            />
          </div>

          <!-- 日期範圍 (2欄) -->
          <div class="col-span-6 md:col-span-2">
            <label for="date_range" class="mb-1 block text-xs font-medium text-gray-700">
              日期
            </label>
            <select
              id="date_range"
              v-model="filters.dateRange"
              class="h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              @change="loadAttendanceRecords"
            >
              <option value="today">今天</option>
              <option value="week">本週</option>
              <option value="month">本月</option>
              <option value="all">全部</option>
            </select>
          </div>

          <!-- 課程 (3欄) -->
          <div class="col-span-6 md:col-span-3">
            <label for="course_filter" class="mb-1 block text-xs font-medium text-gray-700">
              課程
            </label>
            <select
              id="course_filter"
              v-model="filters.courseId"
              class="h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              @change="loadAttendanceRecords"
            >
              <option value="">全部課程</option>
              <option v-for="course in courses" :key="course.course_id" :value="course.course_id">
                {{ course.course_name }}
              </option>
            </select>
          </div>

          <!-- 出席狀態 (2欄) -->
          <div class="col-span-10 md:col-span-2">
            <label for="status_filter" class="mb-1 block text-xs font-medium text-gray-700">
              狀態
            </label>
            <select
              id="status_filter"
              v-model="filters.status"
              class="h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              @change="loadAttendanceRecords"
            >
              <option value="">全部</option>
              <option value="present">出席</option>
              <option value="absent">缺席</option>
              <option value="late">遲到</option>
              <option value="leave">請假</option>
            </select>
          </div>

          <!-- 重置按鈕 (1欄) -->
          <div class="col-span-2 flex items-end md:col-span-1">
            <button
              @click="resetFilters"
              class="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-md border border-gray-300 bg-white p-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              title="重置篩選"
            >
              <ArrowPathIcon class="size-5" />
            </button>
          </div>
        </div>

        <!-- 出席率統計（摺疊區塊） -->
        <div v-if="filteredRecords.length > 0" class="mt-4 border-t pt-4">
          <button
            @click="showStats = !showStats"
            class="-m-2 flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors hover:bg-gray-50"
          >
            <h3 class="text-lg font-medium text-gray-900">出席率統計</h3>
            <svg
              :class="['size-5 transition-transform', showStats ? 'rotate-180' : '']"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div v-show="showStats" class="mt-4">
            <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">{{ attendanceStats.presentCount }}</div>
                <div class="text-sm text-gray-500">出席</div>
                <div class="text-xs text-gray-400">{{ attendanceStats.presentRate }}%</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-red-600">{{ attendanceStats.absentCount }}</div>
                <div class="text-sm text-gray-500">缺席</div>
                <div class="text-xs text-gray-400">{{ attendanceStats.absentRate }}%</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-yellow-600">{{ attendanceStats.lateCount }}</div>
                <div class="text-sm text-gray-500">遲到</div>
                <div class="text-xs text-gray-400">{{ attendanceStats.lateRate }}%</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">{{ attendanceStats.leaveCount }}</div>
                <div class="text-sm text-gray-500">請假</div>
                <div class="text-xs text-gray-400">{{ attendanceStats.leaveRate }}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 出席記錄列表 -->
      <div class="card">
        <div class="border-b border-gray-200 px-6 py-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">
              出席記錄 ({{ filteredRecords.length }} 筆)
            </h3>
            <!-- 分頁資訊 -->
            <div v-if="totalPages > 1" class="text-sm text-gray-500">
              第 {{ currentPage }} / {{ totalPages }} 頁
            </div>
          </div>
        </div>

        <!-- 載入中狀態 -->
        <div v-if="loading" class="p-6">
          <div class="animate-pulse space-y-4">
            <div v-for="i in 5" :key="i" class="h-16 rounded bg-gray-200"></div>
          </div>
        </div>

        <!-- 空狀態 -->
        <div v-else-if="filteredRecords.length === 0" class="p-6 text-center">
          <ClipboardDocumentListIcon class="mx-auto size-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">沒有出席記錄</h3>
          <p class="mt-1 text-sm text-gray-500">
            開始點名記錄學生出席狀況
          </p>
          <div class="mt-6">
            <router-link
              to="/attendance/take"
              class="inline-flex min-h-[3rem] items-center justify-center rounded-md border border-transparent bg-blue-600 px-8 py-3 text-base font-medium text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <ClipboardDocumentCheckIcon class="mr-2 size-5" />
              開始點名
            </router-link>
          </div>
        </div>

        <!-- 出席記錄表格 -->
        <div v-else class="overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  課程資訊
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  學生
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  出席狀態
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  記錄時間
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="record in paginatedRecords" :key="record.id" class="hover:bg-gray-50">
                <td class="whitespace-nowrap px-6 py-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ record.schedule?.course?.course_name }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ formatDateTime(record.schedule?.class_datetime) }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ record.schedule?.classroom }}
                  </div>
                  <div v-if="record.teacher_notes" class="text-sm text-gray-500">
                    {{ record.teacher_notes }}
                  </div>
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ record.student?.chinese_name }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ record.student?.student_id }}
                  </div>
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <span
                    :class="getStatusClass(record.status)"
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  >
                    {{ getStatusText(record.status) }}
                  </span>
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {{ formatDateTime(record.created_at) }}
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      v-if="record.status === 'absent'"
                      @click="openMakeupModal(record)"
                      class="text-blue-600 hover:text-blue-900"
                    >
                      安排補課
                    </button>
                    <button
                      @click="editAttendance(record)"
                      class="text-gray-600 hover:text-gray-900"
                    >
                      編輯
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分頁控制 -->
        <div v-if="totalPages > 1" class="border-t border-gray-200 px-6 py-4">
          <div class="flex items-center justify-between">
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              上一頁
            </button>

            <div class="flex items-center space-x-2">
              <button
                v-for="page in displayedPages"
                :key="page"
                @click="currentPage = page"
                :class="[
                  'rounded-md px-3 py-1 text-sm font-medium',
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                ]"
              >
                {{ page }}
              </button>
            </div>

            <button
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              下一頁
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 手動新增出席記錄 Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-screen items-center justify-center px-4">
        <div class="fixed inset-0 bg-black opacity-50" @click="showCreateModal = false"></div>

        <div class="relative w-full max-w-lg rounded-lg bg-white p-6">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">手動新增出席記錄</h3>
            <button @click="showCreateModal = false" class="text-gray-400 hover:text-gray-600">
              <XMarkIcon class="size-5" />
            </button>
          </div>

          <form @submit.prevent="createAttendanceRecord" class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">課程</label>
              <select
                v-model="createForm.course_id"
                @change="handleCourseChange"
                required
                class="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">請選擇課程</option>
                <option v-for="course in ongoingCourses" :key="course.id" :value="course.course_id">
                  {{ course.course_name }}
                </option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">課程安排</label>
              <select
                v-model="createForm.schedule_id"
                @change="loadScheduleStudents"
                required
                :disabled="!createForm.course_id"
                class="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="">{{ createForm.course_id ? '請選擇課程安排' : '請先選擇課程' }}</option>
                <option v-for="schedule in recentSchedules" :key="schedule.id" :value="schedule.schedule_id">
                  {{ formatDateTime(schedule.class_datetime) }} - {{ schedule.classroom }}
                </option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">學生</label>
              <select
                v-model="createForm.student_id"
                required
                class="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">請選擇學生</option>
                <option v-for="student in scheduleStudents" :key="student.student_id" :value="student.student_id">
                  {{ student.chinese_name }} ({{ student.student_id }})
                </option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">出席狀態</label>
              <select
                v-model="createForm.status"
                required
                class="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="present">出席</option>
                <option value="absent">缺席</option>
                <option value="late">遲到</option>
                <option value="leave">請假</option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">備註</label>
              <textarea
                v-model="createForm.teacher_notes"
                rows="3"
                class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="記錄特殊狀況或備註"
              ></textarea>
            </div>

            <div class="flex justify-end space-x-4 border-t border-gray-200 pt-6">
              <button
                type="button"
                @click="showCreateModal = false"
                class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="creating"
                class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div v-if="creating" class="mr-2 size-4 animate-spin rounded-full border-b-2 border-white"></div>
                新增記錄
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 編輯出席記錄 Modal -->
    <div v-if="showEditModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-screen items-center justify-center px-4">
        <div class="fixed inset-0 bg-black opacity-50" @click="showEditModal = false"></div>

        <div class="relative w-full max-w-md rounded-lg bg-white p-6">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">編輯出席記錄</h3>
            <button @click="showEditModal = false" class="text-gray-400 hover:text-gray-600">
              <XMarkIcon class="size-5" />
            </button>
          </div>

          <form @submit.prevent="updateAttendance" class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">學生</label>
              <div class="text-sm text-gray-900">{{ editingRecord?.student?.chinese_name }}</div>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">課程</label>
              <div class="text-sm text-gray-900">{{ editingRecord?.schedule?.course?.course_name }}</div>
              <div class="text-sm text-gray-500">{{ formatDateTime(editingRecord?.schedule?.class_datetime) }}</div>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">出席狀態</label>
              <select
                v-model="editForm.status"
                required
                class="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="present">出席</option>
                <option value="absent">缺席</option>
                <option value="late">遲到</option>
                <option value="leave">請假</option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">備註</label>
              <textarea
                v-model="editForm.teacher_notes"
                rows="3"
                class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="記錄特殊狀況或備註"
              ></textarea>
            </div>

            <div class="flex justify-end space-x-4 border-t border-gray-200 pt-6">
              <button
                type="button"
                @click="showEditModal = false"
                class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                取消
              </button>
              <button
                type="button"
                @click="deleteAttendance"
                :disabled="updating"
                class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-transparent bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                刪除
              </button>
              <button
                type="submit"
                :disabled="updating"
                class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div v-if="updating" class="mr-2 size-4 animate-spin rounded-full border-b-2 border-white"></div>
                更新
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 補課安排 Modal -->
    <div v-if="showMakeupModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-screen items-center justify-center px-4">
        <div class="fixed inset-0 bg-black opacity-50" @click="showMakeupModal = false"></div>

        <div class="relative w-full max-w-md rounded-lg bg-white p-6">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">安排補課</h3>
            <button @click="showMakeupModal = false" class="text-gray-400 hover:text-gray-600">
              <XMarkIcon class="size-5" />
            </button>
          </div>

          <form @submit.prevent="scheduleMakeup" class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">學生</label>
              <div class="text-sm text-gray-900">{{ selectedRecord?.student?.chinese_name }}</div>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">原課程</label>
              <div class="text-sm text-gray-900">{{ selectedRecord?.schedule?.course?.course_name }}</div>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">補課日期</label>
              <input
                v-model="makeupForm.date"
                type="date"
                required
                class="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700">開始時間</label>
                <input
                  v-model="makeupForm.startTime"
                  type="time"
                  required
                  class="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700">結束時間</label>
                <input
                  v-model="makeupForm.endTime"
                  type="time"
                  required
                  class="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">教室</label>
              <select
                v-model="makeupForm.classroom"
                required
                class="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">請選擇教室</option>
                <option value="教室A">教室A</option>
                <option value="教室B">教室B</option>
                <option value="教室C">教室C</option>
                <option value="會議室">會議室</option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">備註</label>
              <textarea
                v-model="makeupForm.notes"
                rows="3"
                class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="補課原因或特殊說明"
              ></textarea>
            </div>

            <div class="flex justify-end space-x-4 border-t border-gray-200 pt-6">
              <button
                type="button"
                @click="showMakeupModal = false"
                class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="creating"
                class="inline-flex min-h-[2.75rem] items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div v-if="creating" class="mr-2 size-4 animate-spin rounded-full border-b-2 border-white"></div>
                安排補課
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import MainLayout from '@/components/layout/MainLayout.vue'
import { db, supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/authSupabase'
import type { AttendanceRecord, Course, Schedule, Student } from '@/types'
import {
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/vue/24/outline'

const loading = ref(false)
const attendanceRecords = ref<AttendanceRecord[]>([])
const courses = ref<Course[]>([])
const showMakeupModal = ref(false)
const showEditModal = ref(false)
const showCreateModal = ref(false)
const creating = ref(false)
const updating = ref(false)
const selectedRecord = ref<AttendanceRecord | null>(null)
const editingRecord = ref<AttendanceRecord | null>(null)
const recentSchedules = ref<Schedule[]>([])
const scheduleStudents = ref<Student[]>([])
const ongoingCourses = ref<Course[]>([])

const filters = reactive({
  dateRange: 'week',
  courseId: '',
  status: '',
  studentName: ''
})

// 分頁相關
const currentPage = ref(1)
const pageSize = 20
const showStats = ref(false) // 統計區塊預設收合

const makeupForm = reactive({
  date: '',
  startTime: '',
  endTime: '',
  classroom: '',
  notes: ''
})

const editForm = reactive({
  status: '',
  teacher_notes: ''
})

const createForm = reactive({
  course_id: '',
  schedule_id: '',
  student_id: '',
  status: 'present',
  teacher_notes: ''
})

// 過濾後的記錄
const filteredRecords = computed(() => {
  if (!filters.studentName) {
    return attendanceRecords.value
  }

  const searchTerm = filters.studentName.toLowerCase()
  return attendanceRecords.value.filter(record => {
    const studentName = record.student?.chinese_name || ''
    const englishName = record.student?.english_name || ''
    return studentName.toLowerCase().includes(searchTerm) ||
           englishName.toLowerCase().includes(searchTerm)
  })
})

// 分頁計算
const totalPages = computed(() => Math.ceil(filteredRecords.value.length / pageSize))

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredRecords.value.slice(start, end)
})

// 顯示的頁碼
const displayedPages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value

  // 顯示最多5個頁碼
  let start = Math.max(1, current - 2)
  const end = Math.min(total, start + 4)

  // 調整起始位置
  if (end - start < 4) {
    start = Math.max(1, end - 4)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

const attendanceStats = computed(() => {
  const total = filteredRecords.value.length
  if (total === 0) {
    return {
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      leaveCount: 0,
      presentRate: 0,
      absentRate: 0,
      lateRate: 0,
      leaveRate: 0
    }
  }

  const presentCount = filteredRecords.value.filter(r => r.status === 'present').length
  const absentCount = filteredRecords.value.filter(r => r.status === 'absent').length
  const lateCount = filteredRecords.value.filter(r => r.status === 'late').length
  const leaveCount = filteredRecords.value.filter(r => r.status === 'leave').length

  return {
    presentCount,
    absentCount,
    lateCount,
    leaveCount,
    presentRate: Math.round((presentCount / total) * 100),
    absentRate: Math.round((absentCount / total) * 100),
    lateRate: Math.round((lateCount / total) * 100),
    leaveRate: Math.round((leaveCount / total) * 100)
  }
})

async function loadAttendanceRecords() {
  loading.value = true
  currentPage.value = 1 // 載入新資料時重置到第一頁
  try {
    // 先獲取所有出席記錄，包含 schedule 資訊
    let query = supabase
      .from('attendance')
      .select(`
        id,
        schedule_id,
        student_id,
        status,
        teacher_notes,
        created_at,
        student:students(id, student_id, chinese_name, english_name),
        schedule:schedules(
          id,
          schedule_id,
          class_datetime,
          classroom,
          course_id,
          course:courses(course_id, course_name)
        )
      `)
      .order('created_at', { ascending: false })

    // 狀態篩選
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query

    if (error) throw error

    // 客戶端進行日期和課程篩選
    let filteredData = data || []

    // 日期範圍篩選
    if (filters.dateRange !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      filteredData = filteredData.filter(record => {
        if (!record.schedule?.class_datetime) return false

        const recordDate = new Date(record.schedule.class_datetime)

        switch (filters.dateRange) {
          case 'today':
            return recordDate.toDateString() === today.toDateString()

          case 'week':
            const weekStart = new Date(today)
            weekStart.setDate(today.getDate() - today.getDay())
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekStart.getDate() + 6)
            return recordDate >= weekStart && recordDate <= weekEnd

          case 'month':
            return recordDate.getMonth() === today.getMonth() &&
                   recordDate.getFullYear() === today.getFullYear()

          default:
            return true
        }
      })
    }

    // 課程篩選
    if (filters.courseId) {
      filteredData = filteredData.filter(record =>
        record.schedule?.course_id === filters.courseId
      )
    }

    attendanceRecords.value = filteredData
  } catch (error) {
    console.error('載入出席記錄失敗:', error)
  } finally {
    loading.value = false
  }
}

async function loadCourses() {
  try {
    courses.value = await db.findMany('courses', {
      columns: 'id, course_id, course_name, category, status',
      filters: { status: 'active' },
      orderBy: 'course_name'
    })
  } catch (error) {
    console.error('載入課程失敗:', error)
  }
}

function resetFilters() {
  filters.dateRange = 'week'
  filters.courseId = ''
  filters.status = ''
  filters.studentName = ''
  currentPage.value = 1
  loadAttendanceRecords()
}

// 處理姓名搜尋（防抖）
let searchTimer: any = null
function handleNameSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1 // 重置到第一頁
  }, 300)
}

function getStatusClass(status: string): string {
  const statusClasses = {
    'present': 'bg-green-100 text-green-800',
    'absent': 'bg-red-100 text-red-800',
    'late': 'bg-yellow-100 text-yellow-800',
    'leave': 'bg-blue-100 text-blue-800'
  }
  return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'
}

function getStatusText(status: string): string {
  const statusTexts = {
    'present': '出席',
    'absent': '缺席',
    'late': '遲到',
    'leave': '請假'
  }
  return statusTexts[status as keyof typeof statusTexts] || status
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function openMakeupModal(record: AttendanceRecord) {
  selectedRecord.value = record
  showMakeupModal.value = true

  // 重置表單
  Object.assign(makeupForm, {
    date: '',
    startTime: '',
    endTime: '',
    classroom: '',
    notes: `補課原因：${record.schedule?.course?.course_name} 缺席`
  })
}

async function scheduleMakeup() {
  creating.value = true
  try {
    // 建立補課安排
    const makeupSchedule = {
      course_id: selectedRecord.value?.schedule?.course_id,
      student_id: selectedRecord.value?.student_id,
      class_datetime: `${makeupForm.date}T${makeupForm.startTime}:00.000Z`,
      end_datetime: `${makeupForm.date}T${makeupForm.endTime}:00.000Z`,
      classroom: makeupForm.classroom,
      status: 'scheduled',
      is_makeup: true,
      makeup_for_schedule_id: selectedRecord.value?.schedule_id,
      notes: makeupForm.notes
    }

    await db.create('schedules', makeupSchedule)

    alert('補課安排建立成功')
    showMakeupModal.value = false
    selectedRecord.value = null
  } catch (error) {
    console.error('建立補課安排失敗:', error)
    alert('建立補課安排失敗')
  } finally {
    creating.value = false
  }
}

function editAttendance(record: AttendanceRecord) {
  editingRecord.value = record
  editForm.status = record.status
  editForm.teacher_notes = record.teacher_notes || ''
  showEditModal.value = true
}

async function updateAttendance() {
  updating.value = true
  try {
    await db.update('attendance', editingRecord.value?.id, {
      status: editForm.status,
      teacher_notes: editForm.teacher_notes || null,
      session_deducted: editForm.status === 'present' || editForm.status === 'late'
    })

    alert('出席記錄更新成功')
    showEditModal.value = false
    editingRecord.value = null
    await loadAttendanceRecords() // 重新載入列表
  } catch (error) {
    console.error('更新出席記錄失敗:', error)
    alert('更新出席記錄失敗')
  } finally {
    updating.value = false
  }
}

async function deleteAttendance() {
  if (!confirm('確定要刪除這筆出席記錄嗎？')) {
    return
  }

  updating.value = true
  try {
    await db.delete('attendance', editingRecord.value?.id)

    alert('出席記錄刪除成功')
    showEditModal.value = false
    editingRecord.value = null
    await loadAttendanceRecords() // 重新載入列表
  } catch (error) {
    console.error('刪除出席記錄失敗:', error)
    alert('刪除出席記錄失敗')
  } finally {
    updating.value = false
  }
}

async function loadOngoingCourses() {
  try {
    const data = await db.findMany('courses', {
      columns: `
        id,
        course_id,
        course_name,
        status
      `,
      filters: {
        status: 'ongoing'
      },
      orderBy: 'course_name',
      ascending: true
    })
    ongoingCourses.value = data
  } catch (error) {
    console.error('載入課程失敗:', error)
  }
}

async function loadRecentSchedules() {
  try {
    // 設定日期範圍：前後一個月
    const today = new Date()
    const oneMonthBefore = new Date(today)
    oneMonthBefore.setMonth(today.getMonth() - 1)
    const oneMonthAfter = new Date(today)
    oneMonthAfter.setMonth(today.getMonth() + 1)

    const filters: any = {
      class_datetime: {
        gte: oneMonthBefore.toISOString(),
        lte: oneMonthAfter.toISOString()
      }
    }

    // 如果選擇了課程，加入課程篩選
    if (createForm.course_id) {
      filters.course_id = createForm.course_id
    }

    const data = await db.findMany('schedules', {
      columns: `
        id,
        schedule_id,
        course_id,
        class_datetime,
        classroom,
        status,
        course:courses(course_id, course_name)
      `,
      filters,
      orderBy: 'class_datetime',
      ascending: true
    })
    recentSchedules.value = data
  } catch (error) {
    console.error('載入課程安排失敗:', error)
  }
}

async function loadScheduleStudents() {
  if (!createForm.schedule_id) {
    scheduleStudents.value = []
    return
  }

  try {
    const selectedSchedule = recentSchedules.value.find(s => s.schedule_id === createForm.schedule_id)
    if (!selectedSchedule) return

    const enrollments = await db.findMany('enrollments', {
      columns: `
        id,
        student_id,
        course_id,
        status,
        student:students(
          id,
          student_id,
          chinese_name,
          english_name,
          is_active
        )
      `,
      filters: {
        course_id: selectedSchedule.course_id,
        status: 'active'
      }
    })

    scheduleStudents.value = enrollments
      .map(enrollment => enrollment.student)
      .filter(student => student && student.is_active)
  } catch (error) {
    console.error('載入學生名單失敗:', error)
  }
}

async function createAttendanceRecord() {
  creating.value = true
  try {
    // 找到對應的 enrollment
    const selectedSchedule = recentSchedules.value.find(s => s.schedule_id === createForm.schedule_id)
    if (!selectedSchedule) {
      alert('找不到選擇的課程安排')
      return
    }

    const enrollments = await db.findMany('enrollments', {
      columns: 'id, enrollment_id, student_id, course_id',
      filters: {
        course_id: selectedSchedule.course_id,
        student_id: createForm.student_id,
        status: 'active'
      }
    })

    if (enrollments.length === 0) {
      alert('找不到學生的報名記錄')
      return
    }

    const enrollment = enrollments[0]

    // 檢查是否已有記錄
    const existingRecords = await db.findMany('attendance', {
      columns: 'id',
      filters: {
        schedule_id: createForm.schedule_id,
        student_id: createForm.student_id
      }
    })

    if (existingRecords.length > 0) {
      alert('該學生在此課程已有出席記錄')
      return
    }

    await db.create('attendance', {
      schedule_id: createForm.schedule_id,
      student_id: createForm.student_id,
      enrollment_id: enrollment.enrollment_id,
      status: createForm.status,
      session_deducted: createForm.status === 'present' || createForm.status === 'late',
      teacher_notes: createForm.teacher_notes || null,
      marked_at: new Date().toISOString()
      // 暫時不設置 marked_by，避免外鍵約束錯誤
    })

    alert('出席記錄新增成功')
    showCreateModal.value = false

    // 重置表單
    Object.assign(createForm, {
      course_id: '',
      schedule_id: '',
      student_id: '',
      status: 'present',
      teacher_notes: ''
    })

    await loadAttendanceRecords()
  } catch (error) {
    console.error('新增出席記錄失敗:', error)
    alert(`新增出席記錄失敗: ${error.message}`)
  } finally {
    creating.value = false
  }
}

async function openCreateModal() {
  // 載入進行中的課程
  await loadOngoingCourses()

  // 重置表單
  Object.assign(createForm, {
    course_id: '',
    schedule_id: '',
    student_id: '',
    status: 'present',
    teacher_notes: ''
  })

  // 清空相關資料
  recentSchedules.value = []
  scheduleStudents.value = []

  // 開啟 Modal
  showCreateModal.value = true
}

async function handleCourseChange() {
  // 重置後續選項
  createForm.schedule_id = ''
  createForm.student_id = ''
  scheduleStudents.value = []

  // 如果有選擇課程，載入該課程的課程安排
  if (createForm.course_id) {
    await loadRecentSchedules()
  } else {
    recentSchedules.value = []
  }
}

onMounted(() => {
  loadCourses()
  loadAttendanceRecords()
})
</script>
