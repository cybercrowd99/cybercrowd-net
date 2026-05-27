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

  const list = [];
  const prefix = `post:${userId}:`;

  const { keys } = await env.CREATOR.list({ prefix });

  for (const key of keys) {
    const raw = await env.CREATOR.get(key.name);
    if (raw) {
      list.push(JSON.parse(raw));
    }
  }

  return new Response(JSON.stringify({ ok: true, posts: list }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
