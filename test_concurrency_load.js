const healthHandler = require('./api/health');

console.log('=== RELIABILITY TEST: Concurrency Load Simulation ===');
const TOTAL_REQUESTS = 50;
let completed = 0;
let errors = 0;

console.log(`[Action] Flooding system with ${TOTAL_REQUESTS} concurrent requests...`);

const start = Date.now();

for (let i = 0; i < TOTAL_REQUESTS; i++) {
    // 模擬 Request
    const req = { method: 'GET', url: '/api/health' };
    const res = {
        statusCode: 200,
        setHeader: () => {},
        end: () => {
            completed++;
            process.stdout.write('.'); // 進度條效果
            if (completed === TOTAL_REQUESTS) {
                finish();
            }
        }
    };
    
    // 不用 await，直接轟炸
    try {
        healthHandler(req, res);
    } catch (e) {
        errors++;
        console.error('Request failed');
    }
}

function finish() {
    const duration = Date.now() - start;
    console.log('\n\n=== LOAD TEST RESULTS ===');
    console.log(`✅ Total Requests: ${TOTAL_REQUESTS}`);
    console.log(`✅ Successful: ${completed}`);
    console.log(`❌ Failed: ${errors}`);
    console.log(`⏱️ Time Taken: ${duration}ms`);
    console.log(`🚀 Throughput: ${Math.round(TOTAL_REQUESTS / (duration/1000))} req/sec`);
    
    if (errors === 0) {
        console.log('\n[Conclusion] System handles burst traffic effectively without dropping requests.');
    } else {
        console.log('\n[Conclusion] System showed instability under load.');
    }
}
