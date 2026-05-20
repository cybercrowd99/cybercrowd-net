export async function onRequest() {
  return new Response(JSON.stringify({
    alive: true,
    ts: Date.now()
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
