// FILE ACTION: CREATE NEW FILE
// FILE: functions/api/auth/returning-member-continuity.js
// REPO: cybercrowd99/cybercrowd-net
// COMMIT: Add server returning member continuity authority
// CONTEXT:
// Server only.
// Verify the Turnstile token first.
// Then determine whether a valid
// returning-member session already exists.
//
// BROWSER DOES NOT DECIDE IDENTITY.

import { verifyTurnstileToken } from "./turnstile-verify.js";
import { readEatCookie } from "./cookie.js";
import {
  getSessionRecord,
  getUserRecord
} from "./user-store.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;

  try {
    body = await request.json();
  } catch (_) {
    return json(
      {
        success: false,
        continuity: false,
        error: "invalid_json"
      },
      400
    );
  }

  const token = String(
    body["cf-turnstile-response"] || ""
  ).trim();

  if (!token) {
    return json(
      {
        success: false,
        continuity: false,
        error: "missing_turnstile_token"
      },
      400
    );
  }

  const ip =
    request.headers.get("CF-Connecting-IP");

  const turnstile =
    await verifyTurnstileToken(
      env,
      token,
      ip
    );

  if (!turnstile?.success) {
    return json(
      {
        success: false,
        continuity: false,
        error: "turnstile_failed"
      },
      403
    );
  }

  const eat = readEatCookie(request);

  if (!eat) {
    return json({
      success: true,
      continuity: false
    });
  }

  const session =
    await getSessionRecord(env, eat);

  if (!session) {
    return json({
      success: true,
      continuity: false
    });
  }

  if (
    session.expiresAt &&
    Date.now() > session.expiresAt
  ) {
    return json({
      success: true,
      continuity: false
    });
  }

  const identityActiveId = String(
    session["identity-active-id"] || ""
  ).trim();

  if (!identityActiveId) {
    return json({
      success: true,
      continuity: false
    });
  }

  const user =
    await getUserRecord(
      env,
      identityActiveId
    );

  if (!user) {
    return json({
      success: true,
      continuity: false
    });
  }

  return json({
    success: true,
    continuity: true,
    user: {
      "identity-active-id":
        user["identity-active-id"] ||
        identityActiveId
    }
  });
}

function json(payload, status = 200) {
  return new Response(
    JSON.stringify(payload),
    {
      status,
      headers: {
        "Content-Type":
          "application/json",
        "Cache-Control":
          "no-store"
      }
    }
  );
}
