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

  const email = await env.USERS.get(`user:${userId}:email`);
  const verified = await env.USERS.get(`user:${userId}:verified`);
  const tier = await env.USERS.get(`user:${userId}:tier`) || "free";

  return new Response(JSON.stringify({
    ok: true,
    userId,
    email,
    verified: verified === "true",
    tier
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
