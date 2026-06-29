/**
 * functions/api/identity-collapse-decision.js
 *
 * CyberCrowd Identity Collapse Decision
 *
 * ONE JOB:
 * Approve or block an identity collapse request after the turnstile gate.
 *
 * This is NOT identity-turnstile.js.
 * This is NOT account deletion.
 * This is NOT identity collapse execution.
 * This is NOT payment processing.
 * This is NOT KC custody.
 * This does NOT delete identity records.
 * This does NOT erase history.
 * This does NOT move money.
 * This does NOT charge cards.
 * This does NOT create a PING.
 *
 * identity-turnstile.js says:
 * the human passed or failed the irreversible gate.
 *
 * identity-collapse-decision.js says:
 * the collapse request is approved or blocked.
 *
 * Next worker:
 * identity-collapse.js records the approved collapse state without erasing history.
 */

const DECISION_TTL_SECONDS = 60 * 60 * 24 * 365;
const TURNSTILE_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_DECISION = new Set([
  "approved",
  "blocked"
]);

const ALLOWED_REASON = new Set([
  "manual_approve",
  "manual_block",
  "turnstile_not_passed",
  "turnstile_missing",
  "identity_mismatch",
  "turnstile_already_used",
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

  const sessionIdentityId = getIdentityIdFromSession(session);

  if (!sessionIdentityId) {
    return json({ ok: false, error: "SESSION_IDENTITY_MISSING" }, 401);
  }

  const body = await readRequestJson(request);

  if (!body) {
    return json({ ok: false, error: "JSON_REQUIRED" }, 400);
  }

  const turnstileId = cleanText(
    firstDefined(
      body.identity_turnstile_id,
      body.identityTurnstileId,
      body.turnstile_id,
      body.turnstileId,
      body.id
    )
  );

  if (!turnstileId) {
    return json({ ok: false, error: "IDENTITY_TURNSTILE_ID_REQUIRED" }, 400);
  }

  const turnstile = await readTurnstile(env, turnstileId);

  if (!turnstile) {
    return json({ ok: false, error: "IDENTITY_TURNSTILE_NOT_FOUND" }, 404);
  }

  const targetIdentityId = cleanText(turnstile.identity_id || turnstile.identityId);
  const actorIdentityId = cleanText(turnstile.actor_identity_id || turnstile.actorIdentityId);

  if (targetIdentityId !== sessionIdentityId || actorIdentityId !== sessionIdentityId) {
    return json({ ok: false, error: "IDENTITY_COLLAPSE_ACCESS_DENIED" }, 403);
  }

  const requestedDecision = normalizeDecision(
    firstDefined(
      body.decision,
      body.status,
      body.result,
      ""
    )
  );

  if (!requestedDecision) {
    return json(
      {
        ok: false,
        error: "IDENTITY_COLLAPSE_DECISION_REQUIRED",
        allowed: Array.from(ALLOWED_DECISION)
      },
      400
    );
  }

  const gate = checkDecisionGate({
    requestedDecision,
    turnstile,
    sessionIdentityId
  });

  const finalDecision = gate.ok ? requestedDecision : "blocked";
  const reason = normalizeReason(
    firstDefined(
      body.reason,
      body.decision_reason,
      body.decisionReason,
      gate.reason,
      defaultReason(finalDecision)
    )
  );

  const now = new Date().toISOString();
  const decisionId =
    cleanText(
      firstDefined(
        body.identity_collapse_decision_id,
        body.identityCollapseDecisionId,
        body.decision_id,
        body.decisionId
      )
    ) || makeId("IDENTITY_COLLAPSE_DECISION");

  const decision = {
    id: decisionId,
    identity_collapse_decision_id: decisionId,
    decision_id: decisionId,

    identity_turnstile_id: turnstileId,

    identity_id: targetIdentityId,
    actor_identity_id: sessionIdentityId,

    decision: finalDecision,
    status: finalDecision,
    reason,

    gate_ok: gate.ok === true,
    gate_error: gate.error || null,
    gate_reason: gate.reason || null,

    turnstile_passed: turnstile.gate_passed === true,
    turnstile_status: cleanText(turnstile.status || ""),
    turnstile_reason: cleanText(turnstile.reason || ""),

    approved: finalDecision === "approved",
    blocked: finalDecision === "blocked",

    collapse_requested: true,
    collapse_decided: true,
    collapse_executed: false,
    identity_deleted: false,
    identity_collapsed: false,
    records_erased: false,
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

  const updatedTurnstile = {
    ...turnstile,
    identity_collapse_decision_id: decision.id,
    decision_id: decision.id,
    collapse_requested: true,
    collapse_decided: true,
    collapse_decision: finalDecision,
    collapse_reason: reason,
    collapse_executed: false,
    identity_deleted: false,
    identity_collapsed: false,
    records_erased: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    updated_at: now
  };

  await env.IDENTITY.put("identity-collapse-decision:" + decision.id, JSON.stringify(decision), {
    expirationTtl: DECISION_TTL_SECONDS
  });

  await env.IDENTITY.put("identity-turnstile:" + turnstileId, JSON.stringify(updatedTurnstile), {
    expirationTtl: TURNSTILE_TTL_SECONDS
  });

  await appendIndex(env, "identity-collapse-decision:index:identity:" + targetIdentityId, decision.id);
  await appendIndex(env, "identity-collapse-decision:index:actor:" + sessionIdentityId, decision.id);
  await appendIndex(env, "identity-collapse-decision:index:turnstile:" + turnstileId, decision.id);
  await appendIndex(env, "identity-collapse-decision:index:decision:" + finalDecision, decision.id);
  await appendIndex(env, "identity-collapse-decision:index:reason:" + reason, decision.id);

  await appendSync(env, targetIdentityId, {
    type: "identity_collapse_decided",
    identity_collapse_decision_id: decision.id,
    identity_turnstile_id: turnstileId,
    actor_identity_id: sessionIdentityId,
    decision: finalDecision,
    reason,
    collapse_executed: false,
    identity_deleted: false,
    records_erased: false,
    at: now
  });

  await appendSync(env, sessionIdentityId, {
    type: "actor_identity_collapse_decided",
    identity_collapse_decision_id: decision.id,
    identity_turnstile_id: turnstileId,
    target_identity_id: targetIdentityId,
    decision: finalDecision,
    reason,
    collapse_executed: false,
    identity_deleted: false,
    at: now
  });

  return json({
    ok: true,
    created: true,
    identity_collapse_decision_id: decision.id,
    identity_turnstile_id: turnstileId,
    identity_id: targetIdentityId,
    actor_identity_id: sessionIdentityId,
    decision: finalDecision,
    status: finalDecision,
    reason,
    approved: finalDecision === "approved",
    blocked: finalDecision === "blocked",
    collapse_requested: true,
    collapse_decided: true,
    collapse_executed: false,
    identity_deleted: false,
    identity_collapsed: false,
    records_erased: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    next: finalDecision === "approved"
      ? {
          route: "/api/identity-collapse",
          method: "POST",
          reason: "identity_collapse_approved"
        }
      : null
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

  const sessionIdentityId = getIdentityIdFromSession(session);

  if (!sessionIdentityId) {
    return json({ ok: false, error: "SESSION_IDENTITY_MISSING" }, 401);
  }

  const url = new URL(request.url);

  const decisionId = cleanText(
    url.searchParams.get("identity_collapse_decision_id") ||
      url.searchParams.get("identityCollapseDecisionId") ||
      url.searchParams.get("decision_id") ||
      url.searchParams.get("decisionId") ||
      url.searchParams.get("id")
  );

  if (decisionId) {
    const decision = await readDecision(env, decisionId);

    if (!decision) {
      return json({ ok: false, error: "IDENTITY_COLLAPSE_DECISION_NOT_FOUND" }, 404);
    }

    if (
      cleanText(decision.identity_id || decision.identityId) !== sessionIdentityId &&
      cleanText(decision.actor_identity_id || decision.actorIdentityId) !== sessionIdentityId
    ) {
      return json({ ok: false, error: "IDENTITY_COLLAPSE_DECISION_ACCESS_DENIED" }, 403);
    }

    return json({
      ok: true,
      identity_collapse_decision: cleanDecisionForReturn(decision)
    });
  }

  const turnstileId = cleanText(
    url.searchParams.get("identity_turnstile_id") ||
      url.searchParams.get("identityTurnstileId") ||
      url.searchParams.get("turnstile_id") ||
      url.searchParams.get("turnstileId")
  );

  const key = turnstileId
    ? "identity-collapse-decision:index:turnstile:" + turnstileId
    : "identity-collapse-decision:index:identity:" + sessionIdentityId;

  const ids = await readIndex(env, key);
  const decisions = [];

  for (const id of ids) {
    const decision = await readDecision(env, id);

    if (!decision) continue;

    const identityId = cleanText(decision.identity_id || decision.identityId);
    const actorId = cleanText(decision.actor_identity_id || decision.actorIdentityId);

    if (identityId !== sessionIdentityId && actorId !== sessionIdentityId) continue;

    decisions.push(cleanDecisionForReturn(decision));
  }

  return json({
    ok: true,
    identity_id: sessionIdentityId,
    count: decisions.length,
    identity_collapse_decisions: decisions,
    collapse_executed: false,
    identity_deleted: false,
    records_erased: false,
    ping_created: false
  });
}

function checkDecisionGate(input) {
  const requestedDecision = input.requestedDecision;
  const turnstile = input.turnstile;
  const sessionIdentityId = input.sessionIdentityId;

  if (requestedDecision === "blocked") {
    return {
      ok: true,
      reason: "manual_block"
    };
  }

  if (!turnstile) {
    return {
      ok: false,
      error: "TURNSTILE_MISSING",
      reason: "turnstile_missing"
    };
  }

  const turnstileIdentityId = cleanText(turnstile.identity_id || turnstile.identityId);
  const actorIdentityId = cleanText(turnstile.actor_identity_id || turnstile.actorIdentityId);

  if (turnstileIdentityId !== sessionIdentityId || actorIdentityId !== sessionIdentityId) {
    return {
      ok: false,
      error: "IDENTITY_MISMATCH",
      reason: "identity_mismatch"
    };
  }

  if (turnstile.collapse_decided === true || turnstile.identity_collapse_decision_id) {
    return {
      ok: false,
      error: "TURNSTILE_ALREADY_USED",
      reason: "turnstile_already_used"
    };
  }

  if (turnstile.gate_passed !== true || cleanText(turnstile.status || "").toLowerCase() !== "passed") {
    return {
      ok: false,
      error: "TURNSTILE_NOT_PASSED",
      reason: "turnstile_not_passed"
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

async function readTurnstile(env, turnstileId) {
  const id = cleanText(turnstileId);

  if (!id) return null;

  return readJsonKey(env, "identity-turnstile:" + id);
}

async function readDecision(env, decisionId) {
  const id = cleanText(decisionId);

  if (!id) return null;

  return readJsonKey(env, "identity-collapse-decision:" + id);
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
    identity_collapse_decision_id: decision.identity_collapse_decision_id || decision.id,
    identity_turnstile_id: decision.identity_turnstile_id,
    identity_id: decision.identity_id,
    actor_identity_id: decision.actor_identity_id,
    decision: decision.decision,
    status: decision.status,
    reason: decision.reason,
    gate_ok: decision.gate_ok === true,
    gate_error: decision.gate_error || null,
    turnstile_passed: decision.turnstile_passed === true,
    approved: decision.approved === true,
    blocked: decision.blocked === true,
    collapse_requested: decision.collapse_requested === true,
    collapse_decided: decision.collapse_decided === true,
    collapse_executed: false,
    identity_deleted: false,
    identity_collapsed: false,
    records_erased: false,
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
