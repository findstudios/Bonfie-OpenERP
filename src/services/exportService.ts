import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { reportService } from './reportService'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters'
import type { DateRange } from '@/types/reports'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface ExportOptions {
  type: string
  dateRange: DateRange
}

export async function exportToPDF(options: ExportOptions) {
  const pdf = new jsPDF()
  const { type, dateRange } = options

  // Add title
  pdf.setFontSize(20)
  pdf.text(getReportTitle(type), 20, 20)

  // Add date range
  pdf.setFontSize(12)
  pdf.text(`期間: ${formatDate(dateRange.startDate)} 至 ${formatDate(dateRange.endDate)}`, 20, 30)

  // Generate report content based on type
  switch (type) {
    case 'revenue':
      await generateRevenuePDF(pdf, dateRange)
      break
    case 'students':
      await generateStudentPDF(pdf, dateRange)
      break
    case 'courses':
      await generateCoursePDF(pdf, dateRange)
      break
    case 'attendance':
      await generateAttendancePDF(pdf, dateRange)
      break
    case 'teachers':
      await generateTeacherPDF(pdf, dateRange)
      break
    default:
      await generateSummaryPDF(pdf, dateRange)
  }

  // Save PDF
  pdf.save(`${getReportFileName(type)}_${formatDate(new Date())}.pdf`)
}

export async function exportToExcel(options: ExportOptions) {
  const { type, dateRange } = options
  const workbook = XLSX.utils.book_new()

  // Generate worksheets based on report type
  switch (type) {
    case 'revenue':
      await generateRevenueExcel(workbook, dateRange)
      break
    case 'students':
      await generateStudentExcel(workbook, dateRange)
      break
    case 'courses':
      await generateCourseExcel(workbook, dateRange)
      break
    case 'attendance':
      await generateAttendanceExcel(workbook, dateRange)
      break
    case 'teachers':
      await generateTeacherExcel(workbook, dateRange)
      break
    default:
      await generateSummaryExcel(workbook, dateRange)
  }

  // Save Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
  saveAs(blob, `${getReportFileName(type)}_${formatDate(new Date())}.xlsx`)
}

// Helper functions
function getReportTitle(type: string): string {
  const titles: Record<string, string> = {
    summary: '綜合報表',
    revenue: '收入分析報表',
    students: '學生統計報表',
    courses: '課程分析報表',
    attendance: '出席率報表',
    teachers: '教師績效報表'
  }
  return titles[type] || '報表'
}

function getReportFileName(type: string): string {
  const fileNames: Record<string, string> = {
    summary: 'summary_report',
    revenue: 'revenue_report',
    students: 'student_report',
    courses: 'course_report',
    attendance: 'attendance_report',
    teachers: 'teacher_report'
  }
  return fileNames[type] || 'report'
}

// PDF Generation Functions
async function generateSummaryPDF(pdf: jsPDF, dateRange: DateRange) {
  const summary = await reportService.getSummaryStatistics({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  })

  if (!summary) return

  // Summary statistics
  const summaryData = [
    ['指標', '數值'],
    ['本月收入', formatCurrency(summary.revenue.currentMonth)],
    ['上月收入', formatCurrency(summary.revenue.lastMonth)],
    ['收入成長率', `${summary.revenue.growth.toFixed(1)}%`],
    ['總學生數', summary.students.totalStudents.toString()],
    ['活躍學生數', summary.students.activeStudents.toString()],
    ['本月新生', summary.students.newStudentsThisMonth.toString()],
    ['平均出席率', `${summary.attendance.monthlyAverage.toFixed(1)}%`]
  ]

  pdf.autoTable({
    head: [summaryData[0]],
    body: summaryData.slice(1),
    startY: 40,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185] }
  })
}

async function generateRevenuePDF(pdf: jsPDF, dateRange: DateRange) {
  const revenueData = await reportService.getRevenueReport({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  })

  const tableData = revenueData.map(d => [
    formatDate(d.date),
    d.orderCount.toString(),
    formatCurrency(d.amount),
    formatCurrency(d.orderCount > 0 ? d.amount / d.orderCount : 0)
  ])

  pdf.autoTable({
    head: [['日期', '訂單數', '總金額', '平均金額']],
    body: tableData,
    startY: 40,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185] }
  })
}

async function generateStudentPDF(pdf: jsPDF, dateRange: DateRange) {
  const studentStats = await reportService.getStudentStatistics({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  })

  const statsData = [
    ['指標', '數值'],
    ['總學生數', studentStats.totalStudents.toString()],
    ['活躍學生數', studentStats.activeStudents.toString()],
    ['本月新生', studentStats.newStudentsThisMonth.toString()],
    ['平均報名課程數', studentStats.avgEnrollmentsPerStudent.toFixed(1)]
  ]

  pdf.autoTable({
    head: [statsData[0]],
    body: statsData.slice(1),
    startY: 40,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185] }
  })
}

async function generateCoursePDF(pdf: jsPDF, dateRange: DateRange) {
  const courseStats = await reportService.getCourseStatistics({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  })

  const tableData = courseStats.map(c => [
    c.courseName,
    c.studentCount.toString(),
    c.avgSessionsPerStudent.toFixed(1),
    `${c.completionRate.toFixed(0)}%`,
    formatCurrency(c.totalRevenue)
  ])

  pdf.autoTable({
    head: [['課程名稱', '學生人數', '平均購買堂數', '完成率', '總收入']],
    body: tableData,
    startY: 40,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185] }
  })
}

async function generateAttendancePDF(pdf: jsPDF, dateRange: DateRange) {
  const attendanceData = await reportService.getAttendanceStatistics({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  })

  const tableData = attendanceData.map(a => [
    formatDate(a.date),
    a.totalClasses.toString(),
    a.presentCount.toString(),
    a.absentCount.toString(),
    `${a.attendanceRate.toFixed(1)}%`
  ])

  pdf.autoTable({
    head: [['日期', '總課堂數', '出席人次', '缺席人次', '出席率']],
    body: tableData,
    startY: 40,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185] }
  })
}

async function generateTeacherPDF(pdf: jsPDF, dateRange: DateRange) {
  const teacherData = await reportService.getTeacherPerformance({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  })

  const tableData = teacherData.map(t => [
    t.teacherName,
    t.courseCount.toString(),
    t.studentCount.toString(),
    `${t.avgAttendanceRate.toFixed(0)}%`,
    formatCurrency(t.totalRevenue)
  ])

  pdf.autoTable({
    head: [['教師姓名', '授課數量', '學生人數', '平均出席率', '總收入貢獻']],
    body: tableData,
    startY: 40,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185] }
  })
}

// Excel Generation Functions
async function generateSummaryExcel(workbook: XLSX.WorkBook, dateRange: DateRange) {
  const summary = await reportService.getSummaryStatistics({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  })

  if (!summary) return

  const wsData = [
    ['綜合報表統計'],
    [`期間: ${formatDate(dateRange.startDate)} 至 ${formatDate(dateRange.endDate)}`],
    [],
    ['指標', '數值'],
    ['本月收入', summary.revenue.currentMonth],
    ['上月收入', summary.revenue.lastMonth],
    ['收入成長率 (%)', summary.revenue.growth],
    ['總學生數', summary.students.totalStudents],
    ['活躍學生數', summary.students.activeStudents],
    ['本月新生', summary.students.newStudentsThisMonth],
    ['平均出席率 (%)', summary.attendance.monthlyAverage]
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  XLSX.utils.book_append_sheet(workbook, ws, '綜合統計')
}

async function generateRevenueExcel(workbook: XLSX.WorkBook, dateRange: DateRange) {
  const revenueData = await reportService.getRevenueReport({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  })

  const wsData = [
    ['收入分析報表'],
    [`期間: ${formatDate(dateRange.startDate)} 至 ${formatDate(dateRange.endDate)}`],
    [],
    ['日期', '訂單數', '總金額', '平均金額'],
    ...revenueData.map(d => [
      d.date,
      d.orderCount,
      d.amount,
      d.orderCount > 0 ? d.amount / d.orderCount : 0
    ])
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  XLSX.utils.book_append_sheet(workbook, ws, '收入分析')
}

async function generateStudentExcel(workbook: XLSX.WorkBook, dateRange: DateRange) {
  const studentStats = await reportService.getStudentStatistics({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  })

  const wsData = [
    ['學生統計報表'],
    [`期間: ${formatDate(dateRange.startDate)} 至 ${formatDate(dateRange.endDate)}`],
    [],
    ['指標', '數值'],
    ['總學生數', studentStats.totalStudents],
    ['活躍學生數', studentStats.activeStudents],
    ['本月新生', studentStats.newStudentsThisMonth],
    ['平均報名課程數', studentStats.avgEnrollmentsPerStudent]
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  XLSX.utils.book_append_sheet(workbook, ws, '學生統計')
}

async function generateCourseExcel(workbook: XLSX.WorkBook, dateRange: DateRange) {
  const courseStats = await reportService.getCourseStatistics({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  })

  const wsData = [
    ['課程分析報表'],
    [`期間: ${formatDate(dateRange.startDate)} 至 ${formatDate(dateRange.endDate)}`],
    [],
    ['課程名稱', '學生人數', '平均購買堂數', '完成率 (%)', '總收入'],
    ...courseStats.map(c => [
      c.courseName,
      c.studentCount,
      c.avgSessionsPerStudent,
      c.completionRate,
      c.totalRevenue
    ])
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  XLSX.utils.book_append_sheet(workbook, ws, '課程分析')
}

async function generateAttendanceExcel(workbook: XLSX.WorkBook, dateRange: DateRange) {
  const attendanceData = await reportService.getAttendanceStatistics({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  })

  const wsData = [
    ['出席率報表'],
    [`期間: ${formatDate(dateRange.startDate)} 至 ${formatDate(dateRange.endDate)}`],
    [],
    ['日期', '總課堂數', '出席人次', '缺席人次', '出席率 (%)'],
    ...attendanceData.map(a => [
      a.date,
      a.totalClasses,
      a.presentCount,
      a.absentCount,
      a.attendanceRate
    ])
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  XLSX.utils.book_append_sheet(workbook, ws, '出席率統計')
}

async function generateTeacherExcel(workbook: XLSX.WorkBook, dateRange: DateRange) {
  const teacherData = await reportService.getTeacherPerformance({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  })

  const wsData = [
    ['教師績效報表'],
    [`期間: ${formatDate(dateRange.startDate)} 至 ${formatDate(dateRange.endDate)}`],
    [],
    ['教師姓名', '授課數量', '學生人數', '平均出席率 (%)', '總收入貢獻'],
    ...teacherData.map(t => [
      t.teacherName,
      t.courseCount,
      t.studentCount,
      t.avgAttendanceRate,
      t.totalRevenue
    ])
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  XLSX.utils.book_append_sheet(workbook, ws, '教師績效')
}
