/**
 * functions/api/value-limit-check.js
 *
 * CyberCrowd Value Limit Check
 *
 * ONE JOB:
 * Check one proposed value movement against one surface limit set.
 *
 * This is NOT value-limit.js.
 * This is NOT value-surface.js.
 * This is NOT value-topup.js.
 * This is NOT value-topup-decision.js.
 * This is NOT value-balance.js.
 * This does NOT set limits.
 * This does NOT request topups.
 * This does NOT approve topups.
 * This does NOT move balances.
 * This does NOT process payments.
 * This does NOT charge cards.
 * This does NOT expose real accounts.
 * This does NOT create a PING.
 *
 * Value Limit says:
 * these boundaries exist.
 *
 * Value Limit Check says:
 * this proposed movement is inside or outside those boundaries.
 */

const MAX_INDEX_ITEMS = 100;
const CHECK_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;

const ALLOWED_MOVEMENT_KIND = new Set([
  "spend",
  "topup",
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
    return json({ ok: false, error: "VALUE_LIMIT_CHECK_AMOUNT_REQUIRED" }, 400);
  }

  const movementKind = normalizeMovementKind(
    body.movement_kind ||
      body.movementKind ||
      body.kind ||
      "other"
  );

  if (!ALLOWED_MOVEMENT_KIND.has(movementKind)) {
    return json(
      {
        ok: false,
        error: "VALUE_LIMIT_CHECK_KIND_NOT_ALLOWED",
        allowed: Array.from(ALLOWED_MOVEMENT_KIND)
      },
      400
    );
  }

  const limits = surface.limits && typeof surface.limits === "object"
    ? surface.limits
    : {};

  const result = checkLimits({
    movementKind,
    amountCents,
    limits
  });

  const now = new Date().toISOString();
  const checkId = makeId("VALUE_LIMIT_CHECK");

  const check = {
    id: checkId,
    check_id: checkId,

    identity_id: identityId,
    actor_identity_id: identityId,

    value_surface_id: cleanText(surface.id || surface.surface_id || surface.surfaceId || surfaceId),

    movement_kind: movementKind,
    amount_cents: amountCents,
    currency: cleanText(body.currency || surface.currency || "USD").toUpperCase(),

    allowed: result.allowed,
    blocked: result.allowed !== true,
    reason: result.reason,
    limit_cents: result.limit_cents,

    limit_checked: true,
    limit_set: Object.keys(limits).length > 0,

    topup_requested: false,
    decision_created: false,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,

    note: cleanText(body.note || body.description) || null,

    created_at: now,
    updated_at: now
  };

  await env.IDENTITY.put("value-limit-check:" + check.id, JSON.stringify(check), {
    expirationTtl: CHECK_TTL_SECONDS
  });

  await appendIndex(env, "value-limit-check:index:identity:" + identityId, check.id);
  await appendIndex(env, "value-limit-check:index:surface:" + check.value_surface_id, check.id);
  await appendIndex(env, "value-limit-check:index:kind:" + movementKind, check.id);
  await appendIndex(env, "value-limit-check:index:result:" + (check.allowed ? "allowed" : "blocked"), check.id);

  await appendSync(env, identityId, {
    type: "identity_value_limit_checked",
    value_limit_check_id: check.id,
    value_surface_id: check.value_surface_id,
    movement_kind: movementKind,
    amount_cents: amountCents,
    currency: check.currency,
    allowed: check.allowed,
    reason: check.reason,
    at: now
  });

  await appendSync(env, check.value_surface_id, {
    type: "value_surface_limit_checked",
    value_limit_check_id: check.id,
    identity_id: identityId,
    movement_kind: movementKind,
    amount_cents: amountCents,
    currency: check.currency,
    allowed: check.allowed,
    reason: check.reason,
    at: now
  });

  return json({
    ok: true,
    created: true,
    value_limit_check_id: check.id,
    identity_id: identityId,
    value_surface_id: check.value_surface_id,
    movement_kind: movementKind,
    amount_cents: amountCents,
    currency: check.currency,
    allowed: check.allowed,
    blocked: check.blocked,
    reason: check.reason,
    limit_cents: check.limit_cents,
    limit_checked: true,
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

  const checkId = cleanText(
    url.searchParams.get("check_id") ||
      url.searchParams.get("checkId") ||
      url.searchParams.get("id")
  );

  if (checkId) {
    const check = await readLimitCheck(env, checkId);

    if (!check) {
      return json({ ok: false, error: "VALUE_LIMIT_CHECK_NOT_FOUND" }, 404);
    }

    if (cleanText(check.identity_id || check.identityId) !== identityId) {
      return json({ ok: false, error: "VALUE_LIMIT_CHECK_ACCESS_DENIED" }, 403);
    }

    return json({
      ok: true,
      value_limit_check: cleanCheckForReturn(check)
    });
  }

  const surfaceId = cleanText(
    url.searchParams.get("surface_id") ||
      url.searchParams.get("surfaceId") ||
      url.searchParams.get("value_surface_id") ||
      url.searchParams.get("valueSurfaceId")
  );

  const key = surfaceId
    ? "value-limit-check:index:surface:" + surfaceId
    : "value-limit-check:index:identity:" + identityId;

  const ids = await readIndex(env, key);
  const checks = [];

  for (const id of ids) {
    const check = await readLimitCheck(env, id);

    if (!check) continue;
    if (cleanText(check.identity_id || check.identityId) !== identityId) continue;

    checks.push(cleanCheckForReturn(check));
  }

  return json({
    ok: true,
    identity_id: identityId,
    count: checks.length,
    value_limit_checks: checks,
    topup_requested: false,
    decision_created: false,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    ping_created: false
  });
}

function checkLimits(input) {
  const limits = input.limits || {};
  const amountCents = Number(input.amountCents || 0);
  const movementKind = input.movementKind;

  if (movementKind === "spend") {
    const dailySpend = normalizeStoredLimit(limits.daily_spend_limit_cents);
    const weeklySpend = normalizeStoredLimit(limits.weekly_spend_limit_cents);
    const monthlySpend = normalizeStoredLimit(limits.monthly_spend_limit_cents);

    const smallestSpendLimit = smallestPositive([
      dailySpend,
      weeklySpend,
      monthlySpend
    ]);

    if (smallestSpendLimit !== null && amountCents > smallestSpendLimit) {
      return {
        allowed: false,
        reason: "spend_limit_exceeded",
        limit_cents: smallestSpendLimit
      };
    }

    return {
      allowed: true,
      reason: "inside_spend_limit",
      limit_cents: smallestSpendLimit
    };
  }

  if (movementKind === "topup") {
    const singleTopup = normalizeStoredLimit(limits.single_topup_limit_cents);
    const dailyTopup = normalizeStoredLimit(limits.daily_topup_limit_cents);

    const smallestTopupLimit = smallestPositive([
      singleTopup,
      dailyTopup
    ]);

    if (smallestTopupLimit !== null && amountCents > smallestTopupLimit) {
      return {
        allowed: false,
        reason: "topup_limit_exceeded",
        limit_cents: smallestTopupLimit
      };
    }

    return {
      allowed: true,
      reason: "inside_topup_limit",
      limit_cents: smallestTopupLimit
    };
  }

  return {
    allowed: true,
    reason: "no_matching_limit_rule",
    limit_cents: null
  };
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

async function readLimitCheck(env, checkId) {
  const id = cleanText(checkId);

  if (!id) return null;

  return readJsonKey(env, "value-limit-check:" + id);
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

function cleanCheckForReturn(check) {
  return {
    id: check.id,
    check_id: check.check_id || check.id,
    identity_id: check.identity_id,
    value_surface_id: check.value_surface_id,
    movement_kind: check.movement_kind,
    amount_cents: Number(check.amount_cents || 0),
    currency: check.currency || "USD",
    allowed: check.allowed === true,
    blocked: check.blocked === true,
    reason: check.reason || null,
    limit_cents: check.limit_cents === null || check.limit_cents === undefined
      ? null
      : Number(check.limit_cents),
    limit_checked: true,
    topup_requested: false,
    decision_created: false,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    note: check.note || null,
    created_at: check.created_at || null,
    updated_at: check.updated_at || null
  };
}

function normalizeMovementKind(value) {
  const clean = cleanText(value || "other").toLowerCase();

  if (clean === "purchase") return "spend";
  if (clean === "buy") return "spend";
  if (clean === "refill") return "topup";

  if (ALLOWED_MOVEMENT_KIND.has(clean)) {
    return clean;
  }

  return "other";
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

function normalizeStoredLimit(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }

  return Math.round(number);
}

function smallestPositive(values) {
  const clean = values.filter((value) => Number.isFinite(value) && value > 0);

  if (!clean.length) return null;

  return Math.min(...clean);
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
