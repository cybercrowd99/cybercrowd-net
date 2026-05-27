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

  const tier = await env.USERS.get(`user:${userId}:tier`) || "free";
  const creator = await env.USERS.get(`user:${userId}:creator`) === "true";

  const upgradeOptions = {
    free: ["member", "creator"],
    member: ["creator"],
    creator: []
  };

  return new Response(JSON.stringify({
    ok: true,
    userId,
    tier,
    creator,
    upgradeOptions: upgradeOptions[tier]
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
