export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const password = body.password;

    // PASSWORD POLICY ENFORCEMENT
    // ---------------------------
    // • Minimum length: 6
    // • Maximum length: 64
    // • Allowed: A–Z, a–z, 0–9, and ! # $ % & ? @ _ + =
    // • Disallowed: spaces, emoji, and high‑risk symbols used in trojans/injections
    const allowedPattern = /^[A-Za-z0-9!#$%&?@_+=]{6,64}$/;

    if (!password || !allowedPattern.test(password)) {
      return new Response(JSON.stringify({
        error: "invalid password",
        rules: "6–64 chars; letters, numbers, and ! # $ % & ? @ _ + = only"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // SESSION TOKEN CHECK
    const sessionToken = request.headers.get("Authorization");
    if (!sessionToken) {
      return new Response(JSON.stringify({ error: "no session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // SESSION VALIDATION
    const userId = await env.SESSION.get(sessionToken);
    if (!userId) {
      return new Response(JSON.stringify({ error: "invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // HASH PASSWORD
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(password)
    );

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    // STORE PASSWORD + MARK VERIFIED
    await env.USERS.put(`user:${userId}:password`, hashedPassword);
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
