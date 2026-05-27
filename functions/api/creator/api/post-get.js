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

  const { postId } = await request.json();

  if (!postId) {
    return new Response(JSON.stringify({ error: "missing postId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const postKey = `post:${userId}:${postId}`;
  const raw = await env.CREATOR.get(postKey);

  if (!raw) {
    return new Response(JSON.stringify({ error: "post not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({
    ok: true,
    post: JSON.parse(raw)
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
