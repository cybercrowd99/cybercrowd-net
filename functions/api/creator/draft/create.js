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

  const draftCountKey = `meta:${userId}:draftCount`;
  const currentCount = parseInt((await env.CREATOR.get(draftCountKey)) || "0", 10);
  const newCount = currentCount + 1;

  const draftId = crypto.randomUUID();
  const draftKey = `draft:${userId}:${draftId}`;

  await env.CREATOR.put(draftKey, JSON.stringify({
    id: draftId,
    userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    title: "",
    body: "",
    status: "draft"
  }));

  await env.CREATOR.put(draftCountKey, newCount.toString());

  return new Response(JSON.stringify({
    ok: true,
    draftId,
    draftCount: newCount
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
