# Observability (Logs & Metrics)

## Structured Logging
- 位置：`logger.js`
- 格式：`timestamp`, `level`, `service`, `message`, `meta`（JSON 輸出到 stdout/stderr）
- 錯誤時使用範例（try/catch）：
```js
const logger = require('./logger');

async function handler(req, res) {
  try {
    // ...your logic
  } catch (err) {
    logger.error('api_error', { path: req.url, error: err.message, stack: err.stack });
    res.status(500).json({ error: 'internal_error' });
  }
}
```

## Metrics Endpoint (`/api/health`)
- 位置：`api/health.js`（Express 路由）
- 回傳內容：
  - `status`: "ok"
  - `uptime`: `process.uptime()`（秒）
  - `memory_usage`: RSS（MB）
  - `dependencies`: 模擬 Database / Google Auth 狀態
- 可直接執行 `node api/health.js` 在本地測試（預設 3000 port）。
