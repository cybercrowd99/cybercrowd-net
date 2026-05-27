export async function onRequest({ request, env }) {
  const token = request.headers.get("Authorization");

  if (!token) {
    return new Response(JSON.stringify({ error: "no session" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const userId = await env.SESSION.get(token);
  if (!userId) {
    return new Response(JSON.stringify({ error: "invalid session" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = Date.now().toString();

  await env.SESSION.put(`meta:${token}:lastSeen`, now, { expirationTtl: 86400 });
  await env.SESSION.put(`meta:${token}:lastIp`, ip, { expirationTtl: 86400 });

  return new Response(JSON.stringify({
    ok: true,
    refreshed: token,
    lastSeen: now,
    lastIp: ip
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
