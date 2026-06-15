// =====================================================================
//  Auth del panel admin — token firmado (HMAC), sin dependencias externas.
//  Secreto = ADMIN_PASSWORD. El token caduca a las 12 horas.
// =====================================================================

const crypto = require('crypto');

const TTL_MS = 12 * 60 * 60 * 1000; // 12 h

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function sign(payloadStr, secret) {
  return b64url(crypto.createHmac('sha256', secret).update(payloadStr).digest());
}

// Crea un token válido para el password correcto.
function issueToken() {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error('ADMIN_PASSWORD no configurado');
  const payload = b64url(JSON.stringify({ exp: Date.now() + TTL_MS }));
  return payload + '.' + sign(payload, secret);
}

// Verifica el password (comparación a tiempo constante).
function checkPassword(input) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || !input) return false;
  const a = Buffer.from(String(input));
  const b = Buffer.from(String(secret));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Valida un token (firma + expiración). Devuelve true/false.
function verifyToken(token) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || !token || typeof token !== 'string') return false;
  const dot = token.indexOf('.');
  if (dot < 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(payload, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    return typeof data.exp === 'number' && Date.now() < data.exp;
  } catch (_) {
    return false;
  }
}

// Extrae el token del header Authorization: Bearer xxx
function tokenFromReq(req) {
  const h = req.headers['authorization'] || req.headers['Authorization'] || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1] : null;
}

// Middleware-ish: responde 401 y devuelve false si no autorizado.
function requireAuth(req, res) {
  if (verifyToken(tokenFromReq(req))) return true;
  res.status(401).json({ error: 'no autorizado' });
  return false;
}

module.exports = { issueToken, checkPassword, verifyToken, tokenFromReq, requireAuth };
