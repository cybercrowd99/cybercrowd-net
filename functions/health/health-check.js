export async function onRequest(context) {
  const env = context.env;

  const now = Date.now();
  const drift = Math.abs(now - new Date().getTime());

  const bindings = Object.keys(env || {});

  return new Response(JSON.stringify({
    ok: true,
    ts: now,
    drift,
    bindings
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
