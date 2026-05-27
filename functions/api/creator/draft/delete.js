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

  const { draftId } = await request.json();

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

  await env.CREATOR.delete(draftKey);

  const draftCountKey = `meta:${userId}:draftCount`;
  const currentCount = parseInt((await env.CREATOR.get(draftCountKey)) || "0", 10);
  const newCount = Math.max(0, currentCount - 1);

  await env.CREATOR.put(draftCountKey, newCount.toString());

  return new Response(JSON.stringify({
    ok: true,
    deleted: draftId,
    draftCount: newCount
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
