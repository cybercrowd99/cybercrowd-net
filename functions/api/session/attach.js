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

  const indexKey = `user:${userId}:session:${token}`;

  await env.SESSION.put(indexKey, "1", { expirationTtl: 86400 });

  return new Response(JSON.stringify({
    ok: true,
    attached: token
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
