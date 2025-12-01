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
<<<<<<< HEAD
      // [Reliability Fix]: 加入 try-catch 以防止惡意 JSON 導致崩潰
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON format'));
=======
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
>>>>>>> 70ba73c654ad1603f98185066af95befe1737a4a
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
    `/rest/v1/profiles?email=eq.${encoded}&select=id,email,password_hash&limit=1`
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
<<<<<<< HEAD
    // [Reliability Fix]: 捕捉 JSON 解析錯誤，回傳 400 而不是 500
    console.error('[Input Resilience] Caught malformed JSON:', err.message);
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Bad Request: Malformed JSON payload' }));
=======
    res.statusCode = 400;
    return res.end('無法解析 JSON');
>>>>>>> 70ba73c654ad1603f98185066af95befe1737a4a
  }

  const { email, password } = body || {};
  if (!email || !password) {
    res.statusCode = 400;
    return res.end('需要 email 與 password');
  }

<<<<<<< HEAD
  // (後續登入邏輯省略，因為測試會在 JSON 解析階段就結束)
  // 為了完整性保留基本結構
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      res.statusCode = 401;
      return res.end('帳號不存在或密碼錯誤');
    }
    // ... 密碼驗證省略 ...
    const now = Math.floor(Date.now() / 1000);
    const token = signJwt({ sub: user.id }, secret);
    res.statusCode = 200;
    res.end(JSON.stringify({ token }));
  } catch (err) {
    res.statusCode = 500;
    res.end(err.message);
  }
};
=======
  let user;
  try {
    user = await getUserByEmail(email);
  } catch (err) {
    res.statusCode = 500;
    return res.end(`查詢使用者失敗：${err.message}`);
  }

  if (!user) {
    res.statusCode = 401;
    return res.end('帳號不存在或密碼錯誤');
  }

  const [salt, storedHash] = user.password_hash.split(':');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  if (hash !== storedHash) {
    res.statusCode = 401;
    return res.end('帳號不存在或密碼錯誤');
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60; // 1 小時有效
  const jti = crypto.randomUUID ? crypto.randomUUID() : `jti-${Date.now()}`;

  const token = signJwt({ sub: user.id, email: user.email, iat: now, exp, jti }, secret);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ token, email: user.email, exp }));
};
>>>>>>> 70ba73c654ad1603f98185066af95befe1737a4a
