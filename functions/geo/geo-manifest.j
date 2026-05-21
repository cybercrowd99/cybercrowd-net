export async function onRequest() {
  const manifest = {
    geo: [
      "ip",
      "region",
      "timezone",
      "asn"
    ]
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
