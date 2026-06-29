/**
 * functions/api/identity-reactivation-decision.js
 *
 * CyberCrowd Identity Reactivation Decision
 *
 * ONE JOB:
 * Approve or block a collapsed identity reactivation request.
 *
 * This is NOT identity-reactivation.js.
 * This is NOT identity-reactivation-restore.js.
 * This is NOT identity-collapse.js.
 * This does NOT restore login.
 * This does NOT restore public visibility.
 * This does NOT erase collapse history.
 * This does NOT delete records.
 * This does NOT process payments.
 * This does NOT create a PING.
 *
 * identity-reactivation.js says:
 * a collapsed identity requested review.
 *
 * identity-reactivation-decision.js says:
 * that reactivation request is approved or blocked.
 *
 * Next worker:
 * identity-reactivation-restore.js restores the approved reactivation state.
 */

const DECISION_TTL_SECONDS = 60 * 60 * 24 * 365;
const REACTIVATION_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_DECISION = new Set([
  "approved",
  "blocked"
]);

const ALLOWED_REASON = new Set([
  "manual_approve",
  "manual_block",
  "identity_not_collapsed",
  "reactivation_not_requested",
  "reactivation_already_decided",
  "identity_mismatch",
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

  const reactivationId = cleanText(
    firstDefined(
      body.identity_reactivation_id,
      body.identityReactivationId,
      body.reactivation_id,
      body.reactivationId,
      body.id
    )
  );

  if (!reactivationId) {
    return json({ ok: false, error: "IDENTITY_REACTIVATION_ID_REQUIRED" }, 400);
  }

  const reactivation = await readReactivation(env, reactivationId);

  if (!reactivation) {
    return json({ ok: false, error: "IDENTITY_REACTIVATION_NOT_FOUND" }, 404);
  }

  const targetIdentityId = cleanText(reactivation.identity_id || reactivation.identityId);
  const actorIdentityId = cleanText(reactivation.actor_identity_id || reactivation.actorIdentityId);

  if (targetIdentityId !== sessionIdentityId || actorIdentityId !== sessionIdentityId) {
    return json({ ok: false, error: "IDENTITY_REACTIVATION_ACCESS_DENIED" }, 403);
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
        error: "IDENTITY_REACTIVATION_DECISION_REQUIRED",
        allowed: Array.from(ALLOWED_DECISION)
      },
      400
    );
  }

  const collapseState = await readJsonKey(env, "identity-collapse-state:" + targetIdentityId);

  const gate = checkDecisionGate({
    requestedDecision,
    reactivation,
    collapseState,
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
        body.identity_reactivation_decision_id,
        body.identityReactivationDecisionId,
        body.decision_id,
        body.decisionId
      )
    ) || makeId("IDENTITY_REACTIVATION_DECISION");

  const decision = {
    id: decisionId,
    identity_reactivation_decision_id: decisionId,
    decision_id: decisionId,

    identity_reactivation_id: reactivationId,

    identity_id: targetIdentityId,
    actor_identity_id: sessionIdentityId,

    identity_collapse_id: cleanText(reactivation.identity_collapse_id || collapseState?.identity_collapse_id || ""),
    identity_collapse_decision_id: cleanText(reactivation.identity_collapse_decision_id || collapseState?.identity_collapse_decision_id || ""),
    identity_turnstile_id: cleanText(reactivation.identity_turnstile_id || collapseState?.identity_turnstile_id || ""),

    decision: finalDecision,
    status: finalDecision,
    reason,

    gate_ok: gate.ok === true,
    gate_error: gate.error || null,
    gate_reason: gate.reason || null,

    requested: true,
    decided: true,
    approved: finalDecision === "approved",
    blocked: finalDecision === "blocked",

    identity_collapsed: collapseState?.identity_collapsed === true,
    identity_reactivated: false,
    login_restored: false,
    public_visibility_restored: false,
    new_activity_restored: false,
    history_preserved: true,
    records_erased: false,
    identity_deleted: false,

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

  const updatedReactivation = {
    ...reactivation,
    identity_reactivation_decision_id: decision.id,
    decision_id: decision.id,
    decision: finalDecision,
    status: finalDecision,
    reason,
    decided: true,
    approved: finalDecision === "approved",
    blocked: finalDecision === "blocked",
    identity_reactivated: false,
    login_restored: false,
    public_visibility_restored: false,
    new_activity_restored: false,
    history_preserved: true,
    records_erased: false,
    identity_deleted: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    updated_at: now
  };

  await env.IDENTITY.put("identity-reactivation-decision:" + decision.id, JSON.stringify(decision), {
    expirationTtl: DECISION_TTL_SECONDS
  });

  await env.IDENTITY.put("identity-reactivation:" + reactivationId, JSON.stringify(updatedReactivation), {
    expirationTtl: REACTIVATION_TTL_SECONDS
  });

  await appendIndex(env, "identity-reactivation-decision:index:identity:" + targetIdentityId, decision.id);
  await appendIndex(env, "identity-reactivation-decision:index:actor:" + sessionIdentityId, decision.id);
  await appendIndex(env, "identity-reactivation-decision:index:reactivation:" + reactivationId, decision.id);
  await appendIndex(env, "identity-reactivation-decision:index:decision:" + finalDecision, decision.id);
  await appendIndex(env, "identity-reactivation-decision:index:reason:" + reason, decision.id);

  await appendSync(env, targetIdentityId, {
    type: "identity_reactivation_decided",
    identity_reactivation_id: reactivationId,
    identity_reactivation_decision_id: decision.id,
    actor_identity_id: sessionIdentityId,
    decision: finalDecision,
    reason,
    identity_reactivated: false,
    login_restored: false,
    records_erased: false,
    at: now
  });

  await appendSync(env, sessionIdentityId, {
    type: "actor_identity_reactivation_decided",
    identity_reactivation_id: reactivationId,
    identity_reactivation_decision_id: decision.id,
    target_identity_id: targetIdentityId,
    decision: finalDecision,
    reason,
    identity_reactivated: false,
    at: now
  });

  return json({
    ok: true,
    created: true,
    identity_reactivation_decision_id: decision.id,
    identity_reactivation_id: reactivationId,
    identity_id: targetIdentityId,
    actor_identity_id: sessionIdentityId,
    decision: finalDecision,
    status: finalDecision,
    reason,
    requested: true,
    decided: true,
    approved: finalDecision === "approved",
    blocked: finalDecision === "blocked",
    identity_collapsed: collapseState?.identity_collapsed === true,
    identity_reactivated: false,
    login_restored: false,
    public_visibility_restored: false,
    new_activity_restored: false,
    history_preserved: true,
    records_erased: false,
    identity_deleted: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    next: finalDecision === "approved"
      ? {
          route: "/api/identity-reactivation-restore",
          method: "POST",
          reason: "reactivation_approved"
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
    url.searchParams.get("identity_reactivation_decision_id") ||
      url.searchParams.get("identityReactivationDecisionId") ||
      url.searchParams.get("decision_id") ||
      url.searchParams.get("decisionId") ||
      url.searchParams.get("id")
  );

  if (decisionId) {
    const decision = await readDecision(env, decisionId);

    if (!decision) {
      return json({ ok: false, error: "IDENTITY_REACTIVATION_DECISION_NOT_FOUND" }, 404);
    }

    if (
      cleanText(decision.identity_id || decision.identityId) !== sessionIdentityId &&
      cleanText(decision.actor_identity_id || decision.actorIdentityId) !== sessionIdentityId
    ) {
      return json({ ok: false, error: "IDENTITY_REACTIVATION_DECISION_ACCESS_DENIED" }, 403);
    }

    return json({
      ok: true,
      identity_reactivation_decision: cleanDecisionForReturn(decision)
    });
  }

  const reactivationId = cleanText(
    url.searchParams.get("identity_reactivation_id") ||
      url.searchParams.get("identityReactivationId") ||
      url.searchParams.get("reactivation_id") ||
      url.searchParams.get("reactivationId")
  );

  const key = reactivationId
    ? "identity-reactivation-decision:index:reactivation:" + reactivationId
    : "identity-reactivation-decision:index:identity:" + sessionIdentityId;

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
    identity_reactivation_decisions: decisions,
    identity_reactivated: false,
    login_restored: false,
    records_erased: false,
    ping_created: false
  });
}

function checkDecisionGate(input) {
  const requestedDecision = input.requestedDecision;
  const reactivation = input.reactivation;
  const collapseState = input.collapseState;
  const sessionIdentityId = input.sessionIdentityId;

  if (requestedDecision === "blocked") {
    return {
      ok: true,
      reason: "manual_block"
    };
  }

  if (!reactivation) {
    return {
      ok: false,
      error: "REACTIVATION_NOT_REQUESTED",
      reason: "reactivation_not_requested"
    };
  }

  if (reactivation.decided === true || reactivation.identity_reactivation_decision_id) {
    return {
      ok: false,
      error: "REACTIVATION_ALREADY_DECIDED",
      reason: "reactivation_already_decided"
    };
  }

  const identityId = cleanText(reactivation.identity_id || reactivation.identityId);
  const actorId = cleanText(reactivation.actor_identity_id || reactivation.actorIdentityId);

  if (identityId !== sessionIdentityId || actorId !== sessionIdentityId) {
    return {
      ok: false,
      error: "IDENTITY_MISMATCH",
      reason: "identity_mismatch"
    };
  }

  if (!collapseState || collapseState.identity_collapsed !== true) {
    return {
      ok: false,
      error: "IDENTITY_NOT_COLLAPSED",
      reason: "identity_not_collapsed"
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

async function readReactivation(env, reactivationId) {
  const id = cleanText(reactivationId);

  if (!id) return null;

  return readJsonKey(env, "identity-reactivation:" + id);
}

async function readDecision(env, decisionId) {
  const id = cleanText(decisionId);

  if (!id) return null;

  return readJsonKey(env, "identity-reactivation-decision:" + id);
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
    identity_reactivation_decision_id: decision.identity_reactivation_decision_id || decision.id,
    identity_reactivation_id: decision.identity_reactivation_id,
    identity_id: decision.identity_id,
    actor_identity_id: decision.actor_identity_id,
    identity_collapse_id: decision.identity_collapse_id || null,
    identity_collapse_decision_id: decision.identity_collapse_decision_id || null,
    identity_turnstile_id: decision.identity_turnstile_id || null,
    decision: decision.decision,
    status: decision.status,
    reason: decision.reason,
    requested: decision.requested === true,
    decided: decision.decided === true,
    approved: decision.approved === true,
    blocked: decision.blocked === true,
    identity_collapsed: decision.identity_collapsed === true,
    identity_reactivated: false,
    login_restored: false,
    public_visibility_restored: false,
    new_activity_restored: false,
    history_preserved: decision.history_preserved === true,
    records_erased: false,
    identity_deleted: false,
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
