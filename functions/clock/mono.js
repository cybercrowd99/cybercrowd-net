export async function onRequest() {
  return new Response(JSON.stringify({
    mono: performance.now()
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
