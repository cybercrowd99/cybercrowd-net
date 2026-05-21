export async function onRequest() {
  const ts = Date.now();

  // Cloudflare Workers do not expose full memory metrics,
  // but we can provide a stable structure for future expansion.
  const runtime = {
    engine: "v8",
    workerVersion: "1",
    ts
  };

  return new Response(JSON.stringify(runtime, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
