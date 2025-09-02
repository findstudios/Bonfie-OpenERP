# 修復頭像上傳問題

## 問題描述
在生產環境中上傳老師頭像時出現 400 Bad Request 錯誤：
```
POST https://wtpkhvkdvevutuuxbmyl.supabase.co/storage/v1/object/avatars/USR005.png 400 (Bad Request)
```

## 問題原因
Supabase Storage 中沒有創建 `avatars` bucket。

## 解決方案

### 1. 創建 Storage Bucket
請在 Supabase Dashboard 中執行以下步驟：

1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇你的專案
3. 進入 SQL Editor
4. 執行 `create-avatars-bucket.sql` 檔案中的 SQL 腳本

或者：

1. 進入 Storage 頁面
2. 點擊 "New bucket"
3. 設定：
   - Bucket name: `avatars`
   - Public bucket: ✓ (勾選)
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`

### 2. 確認 RLS 政策
腳本會自動創建以下政策：
- **讀取**：所有人都可以查看頭像（公開）
- **上傳/更新**：只有認證用戶可以上傳和更新頭像
- **刪除**：只有管理員可以刪除頭像

### 3. 測試上傳
創建 bucket 後，重新嘗試上傳頭像功能應該就能正常運作了。

## 預防措施
為了避免類似問題，建議：
1. 在部署前檢查所有需要的 Storage buckets 是否已創建
2. 將 bucket 創建加入到初始化腳本中
3. 在應用中添加更好的錯誤處理，明確提示缺少的 bucket