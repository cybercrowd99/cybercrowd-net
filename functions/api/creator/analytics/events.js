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

  const prefix = `event:${userId}:`;
  const { keys } = await env.CREATOR.list({ prefix });

  const events = [];

  for (const key of keys) {
    const raw = await env.CREATOR.get(key.name);
    if (!raw) continue;

    const event = JSON.parse(raw);
    events.push(event);
  }

  events.sort((a, b) => b.timestamp - a.timestamp);

  return new Response(JSON.stringify({
    ok: true,
    events
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
