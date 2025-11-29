const logger = require('../logger');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
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
