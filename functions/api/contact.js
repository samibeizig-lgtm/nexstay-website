// Cloudflare Pages Function — formulaire de contact via Resend
// Variables d'env à configurer dans Cloudflare Pages → Settings → Variables :
//   RESEND_API_KEY      → clé API Resend (obligatoire)
//   CONTACT_TO_EMAIL    → adresse qui reçoit les messages (ex: contact@nexstay.tn)
//   CONTACT_FROM_EMAIL  → expéditeur vérifié dans Resend (ex: Nexstay <contact@nexstay.tn>)

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Requête invalide.' }), { status: 400, headers: corsHeaders });
  }

  const { prenom, nom, email, telephone, type, message } = data;

  if (!email || !message) {
    return new Response(JSON.stringify({ error: 'Email et message sont requis.' }), { status: 400, headers: corsHeaders });
  }

  const resendKey = env.RESEND_API_KEY;
  if (!resendKey) {
    return new Response(JSON.stringify({ error: 'Configuration serveur manquante.' }), { status: 500, headers: corsHeaders });
  }

  const toEmail   = env.CONTACT_TO_EMAIL   || 'contact@nexstay.tn';
  const fromEmail = env.CONTACT_FROM_EMAIL || 'Nexstay <noreply@nexstay.tn>';

  const subject = `[Nexstay] ${escHtml(type) || 'Demande'} — ${escHtml(prenom)} ${escHtml(nom)}`.trim();

  const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;color:#1E1E1E;max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:#D4714E;padding:24px 32px;border-radius:8px 8px 0 0;">
    <p style="margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.02em;">Nexstay — Nouveau message</p>
  </div>
  <div style="background:#F8F5F1;padding:28px 32px;border-radius:0 0 8px 8px;border:1px solid #e8e4de;border-top:none;">
    <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
      <tr><td style="padding:8px 0;border-bottom:1px solid #e8e4de;width:140px;color:#888;font-size:13px;">Prénom</td><td style="padding:8px 0;border-bottom:1px solid #e8e4de;font-weight:600;">${escHtml(prenom) || '—'}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #e8e4de;color:#888;font-size:13px;">Nom</td><td style="padding:8px 0;border-bottom:1px solid #e8e4de;font-weight:600;">${escHtml(nom) || '—'}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #e8e4de;color:#888;font-size:13px;">Email</td><td style="padding:8px 0;border-bottom:1px solid #e8e4de;"><a href="mailto:${escHtml(email)}" style="color:#D4714E;">${escHtml(email)}</a></td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #e8e4de;color:#888;font-size:13px;">Téléphone</td><td style="padding:8px 0;border-bottom:1px solid #e8e4de;">${escHtml(telephone) || '—'}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #e8e4de;color:#888;font-size:13px;">Type</td><td style="padding:8px 0;border-bottom:1px solid #e8e4de;">${escHtml(type) || '—'}</td></tr>
      <tr><td style="padding:12px 0 0;color:#888;font-size:13px;vertical-align:top;">Message</td><td style="padding:12px 0 0;">${escHtml(message).replace(/\n/g, '<br>')}</td></tr>
    </table>
    <p style="margin:24px 0 0;font-size:12px;color:#aaa;">Envoyé depuis nexstay.tn — répondre directement à cet email pour contacter ${escHtml(prenom) || 'le client'}.</p>
  </div>
</body>
</html>`;

  let resendRes;
  try {
    resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject,
        html: htmlBody,
      }),
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Impossible de joindre le service d\'envoi.' }), { status: 502, headers: corsHeaders });
  }

  if (!resendRes.ok) {
    const errText = await resendRes.text().catch(() => '');
    console.error('Resend error:', resendRes.status, errText);
    return new Response(JSON.stringify({ error: 'Erreur lors de l\'envoi. Réessayez.' }), { status: 502, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
