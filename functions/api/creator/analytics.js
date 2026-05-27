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

  const tier = await env.CREATOR.get(`tier:${userId}`);
  if (tier !== "creator" && tier !== "pro") {
    return new Response(JSON.stringify({ error: "not a creator" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  const draftCount = parseInt((await env.CREATOR.get(`meta:${userId}:draftCount`)) || "0", 10);
  const publishCount = parseInt((await env.CREATOR.get(`meta:${userId}:publishCount`)) || "0", 10);
  const activatedAt = (await env.CREATOR.get(`meta:${userId}:activatedAt`)) || null;
  const lastPublishAt = (await env.CREATOR.get(`meta:${userId}:lastPublishAt`)) || null;

  return new Response(JSON.stringify({
    ok: true,
    userId,
    analytics: {
      draftCount,
      publishCount,
      activatedAt,
      lastPublishAt
    }
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
