// =====================================================================
//  POST /api/webhook  — notificación de Mercado Pago.
//  Valida x-signature, consulta el pago; si está 'approved' manda el
//  resumen al WhatsApp del primo. Responde 200 rápido.
// =====================================================================

const crypto = require('crypto');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const { sendWhatsApp } = require('./_whatsapp');
const { PRODUCTS } = require('./_catalog');

function fmt(n) {
  return '$ ' + Number(n || 0).toLocaleString('es-AR');
}

// Valida la firma HMAC de MP. Si no hay MP_WEBHOOK_SECRET, no valida (dev).
function validSignature(req, dataId) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true;
  const sig = req.headers['x-signature'] || '';
  const reqId = req.headers['x-request-id'] || '';
  const parts = {};
  sig.split(',').forEach((kv) => {
    const idx = kv.indexOf('=');
    if (idx > -1) parts[kv.slice(0, idx).trim()] = kv.slice(idx + 1).trim();
  });
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${reqId};ts:${ts};`;
  const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1));
  } catch (_) {
    return false;
  }
}

module.exports = async (req, res) => {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const q = req.query || {};
    const dataId = q['data.id'] || (body.data && body.data.id);
    const type = q.type || body.type;

    if (!dataId) {
      res.status(200).send('ok');
      return;
    }
    if (!validSignature(req, dataId)) {
      console.warn('[webhook] firma inválida');
      res.status(401).send('bad signature');
      return;
    }
    if (type && type !== 'payment') {
      res.status(200).send('ok');
      return;
    }
    if (!process.env.MP_ACCESS_TOKEN) {
      console.error('[webhook] MP_ACCESS_TOKEN faltante');
      res.status(200).send('ok');
      return;
    }

    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const payment = await new Payment(client).get({ id: dataId });

    if (payment && payment.status === 'approved') {
      const md = payment.metadata || {};
      const lineas = Array.isArray(md.lineas) ? md.lineas : [];
      const zonaLabel = md.zona_label || md.zona || '—';
      const aConfirmar = md.envio_a_confirmar;
      const payer = payment.payer || {};
      const comprador = md.comprador || {};

      const itemLines = lineas.length
        ? lineas
            .map((l) => {
              const p = PRODUCTS[l.id];
              const q2 = l.qty || 1;
              return `• ${q2}× ${p ? p.name : l.id} (${fmt((p ? p.price : 0) * q2)})`;
            })
            .join('\n')
        : '(detalle no disponible)';

      const nombre =
        [payer.first_name, payer.last_name].filter(Boolean).join(' ') ||
        comprador.nombre ||
        '—';
      const email = payer.email || comprador.email || '—';
      const tel = comprador.tel || '—';

      const text =
        '🧉 *Nuevo pedido pagado — JMates*\n' +
        `Pedido: ${md.order_id || payment.external_reference || '—'}\n\n` +
        `${itemLines}\n\n` +
        `Envío: ${zonaLabel}${aConfirmar ? ' (a confirmar aparte)' : ''}\n` +
        `Total cobrado: ${fmt(payment.transaction_amount)}\n\n` +
        `Comprador: ${nombre}\n` +
        `WhatsApp: ${tel}\n` +
        `Email: ${email}\n` +
        `Pago MP: ${payment.id} (${payment.status})`;

      await sendWhatsApp(text);
    }

    res.status(200).send('ok');
  } catch (err) {
    console.error('[webhook]', err);
    res.status(200).send('ok'); // 200 para que MP no reintente en loop
  }
};
