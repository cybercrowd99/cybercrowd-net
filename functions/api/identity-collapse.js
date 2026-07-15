/**
 * functions/api/identity-collapse.js
 *
 * CyberCrowd Identity Collapse
 *
 * ONE JOB:
 * Record the approved identity collapse state without erasing history.
 *
 * This is NOT identity-turnstile.js.
 * This is NOT identity-collapse-decision.js.
 * This is NOT hard deletion.
 * This is NOT record erasure.
 * This is NOT payment processing.
 * This is NOT KC custody.
 * This does NOT delete KV records.
 * This does NOT erase history.
 * This does NOT move money.
 * This does NOT charge cards.
 * This does NOT create a PING.
 *
 * identity-turnstile.js says:
 * the human passed the irreversible gate.
 *
 * identity-collapse-decision.js says:
 * collapse was approved.
 *
 * identity-collapse.js says:
 * the identity is now marked collapsed and preserved as history.
 */

const COLLAPSE_TTL_SECONDS = 60 * 60 * 24 * 365;
const DECISION_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_REASON = new Set([
  "approved_collapse",
  "decision_not_approved",
  "decision_missing",
  "identity_mismatch",
  "already_collapsed",
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

  const decisionId = cleanText(
    firstDefined(
      body.identity_collapse_decision_id,
      body.identityCollapseDecisionId,
      body.decision_id,
      body.decisionId,
      body.id
    )
  );

  if (!decisionId) {
    return json({ ok: false, error: "IDENTITY_COLLAPSE_DECISION_ID_REQUIRED" }, 400);
  }

  const decision = await readDecision(env, decisionId);

  if (!decision) {
    return json({ ok: false, error: "IDENTITY_COLLAPSE_DECISION_NOT_FOUND" }, 404);
  }

  const targetIdentityId = cleanText(decision.identity_id || decision.identityId);
  const actorIdentityId = cleanText(decision.actor_identity_id || decision.actorIdentityId);

  if (targetIdentityId !== sessionIdentityId || actorIdentityId !== sessionIdentityId) {
    return json({ ok: false, error: "IDENTITY_COLLAPSE_ACCESS_DENIED" }, 403);
  }

  if (decision.collapse_executed === true || decision.identity_collapsed === true) {
    return json(
      {
        ok: false,
        error: "IDENTITY_ALREADY_COLLAPSED",
        identity_collapse_decision_id: decisionId,
        identity_id: targetIdentityId,
        identity_collapsed: true
      },
      409
    );
  }

  if (decision.approved !== true || cleanText(decision.decision || decision.status).toLowerCase() !== "approved") {
    return json(
      {
        ok: false,
        error: "IDENTITY_COLLAPSE_DECISION_NOT_APPROVED",
        identity_collapse_decision_id: decisionId,
        identity_id: targetIdentityId,
        approved: decision.approved === true,
        status: cleanText(decision.status || ""),
        decision: cleanText(decision.decision || "")
      },
      409
    );
  }

  const now = new Date().toISOString();
  const collapseId =
    cleanText(
      firstDefined(
        body.identity_collapse_id,
        body.identityCollapseId,
        body.collapse_id,
        body.collapseId
      )
    ) || makeId("IDENTITY_COLLAPSE");

  const turnstileId = cleanText(
    decision.identity_turnstile_id ||
      decision.turnstile_id ||
      decision.turnstileId ||
      ""
  );

  const reason = normalizeReason(
    firstDefined(
      body.reason,
      body.collapse_reason,
      body.collapseReason,
      "approved_collapse"
    )
  );

  const collapse = {
    id: collapseId,
    identity_collapse_id: collapseId,
    collapse_id: collapseId,

    identity_collapse_decision_id: decisionId,
    identity_turnstile_id: turnstileId || null,

    identity_id: targetIdentityId,
    actor_identity_id: sessionIdentityId,

    status: "collapsed",
    reason,

    collapse_requested: true,
    collapse_decided: true,
    collapse_executed: true,

    identity_collapsed: true,
    identity_deleted: false,
    records_erased: false,
    history_preserved: true,

    login_disabled: true,
    public_visibility_disabled: true,
    new_activity_disabled: true,
    recovery_required_for_reactivation: true,

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

  const updatedDecision = {
    ...decision,
    identity_collapse_id: collapse.id,
    collapse_id: collapse.id,
    collapse_executed: true,
    identity_collapsed: true,
    identity_deleted: false,
    records_erased: false,
    history_preserved: true,
    login_disabled: true,
    public_visibility_disabled: true,
    new_activity_disabled: true,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    updated_at: now
  };

  await env.IDENTITY.put("identity-collapse:" + collapse.id, JSON.stringify(collapse), {
    expirationTtl: COLLAPSE_TTL_SECONDS
  });

  await env.IDENTITY.put("identity-collapse-decision:" + decisionId, JSON.stringify(updatedDecision), {
    expirationTtl: DECISION_TTL_SECONDS
  });

  await env.IDENTITY.put("identity-collapse-state:" + targetIdentityId, JSON.stringify({
    identity_id: targetIdentityId,
    identity_collapse_id: collapse.id,
    identity_collapse_decision_id: decisionId,
    identity_turnstile_id: turnstileId || null,
    status: "collapsed",
    identity_collapsed: true,
    identity_deleted: false,
    records_erased: false,
    history_preserved: true,
    login_disabled: true,
    public_visibility_disabled: true,
    new_activity_disabled: true,
    recovery_required_for_reactivation: true,
    collapsed_at: now,
    updated_at: now
  }), {
    expirationTtl: COLLAPSE_TTL_SECONDS
  });

  await appendIndex(env, "identity-collapse:index:identity:" + targetIdentityId, collapse.id);
  await appendIndex(env, "identity-collapse:index:actor:" + sessionIdentityId, collapse.id);
  await appendIndex(env, "identity-collapse:index:decision:" + decisionId, collapse.id);
  await appendIndex(env, "identity-collapse:index:status:collapsed", collapse.id);
  await appendIndex(env, "identity-collapse:index:reason:" + reason, collapse.id);

  await appendSync(env, targetIdentityId, {
    type: "identity_collapsed",
    identity_collapse_id: collapse.id,
    identity_collapse_decision_id: decisionId,
    identity_turnstile_id: turnstileId || null,
    actor_identity_id: sessionIdentityId,
    status: "collapsed",
    reason,
    identity_deleted: false,
    records_erased: false,
    history_preserved: true,
    login_disabled: true,
    public_visibility_disabled: true,
    new_activity_disabled: true,
    at: now
  });

  await appendSync(env, sessionIdentityId, {
    type: "actor_identity_collapse_executed",
    identity_collapse_id: collapse.id,
    identity_collapse_decision_id: decisionId,
    target_identity_id: targetIdentityId,
    status: "collapsed",
    reason,
    identity_deleted: false,
    records_erased: false,
    history_preserved: true,
    at: now
  });

  return json({
    ok: true,
    created: true,
    identity_collapse_id: collapse.id,
    identity_collapse_decision_id: decisionId,
    identity_turnstile_id: turnstileId || null,
    identity_id: targetIdentityId,
    actor_identity_id: sessionIdentityId,
    status: "collapsed",
    reason,
    collapse_requested: true,
    collapse_decided: true,
    collapse_executed: true,
    identity_collapsed: true,
    identity_deleted: false,
    records_erased: false,
    history_preserved: true,
    login_disabled: true,
    public_visibility_disabled: true,
    new_activity_disabled: true,
    recovery_required_for_reactivation: true,
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

  const sessionIdentityId = getIdentityIdFromSession(session);

  if (!sessionIdentityId) {
    return json({ ok: false, error: "SESSION_IDENTITY_MISSING" }, 401);
  }

  const url = new URL(request.url);

  const collapseId = cleanText(
    url.searchParams.get("identity_collapse_id") ||
      url.searchParams.get("identityCollapseId") ||
      url.searchParams.get("collapse_id") ||
      url.searchParams.get("collapseId") ||
      url.searchParams.get("id")
  );

  if (collapseId) {
    const collapse = await readCollapse(env, collapseId);

    if (!collapse) {
      return json({ ok: false, error: "IDENTITY_COLLAPSE_NOT_FOUND" }, 404);
    }

    if (
      cleanText(collapse.identity_id || collapse.identityId) !== sessionIdentityId &&
      cleanText(collapse.actor_identity_id || collapse.actorIdentityId) !== sessionIdentityId
    ) {
      return json({ ok: false, error: "IDENTITY_COLLAPSE_ACCESS_DENIED" }, 403);
    }

    return json({
      ok: true,
      identity_collapse: cleanCollapseForReturn(collapse)
    });
  }

  const state = await readJsonKey(env, "identity-collapse-state:" + sessionIdentityId);
  const ids = await readIndex(env, "identity-collapse:index:identity:" + sessionIdentityId);
  const collapses = [];

  for (const id of ids) {
    const collapse = await readCollapse(env, id);

    if (!collapse) continue;

    const identityId = cleanText(collapse.identity_id || collapse.identityId);
    const actorId = cleanText(collapse.actor_identity_id || collapse.actorIdentityId);

    if (identityId !== sessionIdentityId && actorId !== sessionIdentityId) continue;

    collapses.push(cleanCollapseForReturn(collapse));
  }

  return json({
    ok: true,
    identity_id: sessionIdentityId,
    collapse_state: state
      ? cleanCollapseStateForReturn(state)
      : {
          identity_id: sessionIdentityId,
          identity_collapsed: false,
          identity_deleted: false,
          records_erased: false
        },
    count: collapses.length,
    identity_collapses: collapses,
    identity_deleted: false,
    records_erased: false,
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

async function readDecision(env, decisionId) {
  const id = cleanText(decisionId);

  if (!id) return null;

  return readJsonKey(env, "identity-collapse-decision:" + id);
}

async function readCollapse(env, collapseId) {
  const id = cleanText(collapseId);

  if (!id) return null;

  return readJsonKey(env, "identity-collapse:" + id);
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

function cleanCollapseForReturn(collapse) {
  return {
    id: collapse.id,
    identity_collapse_id: collapse.identity_collapse_id || collapse.id,
    identity_collapse_decision_id: collapse.identity_collapse_decision_id,
    identity_turnstile_id: collapse.identity_turnstile_id || null,
    identity_id: collapse.identity_id,
    actor_identity_id: collapse.actor_identity_id,
    status: collapse.status || "collapsed",
    reason: collapse.reason,
    collapse_requested: collapse.collapse_requested === true,
    collapse_decided: collapse.collapse_decided === true,
    collapse_executed: collapse.collapse_executed === true,
    identity_collapsed: collapse.identity_collapsed === true,
    identity_deleted: false,
    records_erased: false,
    history_preserved: collapse.history_preserved === true,
    login_disabled: collapse.login_disabled === true,
    public_visibility_disabled: collapse.public_visibility_disabled === true,
    new_activity_disabled: collapse.new_activity_disabled === true,
    recovery_required_for_reactivation: collapse.recovery_required_for_reactivation === true,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    note: collapse.note || null,
    created_at: collapse.created_at || null,
    updated_at: collapse.updated_at || null
  };
}

function cleanCollapseStateForReturn(state) {
  return {
    identity_id: state.identity_id,
    identity_collapse_id: state.identity_collapse_id,
    identity_collapse_decision_id: state.identity_collapse_decision_id,
    identity_turnstile_id: state.identity_turnstile_id || null,
    status: state.status || "collapsed",
    identity_collapsed: state.identity_collapsed === true,
    identity_deleted: false,
    records_erased: false,
    history_preserved: state.history_preserved === true,
    login_disabled: state.login_disabled === true,
    public_visibility_disabled: state.public_visibility_disabled === true,
    new_activity_disabled: state.new_activity_disabled === true,
    recovery_required_for_reactivation: state.recovery_required_for_reactivation === true,
    collapsed_at: state.collapsed_at || null,
    updated_at: state.updated_at || null
  };
}

function normalizeReason(value) {
  const clean = cleanText(value || "approved_collapse").toLowerCase();

  if (ALLOWED_REASON.has(clean)) {
    return clean;
  }

  return "other";
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
