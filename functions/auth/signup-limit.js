export async function onRequest({ request, env, next }) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const key = `signup:ip:${ip}`;

  const attempts = parseInt((await env.SAFETY.get(key)) || "0", 10);

  if (attempts >= 5) {
    return new Response(JSON.stringify({ error: "rate_limited" }), {
      status: 429,
      headers: { "Content-Type": "application/json" }
    });
  }

  await env.SAFETY.put(key, String(attempts + 1), { expirationTtl: 600 });

  return next();
}
