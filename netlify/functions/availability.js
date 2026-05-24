// Netlify function — checks Airbnb availability via iCal feed
// Env vars: ICAL_<SLUG_UPPERCASE> = "https://www.airbnb.com/calendar/ical/LISTING_ID.ics?s=TOKEN"
// Slugs with hyphens → underscores, e.g. "modern-meets-tuniso-berber-heritage" → ICAL_MODERN_MEETS_TUNISO_BERBER_HERITAGE

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  };

  const { slug, checkin, checkout } = event.queryStringParameters || {};

  if (!slug || !checkin || !checkout) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'slug, checkin, checkout requis' }) };
  }

  const envKey = 'ICAL_' + slug.toUpperCase().replace(/-/g, '_');
  const icalUrl = process.env[envKey];

  if (!icalUrl) {
    return { statusCode: 200, headers, body: JSON.stringify({ slug, available: null, reason: 'no_ical' }) };
  }

  try {
    const res = await fetch(icalUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    const checkinDate  = new Date(checkin);
    const checkoutDate = new Date(checkout);

    const blocked = parseIcal(text).some(e => e.start < checkoutDate && e.end > checkinDate);

    return { statusCode: 200, headers, body: JSON.stringify({ slug, available: !blocked }) };
  } catch (err) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: err.message }) };
  }
};

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
    const d = toDate(m[2]);
    if (m[1] === 'DTSTART') dtStart = d;
    else                    dtEnd   = d;
  }

  return events;
}

function toDate(s) {
  return new Date(`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`);
}
