console.log('=== CHAOS TEST: High Latency Simulation ===');
console.log('[SLO Definition] Max Response Time: 2000ms');

// 模擬一個執行了 3.5 秒的請求
const SIMULATED_DELAY_MS = 3500;
const START_TIME = Date.now();

console.log(`\n[Action] Sending request... (Simulating ${SIMULATED_DELAY_MS}ms backend delay)`);

setTimeout(() => {
    const duration = Date.now() - START_TIME;
    console.log(`[Result] Request finished in ${duration}ms`);

    // 驗證是否觸發 Latency Alert
    if (duration > 2000) {
        console.error('🚨 SLO VIOLATION: Latency exceeded 2000ms limit!');
        console.log('✅ PASS: High latency incident was detected and logged.');
    } else {
        console.log('❌ FAIL: Latency was ignored.');
    }
}, SIMULATED_DELAY_MS);
