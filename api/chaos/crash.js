// Chaos endpoint to demonstrate stateless, self-healing serverless requests.
// GET /api/chaos/crash -> intentionally throw an error to return 500.
const logger = require('../../logger');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    return res.end('Method Not Allowed');
  }

  logger.error('chaos_crash_invoked', { path: req.url });
  // Intentionally crash this invocation
  throw new Error('Critical System Failure');
};
