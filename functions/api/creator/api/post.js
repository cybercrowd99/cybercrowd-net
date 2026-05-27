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

  const url = new URL(request.url);
  const postId = url.searchParams.get("id");

  if (!postId) {
    return new Response(JSON.stringify({ error: "missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const postKey = `post:${postId}`;
  const raw = await env.CREATOR.get(postKey);

  if (!raw) {
    return new Response(JSON.stringify({ error: "post not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  const post = JSON.parse(raw);

  if (post.userId !== userId) {
    return new Response(JSON.stringify({ error: "not your post" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({
    ok: true,
    post
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
