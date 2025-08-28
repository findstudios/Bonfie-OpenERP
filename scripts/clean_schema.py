#!/usr/bin/env python3
"""清理 schema_clean.sql 檔案，移除多餘的空行"""

def clean_sql_file(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    cleaned_lines = []
    prev_empty = False
    
    for line in lines:
        # 檢查是否為空行
        is_empty = line.strip() == ''
        
        if is_empty:
            # 如果前一行不是空行，保留這個空行（段落分隔）
            if not prev_empty:
                cleaned_lines.append('\n')
            prev_empty = True
        else:
            # 非空行直接加入
            cleaned_lines.append(line)
            prev_empty = False
    
    # 寫入清理後的檔案
    with open(output_file, 'w', encoding='utf-8') as f:
        f.writelines(cleaned_lines)
    
    return len(lines), len(cleaned_lines)

if __name__ == '__main__':
    input_path = 'D:/Github-repo/Bonfie-OpenERP/schema_clean.sql'
    output_path = 'D:/Github-repo/Bonfie-OpenERP/schema_final.sql'
    
    original_lines, cleaned_lines = clean_sql_file(input_path, output_path)
    
    print(f"File cleaned successfully!")
    print(f"Original lines: {original_lines}")
    print(f"Cleaned lines: {cleaned_lines}")
    print(f"Removed {original_lines - cleaned_lines} lines")
    print(f"Output file: schema_final.sql")