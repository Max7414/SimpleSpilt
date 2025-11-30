// Lightweight alert utility using Discord Webhook.
// Usage: const { sendAlert } = require('../utils/alert');
// sendAlert('critical', '🚨 Critical System Failure Detected (Simulated)!', { meta: { path: '/api/chaos/crash' } });

const fetchFn =
  typeof fetch === 'function'
    ? fetch
    : (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LEVEL_COLOR = {
  critical: 0xff0000, // red
  error: 0xff0000,
  warning: 0xffc107, // amber
  info: 0x3498db, // blue
};

const sendAlert = async (level, message, options = {}) => {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    // Fail silently but log to console for debugging.
    console.warn('DISCORD_WEBHOOK_URL is not set; skipping alert.', { level, message });
    return;
  }

  const now = new Date();
  const color = LEVEL_COLOR[level] || LEVEL_COLOR.info;
  const { meta = {} } = options;

  const payload = {
    embeds: [
      {
        title: `[${level.toUpperCase()}] SimpleSplit Alert`,
        description: message,
        color,
        timestamp: now.toISOString(),
        fields: Object.entries(meta).map(([name, value]) => ({
          name,
          value: String(value),
          inline: true,
        })),
      },
    ],
  };

  const attemptSend = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout to avoid hanging
    try {
      const res = await fetchFn(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`status ${res.status} body ${text}`);
      }
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  };

  try {
    await attemptSend();
  } catch (err) {
    // retry once after brief backoff to handle transient network issues (e.g., ETIMEDOUT)
    try {
      await sleep(500);
      await attemptSend();
    } catch (err2) {
      console.error('Error sending alert', err2);
    }
  }
};

module.exports = { sendAlert };
