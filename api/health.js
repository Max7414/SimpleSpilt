const logger = require('../logger');
const { sendAlert } = require('../utils/alert');

module.exports = async function handler(req, res) {
  // Allow preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.end('Method Not Allowed');
  }

  try {
    const uptime = process.uptime();
    const memoryUsageMb = Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100;

    // Simulated dependency checks; replace with real health probes if available.
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

    if (memoryUsageMb > 200) {
      sendAlert('warning', '⚠️ Memory RSS exceeded 200MB threshold', {
        meta: { memory_usage_mb: memoryUsageMb, uptime_seconds: uptime },
      });
    }

    logger.info('health_check', payload);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
  } catch (err) {
    logger.error('health_check_failed', { error: err.message, stack: err.stack });
    res.statusCode = 500;
    res.end('internal_error');
  }
};
