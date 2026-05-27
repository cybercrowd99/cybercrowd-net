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

  const { draftId } = await request.json();

  if (!draftId) {
    return new Response(JSON.stringify({ error: "missing draftId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const draftKey = `draft:${userId}:${draftId}`;
  const raw = await env.CREATOR.get(draftKey);

  if (!raw) {
    return new Response(JSON.stringify({ error: "draft not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  const draft = JSON.parse(raw);

  if (!draft.title || !draft.body) {
    return new Response(JSON.stringify({ error: "draft incomplete" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const postId = crypto.randomUUID();
  const postKey = `post:${postId}`;

  await env.CREATOR.put(postKey, JSON.stringify({
    id: postId,
    userId,
    title: draft.title,
    body: draft.body,
    publishedAt: Date.now()
  }));

  draft.status = "published";
  draft.updatedAt = Date.now();

  await env.CREATOR.put(draftKey, JSON.stringify(draft));

  const publishCountKey = `meta:${userId}:publishCount`;
  const currentCount = parseInt((await env.CREATOR.get(publishCountKey)) || "0", 10);
  const newCount = currentCount + 1;

  await env.CREATOR.put(publishCountKey, newCount.toString());

  return new Response(JSON.stringify({
    ok: true,
    postId,
    publishCount: newCount
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
