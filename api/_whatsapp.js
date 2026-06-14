// =====================================================================
//  Manda el resumen del pedido al WhatsApp del primo.
//  Canal por variables de entorno:
//   - Cloud API oficial (Meta):  WA_TOKEN + WA_PHONE_ID + PRIMO_WA
//   - CallMeBot (fallback):      CALLMEBOT_KEY + PRIMO_WA
//  Si no hay canal configurado, solo loguea (no rompe el webhook).
//  Node 18+ en Vercel trae fetch global.
// =====================================================================

async function sendWhatsApp(text) {
  const primo = process.env.PRIMO_WA; // ej "5492610000000" (país+área+nro, sin + ni 15)
  if (!primo) {
    console.warn('[whatsapp] PRIMO_WA no seteado — no se envía resumen');
    return;
  }

  // 1) WhatsApp Cloud API (oficial)
  if (process.env.WA_TOKEN && process.env.WA_PHONE_ID) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${process.env.WA_PHONE_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.WA_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: primo,
            type: 'text',
            text: { body: text },
          }),
        }
      );
      if (!res.ok) console.error('[whatsapp] Cloud API error', res.status, await res.text());
    } catch (e) {
      console.error('[whatsapp] Cloud API throw', e);
    }
    return;
  }

  // 2) CallMeBot (atajo no oficial)
  if (process.env.CALLMEBOT_KEY) {
    try {
      const url =
        'https://api.callmebot.com/whatsapp.php' +
        `?phone=${encodeURIComponent(primo)}` +
        `&text=${encodeURIComponent(text)}` +
        `&apikey=${encodeURIComponent(process.env.CALLMEBOT_KEY)}`;
      const res = await fetch(url);
      if (!res.ok) console.error('[whatsapp] CallMeBot error', res.status, await res.text());
    } catch (e) {
      console.error('[whatsapp] CallMeBot throw', e);
    }
    return;
  }

  console.warn('[whatsapp] sin canal configurado (CALLMEBOT_KEY o WA_TOKEN/WA_PHONE_ID)');
}

module.exports = { sendWhatsApp };
