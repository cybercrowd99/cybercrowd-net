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

  const listPrefix = `draft:${creatorId}:`;
  const drafts = [];

  const { keys } = await env.CREATOR.list({ prefix: listPrefix });

  for (const key of keys) {
    const raw = await env.CREATOR.get(key.name);
    if (!raw) continue;

    const data = JSON.parse(raw);

    drafts.push({
      id: data.id,
      title: data.title,
      updatedAt: data.updatedAt,
      status: data.status || "draft"
    });
  }

  return new Response(JSON.stringify({ drafts }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
