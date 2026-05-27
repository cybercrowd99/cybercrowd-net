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

  const prefix = "post:";
  const { keys } = await env.CREATOR.list({ prefix });

  const posts = [];

  for (const key of keys) {
    const raw = await env.CREATOR.get(key.name);
    if (!raw) continue;

    const post = JSON.parse(raw);

    if (post.userId === userId) {
      posts.push({
        id: post.id,
        title: post.title,
        publishedAt: post.publishedAt
      });
    }
  }

  posts.sort((a, b) => b.publishedAt - a.publishedAt);

  return new Response(JSON.stringify({
    ok: true,
    posts
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
