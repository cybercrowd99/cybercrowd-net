/**
 * functions/api/value-snapshot.js
 *
 * CyberCrowd Value Snapshot
 *
 * ONE JOB:
 * Read current value surface totals for one verified identity.
 *
 * This is NOT value-surface.js.
 * This is NOT value-topup.js.
 * This is NOT value-topup-decision.js.
 * This is NOT value-balance.js.
 * This is NOT value-history.js.
 * This is NOT value-low-water.js.
 * This does NOT register surfaces.
 * This does NOT request topups.
 * This does NOT approve topups.
 * This does NOT move balances.
 * This does NOT process payments.
 * This does NOT charge cards.
 * This does NOT expose real accounts.
 * This does NOT create a PING.
 *
 * Value Snapshot says:
 * here is the current visible value state for this identity.
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

  const ids = await readIndex(env, "value-surface:index:identity:" + identityId);
  const surfaces = [];

  for (const id of ids.slice(0, MAX_RETURN_ITEMS)) {
    const surface = await readValueSurface(env, id);

    if (!surface) continue;
    if (cleanText(surface.identity_id || surface.identityId) !== identityId) continue;

    surfaces.push(cleanSurfaceForSnapshot(surface));
  }

  const totals = buildTotals(surfaces);

  return json({
    ok: true,
    identity_id: identityId,
    surface_count: surfaces.length,
    totals,
    value_surfaces: surfaces,
    snapshot_created: true,
    topup_requested: false,
    decision_created: false,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    read_at: new Date().toISOString()
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

function cleanSurfaceForSnapshot(surface) {
  const balanceCents = Number(surface.balance_cents || 0);
  const lowWaterCents = Number(surface.low_water_cents || 0);
  const topupDefaultCents = Number(surface.topup_default_cents || 0);
  const status = cleanText(surface.status || "active").toLowerCase();

  return {
    value_surface_id: cleanText(surface.id || surface.surface_id || surface.surfaceId),
    identity_id: cleanText(surface.identity_id || surface.identityId),
    kind: cleanText(surface.kind || "other"),
    role: cleanText(surface.role || "other"),
    status,
    label: cleanText(surface.label || surface.name || "") || null,
    provider: cleanText(surface.provider || surface.bank || surface.issuer || "") || null,
    last4: cleanLast4(surface.last4 || surface.last_four || surface.lastFour),
    currency: cleanText(surface.currency || "USD").toUpperCase(),
    balance_cents: balanceCents,
    low_water_cents: lowWaterCents,
    topup_default_cents: topupDefaultCents,
    low_water: status === "active" && lowWaterCents > 0 && balanceCents <= lowWaterCents,
    street_exposed: surface.street_exposed === true,
    source_allowed: surface.source_allowed === true,
    spend_allowed: surface.spend_allowed === true,
    real_account_exposed: false,
    created_at: surface.created_at || null,
    updated_at: surface.updated_at || null
  };
}

function buildTotals(surfaces) {
  const totals = {
    all_balance_cents: 0,
    street_balance_cents: 0,
    source_balance_cents: 0,
    spend_balance_cents: 0,
    low_water_count: 0,
    active_count: 0,
    paused_count: 0,
    locked_count: 0,
    archived_count: 0,
    by_currency: {},
    by_kind: {},
    by_role: {}
  };

  for (const surface of surfaces) {
    const balance = Number(surface.balance_cents || 0);
    const currency = surface.currency || "USD";
    const kind = surface.kind || "other";
    const role = surface.role || "other";
    const status = surface.status || "active";

    totals.all_balance_cents += balance;

    if (surface.street_exposed === true) {
      totals.street_balance_cents += balance;
    }

    if (surface.source_allowed === true) {
      totals.source_balance_cents += balance;
    }

    if (surface.spend_allowed === true) {
      totals.spend_balance_cents += balance;
    }

    if (surface.low_water === true) {
      totals.low_water_count += 1;
    }

    if (status === "active") totals.active_count += 1;
    if (status === "paused") totals.paused_count += 1;
    if (status === "locked") totals.locked_count += 1;
    if (status === "archived") totals.archived_count += 1;

    if (!totals.by_currency[currency]) {
      totals.by_currency[currency] = {
        balance_cents: 0,
        count: 0
      };
    }

    totals.by_currency[currency].balance_cents += balance;
    totals.by_currency[currency].count += 1;

    if (!totals.by_kind[kind]) {
      totals.by_kind[kind] = {
        balance_cents: 0,
        count: 0
      };
    }

    totals.by_kind[kind].balance_cents += balance;
    totals.by_kind[kind].count += 1;

    if (!totals.by_role[role]) {
      totals.by_role[role] = {
        balance_cents: 0,
        count: 0
      };
    }

    totals.by_role[role].balance_cents += balance;
    totals.by_role[role].count += 1;
  }

  return totals;
}

function cleanLast4(value) {
  const clean = String(value || "").replace(/\D/g, "");

  if (!clean) return null;

  return clean.slice(-4);
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
