/**
 * functions/api/value-history.js
 *
 * CyberCrowd Value History
 *
 * ONE JOB:
 * Read the value trail for one verified identity.
 *
 * This is NOT value-surface.js.
 * This is NOT value-topup.js.
 * This is NOT value-topup-decision.js.
 * This is NOT value-balance.js.
 * This is NOT payment processing.
 * This is NOT checkout.
 * This does NOT move balances.
 * This does NOT approve topups.
 * This does NOT charge cards.
 * This does NOT expose real accounts.
 * This does NOT create a PING.
 *
 * Value History says:
 * show the identity what already happened across value surfaces,
 * topup requests, decisions, and balance movements.
 */

const MAX_RETURN_ITEMS = 100;

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env || !env.IDENTITY) {
    return json({ ok: false, error: "IDENTITY_KV_MISSING" }, 500);
  }

  const session = await readVerifiedSession(request, env);

  if (!session) {
    return json({ ok: false, error: "SESSION_REQUIRED" }, 401);
  }

  const identityId = getIdentityIdFromSession(session);

  if (!identityId) {
    return json({ ok: false, error: "SESSION_IDENTITY_MISSING" }, 401);
  }

  const url = new URL(request.url);

  const surfaceId = cleanText(
    url.searchParams.get("surface_id") ||
      url.searchParams.get("surfaceId") ||
      ""
  );

  const topupId = cleanText(
    url.searchParams.get("topup_id") ||
      url.searchParams.get("topupId") ||
      ""
  );

  const balanceId = cleanText(
    url.searchParams.get("balance_id") ||
      url.searchParams.get("balanceId") ||
      ""
  );

  const targetId = surfaceId || topupId || balanceId || identityId;
  const sync = await readSync(env, targetId);

  const safeTrail = sync
    .filter((item) => item && typeof item === "object")
    .slice(0, MAX_RETURN_ITEMS)
    .map(cleanHistoryItem);

  return json({
    ok: true,
    identity_id: identityId,
    target_id: targetId,
    target_type: surfaceId
      ? "value_surface"
      : topupId
        ? "value_topup"
        : balanceId
          ? "value_balance"
          : "identity",
    count: safeTrail.length,
    value_history: safeTrail,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false
  });
}

async function readVerifiedSession(request, env) {
  const token =
    getCookie(request, "session") ||
    getCookie(request, "cc_session") ||
    getCookie(request, "EAT") ||
    getBearerToken(request);

  if (!token) return null;

  return readJsonKey(env, "session:" + token);
}

function getIdentityIdFromSession(session) {
  return cleanText(
    session.identity_id ||
      session.identityId ||
      session.identity_active_id ||
      session["identity-active-id"] ||
      session.idl ||
      session.email ||
      ""
  );
}

async function readJsonKey(env, key) {
  const raw = await env.IDENTITY.get(key);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readSync(env, targetId) {
  const id = cleanText(targetId);

  if (!id) return [];

  const raw = await env.IDENTITY.get("sync:" + id);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    return [];
  } catch {
    return [];
  }
}

function cleanHistoryItem(item) {
  const cleaned = {};

  Object.keys(item).forEach((key) => {
    const lower = key.toLowerCase();

    if (
      lower.includes("password") ||
      lower.includes("secret") ||
      lower.includes("token") ||
      lower.includes("cookie") ||
      lower.includes("card_number") ||
      lower.includes("full_card") ||
      lower.includes("account_number") ||
      lower.includes("routing") ||
      lower.includes("bank_login")
    ) {
      return;
    }

    const value = item[key];

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      cleaned[key] = value;
    }
  });

  cleaned.payment_created = false;
  cleaned.checkout_created = false;
  cleaned.bank_transfer_executed = false;
  cleaned.card_charged = false;
  cleaned.real_account_exposed = false;
  cleaned.ping_created = false;

  return cleaned;
}

function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const parts = header.split(";");

  for (const part of parts) {
    const index = part.indexOf("=");

    if (index === -1) continue;

    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();

    if (key === name) {
      return decodeURIComponent(value);
    }
  }

  return "";
}

function getBearerToken(request) {
  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match) return "";

  return match[1].trim();
}

function cleanText(value) {
  if (typeof value !== "string" && typeof value !== "number") {
    return "";
  }

  return String(value).trim();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
