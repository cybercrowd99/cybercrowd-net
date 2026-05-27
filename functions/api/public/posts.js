export async function onRequest({ request, env }) {
  const prefix = "post:";
  const { keys } = await env.CREATOR.list({ prefix });

  const posts = [];

  for (const key of keys) {
    const raw = await env.CREATOR.get(key.name);
    if (!raw) continue;

    const post = JSON.parse(raw);

    posts.push({
      id: post.id,
      userId: post.userId,
      title: post.title,
      publishedAt: post.publishedAt
    });
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
