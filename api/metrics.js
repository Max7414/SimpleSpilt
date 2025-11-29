const crypto = require('crypto');

// Ensure fetch exists (Node 18+ has global fetch; fallback to node-fetch for safety)
const fetchFn =
  typeof fetch === 'function'
    ? fetch
    : (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const base64urlDecode = (str) => {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(str.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf8');
};

const parseJwt = (token) => {
  const [headerPart, payloadPart, signature] = token.split('.');
  if (!headerPart || !payloadPart || !signature) throw new Error('JWT 格式錯誤');
  const payload = JSON.parse(base64urlDecode(payloadPart));
  const signingInput = `${headerPart}.${payloadPart}`;
  return { payload, signingInput, signature };
};

const verifyJwt = (token, secret) => {
  const { payload, signingInput, signature } = parseJwt(token);
  const expected = crypto.createHmac('sha256', secret).update(signingInput).digest('base64');
  const expectedUrl = expected.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  if (expectedUrl !== signature) throw new Error('簽章不符');
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now > payload.exp) throw new Error('JWT 已過期');
  return payload;
};

const parseBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });

const supabaseRequest = async (method, path, body) => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL 或 SUPABASE_SERVICE_KEY 未設定');
  }
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
  const res = await fetchFn(`${url}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end('Method Not Allowed');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.statusCode = 500;
    return res.end('JWT_SECRET 未設定');
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    res.statusCode = 500;
    return res.end('SUPABASE_URL 或 SUPABASE_SERVICE_KEY 未設定');
  }

  let body;
  try {
    body = await parseBody(req);
  } catch (err) {
    res.statusCode = 400;
    return res.end('無法解析 JSON');
  }

  const { type, payload } = body || {};
  if (!type) {
    res.statusCode = 400;
    return res.end('缺少 type');
  }

  let jwtPayload = null;
  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');
  if (token) {
    try {
      jwtPayload = verifyJwt(token, secret);
    } catch (err) {
      // metrics 可接受匿名；驗證失敗則當匿名
      jwtPayload = null;
    }
  }

  const record = {
    type,
    user_id: jwtPayload ? jwtPayload.sub : null,
    email: jwtPayload ? jwtPayload.email : null,
    payload: payload || {},
  };

  try {
    await supabaseRequest('POST', '/rest/v1/metrics', record);
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    res.statusCode = 500;
    res.end(`寫入 metrics 失敗：${err.message}`);
  }
};
