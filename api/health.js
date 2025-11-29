const express = require('express');
const logger = require('../logger');

const app = express();
const router = express.Router();

router.get('/api/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsageMb = Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100;

  // Simulated dependency checks (replace with real pings as needed)
  const dependencies = {
    database: 'ok',
    google_auth: 'ok',
  };

  const payload = {
    status: 'ok',
    uptime,
    memory_usage: `${memoryUsageMb} MB`,
    dependencies,
  };

  logger.info('health_check', payload);
  res.status(200).json(payload);
});

// If this file is run directly (`node api/health.js`), start a tiny server for local testing.
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.use(router);
  app.listen(port, () => {
    logger.info('health endpoint listening', { port });
  });
}

module.exports = router;
