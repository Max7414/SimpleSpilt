const logger = require('./logger');

console.log('=== TEST SUITE: Logging Infrastructure ===');

// Test Case 1: Normal Operation (Info Level)
console.log('\n[Case 1] Simulating User Action:');
logger.info('user_login_success', { user_id: 'u-12345', ip: '192.168.1.1' });

// Test Case 2: Error Condition (Error Level)
console.log('\n[Case 2] Simulating Database Failure:');
const fakeError = new Error('Connection timed out');
logger.error('db_connection_failed', { 
    error_msg: fakeError.message, 
    retry_attempt: 3,
    critical: true 
});

console.log('\n=== TEST COMPLETE ===');
