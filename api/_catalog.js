// =====================================================================
//  Lista de precios AUTORITATIVA (server-side).
//  SECURITY: los montos que se cobran salen de ACÁ, nunca del cliente.
//  Espejo de PRODUCTS en index.html — mantener sincronizado a mano.
// =====================================================================

const PRODUCTS = {
  'mate-imperial':      { name: 'Mate Imperial Uruguayo',     price: 32000 },
  'mate-camionero':     { name: 'Mate Camionero',             price: 18500 },
  'mate-torpedo':       { name: 'Mate Torpedo',               price: 24000 },
  'bombilla-alpaca':    { name: 'Bombilla de Alpaca Clásica', price: 7500 },
  'bombilla-pico-loro': { name: 'Bombilla Pico de Loro',      price: 9000 },
  'yerba-canarias':     { name: 'Yerba Canarias Especial',    price: 4200 },
  'yerba-playadito':    { name: 'Yerba Playadito Suave',      price: 3800 },
  'yerba-merced':       { name: 'Yerba La Merced Despalada',   price: 4500 },
  'kit-inicial':        { name: 'Kit Iniciación',             price: 28000 },
  'kit-ronda':          { name: 'Kit Ronda Completa',         price: 55000 },
};

// Tarifas de envío fijas por zona (ARS). 'resto' = a confirmar (no cobra online).
const SHIPPING = {
  mendoza: { label: 'Mendoza (retiro / envío local)', cost: 0 },
  cuyo:    { label: 'Cuyo / Centro',                  cost: 4000 },
  caba:    { label: 'CABA / GBA',                     cost: 5500 },
  resto:   { label: 'Resto del país',                 cost: 0, aConfirmar: true },
};

// Construye los items de la preferencia desde lineas:[{id, qty}] del cliente,
// recalculando precio/nombre desde PRODUCTS (ignora cualquier precio del cliente).
function buildItems(lineas) {
  if (!Array.isArray(lineas) || lineas.length === 0) {
    throw new Error('lineas vacías');
  }
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

module.exports = { PRODUCTS, SHIPPING, buildItems, shippingItem };
