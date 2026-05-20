export async function onRequest() {
  const manifest = {
    clock: [
      "now",
      "drift",
      "mono",
      "sync"
    ]
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
