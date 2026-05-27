export async function onRequestGet(context) {
  const { request, env } = context;

  const SESSION = env.SESSION;
  if (!SESSION) {
    return jsonResponse({ ok: false, status: "session_store_missing" }, 500);
  }

  const authHeader = request.headers.get("Authorization") || "";
  const token = extractToken(authHeader);

  if (!token) {
    return jsonResponse({ ok: false, status: "no_session_token" }, 200);
  }

  const key = `SESSION:${token}`;
  const raw = await SESSION.get(key);

  if (!raw) {
    return jsonResponse({ ok: false, status: "session_not_found" }, 200);
  }

  let session;
  try {
    session = JSON.parse(raw);
  } catch {
    return jsonResponse({ ok: false, status: "session_corrupt" }, 200);
  }

  const now = Math.floor(Date.now() / 1000);

  if (!session.exp || session.exp <= now) {
    await SESSION.delete(key);
    return jsonResponse({ ok: false, status: "session_expired" }, 200);
  }

  return jsonResponse(
    {
      ok: true,
      status: "session_valid",
      userId: session.userId || null,
      email: session.email || null,
      role: session.role || "free",
      issuedAt: session.iat || null,
      expiresAt: session.exp
    },
    200
  );
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
