# API 規格文檔

## 概述

本文檔定義補習班管理系統中的 API 規格標準，包含資料格式、欄位定義和驗證規則。

---

## 課程模組 API

### 課程排程模式格式 (schedule_pattern)

課程表中的 `schedule_pattern` 欄位採用 JSON 格式存儲，用於定義課程的週期性上課安排。

#### 標準 JSON 格式

```json
{
  "type": "weekly",
  "days": [1, 3, 5],
  "start_time": "19:00",
  "end_time": "20:30",
  "duration": 90,
  "classroom": "A教室",
  "effective_date": "2025-07-21",
  "end_date": null
}
```

#### 欄位說明

| 欄位 | 類型 | 必填 | 說明 | 範例值 |
|------|------|------|------|--------|
| `type` | string | ✅ | 排程類型 | `"weekly"`, `"monthly"`, `"intensive"` |
| `days` | number[] | ✅ | 星期幾上課 (1=一, 2=二...7=日) | `[1, 3, 5]` |
| `start_time` | string | ✅ | 開始時間 (HH:mm 格式) | `"19:00"` |
| `end_time` | string | ✅ | 結束時間 (HH:mm 格式) | `"20:30"` |
| `duration` | number | ✅ | 課程長度 (分鐘) | `90` |
| `classroom` | string | ❌ | 預設教室 | `"A教室"` |
| `effective_date` | string | ✅ | 生效日期 (YYYY-MM-DD) | `"2025-07-21"` |
| `end_date` | string | ❌ | 結束日期 (YYYY-MM-DD, null=永久) | `"2025-12-31"` 或 `null` |

#### 排程類型說明

- **weekly**: 每週固定時間上課
- **monthly**: 每月固定時間上課  
- **intensive**: 密集班課程
- **irregular**: 不定期課程

#### 星期幾編碼規則

| 數字 | 星期 |
|------|------|
| 1 | 星期一 |
| 2 | 星期二 |
| 3 | 星期三 |
| 4 | 星期四 |
| 5 | 星期五 |
| 6 | 星期六 |
| 7 | 星期日 |

#### 範例場景

**場景 1: 一般週課程**
```json
{
  "type": "weekly",
  "days": [1, 3],
  "start_time": "19:00",
  "end_time": "20:30",
  "duration": 90,
  "classroom": "A教室",
  "effective_date": "2025-07-21",
  "end_date": null
}
```

**場景 2: 週末密集班**
```json
{
  "type": "intensive",
  "days": [6],
  "start_time": "09:00", 
  "end_time": "12:00",
  "duration": 180,
  "classroom": "B教室",
  "effective_date": "2025-07-26",
  "end_date": "2025-08-30"
}
```

**場景 3: 一週三天課程**
```json
{
  "type": "weekly",
  "days": [1, 3, 5],
  "start_time": "18:00",
  "end_time": "19:30", 
  "duration": 90,
  "classroom": "C教室",
  "effective_date": "2025-07-21",
  "end_date": null
}
```

#### 驗證規則

1. **時間格式**: `start_time` 和 `end_time` 必須為 `HH:mm` 格式
2. **時間邏輯**: `end_time` 必須大於 `start_time`
3. **duration 計算**: 應與 `start_time` 到 `end_time` 的時間差一致
4. **days 範圍**: 陣列元素必須在 1-7 之間
5. **日期格式**: 日期必須為 `YYYY-MM-DD` 格式
6. **日期邏輯**: `end_date` 如果不為 `null`，必須大於等於 `effective_date`

#### 轉換邏輯

從 `schedule_pattern` 生成實際課程安排時：

1. 讀取 `days` 陣列，找出所有上課的星期幾
2. 從 `effective_date` 開始，計算每週對應的日期
3. 結合 `start_time` 和 `end_time` 生成完整的 `class_datetime` 和 `end_datetime`
4. 重複直到 `end_date` (如果有設定) 或指定的課程堂數

---

## 更新記錄

| 版本 | 日期 | 變更說明 |
|------|------|----------|
| 1.0.0 | 2025-07-20 | 初始版本，定義課程排程模式標準格式 |

---

*📅 文檔生成時間: 2025-07-20*  
*🔄 最後更新: 課程排程模式 API 規格完成*