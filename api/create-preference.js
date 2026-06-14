// =====================================================================
//  POST /api/create-preference
//  Body: { lineas:[{id,qty}], zona, comprador? }
//  Crea una preferencia de Checkout Pro y devuelve { init_point, order_id }.
//  Precios SIEMPRE recalculados server-side desde _catalog.
// =====================================================================

const { MercadoPagoConfig, Preference } = require('mercadopago');
const { buildItems, shippingItem, SHIPPING } = require('./_catalog');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  if (!process.env.MP_ACCESS_TOKEN) {
    res.status(500).json({ error: 'MP_ACCESS_TOKEN no configurado en el server' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { lineas, zona, comprador } = body;

    const items = buildItems(lineas);
    const envio = shippingItem(zona);
    if (envio) items.push(envio);

    const total = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const orderId = 'JM-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);

    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const origin = `${proto}://${host}`;

    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const pref = new Preference(client);

    const result = await pref.create({
      body: {
        items: items.map((i) => ({
          id: i.id,
          title: i.title,
          quantity: i.quantity,
          unit_price: i.unit_price,
          currency_id: 'ARS',
        })),
        external_reference: orderId,
        metadata: {
          order_id: orderId,
          zona: zona || null,
          zona_label: (SHIPPING[zona] && SHIPPING[zona].label) || null,
          envio_a_confirmar: !!(SHIPPING[zona] && SHIPPING[zona].aConfirmar),
          total,
          lineas,
          comprador: comprador || null,
        },
        back_urls: {
          success: `${origin}/?pago=success&order=${orderId}`,
          pending: `${origin}/?pago=pending&order=${orderId}`,
          failure: `${origin}/?pago=failure&order=${orderId}`,
        },
        auto_return: 'approved',
        notification_url: `${origin}/api/webhook`,
        statement_descriptor: 'JMATES',
      },
    });

    res.status(200).json({ init_point: result.init_point, order_id: orderId });
  } catch (err) {
    console.error('[create-preference]', err);
    res.status(400).json({ error: (err && err.message) || 'error' });
  }
};
