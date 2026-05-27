import { validateApiKey } from "../../../creator/api/validate-key.js";

export async function onRequest({ request, env }) {
  const apiKey = request.headers.get("X-API-Key");

  const validation = await validateApiKey(env, apiKey);
  if (!validation.ok) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { userId } = validation;

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

  const postId = crypto.randomUUID();
  const postKey = `post:${postId}`;

  const post = {
    id: postId,
    userId,
    title: draft.title,
    body: draft.body,
    publishedAt: Date.now()
  };

  await env.CREATOR.put(postKey, JSON.stringify(post));

  const publishCountKey = `meta:${userId}:publishCount`;
  const currentCount = parseInt((await env.CREATOR.get(publishCountKey)) || "0", 10);
  await env.CREATOR.put(publishCountKey, (currentCount + 1).toString());

  await env.CREATOR.put(`meta:${userId}:lastPublishAt`, post.publishedAt.toString());

  return new Response(JSON.stringify({
    ok: true,
    postId
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
