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

  const created = await env.SESSION.get(`meta:${token}:created`);
  const ip = await env.SESSION.get(`meta:${token}:ip`);
  const ua = request.headers.get("User-Agent") || "unknown";

  const rotationCount = parseInt(
    (await env.SESSION.get(`meta:${token}:rotations`)) || "0",
    10
  );

  const now = Date.now();
  const ageMs = created ? now - parseInt(created, 10) : null;

  return new Response(JSON.stringify({
    ok: true,
    userId,
    token,
    created,
    ageMs,
    ip,
    userAgent: ua,
    rotationCount
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
