export async function onRequest(context) {
  const req = context.request;
  const cf = req.cf || {};

  return new Response(JSON.stringify({
    tlsVersion: cf.tlsVersion || null,
    tlsCipher: cf.tlsCipher || null,
    httpProtocol: cf.httpProtocol || null,
    security: {
      botScore: cf.botScore || null,
      threatScore: cf.threatScore || null,
      isEUCountry: cf.isEUCountry || false
    }
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
