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

  const { draftId, title, body } = await request.json();

  if (!draftId) {
    return new Response(JSON.stringify({ error: "missing draftId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const draftKey = `draft:${userId}:${draftId}`;
  const existing = await env.CREATOR.get(draftKey);

  if (!existing) {
    return new Response(JSON.stringify({ error: "draft not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  const draft = JSON.parse(existing);

  draft.title = title ?? draft.title;
  draft.body = body ?? draft.body;
  draft.updatedAt = Date.now();

  await env.CREATOR.put(draftKey, JSON.stringify(draft));

  return new Response(JSON.stringify({
    ok: true,
    draftId,
    updatedAt: draft.updatedAt
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
