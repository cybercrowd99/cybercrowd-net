import { readEatCookie } from "./cookie.js";
import { getSessionRecord, getUserRecord } from "./user-store.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const eat = readEatCookie(request);

    if (!eat) {
      return json(
        {
          success: false,
          error: "no_session_cookie",
          redirect: "/login.html"
        },
        401
      );
    }

    const session = await getSessionRecord(env, eat);

    if (!session) {
      return json(
        {
          success: false,
          error: "session_not_found",
          redirect: "/login.html"
        },
        401
      );
    }

    if (session.expiresAt && Date.now() > session.expiresAt) {
      return json(
        {
          success: false,
          error: "session_expired",
          redirect: "/login.html"
        },
        401
      );
    }

    const identityActiveId = String(session["identity-active-id"] || "").trim();
    const email = String(session.email || "").trim().toLowerCase();

    if (!identityActiveId && !email) {
      return json(
        {
          success: false,
          error: "session_missing_identity",
          redirect: "/login.html"
        },
        401
      );
    }

    const user = await getUserRecord(env, identityActiveId || email);

    if (!user) {
      return json(
        {
          success: false,
          error: "user_not_found",
          redirect: "/login.html"
        },
        401
      );
    }

    return json({
      success: true,
      status: "dashboard_authorized",
      user: {
        "identity-active-id": user["identity-active-id"] || identityActiveId || null,
        email: user.email || email,
        verified: user.verified === true,
        band: session.band || "user"
      },
      session: {
        epoch: session.epoch || session.createdAt || null,
        expiresAt: session.expiresAt || null
      }
    });
  } catch (error) {
    return json(
      {
        success: false,
        error: "dashboard_authority_failed"
      },
      500
    );
  }
}
