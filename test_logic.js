// test_logic.js - 簡單的單元測試腳本

console.log("🚀 Starting SimpleSplit Logic Tests...");

// 模擬: 核心計算邏輯 (從 script.js 概念提取)
function calculateSplit(total, people) {
    if (people <= 0) throw new Error("人數必須大於 0");
    return parseFloat((total / people).toFixed(2));
}

// 測試案例 1: 正常整除
try {
    const result = calculateSplit(100, 2);
    if (result === 50.00) {
        console.log("✅ Test 1 Passed: 100 / 2 = 50.00");
    } else {
        console.error("❌ Test 1 Failed");
        process.exit(1); // 讓 CI 報錯
    }
} catch (e) {
    console.error(e);
    process.exit(1);
}

// 測試案例 2: 除不盡 (HDD 假設驗證)
try {
    const result = calculateSplit(10, 3);
    // 預期應該是 3.33
    if (result === 3.33) {
        console.log("✅ Test 2 Passed: 10 / 3 = 3.33 (Logic handles recurring decimals)");
    } else {
        console.error(`❌ Test 2 Failed: Expected 3.33, got ${result}`);
        process.exit(1);
    }
} catch (e) {
    console.error(e);
    process.exit(1);
}

console.log("🎉 All Tests Passed!");