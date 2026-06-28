/**
 * functions/api/value-low-water.js
 *
 * CyberCrowd Value Low Water
 *
 * ONE JOB:
 * Check registered value surfaces and report which ones are below their low-water line.
 *
 * This is NOT value-surface.js.
 * This is NOT value-topup.js.
 * This is NOT value-topup-decision.js.
 * This is NOT value-balance.js.
 * This is NOT value-history.js.
 * This does NOT request a topup.
 * This does NOT approve a topup.
 * This does NOT move balances.
 * This does NOT process payments.
 * This does NOT charge cards.
 * This does NOT expose real accounts.
 * This does NOT create a PING.
 *
 * Value Low Water says:
 * this street-facing or buffer surface needs attention.
 *
 * Next worker:
 * value-topup.js may record a requested refill.
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
      url.searchParams.get("id") ||
      ""
  );

  if (surfaceId) {
    const surface = await readValueSurface(env, surfaceId);

    if (!surface) {
      return json({ ok: false, error: "VALUE_SURFACE_NOT_FOUND" }, 404);
    }

    if (cleanText(surface.identity_id || surface.identityId) !== identityId) {
      return json({ ok: false, error: "VALUE_SURFACE_ACCESS_DENIED" }, 403);
    }

    const check = checkSurfaceLowWater(surface);

    return json({
      ok: true,
      identity_id: identityId,
      checked: 1,
      low_water_count: check.low_water ? 1 : 0,
      value_low_water: [check],
      topup_requested: false,
      decision_created: false,
      balance_moved: false,
      payment_created: false,
      checkout_created: false,
      bank_transfer_executed: false,
      card_charged: false,
      real_account_exposed: false,
      ping_created: false
    });
  }

  const ids = await readIndex(env, "value-surface:index:identity:" + identityId);
  const checks = [];

  for (const id of ids.slice(0, MAX_RETURN_ITEMS)) {
    const surface = await readValueSurface(env, id);

    if (!surface) continue;
    if (cleanText(surface.identity_id || surface.identityId) !== identityId) continue;

    checks.push(checkSurfaceLowWater(surface));
  }

  const lowWater = checks.filter((item) => item.low_water === true);

  return json({
    ok: true,
    identity_id: identityId,
    checked: checks.length,
    low_water_count: lowWater.length,
    value_low_water: lowWater,
    value_surfaces_checked: checks,
    topup_requested: false,
    decision_created: false,
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

async function readValueSurface(env, surfaceId) {
  const id = cleanText(surfaceId);

  if (!id) return null;

  return readJsonKey(env, "value-surface:" + id);
}

async function readIndex(env, key) {
  const raw = await env.IDENTITY.get(key);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === "string" && item.trim());
    }

    return [];
  } catch {
    return [];
  }
}

function checkSurfaceLowWater(surface) {
  const balanceCents = Number(surface.balance_cents || 0);
  const lowWaterCents = Number(surface.low_water_cents || 0);
  const topupDefaultCents = Number(surface.topup_default_cents || 0);

  const status = cleanText(surface.status || "active").toLowerCase();
  const lowWater = status === "active" && lowWaterCents > 0 && balanceCents <= lowWaterCents;

  return {
    value_surface_id: cleanText(surface.id || surface.surface_id || surface.surfaceId),
    identity_id: cleanText(surface.identity_id || surface.identityId),
    kind: cleanText(surface.kind || "other"),
    role: cleanText(surface.role || "other"),
    status,
    label: cleanText(surface.label || surface.name || "") || null,
    currency: cleanText(surface.currency || "USD").toUpperCase(),
    balance_cents: balanceCents,
    low_water_cents: lowWaterCents,
    topup_default_cents: topupDefaultCents,
    street_exposed: surface.street_exposed === true,
    source_allowed: surface.source_allowed === true,
    spend_allowed: surface.spend_allowed === true,
    low_water: lowWater,
    needs_attention: lowWater,
    suggested_topup_cents: lowWater ? topupDefaultCents : 0,
    topup_requested: false,
    decision_created: false,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    checked_at: new Date().toISOString()
  };
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
