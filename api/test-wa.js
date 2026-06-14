// TEMPORAL — diagnóstico de WhatsApp. Borrar tras debuggear.
// GET /api/test-wa  → intenta mandar por CallMeBot y devuelve la respuesta cruda.
module.exports = async (req, res) => {
  const primo = process.env.PRIMO_WA;
  const key = process.env.CALLMEBOT_KEY;
  const out = {
    primoSet: !!primo,
    primoSample: primo ? primo.slice(0, 4) + '…' + primo.slice(-2) : null,
    callmebotSet: !!key,
    cloudApiSet: !!(process.env.WA_TOKEN && process.env.WA_PHONE_ID),
    webhookSecretSet: !!process.env.MP_WEBHOOK_SECRET,
  };
  if (primo && key) {
    const url =
      'https://api.callmebot.com/whatsapp.php' +
      `?phone=${encodeURIComponent(primo)}` +
      `&text=${encodeURIComponent('🧉 Test JMates — CallMeBot OK')}` +
      `&apikey=${encodeURIComponent(key)}`;
    try {
      const r = await fetch(url);
      out.callmebotStatus = r.status;
      out.callmebotBody = (await r.text()).replace(/<[^>]+>/g, ' ').slice(0, 600);
    } catch (e) {
      out.fetchError = String(e);
    }
  }
  res.status(200).json(out);
};
