// POST /api/admin/login  { password }  → { token }
const { checkPassword, issueToken } = require('./_auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  if (!process.env.ADMIN_PASSWORD) {
    res.status(500).json({ error: 'ADMIN_PASSWORD no configurado en el server' });
    return;
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (!checkPassword(body.password)) {
      res.status(401).json({ error: 'contraseña incorrecta' });
      return;
    }
    res.status(200).json({ token: issueToken() });
  } catch (err) {
    res.status(400).json({ error: (err && err.message) || 'error' });
  }
};
