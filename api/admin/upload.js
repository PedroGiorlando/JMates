// =====================================================================
//  POST /api/admin/upload  { filename, dataUrl }  (Authorization: Bearer)
//  dataUrl = "data:image/jpeg;base64,...."  → escribe images/<slug>.<ext>
//  Devuelve { path } para guardar en product.image.
//  Límite Vercel Hobby: ~4.5MB de body → imagen real < ~3MB.
// =====================================================================

const { requireAuth } = require('./_auth');
const { putFile } = require('./_github');

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_BYTES = 3 * 1024 * 1024;

function slug(v) {
  return String(v || '').trim().toLowerCase().replace(/\.[a-z0-9]+$/, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  if (!requireAuth(req, res)) return;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const m = /^data:([^;]+);base64,(.+)$/s.exec(body.dataUrl || '');
    if (!m) {
      res.status(400).json({ error: 'dataUrl inválido' });
      return;
    }
    const ext = EXT_BY_MIME[m[1].toLowerCase()];
    if (!ext) {
      res.status(400).json({ error: 'formato no soportado (usá JPG, PNG o WEBP)' });
      return;
    }
    const b64 = m[2];
    const bytes = Buffer.from(b64, 'base64').length;
    if (bytes > MAX_BYTES) {
      res.status(413).json({ error: 'imagen muy pesada (máx 3 MB). Comprimila e intentá de nuevo.' });
      return;
    }
    const name = slug(body.filename) || 'foto-' + Date.now();
    const path = `images/${name}.${ext}`;
    await putFile(path, b64, `admin: subir imagen ${path}`);
    res.status(200).json({ path });
  } catch (err) {
    console.error('[admin/upload]', err);
    res.status(400).json({ error: (err && err.message) || 'error' });
  }
};
