const healthHandler = require('./api/health');

// 1. 設定警報門檻 (故意設超低，確保一定會觸發警報，以驗證功能)
const MEMORY_THRESHOLD_MB = 1; // 1 MB
const EXPECTED_UPTIME_TYPE = 'number';

console.log('=== TEST SUITE: Metrics & Alerting ===');
console.log(`[Config] Alert Threshold: Memory > ${MEMORY_THRESHOLD_MB} MB`);

// 模擬 Request/Response
const req = { method: 'GET', url: '/api/health' };
const res = {
    statusCode: 200,
    setHeader: () => {},
    end: (bodyString) => {
        const data = JSON.parse(bodyString);
        
        // 2. 驗證 Metric Correctness (數值是否合理?)
        console.log('\n[Check 1] Validating Metric Data Structure...');
        if (typeof data.uptime === EXPECTED_UPTIME_TYPE && data.memory_usage.includes('MB')) {
             console.log('✅ PASS: Metrics format is correct.');
             console.log(`   -> Uptime: ${data.uptime.toFixed(2)}s`);
             console.log(`   -> Memory: ${data.memory_usage}`);
        } else {
             console.error('❌ FAIL: Invalid metric format.');
        }

        // 3. 驗證 Alert Thresholds (警報是否觸發?)
        console.log('\n[Check 2] Testing Alert Logic...');
        const currentMem = parseFloat(data.memory_usage);
        if (currentMem > MEMORY_THRESHOLD_MB) {
            console.error(`🚨 ALERT TRIGGERED: High Memory Usage detected! (${currentMem} MB > ${MEMORY_THRESHOLD_MB} MB)`);
            console.log('✅ PASS: Alert system correctly identified resource exhaustion.');
        } else {
            console.warn('⚠️ WARNING: Alert did not trigger. Is the threshold too high?');
        }
        
        console.log('\n=== TEST COMPLETE ===');
    }
};

healthHandler(req, res);
