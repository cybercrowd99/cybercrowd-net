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

  const verified = await env.USERS.get(`user:${userId}:verified`) === "true";
  const password = await env.USERS.get(`user:${userId}:password`);
  const hasPassword = !!password;

  const created = await env.SESSION.get(`meta:${sessionToken}:created`);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";

  return new Response(JSON.stringify({
    ok: true,
    userId,
    verified,
    hasPassword,
    session: {
      token: sessionToken,
      created,
      ip
    }
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
