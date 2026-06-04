export async function onRequestPost({ request, env }) {
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const identityToken = extractToken(authHeader);

    if (!identityToken) {
      return jsonResponse({ ok: false, error: "no_identity_token" }, 401);
    }

    if (!env.IDENTITY) {
      return jsonResponse({ ok: false, error: "identity_store_missing" }, 500);
    }

    if (!env.USERS) {
      return jsonResponse({ ok: false, error: "users_store_missing" }, 500);
    }

    if (!env.SESSION) {
      return jsonResponse({ ok: false, error: "session_store_missing" }, 500);
    }

    const userId = await env.IDENTITY.get(identityToken);

    if (!userId) {
      return jsonResponse({ ok: false, error: "invalid_identity_token" }, 401);
    }

    const verified = await env.USERS.get(`user:${userId}:verified`);
    const email = await env.USERS.get(`user:${userId}:email`);
    const role = await env.USERS.get(`user:${userId}:role`);

    const now = Math.floor(Date.now() / 1000);
    const ttlSeconds = 60 * 60 * 24;
    const expiresAt = now + ttlSeconds;

    const sessionToken = crypto.randomUUID();

    const session = {
      userId,
      email: email || null,
      role: role || "free",
      verified: verified === "true",
      iat: now,
      exp: expiresAt
    };

    await env.SESSION.put(
      `SESSION:${sessionToken}`,
      JSON.stringify(session),
      { expirationTtl: ttlSeconds }
    );

    return jsonResponse(
      {
        ok: true,
        status: "login_session_created",
        userId,
        email: email || null,
        role: role || "free",
        verified: verified === "true",
        sessionToken,
        issuedAt: now,
        expiresAt
      },
      200
    );

  } catch (err) {
    return jsonResponse({ ok: false, error: "server_error" }, 500);
  }
}

function extractToken(authHeader) {
  if (!authHeader) return "";

  const parts = authHeader.split(" ");

  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1].trim();
  }

  return authHeader.trim();
}

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
