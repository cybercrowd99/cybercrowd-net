export async function onRequest() {
  return new Response(JSON.stringify({
    now: Date.now()
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
