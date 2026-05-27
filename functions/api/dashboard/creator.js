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

  const creator = await env.USERS.get(`user:${userId}:creator`) === "true";

  const analytics = {
    posts: 0,
    views: 0,
    revenue: 0
  };

  return new Response(JSON.stringify({
    ok: true,
    userId,
    creator,
    analytics
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
