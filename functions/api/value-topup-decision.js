/**
 * functions/api/value-topup-decision.js
 *
 * CyberCrowd Value Topup Decision
 *
 * ONE JOB:
 * Approve or block a recorded value topup request.
 *
 * This is NOT value-topup.js.
 * This is NOT balance movement.
 * This is NOT payment processing.
 * This is NOT checkout.
 * This is NOT bank transfer execution.
 * This does NOT charge cards.
 * This does NOT expose real accounts.
 * This does NOT create a PING.
 *
 * value-topup.js says:
 * a topup was requested.
 *
 * value-topup-decision.js says:
 * that request is approved or blocked.
 *
 * Next worker:
 * value-balance.js moves balances only after approval.
 */

const DECISION_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_DECISION = new Set([
  "approved",
  "blocked"
]);

const ALLOWED_REASON = new Set([
  "manual_approve",
  "manual_block",
  "source_not_active",
  "target_not_active",
  "source_not_allowed",
  "target_not_allowed",
  "currency_mismatch",
  "insufficient_source_balance",
  "street_to_real_blocked",
  "same_surface_blocked",
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

  const topupId = cleanText(
    body.topup_id ||
      body.topupId ||
      body.value_topup_id ||
      body.valueTopupId ||
      body.id
  );

  if (!topupId) {
    return json({ ok: false, error: "VALUE_TOPUP_ID_REQUIRED" }, 400);
  }

  const topup = await readTopup(env, topupId);

  if (!topup) {
    return json({ ok: false, error: "VALUE_TOPUP_NOT_FOUND" }, 404);
  }

  if (cleanText(topup.identity_id || topup.identityId) !== identityId) {
    return json({ ok: false, error: "VALUE_TOPUP_ACCESS_DENIED" }, 403);
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
        error: "TOPUP_DECISION_REQUIRED",
        allowed: Array.from(ALLOWED_DECISION)
      },
      400
    );
  }

  const fromSurfaceId = cleanText(topup.from_surface_id || topup.fromSurfaceId);
  const toSurfaceId = cleanText(topup.to_surface_id || topup.toSurfaceId);

  const fromSurface = await readValueSurface(env, fromSurfaceId);
  const toSurface = await readValueSurface(env, toSurfaceId);

  if (!fromSurface) {
    return blockDecision(context, {
      identityId,
      topup,
      requestedDecision,
      reason: "source_not_active",
      error: "FROM_VALUE_SURFACE_NOT_FOUND",
      note: body.note || body.description
    });
  }

  if (!toSurface) {
    return blockDecision(context, {
      identityId,
      topup,
      requestedDecision,
      reason: "target_not_active",
      error: "TO_VALUE_SURFACE_NOT_FOUND",
      note: body.note || body.description
    });
  }

  if (cleanText(fromSurface.identity_id || fromSurface.identityId) !== identityId) {
    return json({ ok: false, error: "FROM_VALUE_SURFACE_ACCESS_DENIED" }, 403);
  }

  if (cleanText(toSurface.identity_id || toSurface.identityId) !== identityId) {
    return json({ ok: false, error: "TO_VALUE_SURFACE_ACCESS_DENIED" }, 403);
  }

  const from = normalizeSurface(fromSurface, fromSurfaceId);
  const to = normalizeSurface(toSurface, toSurfaceId);
  const amountCents = Number(topup.amount_cents || 0);
  const currency = cleanText(topup.currency || "USD").toUpperCase();

  const gate = checkDecisionGate({
    requestedDecision,
    topup,
    from,
    to,
    amountCents,
    currency
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
    topup,
    from,
    to,
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
      return json({ ok: false, error: "VALUE_TOPUP_DECISION_NOT_FOUND" }, 404);
    }

    if (cleanText(decision.identity_id || decision.identityId) !== identityId) {
      return json({ ok: false, error: "VALUE_TOPUP_DECISION_ACCESS_DENIED" }, 403);
    }

    return json({
      ok: true,
      value_topup_decision: cleanDecisionForReturn(decision)
    });
  }

  const topupId = cleanText(
    url.searchParams.get("topup_id") ||
      url.searchParams.get("topupId") ||
      url.searchParams.get("value_topup_id") ||
      url.searchParams.get("valueTopupId")
  );

  const key = topupId
    ? "value-topup-decision:index:topup:" + topupId
    : "value-topup-decision:index:identity:" + identityId;

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
    value_topup_decisions: decisions,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    ping_created: false
  });
}

async function blockDecision(context, input) {
  const topup = input.topup;

  return recordDecision(context, {
    identityId: input.identityId,
    topup,
    from: null,
    to: null,
    finalDecision: "blocked",
    reason: input.reason,
    gate: {
      ok: false,
      error: input.error,
      reason: input.reason
    },
    note: input.note
  });
}

async function recordDecision(context, input) {
  const { env } = context;

  const identityId = input.identityId;
  const topup = input.topup;
  const from = input.from;
  const to = input.to;
  const finalDecision = input.finalDecision;
  const reason = input.reason;
  const gate = input.gate || {};

  const now = new Date().toISOString();
  const decisionId = makeId("VALUE_TOPUP_DECISION");

  const topupId = cleanText(topup.id || topup.topup_id || topup.topupId);
  const fromSurfaceId = cleanText(topup.from_surface_id || topup.fromSurfaceId);
  const toSurfaceId = cleanText(topup.to_surface_id || topup.toSurfaceId);

  const decision = {
    id: decisionId,
    decision_id: decisionId,

    value_topup_id: topupId,
    topup_id: topupId,

    identity_id: identityId,
    actor_identity_id: identityId,

    decision: finalDecision,
    status: finalDecision,
    reason,

    gate_ok: gate.ok === true,
    gate_error: gate.error || null,
    gate_reason: gate.reason || null,

    from_surface_id: fromSurfaceId,
    to_surface_id: toSurfaceId,

    amount_cents: Number(topup.amount_cents || 0),
    currency: cleanText(topup.currency || "USD").toUpperCase(),

    source_status: from?.status || null,
    target_status: to?.status || null,
    source_allowed: from?.source_allowed === true,
    target_spend_allowed: to?.spend_allowed === true,

    approved: finalDecision === "approved",
    blocked: finalDecision === "blocked",
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

  const updatedTopup = {
    ...topup,
    decision_id: decision.id,
    decision: finalDecision,
    status: finalDecision,
    reason,
    approved: finalDecision === "approved",
    blocked: finalDecision === "blocked",
    decided: true,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    updated_at: now
  };

  await env.IDENTITY.put("value-topup-decision:" + decision.id, JSON.stringify(decision), {
    expirationTtl: DECISION_TTL_SECONDS
  });

  await env.IDENTITY.put("value-topup:" + topupId, JSON.stringify(updatedTopup), {
    expirationTtl: DECISION_TTL_SECONDS
  });

  await appendIndex(env, "value-topup-decision:index:identity:" + identityId, decision.id);
  await appendIndex(env, "value-topup-decision:index:topup:" + topupId, decision.id);
  await appendIndex(env, "value-topup-decision:index:decision:" + finalDecision, decision.id);
  await appendIndex(env, "value-topup-decision:index:reason:" + reason, decision.id);

  await appendSync(env, identityId, {
    type: "identity_value_topup_decided",
    value_topup_id: topupId,
    value_topup_decision_id: decision.id,
    decision: finalDecision,
    reason,
    from_surface_id: fromSurfaceId,
    to_surface_id: toSurfaceId,
    amount_cents: decision.amount_cents,
    currency: decision.currency,
    balance_moved: false,
    payment_created: false,
    real_account_exposed: false,
    at: now
  });

  await appendSync(env, topupId, {
    type: "value_topup_decided",
    value_topup_id: topupId,
    value_topup_decision_id: decision.id,
    identity_id: identityId,
    decision: finalDecision,
    reason,
    balance_moved: false,
    at: now
  });

  await appendSync(env, fromSurfaceId, {
    type: "value_surface_topup_decision_from",
    value_topup_id: topupId,
    value_topup_decision_id: decision.id,
    identity_id: identityId,
    decision: finalDecision,
    reason,
    to_surface_id: toSurfaceId,
    amount_cents: decision.amount_cents,
    currency: decision.currency,
    balance_moved: false,
    at: now
  });

  await appendSync(env, toSurfaceId, {
    type: "value_surface_topup_decision_to",
    value_topup_id: topupId,
    value_topup_decision_id: decision.id,
    identity_id: identityId,
    decision: finalDecision,
    reason,
    from_surface_id: fromSurfaceId,
    amount_cents: decision.amount_cents,
    currency: decision.currency,
    balance_moved: false,
    at: now
  });

  return json({
    ok: true,
    created: true,
    value_topup_decision_id: decision.id,
    value_topup_id: topupId,
    identity_id: identityId,
    decision: finalDecision,
    status: finalDecision,
    reason,
    approved: finalDecision === "approved",
    blocked: finalDecision === "blocked",
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    next: finalDecision === "approved"
      ? {
          route: "/api/value-balance",
          method: "POST",
          reason: "topup_approved"
        }
      : null
  });
}

function checkDecisionGate(input) {
  const requestedDecision = input.requestedDecision;
  const from = input.from;
  const to = input.to;
  const amountCents = input.amountCents;
  const currency = input.currency;

  if (requestedDecision === "blocked") {
    return {
      ok: true,
      reason: "manual_block"
    };
  }

  if (from.id === to.id) {
    return {
      ok: false,
      error: "SAME_SURFACE_BLOCKED",
      reason: "same_surface_blocked"
    };
  }

  if (from.status !== "active") {
    return {
      ok: false,
      error: "SOURCE_NOT_ACTIVE",
      reason: "source_not_active"
    };
  }

  if (to.status !== "active") {
    return {
      ok: false,
      error: "TARGET_NOT_ACTIVE",
      reason: "target_not_active"
    };
  }

  if (from.currency !== currency || to.currency !== currency) {
    return {
      ok: false,
      error: "CURRENCY_MISMATCH",
      reason: "currency_mismatch"
    };
  }

  if (from.source_allowed !== true) {
    return {
      ok: false,
      error: "SOURCE_NOT_ALLOWED",
      reason: "source_not_allowed"
    };
  }

  if (to.spend_allowed !== true) {
    return {
      ok: false,
      error: "TARGET_NOT_ALLOWED",
      reason: "target_not_allowed"
    };
  }

  if (from.street_exposed === true && to.street_exposed !== true) {
    return {
      ok: false,
      error: "STREET_TO_REAL_BLOCKED",
      reason: "street_to_real_blocked"
    };
  }

  if (amountCents <= 0) {
    return {
      ok: false,
      error: "INVALID_AMOUNT",
      reason: "policy_block"
    };
  }

  if (amountCents > Number(from.balance_cents || 0)) {
    return {
      ok: false,
      error: "INSUFFICIENT_SOURCE_BALANCE",
      reason: "insufficient_source_balance"
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

async function readTopup(env, topupId) {
  const id = cleanText(topupId);
  if (!id) return null;
  return readJsonKey(env, "value-topup:" + id);
}

async function readValueSurface(env, surfaceId) {
  const id = cleanText(surfaceId);
  if (!id) return null;
  return readJsonKey(env, "value-surface:" + id);
}

async function readDecision(env, decisionId) {
  const id = cleanText(decisionId);
  if (!id) return null;
  return readJsonKey(env, "value-topup-decision:" + id);
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

function normalizeSurface(surface, fallbackId) {
  return {
    ...surface,
    id: cleanText(surface.id || surface.surface_id || surface.surfaceId || fallbackId),
    identity_id: cleanText(surface.identity_id || surface.identityId || ""),
    status: cleanText(surface.status || "active").toLowerCase(),
    currency: cleanText(surface.currency || "USD").toUpperCase(),
    balance_cents: Number(surface.balance_cents || 0),
    source_allowed: surface.source_allowed === true,
    spend_allowed: surface.spend_allowed === true,
    street_exposed: surface.street_exposed === true,
    real_account_exposed: false
  };
}

function cleanDecisionForReturn(decision) {
  return {
    id: decision.id,
    decision_id: decision.decision_id || decision.id,
    value_topup_id: decision.value_topup_id,
    identity_id: decision.identity_id,
    decision: decision.decision,
    status: decision.status,
    reason: decision.reason,
    from_surface_id: decision.from_surface_id,
    to_surface_id: decision.to_surface_id,
    amount_cents: Number(decision.amount_cents || 0),
    currency: decision.currency || "USD",
    approved: decision.approved === true,
    blocked: decision.blocked === true,
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
