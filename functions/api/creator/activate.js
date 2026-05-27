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

  await env.CREATOR.put(`tier:${userId}`, "creator");
  await env.CREATOR.put(`ready:${userId}`, "1");

  await env.CREATOR.put(`meta:${userId}:activatedAt`, Date.now().toString());
  await env.CREATOR.put(`meta:${userId}:draftCount`, "0");
  await env.CREATOR.put(`meta:${userId}:publishCount`, "0");

  return new Response(JSON.stringify({
    ok: true,
    userId,
    tier: "creator",
    ready: true
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
