export async function onRequest({ request, env }) {
  const oldToken = request.headers.get("Authorization");

  if (!oldToken) {
    return new Response(JSON.stringify({ error: "no session" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const userId = await env.SESSION.get(oldToken);
  if (!userId) {
    return new Response(JSON.stringify({ error: "invalid session" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const created = await env.SESSION.get(`meta:${oldToken}:created`);
  const ip = await env.SESSION.get(`meta:${oldToken}:ip`);

  const newToken = crypto.randomUUID();

  await env.SESSION.put(newToken, userId, { expirationTtl: 86400 });
  await env.SESSION.put(`meta:${newToken}:created`, created || Date.now().toString());
  await env.SESSION.put(`meta:${newToken}:ip`, ip || "unknown");

  await env.SESSION.delete(oldToken);
  await env.SESSION.delete(`meta:${oldToken}:created`);
  await env.SESSION.delete(`meta:${oldToken}:ip`);

  return new Response(JSON.stringify({
    ok: true,
    userId,
    newToken
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
