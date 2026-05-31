export async function onRequestGet({ request, env }) {
  try {
    const identityToken = request.headers.get("Authorization");

    if (!identityToken) {
      return new Response(JSON.stringify({ error: "no identity token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const userId = await env.IDENTITY.get(identityToken);

    if (!userId) {
      return new Response(JSON.stringify({ error: "invalid identity token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    await env.USERS.put(`user:${userId}:verified`, "true");

    return new Response(null, {
      status: 302,
      headers: {
        "Location": "/dashboard-surface.html",
        "Cache-Control": "no-store"
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
