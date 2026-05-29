// Cloudflare Pages Function — formulaire de contact via Web3Forms
// Variables d'env à configurer dans Cloudflare Pages → Settings → Variables :
//   WEB3FORMS_ACCESS_KEY  → clé obtenue sur web3forms.com (obligatoire)

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

  const accessKey = env.WEB3FORMS_ACCESS_KEY;
  if (!accessKey) {
    return new Response(JSON.stringify({ error: 'Configuration serveur manquante.' }), { status: 500, headers: corsHeaders });
  }

  const subject = `[Nexstay] ${type || 'Demande'} — ${prenom || ''} ${nom || ''}`.trim();

  const body = [
    `Prénom   : ${prenom || '—'}`,
    `Nom      : ${nom || '—'}`,
    `Email    : ${email}`,
    `Téléphone: ${telephone || '—'}`,
    `Type     : ${type || '—'}`,
    ``,
    `Message  :`,
    message,
  ].join('\n');

  let w3res;
  try {
    w3res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject,
        from_name: `${prenom || ''} ${nom || ''}`.trim() || 'Visiteur',
        email,
        message: body,
        botcheck: '',
      }),
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Impossible de joindre le service d\'envoi.' }), { status: 502, headers: corsHeaders });
  }

  const json = await w3res.json().catch(() => ({}));

  if (!w3res.ok || json.success === false) {
    console.error('Web3Forms error:', w3res.status, JSON.stringify(json));
    return new Response(JSON.stringify({ error: json.message || 'Erreur lors de l\'envoi.' }), { status: 502, headers: corsHeaders });
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
