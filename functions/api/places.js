// Cloudflare Pages Function — proxy Google Places API (New)
// Variables d'env à configurer dans Cloudflare Pages → Settings → Variables :
//   GOOGLE_PLACES_API_KEY  → clé API Google Maps Platform
//   GOOGLE_PLACE_ID        → Place ID Google de Nexstay (ex: ChIJ...)

export async function onRequest(context) {
  const { env } = context;

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=3600',
  };

  if (!env.GOOGLE_PLACES_API_KEY || !env.GOOGLE_PLACE_ID) {
    return new Response(JSON.stringify({ error: 'Configuration manquante' }), { status: 500, headers: corsHeaders });
  }

  try {
    const url = `https://places.googleapis.com/v1/places/${env.GOOGLE_PLACE_ID}`;
    const res = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews',
        'Accept-Language': 'fr',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Places API error' }), { status: res.status, headers: corsHeaders });
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
