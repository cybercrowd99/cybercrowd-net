/**
 * functions/api/identity-reactivation.js
 *
 * CyberCrowd Identity Reactivation
 *
 * ONE JOB:
 * Record a request to reactivate a collapsed identity.
 *
 * This is NOT identity-collapse.js.
 * This is NOT identity-collapse-decision.js.
 * This is NOT identity-turnstile.js.
 * This is NOT account restore.
 * This is NOT deletion reversal.
 * This does NOT reopen login.
 * This does NOT restore visibility.
 * This does NOT erase collapse history.
 * This does NOT process payments.
 * This does NOT create a PING.
 *
 * identity-collapse.js says:
 * the identity was collapsed and preserved.
 *
 * identity-reactivation.js says:
 * this identity is asking to be reviewed for reactivation.
 *
 * Next worker:
 * identity-reactivation-decision.js approves or blocks the reactivation request.
 */

const REACTIVATION_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_INDEX_ITEMS = 100;

const REQUIRED_CONFIRMATION = "I understand this reactivation requires review";

const ALLOWED_STATUS = new Set([
  "requested",
  "cancelled"
]);

const ALLOWED_REASON = new Set([
  "manual",
  "mistake",
  "returning_member",
  "recovery",
  "appeal",
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

  const targetIdentityId = cleanText(
    firstDefined(
      body.identity_id,
      body.identityId,
      body.target_identity_id,
      body.targetIdentityId,
      body.id,
      sessionIdentityId
    )
  );

  if (!targetIdentityId) {
    return json({ ok: false, error: "IDENTITY_ID_REQUIRED" }, 400);
  }

  if (targetIdentityId !== sessionIdentityId) {
    return json({ ok: false, error: "IDENTITY_REACTIVATION_ACCESS_DENIED" }, 403);
  }

  const collapseState = await readJsonKey(env, "identity-collapse-state:" + targetIdentityId);

  if (!collapseState || collapseState.identity_collapsed !== true) {
    return json(
      {
        ok: false,
        error: "IDENTITY_NOT_COLLAPSED",
        identity_id: targetIdentityId,
        identity_collapsed: false
      },
      409
    );
  }

  const confirmation = cleanText(
    firstDefined(
      body.confirm,
      body.confirmation,
      body.confirmation_phrase,
      body.confirmationPhrase
    )
  );

  if (confirmation !== REQUIRED_CONFIRMATION) {
    return json(
      {
        ok: false,
        error: "REACTIVATION_CONFIRMATION_INVALID",
        required_confirmation: REQUIRED_CONFIRMATION
      },
      400
    );
  }

  const status = normalizeStatus(firstDefined(body.status, "requested"));

  if (!status) {
    return json(
      {
        ok: false,
        error: "IDENTITY_REACTIVATION_STATUS_NOT_ALLOWED",
        allowed: Array.from(ALLOWED_STATUS)
      },
      400
    );
  }

  const reason = normalizeReason(
    firstDefined(
      body.reason,
      body.reactivation_reason,
      body.reactivationReason,
      "manual"
    )
  );

  const now = new Date().toISOString();

  const reactivationId =
    cleanText(
      firstDefined(
        body.identity_reactivation_id,
        body.identityReactivationId,
        body.reactivation_id,
        body.reactivationId
      )
    ) || makeId("IDENTITY_REACTIVATION");

  const requestRecord = {
    id: reactivationId,
    identity_reactivation_id: reactivationId,
    reactivation_id: reactivationId,

    identity_id: targetIdentityId,
    actor_identity_id: sessionIdentityId,

    identity_collapse_id: cleanText(collapseState.identity_collapse_id || ""),
    identity_collapse_decision_id: cleanText(collapseState.identity_collapse_decision_id || ""),
    identity_turnstile_id: cleanText(collapseState.identity_turnstile_id || ""),

    status,
    reason,

    confirmation_phrase_required: REQUIRED_CONFIRMATION,
    confirmation_phrase_matched: true,

    requested: true,
    decided: false,
    approved: false,
    blocked: false,

    identity_collapsed: true,
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

  await env.IDENTITY.put("identity-reactivation:" + requestRecord.id, JSON.stringify(requestRecord), {
    expirationTtl: REACTIVATION_TTL_SECONDS
  });

  await appendIndex(env, "identity-reactivation:index:identity:" + targetIdentityId, requestRecord.id);
  await appendIndex(env, "identity-reactivation:index:actor:" + sessionIdentityId, requestRecord.id);
  await appendIndex(env, "identity-reactivation:index:status:" + status, requestRecord.id);
  await appendIndex(env, "identity-reactivation:index:reason:" + reason, requestRecord.id);

  await appendSync(env, targetIdentityId, {
    type: "identity_reactivation_requested",
    identity_reactivation_id: requestRecord.id,
    identity_collapse_id: requestRecord.identity_collapse_id || null,
    actor_identity_id: sessionIdentityId,
    status,
    reason,
    decided: false,
    identity_reactivated: false,
    login_restored: false,
    records_erased: false,
    at: now
  });

  await appendSync(env, sessionIdentityId, {
    type: "actor_identity_reactivation_requested",
    identity_reactivation_id: requestRecord.id,
    target_identity_id: targetIdentityId,
    status,
    reason,
    decided: false,
    identity_reactivated: false,
    at: now
  });

  return json({
    ok: true,
    created: true,
    identity_reactivation_id: requestRecord.id,
    identity_id: targetIdentityId,
    actor_identity_id: sessionIdentityId,
    status,
    reason,
    requested: true,
    decided: false,
    approved: false,
    blocked: false,
    identity_collapsed: true,
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
    next: {
      route: "/api/identity-reactivation-decision",
      method: "POST",
      reason: "reactivation_requested"
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

  const sessionIdentityId = getIdentityIdFromSession(session);

  if (!sessionIdentityId) {
    return json({ ok: false, error: "SESSION_IDENTITY_MISSING" }, 401);
  }

  const url = new URL(request.url);

  const reactivationId = cleanText(
    url.searchParams.get("identity_reactivation_id") ||
      url.searchParams.get("identityReactivationId") ||
      url.searchParams.get("reactivation_id") ||
      url.searchParams.get("reactivationId") ||
      url.searchParams.get("id")
  );

  if (reactivationId) {
    const requestRecord = await readReactivation(env, reactivationId);

    if (!requestRecord) {
      return json({ ok: false, error: "IDENTITY_REACTIVATION_NOT_FOUND" }, 404);
    }

    if (
      cleanText(requestRecord.identity_id || requestRecord.identityId) !== sessionIdentityId &&
      cleanText(requestRecord.actor_identity_id || requestRecord.actorIdentityId) !== sessionIdentityId
    ) {
      return json({ ok: false, error: "IDENTITY_REACTIVATION_ACCESS_DENIED" }, 403);
    }

    return json({
      ok: true,
      identity_reactivation: cleanReactivationForReturn(requestRecord)
    });
  }

  const ids = await readIndex(env, "identity-reactivation:index:identity:" + sessionIdentityId);
  const requests = [];

  for (const id of ids) {
    const requestRecord = await readReactivation(env, id);

    if (!requestRecord) continue;

    const identityId = cleanText(requestRecord.identity_id || requestRecord.identityId);
    const actorId = cleanText(requestRecord.actor_identity_id || requestRecord.actorIdentityId);

    if (identityId !== sessionIdentityId && actorId !== sessionIdentityId) continue;

    requests.push(cleanReactivationForReturn(requestRecord));
  }

  return json({
    ok: true,
    identity_id: sessionIdentityId,
    count: requests.length,
    identity_reactivations: requests,
    identity_reactivated: false,
    login_restored: false,
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

async function readReactivation(env, reactivationId) {
  const id = cleanText(reactivationId);

  if (!id) return null;

  return readJsonKey(env, "identity-reactivation:" + id);
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

function cleanReactivationForReturn(requestRecord) {
  return {
    id: requestRecord.id,
    identity_reactivation_id: requestRecord.identity_reactivation_id || requestRecord.id,
    identity_id: requestRecord.identity_id,
    actor_identity_id: requestRecord.actor_identity_id,
    identity_collapse_id: requestRecord.identity_collapse_id || null,
    identity_collapse_decision_id: requestRecord.identity_collapse_decision_id || null,
    identity_turnstile_id: requestRecord.identity_turnstile_id || null,
    status: requestRecord.status || "requested",
    reason: requestRecord.reason || "manual",
    requested: requestRecord.requested === true,
    decided: requestRecord.decided === true,
    approved: requestRecord.approved === true,
    blocked: requestRecord.blocked === true,
    identity_collapsed: requestRecord.identity_collapsed === true,
    identity_reactivated: false,
    login_restored: false,
    public_visibility_restored: false,
    new_activity_restored: false,
    history_preserved: requestRecord.history_preserved === true,
    records_erased: false,
    identity_deleted: false,
    payment_created: false,
    checkout_created: false,
    bank_transfer_executed: false,
    card_charged: false,
    real_account_exposed: false,
    ping_created: false,
    note: requestRecord.note || null,
    created_at: requestRecord.created_at || null,
    updated_at: requestRecord.updated_at || null
  };
}

function normalizeStatus(value) {
  const clean = cleanText(value || "requested").toLowerCase();

  if (ALLOWED_STATUS.has(clean)) {
    return clean;
  }

  return "";
}

function normalizeReason(value) {
  const clean = cleanText(value || "manual").toLowerCase();

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
