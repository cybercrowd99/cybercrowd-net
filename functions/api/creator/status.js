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

  const tier = (await env.CREATOR.get(`tier:${userId}`)) || "free";
  const ready = (await env.CREATOR.get(`ready:${userId}`)) === "1";

  const capabilities = {
    canCreateDrafts: tier !== "free",
    canPublish: tier === "creator" || tier === "pro",
    canAccessAnalytics: tier === "pro",
    canUseCreatorAPI: tier === "pro"
  };

  return new Response(JSON.stringify({
    ok: true,
    userId,
    tier,
    ready,
    capabilities
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
