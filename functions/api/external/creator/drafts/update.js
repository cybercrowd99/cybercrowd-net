export async function onRequest({ request, env }) {
  const apiKey = request.headers.get("x-cc-pro-key");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "missing api key" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const creatorId = await env.PRO_API_KEYS.get(apiKey);
  if (!creatorId) {
    return new Response(JSON.stringify({ error: "invalid api key" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const url = new URL(request.url);
  const draftId = url.searchParams.get("id");

  if (!draftId) {
    return new Response(JSON.stringify({ error: "missing draft id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const key = `draft:${creatorId}:${draftId}`;
  const raw = await env.CREATOR.get(key);

  if (!raw) {
    return new Response(JSON.stringify({ error: "draft not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  const body = await request.json();
  const existing = JSON.parse(raw);

  const updated = {
    ...existing,
    title: body.title ?? existing.title,
    content: body.content ?? existing.content,
    updatedAt: Date.now()
  };

  await env.CREATOR.put(key, JSON.stringify(updated));

  return new Response(JSON.stringify({ draft: updated }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
