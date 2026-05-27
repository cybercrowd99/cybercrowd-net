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

  const list = [];
  const prefix = `user:${userId}:session:`;

  const { keys } = await env.SESSION.list({ prefix });

  for (const key of keys) {
    const sessionToken = key.name.replace(prefix, "");
    const created = await env.SESSION.get(`meta:${sessionToken}:created`);
    const ip = await env.SESSION.get(`meta:${sessionToken}:ip`);

    list.push({
      token: sessionToken,
      created,
      ip
    });
  }

  return new Response(JSON.stringify({
    ok: true,
    userId,
    sessions: list
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
