import { supabase } from '@/services/supabase'

interface MigrationResult {
  totalProcessed: number
  migrated: number
  errors: number
  details?: any[]
}

/**
 * Migrate courses data to new schema
 * - Add course_category field based on course_type
 * - Add allow_package_purchase field for regular courses
 */
export async function migrateCoursesData(): Promise<MigrationResult> {
  console.log('開始遷移課程資料...')

  const result: MigrationResult = {
    totalProcessed: 0,
    migrated: 0,
    errors: 0,
    details: []
  }

  try {
    // Get all courses without category
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .is('course_category', null)

    if (error) {
      console.error('Error fetching courses:', error)
      throw error
    }

    if (!courses || courses.length === 0) {
      console.log('沒有需要遷移的課程資料')
      return result
    }

    result.totalProcessed = courses.length

    // Process each course
    for (const course of courses) {
      try {
        // Determine category based on course_type or total_sessions
        let category = 'regular' // default
        let allowPackagePurchase = true

        if (course.course_type === 'short_term' || course.total_sessions <= 16) {
          category = 'theme'
          allowPackagePurchase = false
        }

        // Update course
        const { error: updateError } = await supabase
          .from('courses')
          .update({
            course_category: category,
            allow_package_purchase: allowPackagePurchase
          })
          .eq('course_id', course.course_id)

        if (updateError) {
          console.error(`Error updating course ${course.course_id}:`, updateError)
          result.errors++
          result.details?.push({
            course_id: course.course_id,
            error: updateError.message
          })
        } else {
          result.migrated++
          console.log(`✓ 課程 ${course.course_name} 已遷移為 ${category} 類別`)
        }
      } catch (err) {
        console.error(`Error processing course ${course.course_id}:`, err)
        result.errors++
      }
    }
  } catch (err) {
    console.error('Fatal error in course migration:', err)
    throw err
  }

  return result
}

/**
 * Migrate enrollments data to new schema
 * - Add enrollment_category based on course category
 * - Add valid_until for all enrollments (6 months from creation)
 */
export async function migrateEnrollmentsData(): Promise<MigrationResult> {
  console.log('開始遷移註冊資料...')

  const result: MigrationResult = {
    totalProcessed: 0,
    migrated: 0,
    errors: 0,
    details: []
  }

  try {
    // Get all enrollments without category or validity
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select('*')
      .is('enrollment_category', null)

    if (error) {
      console.error('Error fetching enrollments:', error)
      throw error
    }

    if (!enrollments || enrollments.length === 0) {
      console.log('沒有需要遷移的註冊資料')
      return result
    }

    result.totalProcessed = enrollments.length

    // Process each enrollment
    for (const enrollment of enrollments) {
      try {
        // Get course information
        const { data: course, error: courseError } = await supabase
          .from('courses')
          .select('course_category')
          .eq('course_id', enrollment.course_id)
          .single()

        if (courseError || !course) {
          console.error(`Error fetching course ${enrollment.course_id}:`, courseError)
          result.errors++
          continue
        }

        // Calculate valid_until (6 months from creation)
        const createdDate = new Date(enrollment.created_at)
        const validUntil = new Date(createdDate)
        validUntil.setMonth(validUntil.getMonth() + 6)

        // Update enrollment
        const { error: updateError } = await supabase
          .from('enrollments')
          .update({
            enrollment_category: course.course_category || 'regular',
            valid_until: validUntil.toISOString().split('T')[0]
          })
          .eq('enrollment_id', enrollment.enrollment_id)

        if (updateError) {
          console.error(`Error updating enrollment ${enrollment.enrollment_id}:`, updateError)
          result.errors++
          result.details?.push({
            enrollment_id: enrollment.enrollment_id,
            error: updateError.message
          })
        } else {
          result.migrated++
          console.log(`✓ 註冊 ${enrollment.enrollment_id} 已遷移`)
        }
      } catch (err) {
        console.error(`Error processing enrollment ${enrollment.enrollment_id}:`, err)
        result.errors++
      }
    }
  } catch (err) {
    console.error('Fatal error in enrollment migration:', err)
    throw err
  }

  return result
}

/**
 * Generate migration report
 */
export async function generateMigrationReport(
  coursesResult: MigrationResult,
  enrollmentsResult: MigrationResult
): Promise<string> {
  const timestamp = new Date().toISOString()

  const report = `
=================================
資料遷移報告
=================================
執行時間: ${timestamp}

課程資料遷移
---------------------------------
總處理數: ${coursesResult.totalProcessed}
成功遷移: ${coursesResult.migrated}
錯誤數: ${coursesResult.errors}

註冊資料遷移
---------------------------------
總處理數: ${enrollmentsResult.totalProcessed}
成功遷移: ${enrollmentsResult.migrated}
錯誤數: ${enrollmentsResult.errors}

總結
---------------------------------
總處理記錄: ${coursesResult.totalProcessed + enrollmentsResult.totalProcessed}
成功遷移: ${coursesResult.migrated + enrollmentsResult.migrated}
總錯誤數: ${coursesResult.errors + enrollmentsResult.errors}
=================================
`

  return report
}

/**
 * Main migration function
 */
export async function runMigration() {
  console.log('=== 開始執行資料遷移 ===')

  try {
    // Step 1: Migrate courses
    console.log('\n步驟 1: 遷移課程資料')
    const coursesResult = await migrateCoursesData()
    console.log(`課程遷移完成: ${coursesResult.migrated}/${coursesResult.totalProcessed} 成功`)

    // Step 2: Migrate enrollments
    console.log('\n步驟 2: 遷移註冊資料')
    const enrollmentsResult = await migrateEnrollmentsData()
    console.log(`註冊遷移完成: ${enrollmentsResult.migrated}/${enrollmentsResult.totalProcessed} 成功`)

    // Generate report
    const report = await generateMigrationReport(coursesResult, enrollmentsResult)
    console.log(report)

    // Save report to file (optional)
    if (typeof window === 'undefined') {
      // Node.js environment
      const fs = await import('fs').then(m => m.promises)
      const reportPath = `migration-report-${Date.now()}.txt`
      await fs.writeFile(reportPath, report)
      console.log(`報告已儲存至: ${reportPath}`)
    }

    return {
      success: true,
      coursesResult,
      enrollmentsResult,
      report
    }
  } catch (error) {
    console.error('遷移過程中發生錯誤:', error)
    return {
      success: false,
      error
    }
  }
}

// Allow running from command line
if (typeof window === 'undefined' && require.main === module) {
  runMigration()
    .then(result => {
      if (result.success) {
        console.log('✅ 資料遷移成功完成')
        process.exit(0)
      } else {
        console.error('❌ 資料遷移失敗')
        process.exit(1)
      }
    })
    .catch(err => {
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
