export default {
  async fetch(request, env) {
    const id = crypto.randomUUID();

    const shadowRecord = {
      id,
      route: request.headers.get("x-route") ?? "unknown",
      phantom: request.headers.get("x-phantom") === "true",
      notVisible: request.headers.get("x-not-visible") ?? null,
      map: request.headers.get("accept-language") ?? "0.0.0.0",
      ua: request.headers.get("user-agent") ?? "unknown",
      stamp: "Shadow Index"
    };

    await env.SHADOW_INDEX.put(id, JSON.stringify(shadowRecord));

    return new Response("shadow-indexed", { status: 200 });
  }
};
