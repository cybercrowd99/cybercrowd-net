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

  const { draftId, title, body } = await request.json();

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

  if (title !== undefined) draft.title = title;
  if (body !== undefined) draft.body = body;

  draft.updatedAt = Date.now();

  await env.CREATOR.put(draftKey, JSON.stringify(draft));

  return new Response(JSON.stringify({
    ok: true,
    draftId
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
