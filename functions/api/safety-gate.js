export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";

  const protectedPrefixes = ["/api/auth", "/api/dashboard"];

  const isProtected = protectedPrefixes.some(prefix =>
    url.pathname.startsWith(prefix)
  );

  if (!isProtected) {
    return next();
  }

  const blocked = await env.SAFETY.get(`block:ip:${ip}`);
  if (blocked) {
    return new Response(JSON.stringify({ error: "blocked" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  return next();
}
