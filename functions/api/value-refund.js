/**
 * functions/api/value-refund.js
 *
 * CyberCrowd Value Refund
 *
 * ONE JOB:
 * Record a requested refund for one completed value spend.
 *
 * This is NOT value-spend.js.
 * This is NOT value-spend-decision.js.
 * This is NOT value-spend-balance.js.
 * This is NOT value-receipt.js.
 * This is NOT value-balance.js.
 * This does NOT approve refunds.
 * This does NOT move balances.
 * This does NOT process payments.
 * This does NOT charge cards.
 * This does NOT execute bank transfers.
 * This does NOT expose real accounts.
 * This does NOT create a PING.
 *
 * value-spend.js says:
 * a spend was requested.
 *
 * value-spend-balance.js says:
 * the internal spend debit was applied.
 *
 * value-refund.js says:
 * this identity requested a refund against that completed spend.
 *
 * Next worker:
 * value-refund-decision.js approves or blocks the refund request.
 */

const REFUND_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_STATUS = new Set([
  "requested",
  "cancelled"
]);

const ALLOWED_REASON = new Set([
  "manual",
  "returned_item",
  "cancelled_order",
  "service_failed",
  "duplicate_charge",
  "merchant_credit",
  "adjustment",
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

  const spendId = cleanText(
    body.spend_id ||
      body.spendId ||
      body.value_spend_id ||
      body.valueSpendId ||
      body.id
  );

  if (!spendId) {
    return json({ ok: false, error: "VALUE_SPEND_ID_REQUIRED" }, 400);
  }

  const spend = await readSpend(env, spendId);

  if (!spend) {
    return json({ ok: false, error: "VALUE_SPEND_NOT_FOUND" }, 404);
  }

  if (cleanText(spend.identity_id || spend.identityId) !== identityId) {
    return json({ ok: false, error: "VALUE_SPEND_ACCESS_DENIED" }, 403);
  }

  if (spend.balance_moved !== true) {
    return json(
      {
        ok: false,
        error: "VALUE_SPEND_NOT_COMPLETED",
        value_spend_id: spendId,
        balance_moved: spend.balance_moved === true
      },
      409
    );
  }

  const requestedAmountCents = normalizeCents(
    body.amount_cents ||
      body.amountCents ||
      body.amount ||
      spend.amount_cents ||
      0
  );

  const originalAmountCents = Number(spend.amount_cents || 0);

  if (requestedAmountCents <= 0) {
    return json({ ok: false, error: "VALUE_REFUND_AMOUNT_REQUIRED" }, 400);
  }

  if (originalAmountCents > 0 && requestedAmountCents > originalAmountCents) {
    return json(
      {
        ok: false,
        error: "VALUE_REFUND_EXCEEDS_ORIGINAL_SPEND",
        requested_amount_cents: requestedAmountCents,
        original_amount_cents: originalAmountCents
      },
      409
    );
  }

  const status = normalizeStatus(body.status || "requested");

  if (!status) {
    return json(
      {
        ok: false,
        error: "VALUE_REFUND_STATUS_NOT_ALLOWED",
        allowed: Array.from(ALLOWED_STATUS)
      },
      400
    );
  }

  const reason = normalizeReason(
    body.reason ||
      body.refund_reason ||
      body.refundReason ||
      "manual"
  );

  const now = new Date().toISOString();
  const refundId =
    cleanText(body.refund_id || body.refundId || body.value_refund_id || body.valueRefundId) ||
    makeId("VALUE_REFUND");

  const surfaceId = cleanText(
    spend.value_surface_id ||
      spend.surface_id ||
      spend.surfaceId ||
      ""
  );

  const refund = {
    id: refundId,
    refund_id: refundId,

    identity_id: identityId,
    actor_identity_id: identityId,

    value_spend_id: spendId,
    value_spend_balance_id: cleanText(spend.spend_balance_id || spend.balance_id || spend.balanceId || ""),
    value_surface_id: surfaceId,

    amount_cents: requestedAmountCents,
    original_spend_amount_cents: originalAmountCents,
    currency: cleanText(body.currency || spend.currency || "USD").toUpperCase(),

    status,
    reason,

    merchant: cleanText(body.merchant || spend.merchant || "") || null,
    label: cleanText(body.label || spend.label || "") || null,
    note: cleanText(body.note || body.description || "") || null,

    approved: false,
    blocked: false,
    decided: false,

    refund_balance_moved: false,
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

  await env.IDENTITY.put("value-refund:" + refund.id, JSON.stringify(refund), {
    expirationTtl: REFUND_TTL_SECONDS
  });

  await appendIndex(env, "value-refund:index:identity:" + identityId, refund.id);
  await appendIndex(env, "value-refund:index:spend:" + spendId, refund.id);
  await appendIndex(env, "value-refund:index:surface:" + surfaceId, refund.id);
  await appendIndex(env, "value-refund:index:status:" + status, refund.id);
  await appendIndex(env, "value-refund:index:reason:" + reason, refund.id);

  await appendSync(env, identityId, {
    type: "identity_value_refund_requested",
    value_refund_id: refund.id,
    value_spend_id: spendId,
    value_surface_id: surfaceId,
    amount_cents: requestedAmountCents,
    currency: refund.currency,
    status,
    reason,
    refund_balance_moved: false,
    payment_created: false,
    real_account_exposed: false,
    at: now
  });

  await appendSync(env, spendId, {
    type: "value_spend_refund_requested",
    value_refund_id: refund.id,
    value_spend_id: spendId,
    identity_id: identityId,
    value_surface_id: surfaceId,
    amount_cents: requestedAmountCents,
    currency: refund.currency,
    status,
    reason,
    refund_balance_moved: false,
    at: now
  });

  if (surfaceId) {
    await appendSync(env, surfaceId, {
      type: "value_surface_refund_requested",
      value_refund_id: refund.id,
      value_spend_id: spendId,
      identity_id: identityId,
      amount_cents: requestedAmountCents,
      currency: refund.currency,
      status,
      reason,
      refund_balance_moved: false,
      at: now
    });
  }

  return json({
    ok: true,
    created: true,
    value_refund_id: refund.id,
    value_spend_id: spendId,
    identity_id: identityId,
    value_surface_id: surfaceId || null,
    amount_cents: requestedAmountCents,
    currency: refund.currency,
    status,
    reason,
    approved: false,
    decided: false,
    refund_balance_moved: false,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    next: {
      route: "/api/value-refund-decision",
      method: "POST",
      reason: "refund_request_recorded"
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

  const refundId = cleanText(
    url.searchParams.get("refund_id") ||
      url.searchParams.get("refundId") ||
      url.searchParams.get("value_refund_id") ||
      url.searchParams.get("valueRefundId") ||
      url.searchParams.get("id")
  );

  if (refundId) {
    const refund = await readRefund(env, refundId);

    if (!refund) {
      return json({ ok: false, error: "VALUE_REFUND_NOT_FOUND" }, 404);
    }

    if (cleanText(refund.identity_id || refund.identityId) !== identityId) {
      return json({ ok: false, error: "VALUE_REFUND_ACCESS_DENIED" }, 403);
    }

    return json({
      ok: true,
      value_refund: cleanRefundForReturn(refund)
    });
  }

  const spendId = cleanText(
    url.searchParams.get("spend_id") ||
      url.searchParams.get("spendId") ||
      url.searchParams.get("value_spend_id") ||
      url.searchParams.get("valueSpendId")
  );

  const surfaceId = cleanText(
    url.searchParams.get("surface_id") ||
      url.searchParams.get("surfaceId") ||
      url.searchParams.get("value_surface_id") ||
      url.searchParams.get("valueSurfaceId")
  );

  const key = spendId
    ? "value-refund:index:spend:" + spendId
    : surfaceId
      ? "value-refund:index:surface:" + surfaceId
      : "value-refund:index:identity:" + identityId;

  const ids = await readIndex(env, key);
  const refunds = [];

  for (const id of ids) {
    const refund = await readRefund(env, id);

    if (!refund) continue;
    if (cleanText(refund.identity_id || refund.identityId) !== identityId) continue;

    refunds.push(cleanRefundForReturn(refund));
  }

  return json({
    ok: true,
    identity_id: identityId,
    count: refunds.length,
    value_refunds: refunds,
    refund_balance_moved: false,
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

async function readSpend(env, spendId) {
  const id = cleanText(spendId);
  if (!id) return null;
  return readJsonKey(env, "value-spend:" + id);
}

async function readRefund(env, refundId) {
  const id = cleanText(refundId);
  if (!id) return null;
  return readJsonKey(env, "value-refund:" + id);
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

function cleanRefundForReturn(refund) {
  return {
    id: refund.id,
    refund_id: refund.refund_id || refund.id,
    identity_id: refund.identity_id,
    value_spend_id: refund.value_spend_id,
    value_spend_balance_id: refund.value_spend_balance_id || null,
    value_surface_id: refund.value_surface_id || null,
    amount_cents: Number(refund.amount_cents || 0),
    original_spend_amount_cents: Number(refund.original_spend_amount_cents || 0),
    currency: refund.currency || "USD",
    status: refund.status,
    reason: refund.reason,
    merchant: refund.merchant || null,
    label: refund.label || null,
    note: refund.note || null,
    approved: false,
    blocked: false,
    decided: false,
    refund_balance_moved: false,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    created_at: refund.created_at || null,
    updated_at: refund.updated_at || null
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
