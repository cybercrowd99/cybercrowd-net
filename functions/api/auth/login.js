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

    const verified = await env.USERS.get(`user:${userId}:verified`);

    return new Response(JSON.stringify({
      ok: true,
      userId,
      verified: verified === "true"
    }), {
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
