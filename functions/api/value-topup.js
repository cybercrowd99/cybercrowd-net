/**
 * functions/api/value-topup.js
 *
 * CyberCrowd Value Topup
 *
 * ONE JOB:
 * Record a requested top-up between two registered value surfaces.
 *
 * This is NOT approval.
 * This is NOT payment processing.
 * This is NOT checkout.
 * This is NOT balance movement.
 * This is NOT banking custody.
 * This does NOT charge cards.
 * This does NOT execute transfers.
 * This does NOT store bank credentials.
 * This does NOT expose real accounts.
 * This does NOT create a PING.
 *
 * Value Surface says:
 * these money surfaces exist under one identity.
 *
 * Value Topup says:
 * this identity requested value to move from one surface to another.
 *
 * Next worker:
 * value-topup-decision.js approves or blocks the request.
 */

const TOPUP_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_STATUS = new Set([
  "requested",
  "cancelled"
]);

const ALLOWED_REASON = new Set([
  "manual",
  "low_water",
  "play_card_refill",
  "cash_pocket_refill",
  "spend_buffer_refill",
  "household_move",
  "business_move",
  "other"
]);

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

  const fromSurfaceId = cleanText(
    body.from_surface_id ||
      body.fromSurfaceId ||
      body.source_surface_id ||
      body.sourceSurfaceId ||
      body.from
  );

  const toSurfaceId = cleanText(
    body.to_surface_id ||
      body.toSurfaceId ||
      body.target_surface_id ||
      body.targetSurfaceId ||
      body.to
  );

  if (!fromSurfaceId) {
    return json({ ok: false, error: "FROM_VALUE_SURFACE_REQUIRED" }, 400);
  }

  if (!toSurfaceId) {
    return json({ ok: false, error: "TO_VALUE_SURFACE_REQUIRED" }, 400);
  }

  if (fromSurfaceId === toSurfaceId) {
    return json({ ok: false, error: "SELF_TOPUP_REQUEST_BLOCKED" }, 409);
  }

  const fromSurface = await readValueSurface(env, fromSurfaceId);
  const toSurface = await readValueSurface(env, toSurfaceId);

  if (!fromSurface) {
    return json({ ok: false, error: "FROM_VALUE_SURFACE_NOT_FOUND" }, 404);
  }

  if (!toSurface) {
    return json({ ok: false, error: "TO_VALUE_SURFACE_NOT_FOUND" }, 404);
  }

  if (cleanText(fromSurface.identity_id || fromSurface.identityId) !== identityId) {
    return json({ ok: false, error: "FROM_VALUE_SURFACE_ACCESS_DENIED" }, 403);
  }

  if (cleanText(toSurface.identity_id || toSurface.identityId) !== identityId) {
    return json({ ok: false, error: "TO_VALUE_SURFACE_ACCESS_DENIED" }, 403);
  }

  const amountCents = normalizeCents(
    body.amount_cents ||
      body.amountCents ||
      body.amount ||
      0
  );

  if (amountCents <= 0) {
    return json({ ok: false, error: "TOPUP_AMOUNT_REQUIRED" }, 400);
  }

  const currency = cleanText(
    body.currency ||
      toSurface.currency ||
      fromSurface.currency ||
      "USD"
  ).toUpperCase();

  const reason = normalizeReason(
    body.reason ||
      body.topup_reason ||
      body.topupReason ||
      "manual"
  );

  const status = normalizeStatus(body.status || "requested");

  if (!status) {
    return json(
      {
        ok: false,
        error: "TOPUP_STATUS_NOT_ALLOWED",
        allowed: Array.from(ALLOWED_STATUS)
      },
      400
    );
  }

  const now = new Date().toISOString();
  const topupId = cleanText(body.topup_id || body.topupId || body.id) || makeId("VALUE_TOPUP");

  const topup = {
    id: topupId,
    topup_id: topupId,

    identity_id: identityId,
    actor_identity_id: identityId,

    from_surface_id: fromSurfaceId,
    to_surface_id: toSurfaceId,

    amount_cents: amountCents,
    currency,

    status,
    reason,

    note: cleanText(body.note || body.description) || null,

    approved: false,
    blocked: false,
    decided: false,

    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,

    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  await env.IDENTITY.put("value-topup:" + topup.id, JSON.stringify(topup), {
    expirationTtl: TOPUP_TTL_SECONDS
  });

  await appendIndex(env, "value-topup:index:identity:" + identityId, topup.id);
  await appendIndex(env, "value-topup:index:from:" + fromSurfaceId, topup.id);
  await appendIndex(env, "value-topup:index:to:" + toSurfaceId, topup.id);
  await appendIndex(env, "value-topup:index:status:" + status, topup.id);
  await appendIndex(env, "value-topup:index:reason:" + reason, topup.id);

  await appendSync(env, identityId, {
    type: "identity_value_topup_requested",
    value_topup_id: topup.id,
    from_surface_id: fromSurfaceId,
    to_surface_id: toSurfaceId,
    amount_cents: amountCents,
    currency,
    status,
    reason,
    balance_moved: false,
    payment_created: false,
    real_account_exposed: false,
    at: now
  });

  await appendSync(env, fromSurfaceId, {
    type: "value_surface_topup_requested_from",
    value_topup_id: topup.id,
    identity_id: identityId,
    to_surface_id: toSurfaceId,
    amount_cents: amountCents,
    currency,
    at: now
  });

  await appendSync(env, toSurfaceId, {
    type: "value_surface_topup_requested_to",
    value_topup_id: topup.id,
    identity_id: identityId,
    from_surface_id: fromSurfaceId,
    amount_cents: amountCents,
    currency,
    at: now
  });

  return json({
    ok: true,
    created: true,
    value_topup_id: topup.id,
    identity_id: identityId,
    from_surface_id: fromSurfaceId,
    to_surface_id: toSurfaceId,
    amount_cents: amountCents,
    currency,
    status,
    reason,
    approved: false,
    decided: false,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    next: {
      route: "/api/value-topup-decision",
      method: "POST",
      reason: "topup_request_recorded"
    }
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

  const topupId = cleanText(
    url.searchParams.get("topup_id") ||
      url.searchParams.get("topupId") ||
      url.searchParams.get("id")
  );

  if (topupId) {
    const topup = await readTopup(env, topupId);

    if (!topup) {
      return json({ ok: false, error: "VALUE_TOPUP_NOT_FOUND" }, 404);
    }

    if (cleanText(topup.identity_id || topup.identityId) !== identityId) {
      return json({ ok: false, error: "VALUE_TOPUP_ACCESS_DENIED" }, 403);
    }

    return json({
      ok: true,
      value_topup: cleanTopupForReturn(topup)
    });
  }

  const ids = await readIndex(env, "value-topup:index:identity:" + identityId);
  const topups = [];

  for (const id of ids) {
    const topup = await readTopup(env, id);

    if (!topup) continue;
    if (cleanText(topup.identity_id || topup.identityId) !== identityId) continue;

    topups.push(cleanTopupForReturn(topup));
  }

  return json({
    ok: true,
    identity_id: identityId,
    count: topups.length,
    value_topups: topups,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
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

async function readTopup(env, topupId) {
  const id = cleanText(topupId);
  if (!id) return null;
  return readJsonKey(env, "value-topup:" + id);
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

function cleanTopupForReturn(topup) {
  return {
    id: topup.id,
    topup_id: topup.topup_id || topup.id,
    identity_id: topup.identity_id,
    from_surface_id: topup.from_surface_id,
    to_surface_id: topup.to_surface_id,
    amount_cents: Number(topup.amount_cents || 0),
    currency: topup.currency || "USD",
    status: topup.status,
    reason: topup.reason,
    note: topup.note || null,
    approved: false,
    blocked: false,
    decided: false,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    created_at: topup.created_at || null,
    updated_at: topup.updated_at || null
  };
}

function normalizeReason(value) {
  const clean = cleanText(value || "manual").toLowerCase();

  if (ALLOWED_REASON.has(clean)) {
    return clean;
  }

  return "other";
}

function normalizeStatus(value) {
  const clean = cleanText(value || "requested").toLowerCase();

  if (ALLOWED_STATUS.has(clean)) {
    return clean;
  }

  return "";
}

function normalizeCents(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    if (Math.abs(value) < 1000 && !Number.isInteger(value)) {
      return Math.round(value * 100);
    }

    return Math.round(value);
  }

  const clean = String(value).replace(/[$,\s]/g, "");
  const number = Number(clean);

  if (!Number.isFinite(number)) {
    return 0;
  }

  if (clean.includes(".")) {
    return Math.round(number * 100);
  }

  return Math.round(number);
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

function cleanMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const cleaned = {};

  Object.keys(value).forEach((key) => {
    const lower = key.toLowerCase();

    if (
      lower.includes("password") ||
      lower.includes("secret") ||
      lower.includes("token") ||
      lower.includes("cookie") ||
      lower.includes("card") ||
      lower.includes("account") ||
      lower.includes("routing")
    ) {
      return;
    }

    const item = value[key];

    if (
      typeof item === "string" ||
      typeof item === "number" ||
      typeof item === "boolean" ||
      item === null
    ) {
      cleaned[key] = item;
    }
  });

  return cleaned;
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
