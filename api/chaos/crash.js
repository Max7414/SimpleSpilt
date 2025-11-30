// Chaos endpoint to demonstrate stateless, self-healing serverless requests.
// GET /api/chaos/crash -> intentionally throw an error to return 500.
const logger = require('../../logger');
const { sendAlert } = require('../../utils/alert');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.end('Method Not Allowed');
  }

  logger.error('chaos_crash_invoked', { path: req.url });
  // Fire critical alert before crashing this invocation; await to ensure it’s sent
  try {
    await sendAlert('critical', '🚨 Critical System Failure Detected (Simulated)!', {
      meta: { path: req.url },
    });
  } catch (err) {
    logger.error('chaos_alert_failed', { error: err.message });
  }

  // Intentionally crash this invocation
  throw new Error('Critical System Failure');
};
