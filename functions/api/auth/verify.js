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

    // 3 — Mark user as verified
    await env.USERS.put(`user:${userId}:verified`, "true");

    // 4 — Build cc_access cookie payload
    const payload = {
      sub: userId,
      iat: Date.now(),
      exp: Date.now() + 86400000 // 24 hours
    };

    const payloadB64 = btoa(JSON.stringify(payload))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // 5 — Sign the payload with CC_SESSION_SECRET
    const secret = env.CC_SESSION_SECRET || "";
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));

    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const ccAccess = `${payloadB64}.${sigB64}`;

    // 6 — Delete the one-time token (security)
    await env.IDENTITY.delete(identityToken);

    // 7 — Redirect to dashboard with cookie set
    return new Response(null, {
      status: 302,
      headers: {
        "Location": "/dashboard-surface.html",
        "Set-Cookie": `cc_access=${ccAccess}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`,
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
