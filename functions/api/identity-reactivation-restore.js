/**
 * functions/api/identity-reactivation-restore.js
 *
 * CyberCrowd Identity Reactivation Restore
 *
 * ONE JOB:
 * Restore an approved collapsed identity back to active state.
 *
 * This is NOT identity-reactivation.js.
 * This is NOT identity-reactivation-decision.js.
 * This is NOT identity-collapse.js.
 * This does NOT erase collapse history.
 * This does NOT delete records.
 * This does NOT process payments.
 * This does NOT charge cards.
 * This does NOT create a PING.
 *
 * identity-reactivation.js says:
 * the collapsed identity requested review.
 *
 * identity-reactivation-decision.js says:
 * the request was approved.
 *
 * identity-reactivation-restore.js says:
 * the identity is active again, with history preserved.
 */

const RESTORE_TTL_SECONDS = 60 * 60 * 24 * 365;
const DECISION_TTL_SECONDS = 60 * 60 * 24 * 365;
const REACTIVATION_TTL_SECONDS = 60 * 60 * 24 * 365;
const STATE_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_REASON = new Set([
  "approved_restore",
  "manual_restore",
  "appeal_granted",
  "recovery_complete",
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
      body.identity_reactivation_decision_id,
      body.identityReactivationDecisionId,
      body.decision_id,
      body.decisionId,
      body.id
    )
  );

  if (!decisionId) {
    return json({ ok: false, error: "IDENTITY_REACTIVATION_DECISION_ID_REQUIRED" }, 400);
  }

  const decision = await readDecision(env, decisionId);

  if (!decision) {
    return json({ ok: false, error: "IDENTITY_REACTIVATION_DECISION_NOT_FOUND" }, 404);
  }

  const targetIdentityId = cleanText(decision.identity_id || decision.identityId);
  const actorIdentityId = cleanText(decision.actor_identity_id || decision.actorIdentityId);

  if (targetIdentityId !== sessionIdentityId || actorIdentityId !== sessionIdentityId) {
    return json({ ok: false, error: "IDENTITY_REACTIVATION_RESTORE_ACCESS_DENIED" }, 403);
  }

  if (decision.identity_reactivated === true || decision.login_restored === true) {
    return json(
      {
        ok: false,
        error: "IDENTITY_ALREADY_REACTIVATED",
        identity_reactivation_decision_id: decisionId,
        identity_id: targetIdentityId,
        identity_reactivated: true
      },
      409
    );
  }

  if (decision.approved !== true || cleanText(decision.decision || decision.status).toLowerCase() !== "approved") {
    return json(
      {
        ok: false,
        error: "IDENTITY_REACTIVATION_DECISION_NOT_APPROVED",
        identity_reactivation_decision_id: decisionId,
        identity_id: targetIdentityId,
        approved: decision.approved === true,
        status: cleanText(decision.status || ""),
        decision: cleanText(decision.decision || "")
      },
      409
    );
  }

  const collapseState = await readJsonKey(env, "identity-collapse-state:" + targetIdentityId);

  if (!collapseState || collapseState.identity_collapsed !== true) {
    return json(
      {
        ok: false,
        error: "IDENTITY_COLLAPSE_STATE_MISSING",
        identity_id: targetIdentityId
      },
      409
    );
  }

  const reactivationId = cleanText(
    decision.identity_reactivation_id ||
      decision.reactivation_id ||
      decision.reactivationId ||
      ""
  );

  const reactivation = reactivationId
    ? await readReactivation(env, reactivationId)
    : null;

  const now = new Date().toISOString();

  const restoreId =
    cleanText(
      firstDefined(
        body.identity_reactivation_restore_id,
        body.identityReactivationRestoreId,
        body.restore_id,
        body.restoreId
      )
    ) || makeId("IDENTITY_REACTIVATION_RESTORE");

  const reason = normalizeReason(
    firstDefined(
      body.reason,
      body.restore_reason,
      body.restoreReason,
      "approved_restore"
    )
  );

  const restore = {
    id: restoreId,
    identity_reactivation_restore_id: restoreId,
    restore_id: restoreId,

    identity_id: targetIdentityId,
    actor_identity_id: sessionIdentityId,

    identity_reactivation_id: reactivationId || null,
    identity_reactivation_decision_id: decisionId,

    identity_collapse_id: cleanText(decision.identity_collapse_id || collapseState.identity_collapse_id || ""),
    identity_collapse_decision_id: cleanText(decision.identity_collapse_decision_id || collapseState.identity_collapse_decision_id || ""),
    identity_turnstile_id: cleanText(decision.identity_turnstile_id || collapseState.identity_turnstile_id || ""),

    status: "active",
    reason,

    identity_collapsed: false,
    identity_reactivated: true,
    login_restored: true,
    public_visibility_restored: true,
    new_activity_restored: true,

    collapse_history_preserved: true,
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

  const restoredState = {
    identity_id: targetIdentityId,
    status: "active",

    identity_reactivation_restore_id: restore.id,
    identity_reactivation_id: reactivationId || null,
    identity_reactivation_decision_id: decisionId,

    previous_identity_collapse_id: cleanText(collapseState.identity_collapse_id || ""),
    previous_identity_collapse_decision_id: cleanText(collapseState.identity_collapse_decision_id || ""),
    previous_identity_turnstile_id: cleanText(collapseState.identity_turnstile_id || ""),

    identity_collapsed: false,
    identity_reactivated: true,
    identity_deleted: false,
    records_erased: false,
    history_preserved: true,

    login_disabled: false,
    public_visibility_disabled: false,
    new_activity_disabled: false,
    recovery_required_for_reactivation: false,

    restored_at: now,
    updated_at: now
  };

  const updatedDecision = {
    ...decision,
    identity_reactivation_restore_id: restore.id,
    restore_id: restore.id,
    identity_reactivated: true,
    login_restored: true,
    public_visibility_restored: true,
    new_activity_restored: true,
    identity_collapsed: false,
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

  await env.IDENTITY.put("identity-reactivation-restore:" + restore.id, JSON.stringify(restore), {
    expirationTtl: RESTORE_TTL_SECONDS
  });

  await env.IDENTITY.put("identity-reactivation-decision:" + decisionId, JSON.stringify(updatedDecision), {
    expirationTtl: DECISION_TTL_SECONDS
  });

  if (reactivation) {
    const updatedReactivation = {
      ...reactivation,
      identity_reactivation_restore_id: restore.id,
      restore_id: restore.id,
      identity_reactivated: true,
      login_restored: true,
      public_visibility_restored: true,
      new_activity_restored: true,
      identity_collapsed: false,
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

    await env.IDENTITY.put("identity-reactivation:" + reactivationId, JSON.stringify(updatedReactivation), {
      expirationTtl: REACTIVATION_TTL_SECONDS
    });
  }

  await env.IDENTITY.put("identity-collapse-state:" + targetIdentityId, JSON.stringify(restoredState), {
    expirationTtl: STATE_TTL_SECONDS
  });

  await appendIndex(env, "identity-reactivation-restore:index:identity:" + targetIdentityId, restore.id);
  await appendIndex(env, "identity-reactivation-restore:index:actor:" + sessionIdentityId, restore.id);
  await appendIndex(env, "identity-reactivation-restore:index:decision:" + decisionId, restore.id);
  await appendIndex(env, "identity-reactivation-restore:index:reactivation:" + reactivationId, restore.id);
  await appendIndex(env, "identity-reactivation-restore:index:reason:" + reason, restore.id);

  await appendSync(env, targetIdentityId, {
    type: "identity_reactivation_restored",
    identity_reactivation_restore_id: restore.id,
    identity_reactivation_id: reactivationId || null,
    identity_reactivation_decision_id: decisionId,
    actor_identity_id: sessionIdentityId,
    status: "active",
    reason,
    identity_reactivated: true,
    login_restored: true,
    records_erased: false,
    history_preserved: true,
    at: now
  });

  await appendSync(env, sessionIdentityId, {
    type: "actor_identity_reactivation_restored",
    identity_reactivation_restore_id: restore.id,
    identity_reactivation_decision_id: decisionId,
    target_identity_id: targetIdentityId,
    status: "active",
    reason,
    identity_reactivated: true,
    at: now
  });

  return json({
    ok: true,
    created: true,
    identity_reactivation_restore_id: restore.id,
    identity_reactivation_id: reactivationId || null,
    identity_reactivation_decision_id: decisionId,
    identity_id: targetIdentityId,
    actor_identity_id: sessionIdentityId,
    status: "active",
    reason,
    identity_collapsed: false,
    identity_reactivated: true,
    login_restored: true,
    public_visibility_restored: true,
    new_activity_restored: true,
    history_preserved: true,
    records_erased: false,
    identity_deleted: false,
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

  const restoreId = cleanText(
    url.searchParams.get("identity_reactivation_restore_id") ||
      url.searchParams.get("identityReactivationRestoreId") ||
      url.searchParams.get("restore_id") ||
      url.searchParams.get("restoreId") ||
      url.searchParams.get("id")
  );

  if (restoreId) {
    const restore = await readRestore(env, restoreId);

    if (!restore) {
      return json({ ok: false, error: "IDENTITY_REACTIVATION_RESTORE_NOT_FOUND" }, 404);
    }

    if (
      cleanText(restore.identity_id || restore.identityId) !== sessionIdentityId &&
      cleanText(restore.actor_identity_id || restore.actorIdentityId) !== sessionIdentityId
    ) {
      return json({ ok: false, error: "IDENTITY_REACTIVATION_RESTORE_ACCESS_DENIED" }, 403);
    }

    return json({
      ok: true,
      identity_reactivation_restore: cleanRestoreForReturn(restore)
    });
  }

  const ids = await readIndex(env, "identity-reactivation-restore:index:identity:" + sessionIdentityId);
  const restores = [];

  for (const id of ids) {
    const restore = await readRestore(env, id);

    if (!restore) continue;

    const identityId = cleanText(restore.identity_id || restore.identityId);
    const actorId = cleanText(restore.actor_identity_id || restore.actorIdentityId);

    if (identityId !== sessionIdentityId && actorId !== sessionIdentityId) continue;

    restores.push(cleanRestoreForReturn(restore));
  }

  return json({
    ok: true,
    identity_id: sessionIdentityId,
    count: restores.length,
    identity_reactivation_restores: restores,
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

  return readJsonKey(env, "identity-reactivation-decision:" + id);
}

async function readReactivation(env, reactivationId) {
  const id = cleanText(reactivationId);

  if (!id) return null;

  return readJsonKey(env, "identity-reactivation:" + id);
}

async function readRestore(env, restoreId) {
  const id = cleanText(restoreId);

  if (!id) return null;

  return readJsonKey(env, "identity-reactivation-restore:" + id);
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

function cleanRestoreForReturn(restore) {
  return {
    id: restore.id,
    identity_reactivation_restore_id: restore.identity_reactivation_restore_id || restore.id,
    identity_reactivation_id: restore.identity_reactivation_id || null,
    identity_reactivation_decision_id: restore.identity_reactivation_decision_id,
    identity_id: restore.identity_id,
    actor_identity_id: restore.actor_identity_id,
    status: restore.status || "active",
    reason: restore.reason,
    identity_collapsed: false,
    identity_reactivated: restore.identity_reactivated === true,
    login_restored: restore.login_restored === true,
    public_visibility_restored: restore.public_visibility_restored === true,
    new_activity_restored: restore.new_activity_restored === true,
    history_preserved: restore.history_preserved === true,
    records_erased: false,
    identity_deleted: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    note: restore.note || null,
    created_at: restore.created_at || null,
    updated_at: restore.updated_at || null
  };
}

function normalizeReason(value) {
  const clean = cleanText(value || "approved_restore").toLowerCase();

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
