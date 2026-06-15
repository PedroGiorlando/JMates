// =====================================================================
//  POST /api/admin/save  { section, data }   (Authorization: Bearer <token>)
//  section ∈ products | shipping | kit | faq
//  Valida/normaliza la forma antes de escribir a data/<section>.json en GitHub.
// =====================================================================

const { requireAuth } = require('./_auth');
const { putJson } = require('./_github');

const CATEGORIES = ['mate', 'bombilla', 'yerba', 'combo'];

function str(v, max) {
  const s = (v == null ? '' : String(v)).trim();
  return max ? s.slice(0, max) : s;
}
function slug(v) {
  return str(v, 60).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function money(v) {
  const n = Math.round(Number(v));
  if (!isFinite(n) || n < 0) return 0;
  return Math.min(n, 99999999);
}

function validateProducts(data) {
  const arr = Array.isArray(data && data.products) ? data.products : null;
  if (!arr || arr.length === 0) throw new Error('products vacío');
  const seen = new Set();
  const products = arr.map((p, i) => {
    const id = slug(p.id) || slug(p.name) || 'producto-' + (i + 1);
    if (seen.has(id)) throw new Error('id duplicado: ' + id);
    seen.add(id);
    const category = CATEGORIES.includes(p.category) ? p.category : 'mate';
    const name = str(p.name, 120);
    if (!name) throw new Error('producto sin nombre (fila ' + (i + 1) + ')');
    return {
      id,
      category,
      name,
      desc: str(p.desc, 400),
      price: money(p.price),
      image: str(p.image, 300),
    };
  });
  return { products };
}

function validateShipping(data) {
  const arr = Array.isArray(data && data.zones) ? data.zones : null;
  if (!arr || arr.length === 0) throw new Error('zones vacío');
  const seen = new Set();
  const zones = arr.map((z, i) => {
    const id = slug(z.id) || slug(z.label) || 'zona-' + (i + 1);
    if (seen.has(id)) throw new Error('id de zona duplicado: ' + id);
    seen.add(id);
    const label = str(z.label, 120);
    if (!label) throw new Error('zona sin nombre (fila ' + (i + 1) + ')');
    return {
      id,
      label,
      blurb: str(z.blurb, 200),
      cost: money(z.cost),
      dias: str(z.dias, 40),
      aConfirmar: !!z.aConfirmar,
    };
  });
  return { intro: str(data.intro, 600), zones };
}

function validateKit(data) {
  const pasos = (data && data.pasos) || {};
  return {
    title: str(data && data.title, 80) || 'Armá tu kit',
    intro: str(data && data.intro, 400),
    placeholder: str(data && data.placeholder, 200),
    pasos: {
      mate: str(pasos.mate, 60) || '1. Elegí tu mate',
      bombilla: str(pasos.bombilla, 60) || '2. Elegí tu bombilla',
      yerba: str(pasos.yerba, 60) || '3. Elegí tu yerba',
    },
  };
}

function validateFaq(data) {
  const arr = Array.isArray(data && data.items) ? data.items : null;
  if (!arr) throw new Error('items inválido');
  const items = arr
    .map((it) => ({ q: str(it.q, 200), a: str(it.a, 1200) }))
    .filter((it) => it.q || it.a);
  return { items };
}

const VALIDATORS = {
  products: validateProducts,
  shipping: validateShipping,
  kit: validateKit,
  faq: validateFaq,
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  if (!requireAuth(req, res)) return;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const section = str(body.section, 20);
    const validate = VALIDATORS[section];
    if (!validate) {
      res.status(400).json({ error: 'sección inválida' });
      return;
    }
    const clean = validate(body.data);
    await putJson(`data/${section}.json`, clean, `admin: actualizar ${section}`);
    res.status(200).json({ ok: true, section });
  } catch (err) {
    console.error('[admin/save]', err);
    res.status(400).json({ error: (err && err.message) || 'error' });
  }
};
