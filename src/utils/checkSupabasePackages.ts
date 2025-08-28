import { supabase } from '@/services/supabase'

export async function checkSupabasePackages() {
  console.log('=== 查詢 Supabase 套餐資料 ===\n')

  try {
    // 1. 查詢所有套餐
    const { data: packages, error: packagesError } = await supabase
      .from('course_packages')
      .select('*')
      .order('course_id')
      .order('sort_order')

    if (packagesError) {
      console.error('查詢套餐錯誤:', packagesError)
      return
    }

    console.log(`找到 ${packages?.length || 0} 個套餐\n`)

    if (packages && packages.length > 0) {
      // 按課程分組顯示
      const packagesByCourse: Record<string, any[]> = {}
      packages.forEach(pkg => {
        if (!packagesByCourse[pkg.course_id]) {
          packagesByCourse[pkg.course_id] = []
        }
        packagesByCourse[pkg.course_id].push(pkg)
      })

      for (const [courseId, coursePackages] of Object.entries(packagesByCourse)) {
        console.log(`\n課程 ${courseId} 的套餐:`)
        console.log('─'.repeat(60))

        coursePackages.forEach(pkg => {
          console.log(`套餐名稱: ${pkg.package_name}`)
          console.log(`套餐ID: ${pkg.package_id}`)
          console.log(`堂數: ${pkg.session_count} 堂`)
          console.log(`價格: $${pkg.price}`)
          console.log(`折扣: ${pkg.discount_percentage || 0}%`)
          console.log(`有效天數: ${pkg.validity_days} 天`)
          console.log(`狀態: ${pkg.is_active ? '啟用' : '停用'}`)
          console.log(`排序: ${pkg.sort_order}`)
          console.log(`建立時間: ${pkg.created_at}`)
          console.log('─'.repeat(30))
        })
      }
    }

    // 2. 查詢有啟用套餐購買的課程
    console.log('\n\n=== 有啟用套餐購買的課程 ===')
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('course_id, course_name, allow_package_purchase, price_per_session')
      .eq('allow_package_purchase', true)

    if (coursesError) {
      console.error('查詢課程錯誤:', coursesError)
      return
    }

    if (courses && courses.length > 0) {
      console.log(`\n找到 ${courses.length} 個課程啟用了套餐購買:`)
      courses.forEach(course => {
        console.log(`\n課程名稱: ${course.course_name}`)
        console.log(`課程ID: ${course.course_id}`)
        console.log(`單堂價格: $${course.price_per_session || 'N/A'}`)

        // 顯示該課程的套餐數量
        const coursePackageCount = packagesByCourse[course.course_id]?.length || 0
        console.log(`套餐數量: ${coursePackageCount} 個`)
      })
    } else {
      console.log('\n目前沒有課程啟用套餐購買功能')
    }

    // 3. 統計資訊
    console.log('\n\n=== 統計資訊 ===')
    console.log(`總套餐數: ${packages?.length || 0}`)
    console.log(`有套餐的課程數: ${Object.keys(packagesByCourse).length}`)

    // 檢查是否有使用套餐的訂單
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('*')
      .not('package_id', 'is', null)
      .limit(5)

    if (!orderItemsError && orderItems) {
      console.log(`\n有使用套餐的訂單項目數: ${orderItems.length}`)
      if (orderItems.length > 0) {
        console.log('\n最近使用套餐的訂單項目:')
        orderItems.forEach(item => {
          console.log(`- 訂單ID: ${item.order_id}, 套餐ID: ${item.package_id}, 價格: $${item.final_price}`)
        })
      }
    }

  } catch (error) {
    console.error('執行錯誤:', error)
  }
}

// 如果直接執行此檔案
if (import.meta.url === `file://${process.argv[1]}`) {
  checkSupabasePackages()
}
