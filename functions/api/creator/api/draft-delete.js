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

  await env.CREATOR.delete(draftKey);

  const draftCountKey = `meta:${userId}:draftCount`;
  const currentCount = parseInt((await env.CREATOR.get(draftCountKey)) || "0", 10);
  const newCount = Math.max(0, currentCount - 1);

  await env.CREATOR.put(draftCountKey, newCount.toString());

  return new Response(JSON.stringify({
    ok: true,
    draftId
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
