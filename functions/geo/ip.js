export async function onRequest(context) {
  const cf = context.request.cf || {};

  return new Response(JSON.stringify({
    country: cf.country || null,
    region: cf.region || null,
    city: cf.city || null,
    latitude: cf.latitude || null,
    longitude: cf.longitude || null,
    timezone: cf.timezone || null,
    asn: cf.asn || null,
    colo: cf.colo || null
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
