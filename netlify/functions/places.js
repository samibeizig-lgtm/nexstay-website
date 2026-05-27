exports.handler = async function () {
  const GKEY = process.env.GOOGLE_PLACES_API_KEY;
  if (!GKEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  const API = 'https://places.googleapis.com/v1';

  try {
    const searchRes = await fetch(API + '/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GKEY,
        'X-Goog-FieldMask': 'places.id'
      },
      body: JSON.stringify({
        textQuery: 'Nexstay Conciergerie',
        languageCode: 'fr',
        locationBias: {
          circle: { center: { latitude: 36.8, longitude: 10.18 }, radius: 50000.0 }
        },
        maxResultCount: 1
      })
    });

    const searchData = await searchRes.json();
    if (!searchData.places || !searchData.places.length) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Place not found' }) };
    }

    const placeId = searchData.places[0].id;

    const detailRes = await fetch(API + '/places/' + placeId + '?languageCode=fr', {
      headers: {
        'X-Goog-Api-Key': GKEY,
        'X-Goog-FieldMask': 'rating,userRatingCount,reviews,googleMapsUri'
      }
    });

    const place = await detailRes.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(place)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
