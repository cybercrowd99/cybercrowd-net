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

  await env.SESSION.delete(token);
  await env.SESSION.delete(`meta:${token}:created`);
  await env.SESSION.delete(`meta:${token}:ip`);
  await env.SESSION.delete(`meta:${token}:rotations`);

  return new Response(JSON.stringify({
    ok: true,
    revoked: true
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
