// test_runner.js
const healthHandler = require('./health');

// 模擬 Request 和 Response
const req = { method: 'GET', url: '/api/health' };
const res = {
    statusCode: 200,
    setHeader: () => {},
    end: (body) => console.log('\n--- HTTP RESPONSE BODY ---\n' + body)
};

console.log('--- SERVER LOGS START ---');
healthHandler(req, res);