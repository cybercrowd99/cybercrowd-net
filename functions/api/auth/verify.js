export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const identityToken = url.searchParams.get("token");

    // 1 — Token must exist
    if (!identityToken) {
      return new Response(JSON.stringify({ error: "no identity token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2 — Look up the userId from IDENTITY KV
    const userId = await env.IDENTITY.get(identityToken);

    if (!userId) {
      return new Response(JSON.stringify({ error: "invalid identity token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3 — Do NOT mark verified here.
    // Verification is completed only after password creation.

    // 4 — Do NOT delete the token.
    // set_password.js will consume it after password creation.

    // 5 — Redirect to verify-success.html with token intact
    return new Response(null, {
      status: 302,
      headers: {
        "Location": `/verify-success.html?token=${encodeURIComponent(identityToken)}`,
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
