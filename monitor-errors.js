const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// 創建錯誤日誌目錄
const errorLogDir = path.join(__dirname, 'error-logs');
if (!fs.existsSync(errorLogDir)) {
    fs.mkdirSync(errorLogDir);
}

// 取得當前日期的日誌檔名
const logFileName = `development-errors-${new Date().toISOString().split('T')[0]}.log`;
const logFilePath = path.join(errorLogDir, logFileName);

// 寫入日誌的函數
function writeLog(type, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type}] ${message}\n`;
    fs.appendFileSync(logFilePath, logEntry);
    console.log(`📝 ${type}: ${message}`);
}

// 監控開發伺服器輸出
console.log('🔍 開始監控錯誤...');
console.log(`📁 錯誤日誌將儲存在: ${logFilePath}`);

// 定期檢查日誌檔案大小
setInterval(() => {
    if (fs.existsSync(logFilePath)) {
        const stats = fs.statSync(logFilePath);
        const size = (stats.size / 1024).toFixed(2);
        console.log(`📊 日誌檔案大小: ${size} KB`);
    }
}, 30000); // 每30秒報告一次

// 監聽鍵盤輸入以顯示統計
process.stdin.on('data', (data) => {
    const input = data.toString().trim();
    if (input === 's' || input === 'stats') {
        if (fs.existsSync(logFilePath)) {
            const content = fs.readFileSync(logFilePath, 'utf-8');
            const lines = content.split('\n').filter(line => line.length > 0);
            const errors = lines.filter(line => line.includes('[ERROR]')).length;
            const warnings = lines.filter(line => line.includes('[WARNING]')).length;
            
            console.log('\n📈 錯誤統計:');
            console.log(`   ❌ 錯誤: ${errors}`);
            console.log(`   ⚠️ 警告: ${warnings}`);
            console.log(`   📝 總記錄: ${lines.length}\n`);
        }
    }
});

console.log('💡 提示: 輸入 "s" 或 "stats" 來查看錯誤統計');
writeLog('INFO', '錯誤監控系統已啟動');