// =====================================================================
//  Lista de precios AUTORITATIVA (server-side).
//  SECURITY: los montos que se cobran salen de ACÁ, nunca del cliente.
//  Fuente única: data/products.json + data/shipping.json (editables desde /admin).
// =====================================================================

// require() de JSON literal: Vercel lo traza y lo incluye en el bundle de la
// función. Se cachea por proceso, pero los datos solo cambian vía redeploy
// (el panel commitea → nuevo deploy → nuevo bundle), así que siempre está fresco.

// PRODUCTS: { id: { name, price } } derivado de products.json
function getProducts() {
  const { products } = require('../data/products.json');
  const map = {};
  (products || []).forEach((p) => {
    map[p.id] = { name: p.name, price: Number(p.price) || 0 };
  });
  return map;
}

// SHIPPING: { zonaId: { label, cost, aConfirmar } } derivado de shipping.json
function getShipping() {
  const { zones } = require('../data/shipping.json');
  const map = {};
  (zones || []).forEach((z) => {
    map[z.id] = { label: z.label, cost: Number(z.cost) || 0, aConfirmar: !!z.aConfirmar };
  });
  return map;
}

// Construye los items de la preferencia desde lineas:[{id, qty}] del cliente,
// recalculando precio/nombre desde products.json (ignora cualquier precio del cliente).
function buildItems(lineas) {
  if (!Array.isArray(lineas) || lineas.length === 0) {
    throw new Error('lineas vacías');
  }
  const PRODUCTS = getProducts();
  return lineas.map((l) => {
    const p = PRODUCTS[l && l.id];
    if (!p) throw new Error('producto desconocido: ' + (l && l.id));
    const qty = Math.max(1, Math.min(20, parseInt(l.qty, 10) || 1));
    return {
      id: l.id,
      title: p.name,
      quantity: qty,
      unit_price: p.price,
      currency_id: 'ARS',
    };
  });
}

// Línea de envío para la zona (null si gratis o a confirmar).
function shippingItem(zona) {
  const SHIPPING = getShipping();
  const z = SHIPPING[zona];
  if (!z) throw new Error('zona desconocida: ' + zona);
  if (z.cost > 0) {
    return {
      id: 'envio-' + zona,
      title: 'Envío — ' + z.label,
      quantity: 1,
      unit_price: z.cost,
      currency_id: 'ARS',
    };
  }
  return null;
}

// Compatibilidad: PRODUCTS/SHIPPING como getters (se releen en cada acceso).
module.exports = {
  get PRODUCTS() { return getProducts(); },
  get SHIPPING() { return getShipping(); },
  buildItems,
  shippingItem,
};
