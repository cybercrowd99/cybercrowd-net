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
  const postKey = `post:${userId}:${postId}`;

  const post = {
    id: postId,
    title: draft.title,
    body: draft.body,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    publishedFromDraft: draftId
  };

  await env.CREATOR.put(postKey, JSON.stringify(post));

  draft.status = "published";
  draft.updatedAt = Date.now();

  await env.CREATOR.put(draftKey, JSON.stringify(draft));

  const metaKey = `creator:meta:${userId}`;
  const metaRaw = await env.CREATOR.get(metaKey);
  const meta = metaRaw ? JSON.parse(metaRaw) : { drafts: 0, published: 0 };

  meta.published += 1;

  await env.CREATOR.put(metaKey, JSON.stringify(meta));

  return new Response(JSON.stringify({
    ok: true,
    postId,
    draftId
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
