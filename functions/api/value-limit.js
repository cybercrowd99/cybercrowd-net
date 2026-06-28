/**
 * functions/api/value-limit.js
 *
 * CyberCrowd Value Limit
 *
 * ONE JOB:
 * Set spending/topup limits for one registered value surface.
 *
 * This is NOT value-surface.js.
 * This is NOT value-snapshot.js.
 * This is NOT value-low-water.js.
 * This is NOT value-topup.js.
 * This is NOT value-topup-decision.js.
 * This is NOT value-balance.js.
 * This does NOT register surfaces.
 * This does NOT request topups.
 * This does NOT approve topups.
 * This does NOT move balances.
 * This does NOT process payments.
 * This does NOT charge cards.
 * This does NOT expose real accounts.
 * This does NOT create a PING.
 *
 * Value Limit says:
 * this existing surface has safe movement boundaries.
 */

const SURFACE_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost(context) {
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

  const body = await readRequestJson(request);

  if (!body) {
    return json({ ok: false, error: "JSON_REQUIRED" }, 400);
  }

  const surfaceId = cleanText(
    body.surface_id ||
      body.surfaceId ||
      body.value_surface_id ||
      body.valueSurfaceId ||
      body.id
  );

  if (!surfaceId) {
    return json({ ok: false, error: "VALUE_SURFACE_ID_REQUIRED" }, 400);
  }

  const surface = await readValueSurface(env, surfaceId);

  if (!surface) {
    return json({ ok: false, error: "VALUE_SURFACE_NOT_FOUND" }, 404);
  }

  if (cleanText(surface.identity_id || surface.identityId) !== identityId) {
    return json({ ok: false, error: "VALUE_SURFACE_ACCESS_DENIED" }, 403);
  }

  const limits = {
    daily_spend_limit_cents: normalizeOptionalCents(
      body.daily_spend_limit_cents ||
        body.dailySpendLimitCents ||
        body.daily_spend_limit ||
        body.dailySpendLimit
    ),

    weekly_spend_limit_cents: normalizeOptionalCents(
      body.weekly_spend_limit_cents ||
        body.weeklySpendLimitCents ||
        body.weekly_spend_limit ||
        body.weeklySpendLimit
    ),

    monthly_spend_limit_cents: normalizeOptionalCents(
      body.monthly_spend_limit_cents ||
        body.monthlySpendLimitCents ||
        body.monthly_spend_limit ||
        body.monthlySpendLimit
    ),

    single_topup_limit_cents: normalizeOptionalCents(
      body.single_topup_limit_cents ||
        body.singleTopupLimitCents ||
        body.single_topup_limit ||
        body.singleTopupLimit
    ),

    daily_topup_limit_cents: normalizeOptionalCents(
      body.daily_topup_limit_cents ||
        body.dailyTopupLimitCents ||
        body.daily_topup_limit ||
        body.dailyTopupLimit
    )
  };

  const hasAnyLimit = Object.values(limits).some((value) => value !== null);

  if (!hasAnyLimit) {
    return json({ ok: false, error: "VALUE_LIMIT_REQUIRED" }, 400);
  }

  const now = new Date().toISOString();

  const updatedSurface = {
    ...surface,
    id: cleanText(surface.id || surface.surface_id || surface.surfaceId || surfaceId),
    limits: {
      ...(surface.limits && typeof surface.limits === "object" ? surface.limits : {}),
      ...removeNullValues(limits)
    },
    limits_updated_at: now,
    updated_at: now
  };

  await env.IDENTITY.put("value-surface:" + updatedSurface.id, JSON.stringify(updatedSurface), {
    expirationTtl: SURFACE_TTL_SECONDS
  });

  await appendIndex(env, "value-limit:index:identity:" + identityId, updatedSurface.id);
  await appendIndex(env, "value-limit:index:surface:" + updatedSurface.id, updatedSurface.id);

  await appendSync(env, identityId, {
    type: "identity_value_limit_set",
    value_surface_id: updatedSurface.id,
    limits: removeNullValues(limits),
    at: now
  });

  await appendSync(env, updatedSurface.id, {
    type: "value_surface_limit_set",
    value_surface_id: updatedSurface.id,
    identity_id: identityId,
    limits: removeNullValues(limits),
    at: now
  });

  return json({
    ok: true,
    updated: true,
    identity_id: identityId,
    value_surface_id: updatedSurface.id,
    limits: updatedSurface.limits,
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
      url.searchParams.get("value_surface_id") ||
      url.searchParams.get("valueSurfaceId") ||
      url.searchParams.get("id")
  );

  if (!surfaceId) {
    return json({ ok: false, error: "VALUE_SURFACE_ID_REQUIRED" }, 400);
  }

  const surface = await readValueSurface(env, surfaceId);

  if (!surface) {
    return json({ ok: false, error: "VALUE_SURFACE_NOT_FOUND" }, 404);
  }

  if (cleanText(surface.identity_id || surface.identityId) !== identityId) {
    return json({ ok: false, error: "VALUE_SURFACE_ACCESS_DENIED" }, 403);
  }

  return json({
    ok: true,
    identity_id: identityId,
    value_surface_id: cleanText(surface.id || surface.surface_id || surface.surfaceId || surfaceId),
    limits: surface.limits || {},
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

async function readRequestJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
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

async function appendIndex(env, key, value) {
  if (!key || !value) return;

  const raw = await env.IDENTITY.get(key);
  let list = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    } catch {
      list = [];
    }
  }

  list = list.filter((item) => item !== value);
  list.unshift(value);
  list = list.slice(0, MAX_INDEX_ITEMS);

  await env.IDENTITY.put(key, JSON.stringify(list), {
    expirationTtl: INDEX_TTL_SECONDS
  });
}

async function appendSync(env, targetId, event) {
  if (!targetId) return;

  const key = "sync:" + targetId;
  const raw = await env.IDENTITY.get(key);
  let trail = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) trail = parsed;
    } catch {
      trail = [];
    }
  }

  trail.unshift({
    sync_id: makeId("SYNC"),
    ...event
  });

  trail = trail.slice(0, MAX_INDEX_ITEMS);

  await env.IDENTITY.put(key, JSON.stringify(trail), {
    expirationTtl: INDEX_TTL_SECONDS
  });
}

function normalizeOptionalCents(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    if (value < 0) return null;

    if (Math.abs(value) < 1000 && !Number.isInteger(value)) {
      return Math.round(value * 100);
    }

    return Math.round(value);
  }

  const clean = String(value).replace(/[$,\s]/g, "");
  const number = Number(clean);

  if (!Number.isFinite(number) || number < 0) {
    return null;
  }

  if (clean.includes(".")) {
    return Math.round(number * 100);
  }

  return Math.round(number);
}

function removeNullValues(value) {
  const cleaned = {};

  Object.keys(value || {}).forEach((key) => {
    if (value[key] !== null && value[key] !== undefined) {
      cleaned[key] = value[key];
    }
  });

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

function makeId(prefix) {
  if (crypto && crypto.randomUUID) {
    return prefix + "." + crypto.randomUUID();
  }

  return prefix + "." + Date.now() + "." + Math.random().toString(36).slice(2, 10);
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
