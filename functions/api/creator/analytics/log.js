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

  const { type } = await request.json();

  if (!type) {
    return new Response(JSON.stringify({ error: "missing event type" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const eventId = crypto.randomUUID();
  const eventKey = `event:${userId}:${eventId}`;

  const timestamp = Date.now();

  await env.CREATOR.put(eventKey, JSON.stringify({
    id: eventId,
    userId,
    type,
    timestamp
  }));

  return new Response(JSON.stringify({
    ok: true,
    eventId,
    type,
    timestamp
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
