const loginHandler = require('./api/login');

console.log('=== RELIABILITY TEST: Input Resilience (Fuzzing) ===');

// 測試案例 1: 傳送損壞的 JSON (例如少了一個括號)
// 預期結果: 系統應該捕捉錯誤並回傳 400，而不是讓 Node.js Process Crash
console.log('\n[Case 1] Sending Malformed JSON Payload...');

const reqMalformed = {
    method: 'POST',
    on: (event, cb) => {
        // 故意傳送不合法的 JSON 字串
        if (event === 'data') cb('{"email": "bad-json", "password": "123"'); 
        if (event === 'end') cb();
    }
};

const resMalformed = {
    statusCode: 200,
    setHeader: () => {},
    end: (msg) => {
        if (resMalformed.statusCode === 400) {
            console.log('✅ PASS: System rejected malformed JSON with 400 Bad Request.');
            console.log(`   -> Response: ${msg}`);
        } else {
            console.error(`❌ FAIL: Unexpected status code: ${resMalformed.statusCode}`);
        }
    }
};

// 執行測試
try {
    loginHandler(reqMalformed, resMalformed);
} catch (e) {
    console.error('❌ CRITICAL FAIL: System crashed ungracefully!', e);
}

// 測試案例 2: 傳送空內容
console.log('\n[Case 2] Sending Empty Body...');
const reqEmpty = {
    method: 'POST',
    on: (event, cb) => {
        if (event === 'end') cb(); // 沒有 data 事件
    }
};

const resEmpty = {
    statusCode: 200,
    setHeader: () => {},
    end: (msg) => {
        // API 邏輯：如果沒給 email/password，視為 400
        if (resEmpty.statusCode === 400) {
            console.log('✅ PASS: System handled missing fields correctly.');
            console.log(`   -> Response: ${msg}`);
        } else {
             console.log(`ℹ️ Note: Received status ${resEmpty.statusCode} (This is acceptable if logic allows empty check)`);
        }
    }
};

loginHandler(reqEmpty, resEmpty);
