export async function onRequest() {
  const manifest = {
    health: [
      "health-check"
    ]
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
