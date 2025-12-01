// 模擬環境變數 (故意給一個壞掉的網址)
process.env.SUPABASE_URL = 'https://invalid-url.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'fake-key';
process.env.JWT_SECRET = 'secret';

const loginHandler = require('./api/login');

console.log('=== CHAOS TEST: Dependency Failure (Database Down) ===');

const req = { 
    method: 'POST', 
    headers: { 'content-type': 'application/json' },
    on: (event, cb) => {
        if (event === 'data') cb(JSON.stringify({ email: 'test@test.com', password: '123' }));
        if (event === 'end') cb();
    }
};

const res = {
    statusCode: 200,
    setHeader: () => {},
    end: (msg) => {
        console.log('\n[Server Response]:', msg);
        
        if (msg.includes('查詢使用者失敗') || msg.includes('fetch failed')) {
            console.log('\n✅ PASS: System gracefully handled DB failure.');
            console.log('   -> User received a friendly error message instead of a white screen.');
            console.log('   -> Error was caught in try/catch block.');
        } else {
            console.error('❌ FAIL: System did not handle the error as expected.');
        }
    }
};

// 執行 Login，預期會失敗
loginHandler(req, res);
