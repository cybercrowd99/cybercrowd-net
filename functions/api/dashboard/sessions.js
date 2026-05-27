export async function onRequest({ request, env }) {
  const sessionToken = request.headers.get("Authorization");

  if (!sessionToken) {
    return new Response(JSON.stringify({ error: "no session" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const userId = await env.SESSION.get(sessionToken);
  if (!userId) {
    return new Response(JSON.stringify({ error: "invalid session" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const created = await env.SESSION.get(`meta:${sessionToken}:created`);

  return new Response(JSON.stringify({
    ok: true,
    userId,
    session: {
      token: sessionToken,
      ip,
      created
    }
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
