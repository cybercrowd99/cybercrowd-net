/**
 * functions/api/value-spend-decision.js
 *
 * CyberCrowd Value Spend Decision
 *
 * ONE JOB:
 * Approve or block a recorded value spend request.
 *
 * This is NOT value-spend.js.
 * This is NOT value-limit.js.
 * This is NOT value-limit-check.js.
 * This is NOT value-balance.js.
 * This does NOT request spend.
 * This does NOT set limits.
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
 * value-spend-decision.js says:
 * that spend request is approved or blocked.
 *
 * Next worker:
 * value-spend-balance.js applies the approved internal debit.
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
  "surface_not_active",
  "surface_not_spend_allowed",
  "currency_mismatch",
  "insufficient_surface_balance",
  "limit_blocked",
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
        error: "VALUE_SPEND_DECISION_REQUIRED",
        allowed: Array.from(ALLOWED_DECISION)
      },
      400
    );
  }

  const surfaceId = cleanText(
    spend.value_surface_id ||
      spend.surface_id ||
      spend.surfaceId
  );

  const surface = await readValueSurface(env, surfaceId);

  if (!surface) {
    return recordDecision(context, {
      identityId,
      spend,
      surface: null,
      finalDecision: "blocked",
      reason: "surface_not_active",
      gate: {
        ok: false,
        error: "VALUE_SURFACE_NOT_FOUND",
        reason: "surface_not_active"
      },
      note: body.note || body.description
    });
  }

  if (cleanText(surface.identity_id || surface.identityId) !== identityId) {
    return json({ ok: false, error: "VALUE_SURFACE_ACCESS_DENIED" }, 403);
  }

  const normalizedSurface = normalizeSurface(surface, surfaceId);
  const amountCents = Number(spend.amount_cents || 0);
  const currency = cleanText(spend.currency || "USD").toUpperCase();

  const limitCheckId = cleanText(
    body.limit_check_id ||
      body.limitCheckId ||
      spend.limit_check_id ||
      spend.limitCheckId ||
      ""
  );

  const limitCheck = limitCheckId
    ? await readLimitCheck(env, limitCheckId)
    : null;

  if (limitCheckId && !limitCheck) {
    return recordDecision(context, {
      identityId,
      spend,
      surface: normalizedSurface,
      finalDecision: "blocked",
      reason: "limit_blocked",
      gate: {
        ok: false,
        error: "VALUE_LIMIT_CHECK_NOT_FOUND",
        reason: "limit_blocked"
      },
      note: body.note || body.description
    });
  }

  if (limitCheck && cleanText(limitCheck.identity_id || limitCheck.identityId) !== identityId) {
    return json({ ok: false, error: "VALUE_LIMIT_CHECK_ACCESS_DENIED" }, 403);
  }

  if (limitCheck && cleanText(limitCheck.value_surface_id || limitCheck.valueSurfaceId) !== normalizedSurface.id) {
    return recordDecision(context, {
      identityId,
      spend,
      surface: normalizedSurface,
      finalDecision: "blocked",
      reason: "limit_blocked",
      gate: {
        ok: false,
        error: "VALUE_LIMIT_CHECK_SURFACE_MISMATCH",
        reason: "limit_blocked"
      },
      note: body.note || body.description
    });
  }

  const gate = checkDecisionGate({
    requestedDecision,
    spend,
    surface: normalizedSurface,
    limitCheck,
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
    spend,
    surface: normalizedSurface,
    finalDecision,
    reason,
    gate,
    limitCheck,
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
      return json({ ok: false, error: "VALUE_SPEND_DECISION_NOT_FOUND" }, 404);
    }

    if (cleanText(decision.identity_id || decision.identityId) !== identityId) {
      return json({ ok: false, error: "VALUE_SPEND_DECISION_ACCESS_DENIED" }, 403);
    }

    return json({
      ok: true,
      value_spend_decision: cleanDecisionForReturn(decision)
    });
  }

  const spendId = cleanText(
    url.searchParams.get("spend_id") ||
      url.searchParams.get("spendId") ||
      url.searchParams.get("value_spend_id") ||
      url.searchParams.get("valueSpendId")
  );

  const key = spendId
    ? "value-spend-decision:index:spend:" + spendId
    : "value-spend-decision:index:identity:" + identityId;

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
    value_spend_decisions: decisions,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    ping_created: false
  });
}

async function recordDecision(context, input) {
  const { env } = context;

  const identityId = input.identityId;
  const spend = input.spend;
  const surface = input.surface;
  const finalDecision = input.finalDecision;
  const reason = input.reason;
  const gate = input.gate || {};
  const limitCheck = input.limitCheck || null;

  const now = new Date().toISOString();
  const decisionId = makeId("VALUE_SPEND_DECISION");

  const spendId = cleanText(spend.id || spend.spend_id || spend.spendId);
  const surfaceId = cleanText(
    spend.value_surface_id ||
      spend.surface_id ||
      spend.surfaceId ||
      surface?.id ||
      ""
  );

  const decision = {
    id: decisionId,
    decision_id: decisionId,

    value_spend_id: spendId,
    spend_id: spendId,

    identity_id: identityId,
    actor_identity_id: identityId,

    value_surface_id: surfaceId,

    decision: finalDecision,
    status: finalDecision,
    reason,

    gate_ok: gate.ok === true,
    gate_error: gate.error || null,
    gate_reason: gate.reason || null,

    value_limit_check_id: limitCheck?.id || limitCheck?.check_id || null,
    limit_checked: limitCheck ? true : false,
    limit_allowed: limitCheck ? limitCheck.allowed === true : null,

    amount_cents: Number(spend.amount_cents || 0),
    currency: cleanText(spend.currency || "USD").toUpperCase(),

    surface_status: surface?.status || null,
    surface_spend_allowed: surface?.spend_allowed === true,

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

  const updatedSpend = {
    ...spend,
    decision_id: decision.id,
    decision: finalDecision,
    status: finalDecision,
    reason,
    approved: finalDecision === "approved",
    blocked: finalDecision === "blocked",
    decided: true,
    limit_check_id: decision.value_limit_check_id,
    limit_checked: decision.limit_checked,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    updated_at: now
  };

  await env.IDENTITY.put("value-spend-decision:" + decision.id, JSON.stringify(decision), {
    expirationTtl: DECISION_TTL_SECONDS
  });

  await env.IDENTITY.put("value-spend:" + spendId, JSON.stringify(updatedSpend), {
    expirationTtl: DECISION_TTL_SECONDS
  });

  await appendIndex(env, "value-spend-decision:index:identity:" + identityId, decision.id);
  await appendIndex(env, "value-spend-decision:index:spend:" + spendId, decision.id);
  await appendIndex(env, "value-spend-decision:index:surface:" + surfaceId, decision.id);
  await appendIndex(env, "value-spend-decision:index:decision:" + finalDecision, decision.id);
  await appendIndex(env, "value-spend-decision:index:reason:" + reason, decision.id);

  await appendSync(env, identityId, {
    type: "identity_value_spend_decided",
    value_spend_id: spendId,
    value_spend_decision_id: decision.id,
    value_surface_id: surfaceId,
    decision: finalDecision,
    reason,
    amount_cents: decision.amount_cents,
    currency: decision.currency,
    balance_moved: false,
    payment_created: false,
    real_account_exposed: false,
    at: now
  });

  await appendSync(env, spendId, {
    type: "value_spend_decided",
    value_spend_id: spendId,
    value_spend_decision_id: decision.id,
    identity_id: identityId,
    value_surface_id: surfaceId,
    decision: finalDecision,
    reason,
    balance_moved: false,
    at: now
  });

  await appendSync(env, surfaceId, {
    type: "value_surface_spend_decision",
    value_spend_id: spendId,
    value_spend_decision_id: decision.id,
    identity_id: identityId,
    decision: finalDecision,
    reason,
    amount_cents: decision.amount_cents,
    currency: decision.currency,
    balance_moved: false,
    at: now
  });

  return json({
    ok: true,
    created: true,
    value_spend_decision_id: decision.id,
    value_spend_id: spendId,
    identity_id: identityId,
    value_surface_id: surfaceId,
    decision: finalDecision,
    status: finalDecision,
    reason,
    approved: finalDecision === "approved",
    blocked: finalDecision === "blocked",
    limit_checked: decision.limit_checked,
    balance_moved: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    next: finalDecision === "approved"
      ? {
          route: "/api/value-spend-balance",
          method: "POST",
          reason: "spend_approved"
        }
      : null
  });
}

function checkDecisionGate(input) {
  const requestedDecision = input.requestedDecision;
  const surface = input.surface;
  const limitCheck = input.limitCheck;
  const amountCents = input.amountCents;
  const currency = input.currency;

  if (requestedDecision === "blocked") {
    return {
      ok: true,
      reason: "manual_block"
    };
  }

  if (surface.status !== "active") {
    return {
      ok: false,
      error: "SURFACE_NOT_ACTIVE",
      reason: "surface_not_active"
    };
  }

  if (surface.currency !== currency) {
    return {
      ok: false,
      error: "CURRENCY_MISMATCH",
      reason: "currency_mismatch"
    };
  }

  if (surface.spend_allowed !== true) {
    return {
      ok: false,
      error: "SURFACE_NOT_SPEND_ALLOWED",
      reason: "surface_not_spend_allowed"
    };
  }

  if (limitCheck && limitCheck.allowed !== true) {
    return {
      ok: false,
      error: "LIMIT_BLOCKED",
      reason: "limit_blocked"
    };
  }

  if (amountCents <= 0) {
    return {
      ok: false,
      error: "INVALID_AMOUNT",
      reason: "policy_block"
    };
  }

  if (amountCents > Number(surface.balance_cents || 0)) {
    return {
      ok: false,
      error: "INSUFFICIENT_SURFACE_BALANCE",
      reason: "insufficient_surface_balance"
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

async function readSpend(env, spendId) {
  const id = cleanText(spendId);
  if (!id) return null;
  return readJsonKey(env, "value-spend:" + id);
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

async function readDecision(env, decisionId) {
  const id = cleanText(decisionId);
  if (!id) return null;
  return readJsonKey(env, "value-spend-decision:" + id);
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
    spend_allowed: surface.spend_allowed === true,
    real_account_exposed: false
  };
}

function cleanDecisionForReturn(decision) {
  return {
    id: decision.id,
    decision_id: decision.decision_id || decision.id,
    value_spend_id: decision.value_spend_id,
    identity_id: decision.identity_id,
    value_surface_id: decision.value_surface_id,
    decision: decision.decision,
    status: decision.status,
    reason: decision.reason,
    value_limit_check_id: decision.value_limit_check_id || null,
    limit_checked: decision.limit_checked === true,
    limit_allowed: decision.limit_allowed,
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
