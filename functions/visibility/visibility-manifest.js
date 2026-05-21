export async function onRequest() {
  const manifest = {
    visibility: [
      "heartbeat",
      "mode"
    ]
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
