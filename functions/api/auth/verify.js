// CyberCrowd Verify – Setup Token Validation Lane
// Owns: reading setup token, validating expiry, deleting expired tokens.
// Owns NOT: token creation, email sending, password logic, session, cookie, Turnstile, human policy.

import { readSetupToken, deleteSetupToken } from "./setup-token-store.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ success: false, error: "invalid_json" }, 400);
  }

  const token = String(body.token || "").trim();

  if (!token) {
    return json({ success: false, error: "missing_token" }, 400);
  }

  const kvKey = `setup:${token}`;
  const record = await readSetupToken(env, kvKey);

  if (!record) {
    return json({ success: false, error: "invalid_or_expired" }, 401);
  }

  const now = Date.now();

  if (now > record.expiresAt) {
    await deleteSetupToken(env, kvKey);
    return json({ success: false, error: "expired" }, 401);
  }

  return json({
    success: true
  });
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}
