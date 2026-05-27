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
  if (tier !== "pro") {
    return new Response(JSON.stringify({ error: "pro tier required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  const apiKey = crypto.randomUUID();
  const keyStorage = `apiKey:${userId}`;

  await env.CREATOR.put(keyStorage, apiKey);

  return new Response(JSON.stringify({
    ok: true,
    apiKey
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
