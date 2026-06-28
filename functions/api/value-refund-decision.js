/**
 * functions/api/value-refund-decision.js
 *
 * CyberCrowd Value Refund Decision
 *
 * ONE JOB:
 * Approve or block a recorded refund request.
 *
 * This is NOT value-refund.js.
 * This is NOT value-spend.js.
 * This is NOT value-spend-balance.js.
 * This is NOT value-receipt.js.
 * This is NOT value-balance.js.
 * This does NOT request refunds.
 * This does NOT move balances.
 * This does NOT process payments.
 * This does NOT charge cards.
 * This does NOT execute bank transfers.
 * This does NOT expose real accounts.
 * This does NOT create a PING.
 *
 * value-refund.js says:
 * a refund was requested.
 *
 * value-refund-decision.js says:
 * that refund request is approved or blocked.
 *
 * Next worker:
 * value-refund-balance.js applies the approved internal refund credit.
 */

const DECISION_TTL_SECONDS = 60 * 60 * 24 * 365;
const REFUND_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_DECISION = new Set([
  "approved",
  "blocked"
]);

const ALLOWED_REASON = new Set([
  "manual_approve",
  "manual_block",
  "spend_not_completed",
  "refund_exceeds_original_spend",
  "currency_mismatch",
  "refund_already_decided",
  "policy_block",
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

  const refundId = cleanText(
    body.refund_id ||
      body.refundId ||
      body.value_refund_id ||
      body.valueRefundId ||
      body.id
  );

  if (!refundId) {
    return json({ ok: false, error: "VALUE_REFUND_ID_REQUIRED" }, 400);
  }

  const refund = await readRefund(env, refundId);

  if (!refund) {
    return json({ ok: false, error: "VALUE_REFUND_NOT_FOUND" }, 404);
  }

  if (cleanText(refund.identity_id || refund.identityId) !== identityId) {
    return json({ ok: false, error: "VALUE_REFUND_ACCESS_DENIED" }, 403);
  }

  const requestedDecision = normalizeDecision(
    body.decision ||
      body.status ||
      body.result ||
      ""
  );

  if (!requestedDecision) {
    return json(
      {
        ok: false,
        error: "VALUE_REFUND_DECISION_REQUIRED",
        allowed: Array.from(ALLOWED_DECISION)
      },
      400
    );
  }

  const spendId = cleanText(
    refund.value_spend_id ||
      refund.spend_id ||
      refund.spendId ||
      ""
  );

  const spend = await readSpend(env, spendId);

  if (!spend) {
    return recordDecision(context, {
      identityId,
      refund,
      spend: null,
      finalDecision: "blocked",
      reason: "spend_not_completed",
      gate: {
        ok: false,
        error: "VALUE_SPEND_NOT_FOUND",
        reason: "spend_not_completed"
      },
      note: body.note || body.description
    });
  }

  if (cleanText(spend.identity_id || spend.identityId) !== identityId) {
    return json({ ok: false, error: "VALUE_SPEND_ACCESS_DENIED" }, 403);
  }

  const gate = checkDecisionGate({
    requestedDecision,
    refund,
    spend
  });

  const finalDecision = gate.ok ? requestedDecision : "blocked";
  const reason = normalizeReason(
    body.reason ||
      body.decision_reason ||
      body.decisionReason ||
      gate.reason ||
      defaultReason(finalDecision)
  );

  return recordDecision(context, {
    identityId,
    refund,
    spend,
    finalDecision,
    reason,
    gate,
    note: body.note || body.description
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

  const decisionId = cleanText(
    url.searchParams.get("decision_id") ||
      url.searchParams.get("decisionId") ||
      url.searchParams.get("id")
  );

  if (decisionId) {
    const decision = await readDecision(env, decisionId);

    if (!decision) {
      return json({ ok: false, error: "VALUE_REFUND_DECISION_NOT_FOUND" }, 404);
    }

    if (cleanText(decision.identity_id || decision.identityId) !== identityId) {
      return json({ ok: false, error: "VALUE_REFUND_DECISION_ACCESS_DENIED" }, 403);
    }

    return json({
      ok: true,
      value_refund_decision: cleanDecisionForReturn(decision)
    });
  }

  const refundId = cleanText(
    url.searchParams.get("refund_id") ||
      url.searchParams.get("refundId") ||
      url.searchParams.get("value_refund_id") ||
      url.searchParams.get("valueRefundId")
  );

  const key = refundId
    ? "value-refund-decision:index:refund:" + refundId
    : "value-refund-decision:index:identity:" + identityId;

  const ids = await readIndex(env, key);
  const decisions = [];

  for (const id of ids) {
    const decision = await readDecision(env, id);

    if (!decision) continue;
    if (cleanText(decision.identity_id || decision.identityId) !== identityId) continue;

    decisions.push(cleanDecisionForReturn(decision));
  }

  return json({
    ok: true,
    identity_id: identityId,
    count: decisions.length,
    value_refund_decisions: decisions,
    refund_balance_moved: false,
    payment_created: false,
    checkout_created: false,
    ping_created: false
  });
}

async function recordDecision(context, input) {
  const { env } = context;

  const identityId = input.identityId;
  const refund = input.refund;
  const spend = input.spend;
  const finalDecision = input.finalDecision;
  const reason = input.reason;
  const gate = input.gate || {};

  const now = new Date().toISOString();
  const decisionId = makeId("VALUE_REFUND_DECISION");

  const refundId = cleanText(refund.id || refund.refund_id || refund.refundId);
  const spendId = cleanText(refund.value_spend_id || refund.spend_id || refund.spendId);
  const surfaceId = cleanText(
    refund.value_surface_id ||
      refund.surface_id ||
      refund.surfaceId ||
      spend?.value_surface_id ||
      spend?.surface_id ||
      spend?.surfaceId ||
      ""
  );

  const decision = {
    id: decisionId,
    decision_id: decisionId,

    value_refund_id: refundId,
    refund_id: refundId,

    value_spend_id: spendId,
    value_surface_id: surfaceId,

    identity_id: identityId,
    actor_identity_id: identityId,

    decision: finalDecision,
    status: finalDecision,
    reason,

    gate_ok: gate.ok === true,
    gate_error: gate.error || null,
    gate_reason: gate.reason || null,

    amount_cents: Number(refund.amount_cents || 0),
    original_spend_amount_cents: Number(refund.original_spend_amount_cents || spend?.amount_cents || 0),
    currency: cleanText(refund.currency || spend?.currency || "USD").toUpperCase(),

    spend_completed: spend?.balance_moved === true,
    spend_balance_id: cleanText(spend?.spend_balance_id || spend?.balance_id || spend?.balanceId || ""),

    approved: finalDecision === "approved",
    blocked: finalDecision === "blocked",
    refund_balance_moved: false,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,

    note: cleanText(input.note) || null,

    created_at: now,
    updated_at: now
  };

  const updatedRefund = {
    ...refund,
    decision_id: decision.id,
    decision: finalDecision,
    status: finalDecision,
    reason,
    approved: finalDecision === "approved",
    blocked: finalDecision === "blocked",
    decided: true,
    refund_balance_moved: false,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    updated_at: now
  };

  await env.IDENTITY.put("value-refund-decision:" + decision.id, JSON.stringify(decision), {
    expirationTtl: DECISION_TTL_SECONDS
  });

  await env.IDENTITY.put("value-refund:" + refundId, JSON.stringify(updatedRefund), {
    expirationTtl: REFUND_TTL_SECONDS
  });

  await appendIndex(env, "value-refund-decision:index:identity:" + identityId, decision.id);
  await appendIndex(env, "value-refund-decision:index:refund:" + refundId, decision.id);
  await appendIndex(env, "value-refund-decision:index:spend:" + spendId, decision.id);
  await appendIndex(env, "value-refund-decision:index:surface:" + surfaceId, decision.id);
  await appendIndex(env, "value-refund-decision:index:decision:" + finalDecision, decision.id);
  await appendIndex(env, "value-refund-decision:index:reason:" + reason, decision.id);

  await appendSync(env, identityId, {
    type: "identity_value_refund_decided",
    value_refund_id: refundId,
    value_refund_decision_id: decision.id,
    value_spend_id: spendId,
    value_surface_id: surfaceId,
    decision: finalDecision,
    reason,
    amount_cents: decision.amount_cents,
    currency: decision.currency,
    refund_balance_moved: false,
    payment_created: false,
    real_account_exposed: false,
    at: now
  });

  await appendSync(env, refundId, {
    type: "value_refund_decided",
    value_refund_id: refundId,
    value_refund_decision_id: decision.id,
    identity_id: identityId,
    value_spend_id: spendId,
    value_surface_id: surfaceId,
    decision: finalDecision,
    reason,
    refund_balance_moved: false,
    at: now
  });

  if (spendId) {
    await appendSync(env, spendId, {
      type: "value_spend_refund_decided",
      value_refund_id: refundId,
      value_refund_decision_id: decision.id,
      identity_id: identityId,
      value_surface_id: surfaceId,
      decision: finalDecision,
      reason,
      amount_cents: decision.amount_cents,
      currency: decision.currency,
      refund_balance_moved: false,
      at: now
    });
  }

  if (surfaceId) {
    await appendSync(env, surfaceId, {
      type: "value_surface_refund_decision",
      value_refund_id: refundId,
      value_refund_decision_id: decision.id,
      identity_id: identityId,
      value_spend_id: spendId,
      decision: finalDecision,
      reason,
      amount_cents: decision.amount_cents,
      currency: decision.currency,
      refund_balance_moved: false,
      at: now
    });
  }

  return json({
    ok: true,
    created: true,
    value_refund_decision_id: decision.id,
    value_refund_id: refundId,
    value_spend_id: spendId,
    identity_id: identityId,
    value_surface_id: surfaceId || null,
    decision: finalDecision,
    status: finalDecision,
    reason,
    approved: finalDecision === "approved",
    blocked: finalDecision === "blocked",
    refund_balance_moved: false,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    next: finalDecision === "approved"
      ? {
          route: "/api/value-refund-balance",
          method: "POST",
          reason: "refund_approved"
        }
      : null
  });
}

function checkDecisionGate(input) {
  const requestedDecision = input.requestedDecision;
  const refund = input.refund;
  const spend = input.spend;

  if (requestedDecision === "blocked") {
    return {
      ok: true,
      reason: "manual_block"
    };
  }

  if (refund.decided === true) {
    return {
      ok: false,
      error: "VALUE_REFUND_ALREADY_DECIDED",
      reason: "refund_already_decided"
    };
  }

  if (spend.balance_moved !== true) {
    return {
      ok: false,
      error: "VALUE_SPEND_NOT_COMPLETED",
      reason: "spend_not_completed"
    };
  }

  const refundAmount = Number(refund.amount_cents || 0);
  const originalAmount = Number(refund.original_spend_amount_cents || spend.amount_cents || 0);

  if (refundAmount <= 0) {
    return {
      ok: false,
      error: "INVALID_REFUND_AMOUNT",
      reason: "policy_block"
    };
  }

  if (originalAmount > 0 && refundAmount > originalAmount) {
    return {
      ok: false,
      error: "REFUND_EXCEEDS_ORIGINAL_SPEND",
      reason: "refund_exceeds_original_spend"
    };
  }

  const refundCurrency = cleanText(refund.currency || "USD").toUpperCase();
  const spendCurrency = cleanText(spend.currency || "USD").toUpperCase();

  if (refundCurrency !== spendCurrency) {
    return {
      ok: false,
      error: "CURRENCY_MISMATCH",
      reason: "currency_mismatch"
    };
  }

  return {
    ok: true,
    reason: "manual_approve"
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

async function readRefund(env, refundId) {
  const id = cleanText(refundId);
  if (!id) return null;
  return readJsonKey(env, "value-refund:" + id);
}

async function readSpend(env, spendId) {
  const id = cleanText(spendId);
  if (!id) return null;
  return readJsonKey(env, "value-spend:" + id);
}

async function readDecision(env, decisionId) {
  const id = cleanText(decisionId);
  if (!id) return null;
  return readJsonKey(env, "value-refund-decision:" + id);
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

function cleanDecisionForReturn(decision) {
  return {
    id: decision.id,
    decision_id: decision.decision_id || decision.id,
    value_refund_id: decision.value_refund_id,
    value_spend_id: decision.value_spend_id,
    value_surface_id: decision.value_surface_id || null,
    identity_id: decision.identity_id,
    decision: decision.decision,
    status: decision.status,
    reason: decision.reason,
    amount_cents: Number(decision.amount_cents || 0),
    original_spend_amount_cents: Number(decision.original_spend_amount_cents || 0),
    currency: decision.currency || "USD",
    approved: decision.approved === true,
    blocked: decision.blocked === true,
    refund_balance_moved: false,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    note: decision.note || null,
    created_at: decision.created_at || null,
    updated_at: decision.updated_at || null
  };
}

function normalizeDecision(value) {
  const clean = cleanText(value).toLowerCase();

  if (ALLOWED_DECISION.has(clean)) {
    return clean;
  }

  return "";
}

function normalizeReason(value) {
  const clean = cleanText(value || "other").toLowerCase();

  if (ALLOWED_REASON.has(clean)) {
    return clean;
  }

  return "other";
}

function defaultReason(decision) {
  return decision === "approved" ? "manual_approve" : "manual_block";
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
