const crypto = require('crypto');

const base64url = (input) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const signJwt = (payload, secret) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerPart = base64url(JSON.stringify(header));
  const payloadPart = base64url(JSON.stringify(payload));
  const data = `${headerPart}.${payloadPart}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64');
  const signaturePart = signature.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${data}.${signaturePart}`;
};

const parseBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
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

const getUserByEmail = async (email) => {
  const encoded = encodeURIComponent(email);
  const rows = await supabaseRequest(
    'GET',
    `/rest/v1/profiles?email=eq.${encoded}&select=id,email&limit=1`
  );
  return rows[0];
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

  const { email, password } = body || {};
  if (!email || !password) {
    res.statusCode = 400;
    return res.end('需要 email 與 password');
  }

  try {
    const exists = await getUserByEmail(email);
    if (exists) {
      res.statusCode = 409;
      return res.end('此 email 已註冊');
    }
  } catch (err) {
    res.statusCode = 500;
    return res.end(`查詢使用者失敗：${err.message}`);
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60;
  const jti = crypto.randomUUID ? crypto.randomUUID() : `jti-${Date.now()}`;

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  const passwordHash = `${salt}:${hash}`;

  let inserted;
  try {
    const rows = await supabaseRequest('POST', '/rest/v1/profiles', {
      email,
      password_hash: passwordHash,
    });
    inserted = rows[0];
  } catch (err) {
    res.statusCode = 500;
    return res.end(`寫入使用者失敗：${err.message}`);
  }

  const token = signJwt({ sub: inserted.id, email: inserted.email, iat: now, exp, jti }, secret);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ token, email, exp }));
};
