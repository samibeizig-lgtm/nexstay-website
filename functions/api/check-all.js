// Cloudflare Pages Function — disponibilité Airbnb via iCal
// Variables d'env : ICAL_<SLUG_MAJUSCULES> dans le dashboard Cloudflare Pages
// ex: ICAL_IAAZ = "https://www.airbnb.com/calendar/ical/LISTING_ID.ics?s=TOKEN"

export async function onRequest(context) {
  const { request, env } = context;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const url = new URL(request.url);
  const checkin  = url.searchParams.get('checkin');
  const checkout = url.searchParams.get('checkout');

  if (!checkin || !checkout) {
    return new Response(
      JSON.stringify({ error: 'checkin et checkout requis' }),
      { status: 400, headers }
    );
  }

  const checkinDate  = new Date(checkin);
  const checkoutDate = new Date(checkout);

  const slugs = Object.keys(env)
    .filter(k => k.startsWith('ICAL_'))
    .map(k => ({ key: k, slug: k.slice(5).toLowerCase().replace(/_/g, '-') }));

  if (!slugs.length) {
    return new Response(JSON.stringify({ results: {} }), { status: 200, headers });
  }

  const checks = await Promise.all(
    slugs.map(async ({ key, slug }) => {
      const icalUrl = env[key];
      try {
        const r = await fetch(icalUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) return { slug, available: null };
        const text = await r.text();
        const blocked = parseIcal(text).some(e => e.start < checkoutDate && e.end > checkinDate);
        return { slug, available: !blocked };
      } catch {
        return { slug, available: null };
      }
    })
  );

  const results = {};
  checks.forEach(({ slug, available }) => { results[slug] = available; });

  return new Response(JSON.stringify({ results }), { status: 200, headers });
}

function parseIcal(text) {
  const events = [];
  const lines  = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  let inEvent = false, dtStart = null, dtEnd = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (line === 'BEGIN:VEVENT')  { inEvent = true; dtStart = null; dtEnd = null; continue; }
    if (line === 'END:VEVENT')    { if (inEvent && dtStart && dtEnd) events.push({ start: dtStart, end: dtEnd }); inEvent = false; continue; }
    if (!inEvent) continue;
    const m = line.match(/^(DTSTART|DTEND)(?:;[^:]+)?:(\d{8})/);
    if (!m) continue;
    const d = new Date(`${m[2].slice(0,4)}-${m[2].slice(4,6)}-${m[2].slice(6,8)}`);
    if (m[1] === 'DTSTART') dtStart = d; else dtEnd = d;
  }
  return events;
}
