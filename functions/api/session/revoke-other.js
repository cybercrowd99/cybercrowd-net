export async function onRequest({ request, env }) {
  const currentToken = request.headers.get("Authorization");

  if (!currentToken) {
    return new Response(JSON.stringify({ error: "no session" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const userId = await env.SESSION.get(currentToken);
  if (!userId) {
    return new Response(JSON.stringify({ error: "invalid session" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { token: targetToken } = await request.json();

  if (!targetToken) {
    return new Response(JSON.stringify({ error: "missing token" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (targetToken === currentToken) {
    return new Response(JSON.stringify({ error: "cannot revoke current session" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const owner = await env.SESSION.get(targetToken);
  if (owner !== userId) {
    return new Response(JSON.stringify({ error: "not your session" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  await env.SESSION.delete(targetToken);
  await env.SESSION.delete(`meta:${targetToken}:created`);
  await env.SESSION.delete(`meta:${targetToken}:ip`);
  await env.SESSION.delete(`meta:${targetToken}:rotations`);

  return new Response(JSON.stringify({
    ok: true,
    revoked: targetToken
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
