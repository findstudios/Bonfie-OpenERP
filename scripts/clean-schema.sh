#!/bin/bash
# 清理 schema_clean.sql 檔案

input_file="../schema_clean.sql"
output_file="../schema_final.sql"

# 移除多餘空行，但保留段落間的單一空行
awk '
BEGIN { blank=0 }
/^[[:space:]]*$/ { 
    blank++
    if (blank == 1) print ""
    next 
}
{ 
    blank=0
    print 
}
' "$input_file" > "$output_file"

echo "檔案已清理完成！"
echo "原始檔案行數: $(wc -l < "$input_file")"
echo "清理後行數: $(wc -l < "$output_file")"