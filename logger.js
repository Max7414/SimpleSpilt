// Lightweight structured logger for server-side use.
// Usage:
// const logger = require('./logger');
// logger.info('Started handler', { path: '/api/foo' });

const SERVICE_NAME = 'simplesplit-api';

const log = (level, message, meta = {}) => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    service: SERVICE_NAME,
    message,
    meta,
  };
  // Write to stdout/stderr for platform ingestion
  if (level === 'error') {
    console.error(JSON.stringify(payload));
  } else {
    console.log(JSON.stringify(payload));
  }
};

module.exports = {
  info: (message, meta) => log('info', message, meta),
  error: (message, meta) => log('error', message, meta),
};
