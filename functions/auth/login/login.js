import { verifyPassword, mintSession } from "../core/auth-core.js";

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Missing email or password" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Load user
    const userKey = `user:${email}`;
    const user = await env.USERS.get(userKey, { type: "json" });

    if (!user || !user.passwordHash) {
      return new Response(JSON.stringify({ error: "Invalid login" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Verify password
    const valid = await verifyPassword(password, email, user.passwordHash);
    if (!valid) {
      return new Response(JSON.stringify({ error: "Invalid login" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Mint session (EAT)
    const session = mintSession(email);

    await env.IDENTITY.put(
      `session:${session.eat}`,
      JSON.stringify(session),
      { expirationTtl: 86400 * 7 }
    );

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `session=${session.eat}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`
      }
    });
  }
};
