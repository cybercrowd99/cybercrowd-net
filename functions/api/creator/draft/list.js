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

  const prefix = `draft:${userId}:`;
  const { keys } = await env.CREATOR.list({ prefix });

  const drafts = [];

  for (const key of keys) {
    const raw = await env.CREATOR.get(key.name);
    if (!raw) continue;

    const draft = JSON.parse(raw);

    drafts.push({
      id: draft.id,
      title: draft.title,
      updatedAt: draft.updatedAt,
      status: draft.status
    });
  }

  return new Response(JSON.stringify({
    ok: true,
    drafts
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
