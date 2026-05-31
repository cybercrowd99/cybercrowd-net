export async function onRequestPost({ request, env }) {
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

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
