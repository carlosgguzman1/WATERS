// WATERS — /api/contact  (Vercel Serverless Function, Node 18+)
// Recibe el formulario, valida, y envía el email con Resend (https://resend.com).
// Variables de entorno en Vercel:
//   RESEND_API_KEY  → tu API key de Resend
//   CONTACT_TO      → email que recibe los mensajes (ej. tu@gmail.com)
//   CONTACT_FROM    → remitente verificado en Resend (ej. "WATERS <hola@tudominio.com>")
// Si RESEND_API_KEY no está, el mensaje se registra en los logs de Vercel y responde ok
// con delivered:false (útil para probar antes de conectar email).

const hits = new Map(); // rate-limit simple por IP (por instancia)
const LIMIT = 5, WINDOW_MS = 10 * 60 * 1000;

const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, error: 'Método no permitido' }); }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const rec = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (rec.length >= LIMIT) return res.status(429).json({ ok: false, error: 'Demasiados intentos. Intenta en unos minutos.' });
  rec.push(now); hits.set(ip, rec);

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};
  const name = String(body.name || '').trim().slice(0, 120);
  const email = String(body.email || '').trim().slice(0, 160);
  const message = String(body.message || '').trim().slice(0, 3000);
  const services = Array.isArray(body.services) ? body.services.map(s => String(s).slice(0, 40)).slice(0, 10) : [];

  if (body.company) return res.status(200).json({ ok: true, delivered: false }); // honeypot: bot
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || message.length < 10)
    return res.status(400).json({ ok: false, error: 'Completa nombre, un email válido y un mensaje (mín. 10 caracteres).' });

  const { RESEND_API_KEY, CONTACT_TO, CONTACT_FROM } = process.env;
  if (!RESEND_API_KEY || !CONTACT_TO) {
    console.log('[WATERS contacto]', JSON.stringify({ name, email, services, message, ip, at: new Date().toISOString() }));
    return res.status(200).json({ ok: true, delivered: false });
  }

  const html = `<div style="font-family:Arial,sans-serif;max-width:560px">
    <h2 style="margin:0 0 12px">Nuevo mensaje — WATERS</h2>
    <p><b>Nombre:</b> ${esc(name)}<br><b>Email:</b> ${esc(email)}<br><b>Servicios:</b> ${esc(services.join(', ') || '—')}</p>
    <p style="white-space:pre-wrap;border-left:3px solid #5ef2ff;padding-left:12px">${esc(message)}</p></div>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: CONTACT_FROM || 'WATERS <onboarding@resend.dev>', to: CONTACT_TO.split(',').map(s => s.trim()), reply_to: email, subject: `WATERS · ${name}`, html })
    });
    if (!r.ok) { console.error('Resend error', r.status, await r.text()); return res.status(502).json({ ok: false, error: 'No se pudo enviar ahora. Intenta de nuevo.' }); }
    return res.status(200).json({ ok: true, delivered: true });
  } catch (e) {
    console.error(e); return res.status(500).json({ ok: false, error: 'Error del servidor.' });
  }
}
