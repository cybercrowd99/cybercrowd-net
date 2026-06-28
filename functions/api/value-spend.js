/**
 * functions/api/value-spend.js
 *
 * CyberCrowd Value Spend
 *
 * ONE JOB:
 * Record a requested spend from one registered value surface.
 *
 * This is NOT value-surface.js.
 * This is NOT value-limit.js.
 * This is NOT value-limit-check.js.
 * This is NOT value-topup.js.
 * This is NOT value-topup-decision.js.
 * This is NOT value-balance.js.
 * This does NOT set limits.
 * This does NOT check limits.
 * This does NOT approve spend.
 * This does NOT move balances.
 * This does NOT process payments.
 * This does NOT charge cards.
 * This does NOT execute bank transfers.
 * This does NOT expose real accounts.
 * This does NOT create a PING.
 *
 * Value Spend says:
 * this identity requested to spend from one value surface.
 *
 * Next worker:
 * value-spend-decision.js approves or blocks the spend request.
 */

const SPEND_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_STATUS = new Set([
  "requested",
  "cancelled"
]);

const ALLOWED_REASON = new Set([
  "manual",
  "purchase",
  "service",
  "tip",
  "subscription",
  "job",
  "delivery",
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

  const surfaceId = cleanText(
    body.surface_id ||
      body.surfaceId ||
      body.value_surface_id ||
      body.valueSurfaceId ||
      body.from_surface_id ||
      body.fromSurfaceId ||
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

  const amountCents = normalizeCents(
    body.amount_cents ||
      body.amountCents ||
      body.amount ||
      0
  );

  if (amountCents <= 0) {
    return json({ ok: false, error: "VALUE_SPEND_AMOUNT_REQUIRED" }, 400);
  }

  const currency = cleanText(
    body.currency ||
      surface.currency ||
      "USD"
  ).toUpperCase();

  const reason = normalizeReason(
    body.reason ||
      body.spend_reason ||
      body.spendReason ||
      "manual"
  );

  const status = normalizeStatus(body.status || "requested");

  if (!status) {
    return json(
      {
        ok: false,
        error: "VALUE_SPEND_STATUS_NOT_ALLOWED",
        allowed: Array.from(ALLOWED_STATUS)
      },
      400
    );
  }

  const now = new Date().toISOString();
  const spendId = cleanText(body.spend_id || body.spendId || body.id) || makeId("VALUE_SPEND");

  const spend = {
    id: spendId,
    spend_id: spendId,

    identity_id: identityId,
    actor_identity_id: identityId,

    value_surface_id: cleanText(surface.id || surface.surface_id || surface.surfaceId || surfaceId),

    amount_cents: amountCents,
    currency,

    status,
    reason,

    merchant: cleanText(body.merchant || body.vendor || body.payee) || null,
    label: cleanText(body.label || body.name || body.title) || null,
    note: cleanText(body.note || body.description) || null,

    approved: false,
    blocked: false,
    decided: false,

    limit_checked: false,
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

  await env.IDENTITY.put("value-spend:" + spend.id, JSON.stringify(spend), {
    expirationTtl: SPEND_TTL_SECONDS
  });

  await appendIndex(env, "value-spend:index:identity:" + identityId, spend.id);
  await appendIndex(env, "value-spend:index:surface:" + spend.value_surface_id, spend.id);
  await appendIndex(env, "value-spend:index:status:" + status, spend.id);
  await appendIndex(env, "value-spend:index:reason:" + reason, spend.id);

  await appendSync(env, identityId, {
    type: "identity_value_spend_requested",
    value_spend_id: spend.id,
    value_surface_id: spend.value_surface_id,
    amount_cents: amountCents,
    currency,
    status,
    reason,
    merchant: spend.merchant,
    limit_checked: false,
    balance_moved: false,
    payment_created: false,
    real_account_exposed: false,
    at: now
  });

  await appendSync(env, spend.value_surface_id, {
    type: "value_surface_spend_requested",
    value_spend_id: spend.id,
    identity_id: identityId,
    amount_cents: amountCents,
    currency,
    status,
    reason,
    merchant: spend.merchant,
    limit_checked: false,
    balance_moved: false,
    at: now
  });

  return json({
    ok: true,
    created: true,
    value_spend_id: spend.id,
    identity_id: identityId,
    value_surface_id: spend.value_surface_id,
    amount_cents: amountCents,
    currency,
    status,
    reason,
    merchant: spend.merchant,
    approved: false,
    decided: false,
    limit_checked: false,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    next: {
      route: "/api/value-spend-decision",
      method: "POST",
      reason: "spend_request_recorded"
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

  const spendId = cleanText(
    url.searchParams.get("spend_id") ||
      url.searchParams.get("spendId") ||
      url.searchParams.get("id")
  );

  if (spendId) {
    const spend = await readSpend(env, spendId);

    if (!spend) {
      return json({ ok: false, error: "VALUE_SPEND_NOT_FOUND" }, 404);
    }

    if (cleanText(spend.identity_id || spend.identityId) !== identityId) {
      return json({ ok: false, error: "VALUE_SPEND_ACCESS_DENIED" }, 403);
    }

    return json({
      ok: true,
      value_spend: cleanSpendForReturn(spend)
    });
  }

  const surfaceId = cleanText(
    url.searchParams.get("surface_id") ||
      url.searchParams.get("surfaceId") ||
      url.searchParams.get("value_surface_id") ||
      url.searchParams.get("valueSurfaceId")
  );

  const key = surfaceId
    ? "value-spend:index:surface:" + surfaceId
    : "value-spend:index:identity:" + identityId;

  const ids = await readIndex(env, key);
  const spends = [];

  for (const id of ids) {
    const spend = await readSpend(env, id);

    if (!spend) continue;
    if (cleanText(spend.identity_id || spend.identityId) !== identityId) continue;

    spends.push(cleanSpendForReturn(spend));
  }

  return json({
    ok: true,
    identity_id: identityId,
    count: spends.length,
    value_spends: spends,
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

async function readSpend(env, spendId) {
  const id = cleanText(spendId);

  if (!id) return null;

  return readJsonKey(env, "value-spend:" + id);
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

function cleanSpendForReturn(spend) {
  return {
    id: spend.id,
    spend_id: spend.spend_id || spend.id,
    identity_id: spend.identity_id,
    value_surface_id: spend.value_surface_id,
    amount_cents: Number(spend.amount_cents || 0),
    currency: spend.currency || "USD",
    status: spend.status,
    reason: spend.reason,
    merchant: spend.merchant || null,
    label: spend.label || null,
    note: spend.note || null,
    approved: false,
    blocked: false,
    decided: false,
    limit_checked: false,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    created_at: spend.created_at || null,
    updated_at: spend.updated_at || null
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
