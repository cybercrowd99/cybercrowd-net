export async function onRequest(context) {
  const cf = context.request.cf || {};

  return new Response(JSON.stringify({
    asn: cf.asn || null,
    asOrganization: cf.asOrganization || null,
    network: cf.asn ? `AS${cf.asn}` : null
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
