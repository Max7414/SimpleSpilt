const crypto = require('crypto');

const base64urlDecode = (str) => {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(str.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf8');
};

const parseJwt = (token) => {
  const [headerPart, payloadPart, signature] = token.split('.');
  if (!headerPart || !payloadPart || !signature) throw new Error('JWT 格式錯誤');
  const header = JSON.parse(base64urlDecode(headerPart));
  const payload = JSON.parse(base64urlDecode(payloadPart));
  return { header, payload, signingInput: `${headerPart}.${payloadPart}`, signature };
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
  const res = await fetch(`${url}${path}`, {
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

const getAuthPayload = (req, secret) => {
  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');
  if (!token) throw new Error('缺少 Authorization Bearer token');
  return verifyJwt(token, secret);
};

module.exports = async function handler(req, res) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.statusCode = 500;
    return res.end('JWT_SECRET 未設定');
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    res.statusCode = 500;
    return res.end('SUPABASE_URL 或 SUPABASE_SERVICE_KEY 未設定');
  }

  let payload;
  try {
    payload = getAuthPayload(req, secret);
  } catch (err) {
    res.statusCode = 401;
    return res.end(err.message);
  }

  if (req.method === 'GET') {
    try {
      const rows = await supabaseRequest(
        'GET',
        `/rest/v1/entries?user_id=eq.${payload.sub}&select=*&order=created_at.desc`
      );
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ entries: rows }));
    } catch (err) {
      res.statusCode = 500;
      return res.end(`讀取紀錄失敗：${err.message}`);
    }
  }

  if (req.method === 'POST') {
    let body;
    try {
      body = await parseBody(req);
    } catch (err) {
      res.statusCode = 400;
      return res.end('無法解析 JSON');
    }

    const { item, total, participants, perPerson, aa, friendOwes } = body || {};
    if (!item || total == null || participants == null || perPerson == null || friendOwes == null) {
      res.statusCode = 400;
      return res.end('缺少必要欄位');
    }

    const record = {
      user_id: payload.sub,
      item,
      total,
      participants,
      per_person: perPerson,
      aa: !!aa,
      friend_owes: friendOwes,
    };

    try {
      const rows = await supabaseRequest('POST', '/rest/v1/entries', record);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ entry: rows[0] }));
    } catch (err) {
      res.statusCode = 500;
      return res.end(`寫入紀錄失敗：${err.message}`);
    }
  }

  res.statusCode = 405;
  res.setHeader('Allow', 'GET, POST');
  res.end('Method Not Allowed');
};
