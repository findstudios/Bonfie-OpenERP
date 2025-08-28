export interface DateRange {
  startDate: string
  endDate: string
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
    fill?: boolean
    tension?: number
  }[]
}

export interface ReportCard {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon?: string
  color?: string
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv'
  fileName?: string
  title?: string
  dateRange?: DateRange
  includeCharts?: boolean
}

export type ReportType =
  | 'revenue'
  | 'student'
  | 'course'
  | 'attendance'
  | 'teacher'
  | 'summary'

export interface ReportConfig {
  type: ReportType
  title: string
  description: string
  icon: string
  color: string
  route: string
}
