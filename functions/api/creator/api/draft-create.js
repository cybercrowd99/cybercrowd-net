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

  const { title, body } = await request.json();

  if (!title) {
    return new Response(JSON.stringify({ error: "missing title" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const draftId = crypto.randomUUID();
  const draftKey = `draft:${userId}:${draftId}`;

  const draft = {
    id: draftId,
    userId,
    title,
    body: body || "",
    status: "draft",
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await env.CREATOR.put(draftKey, JSON.stringify(draft));

  const draftCountKey = `meta:${userId}:draftCount`;
  const currentCount = parseInt((await env.CREATOR.get(draftCountKey)) || "0", 10);
  await env.CREATOR.put(draftCountKey, (currentCount + 1).toString());

  return new Response(JSON.stringify({
    ok: true,
    draftId
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
