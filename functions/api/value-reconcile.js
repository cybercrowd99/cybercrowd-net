/**
 * functions/api/value-reconcile.js
 *
 * CyberCrowd Value Reconcile
 *
 * ONE JOB:
 * Record an observed balance check for one registered value surface.
 *
 * This is NOT value-surface.js.
 * This is NOT value-balance.js.
 * This is NOT value-adjustment.js.
 * This is NOT value-spend.js.
 * This is NOT value-refund.js.
 * This does NOT change balances.
 * This does NOT approve corrections.
 * This does NOT move money.
 * This does NOT process payments.
 * This does NOT charge cards.
 * This does NOT execute bank transfers.
 * This does NOT expose real accounts.
 * This does NOT create a PING.
 *
 * value-surface.js says:
 * this value surface exists.
 *
 * value-reconcile.js says:
 * this is the observed balance compared to the stored balance.
 *
 * Next worker:
 * value-adjustment.js requests a manual correction when reconciliation finds a mismatch.
 */

const RECONCILE_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_SOURCE = new Set([
  "manual",
  "receipt_review",
  "cash_count",
  "statement_view",
  "surface_snapshot",
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
    firstDefined(
      body.surface_id,
      body.surfaceId,
      body.value_surface_id,
      body.valueSurfaceId,
      body.id
    )
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

  const observedRaw = firstDefined(
    body.observed_balance_cents,
    body.observedBalanceCents,
    body.observed_balance,
    body.observedBalance,
    body.balance_cents,
    body.balanceCents,
    body.balance
  );

  if (observedRaw === undefined || observedRaw === null || observedRaw === "") {
    return json({ ok: false, error: "OBSERVED_BALANCE_REQUIRED" }, 400);
  }

  const observedBalanceCents = normalizeCents(observedRaw);

  if (!Number.isFinite(observedBalanceCents) || observedBalanceCents < 0) {
    return json({ ok: false, error: "OBSERVED_BALANCE_INVALID" }, 400);
  }

  const storedBalanceCents = Number(surface.balance_cents || 0);
  const differenceCents = observedBalanceCents - storedBalanceCents;
  const matched = differenceCents === 0;

  const source = normalizeSource(
    firstDefined(
      body.source,
      body.reconcile_source,
      body.reconcileSource,
      "manual"
    )
  );

  const now = new Date().toISOString();
  const reconcileId =
    cleanText(
      firstDefined(
        body.reconcile_id,
        body.reconcileId,
        body.value_reconcile_id,
        body.valueReconcileId
      )
    ) || makeId("VALUE_RECONCILE");

  const reconcile = {
    id: reconcileId,
    reconcile_id: reconcileId,

    identity_id: identityId,
    actor_identity_id: identityId,

    value_surface_id: cleanText(surface.id || surface.surface_id || surface.surfaceId || surfaceId),

    stored_balance_cents: storedBalanceCents,
    observed_balance_cents: observedBalanceCents,
    difference_cents: differenceCents,

    currency: cleanText(body.currency || surface.currency || "USD").toUpperCase(),

    matched,
    mismatch: matched !== true,
    source,

    adjustment_requested: false,
    adjustment_decided: false,
    adjustment_balance_moved: false,
    balance_changed: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,

    note: cleanText(body.note || body.description || "") || null,

    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  await env.IDENTITY.put("value-reconcile:" + reconcile.id, JSON.stringify(reconcile), {
    expirationTtl: RECONCILE_TTL_SECONDS
  });

  await appendIndex(env, "value-reconcile:index:identity:" + identityId, reconcile.id);
  await appendIndex(env, "value-reconcile:index:surface:" + reconcile.value_surface_id, reconcile.id);
  await appendIndex(env, "value-reconcile:index:source:" + source, reconcile.id);
  await appendIndex(env, "value-reconcile:index:result:" + (matched ? "matched" : "mismatch"), reconcile.id);

  await appendSync(env, identityId, {
    type: "identity_value_reconciled",
    value_reconcile_id: reconcile.id,
    value_surface_id: reconcile.value_surface_id,
    stored_balance_cents: storedBalanceCents,
    observed_balance_cents: observedBalanceCents,
    difference_cents: differenceCents,
    matched,
    source,
    adjustment_requested: false,
    balance_changed: false,
    payment_created: false,
    real_account_exposed: false,
    at: now
  });

  await appendSync(env, reconcile.value_surface_id, {
    type: "value_surface_reconciled",
    value_reconcile_id: reconcile.id,
    identity_id: identityId,
    stored_balance_cents: storedBalanceCents,
    observed_balance_cents: observedBalanceCents,
    difference_cents: differenceCents,
    matched,
    source,
    adjustment_requested: false,
    balance_changed: false,
    at: now
  });

  return json({
    ok: true,
    created: true,
    value_reconcile_id: reconcile.id,
    identity_id: identityId,
    value_surface_id: reconcile.value_surface_id,
    stored_balance_cents: storedBalanceCents,
    observed_balance_cents: observedBalanceCents,
    difference_cents: differenceCents,
    currency: reconcile.currency,
    matched,
    mismatch: matched !== true,
    source,
    adjustment_requested: false,
    adjustment_decided: false,
    adjustment_balance_moved: false,
    balance_changed: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    next: matched
      ? null
      : {
          route: "/api/value-adjustment",
          method: "POST",
          reason: "reconciliation_mismatch"
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

  const reconcileId = cleanText(
    url.searchParams.get("reconcile_id") ||
      url.searchParams.get("reconcileId") ||
      url.searchParams.get("value_reconcile_id") ||
      url.searchParams.get("valueReconcileId") ||
      url.searchParams.get("id")
  );

  if (reconcileId) {
    const reconcile = await readReconcile(env, reconcileId);

    if (!reconcile) {
      return json({ ok: false, error: "VALUE_RECONCILE_NOT_FOUND" }, 404);
    }

    if (cleanText(reconcile.identity_id || reconcile.identityId) !== identityId) {
      return json({ ok: false, error: "VALUE_RECONCILE_ACCESS_DENIED" }, 403);
    }

    return json({
      ok: true,
      value_reconcile: cleanReconcileForReturn(reconcile)
    });
  }

  const surfaceId = cleanText(
    url.searchParams.get("surface_id") ||
      url.searchParams.get("surfaceId") ||
      url.searchParams.get("value_surface_id") ||
      url.searchParams.get("valueSurfaceId")
  );

  const key = surfaceId
    ? "value-reconcile:index:surface:" + surfaceId
    : "value-reconcile:index:identity:" + identityId;

  const ids = await readIndex(env, key);
  const reconciliations = [];

  for (const id of ids) {
    const reconcile = await readReconcile(env, id);

    if (!reconcile) continue;
    if (cleanText(reconcile.identity_id || reconcile.identityId) !== identityId) continue;

    reconciliations.push(cleanReconcileForReturn(reconcile));
  }

  return json({
    ok: true,
    identity_id: identityId,
    count: reconciliations.length,
    value_reconciliations: reconciliations,
    balance_changed: false,
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

async function readReconcile(env, reconcileId) {
  const id = cleanText(reconcileId);

  if (!id) return null;

  return readJsonKey(env, "value-reconcile:" + id);
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

function cleanReconcileForReturn(reconcile) {
  return {
    id: reconcile.id,
    reconcile_id: reconcile.reconcile_id || reconcile.id,
    identity_id: reconcile.identity_id,
    value_surface_id: reconcile.value_surface_id,
    stored_balance_cents: Number(reconcile.stored_balance_cents || 0),
    observed_balance_cents: Number(reconcile.observed_balance_cents || 0),
    difference_cents: Number(reconcile.difference_cents || 0),
    currency: reconcile.currency || "USD",
    matched: reconcile.matched === true,
    mismatch: reconcile.mismatch === true,
    source: reconcile.source || "manual",
    adjustment_requested: false,
    adjustment_decided: false,
    adjustment_balance_moved: false,
    balance_changed: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    note: reconcile.note || null,
    created_at: reconcile.created_at || null,
    updated_at: reconcile.updated_at || null
  };
}

function normalizeSource(value) {
  const clean = cleanText(value || "manual").toLowerCase();

  if (ALLOWED_SOURCE.has(clean)) {
    return clean;
  }

  return "other";
}

function normalizeCents(value) {
  if (value === null || value === undefined || value === "") {
    return NaN;
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
    return NaN;
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

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
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
