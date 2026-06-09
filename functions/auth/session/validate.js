import { } from "../core/auth-core.js";

export default {
  async fetch(request, env) {
    const cookie = request.headers.get("Cookie") || "";
    const sessionToken = parseCookie(cookie, "session");

    if (!sessionToken) {
      return unauthorized("Missing session");
    }

    const sessionKey = `session:${sessionToken}`;
    const session = await env.IDENTITY.get(sessionKey, { type: "json" });

    if (!session) {
      return unauthorized("Invalid or expired session");
    }

    // Epoch check
    const now = Date.now();
    if (now > session.expiresAt) {
      await env.IDENTITY.delete(sessionKey);
      return unauthorized("Session expired");
    }

    // Band check (expand later)
    if (session.band !== "user") {
      return unauthorized("Insufficient band");
    }

    // Attach identity to request for downstream handlers
    request.ccIdentity = {
      email: session.email,
      band: session.band,
      epoch: session.epoch,
      eat: session.eat
    };

    return new Response(JSON.stringify({ ok: true, identity: request.ccIdentity }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
};

function parseCookie(cookie, name) {
  const parts = cookie.split(";").map((c) => c.trim());
  for (const part of parts) {
    if (part.startsWith(name + "=")) {
      return part.substring(name.length + 1);
    }
  }
  return null;
}

function unauthorized(message) {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { "Content-Type": "application/json" }
  });
}
