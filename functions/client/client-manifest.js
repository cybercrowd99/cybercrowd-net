export async function onRequest() {
  const manifest = {
    client: [
      "fingerprint",
      "integrity",
      "session"
    ]
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
