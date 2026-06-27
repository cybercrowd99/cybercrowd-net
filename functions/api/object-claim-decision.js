/**
 * functions/api/object-claim-decision.js
 *
 * CyberCrowd Object Claim Decision
 *
 * ONE JOB:
 * Let the object owner accept, reject, cancel, or fulfill a claim.
 *
 * This is NOT payment.
 * This is NOT checkout.
 * This is NOT chat.
 * This does NOT create a PING.
 *
 * Object Claim says:
 * someone requested movement on an object.
 *
 * Object Claim Decision says:
 * the owner decides what happens to that claim.
 *
 * Flow:
 * claim exists
 *   ↓
 * owner decides
 *   ↓
 * object status updates if needed
 *   ↓
 * SYNC proves the decision
 */

const CLAIM_TTL_SECONDS = 60 * 60 * 24 * 90;
const OBJECT_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 90;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_DECISIONS = new Set([
  "accept",
  "reject",
  "cancel",
  "fulfill",
  "archive",
  "reopen"
]);

const CLAIM_STATUS_BY_DECISION = {
  accept: "accepted",
  reject: "rejected",
  cancel: "cancelled",
  fulfill: "fulfilled",
  archive: "archived",
  reopen: "open"
};

export async function onRequestOptions() {
  return json({
    ok: true
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env || !env.IDENTITY) {
    return json({
      ok: false,
      error: "IDENTITY_KV_MISSING"
    }, 500);
  }

  const session = await readVerifiedSession(request, env);

  if (!session) {
    return json({
      ok: false,
      error: "SESSION_REQUIRED"
    }, 401);
  }

  const actorIdentityId = cleanText(
    session.identity_id ||
    session.identityId ||
    session.idl ||
    session.email
  );

  if (!actorIdentityId) {
    return json({
      ok: false,
      error: "SESSION_IDENTITY_MISSING"
    }, 401);
  }

  const body = await readJson(request);

  if (!body) {
    return json({
      ok: false,
      error: "JSON_REQUIRED"
    }, 400);
  }

  const claimId = cleanText(
    body.claim_id ||
    body.claimId ||
    body.id
  );

  if (!claimId) {
    return json({
      ok: false,
      error: "CLAIM_ID_REQUIRED"
    }, 400);
  }

  const claim = await readClaim(env, claimId);

  if (!claim) {
    return json({
      ok: false,
      error: "CLAIM_NOT_FOUND"
    }, 404);
  }

  const ownerIdentityId = cleanText(claim.owner_identity_id);
  const claimantIdentityId = cleanText(claim.claimant_identity_id);

  if (!ownerIdentityId || !claimantIdentityId) {
    return json({
      ok: false,
      error: "CLAIM_IDENTITY_BOUNDARY_MISSING"
    }, 500);
  }

  const decision = cleanText(
    body.decision ||
    body.action ||
    "accept"
  ).toLowerCase();

  if (!ALLOWED_DECISIONS.has(decision)) {
    return json({
      ok: false,
      error: "CLAIM_DECISION_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_DECISIONS)
    }, 400);
  }

  const actorIsOwner = actorIdentityId === ownerIdentityId;
  const actorIsClaimant = actorIdentityId === claimantIdentityId;

  if (!actorIsOwner && !actorIsClaimant) {
    return json({
      ok: false,
      error: "CLAIM_DECISION_ACCESS_DENIED"
    }, 403);
  }

  if ((decision === "accept" || decision === "reject" || decision === "fulfill") && !actorIsOwner) {
    return json({
      ok: false,
      error: "OWNER_DECISION_REQUIRED",
      decision
    }, 403);
  }

  if ((decision === "cancel" || decision === "archive" || decision === "reopen") && !actorIsOwner && !actorIsClaimant) {
    return json({
      ok: false,
      error: "CLAIM_PARTY_REQUIRED",
      decision
    }, 403);
  }

  const object = await readObject(env, claim.object_id);

  if (!object) {
    return json({
      ok: false,
      error: "OBJECT_NOT_FOUND"
    }, 404);
  }

  if (cleanText(object.owner_identity_id) !== ownerIdentityId) {
    return json({
      ok: false,
      error: "OBJECT_OWNER_MISMATCH"
    }, 409);
  }

  const now = new Date().toISOString();
  const decisionId = cleanText(
    body.decision_id ||
    body.decisionId
  ) || makeId("CLAIM_DECISION");

  const previousStatus = claim.status || "open";
  const nextStatus = CLAIM_STATUS_BY_DECISION[decision];

  const updatedClaim = {
    ...claim,
    status: nextStatus,
    decision,
    decision_id: decisionId,
    decided_by_identity_id: actorIdentityId,
    decided_at: now,
    decision_note: cleanText(body.note || body.message || body.description) || null,
    updated_at: now
  };

  const decisionRecord = {
    id: decisionId,
    claim_id: claim.id,
    object_id: claim.object_id,
    object_handle: claim.object_handle || null,

    owner_identity_id: ownerIdentityId,
    claimant_identity_id: claimantIdentityId,
    actor_identity_id: actorIdentityId,

    decision,
    previous_status: previousStatus,
    next_status: nextStatus,

    note: updatedClaim.decision_note,

    ping_id: claim.ping_id || null,
    relevance_id: claim.relevance_id || null,
    intent_id: claim.intent_id || null,
    field_id: claim.field_id || null,
    proximity_id: claim.proximity_id || null,

    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  const updatedObject = updateObjectForDecision({
    object,
    claim: updatedClaim,
    decision,
    now
  });

  await env.IDENTITY.put(
    "object-claim:" + updatedClaim.id,
    JSON.stringify(updatedClaim),
    {
      expirationTtl: CLAIM_TTL_SECONDS
    }
  );

  await env.IDENTITY.put(
    "object-claim-decision:" + decisionRecord.id,
    JSON.stringify(decisionRecord),
    {
      expirationTtl: CLAIM_TTL_SECONDS
    }
  );

  await env.IDENTITY.put(
    "object:" + updatedObject.id,
    JSON.stringify(updatedObject),
    {
      expirationTtl: OBJECT_TTL_SECONDS
    }
  );

  await appendIndex(env, "object-claim-decision:index:claim:" + claim.id, decisionRecord.id);
  await appendIndex(env, "object-claim-decision:index:object:" + claim.object_id, decisionRecord.id);
  await appendIndex(env, "object-claim-decision:index:owner:" + ownerIdentityId, decisionRecord.id);
  await appendIndex(env, "object-claim-decision:index:claimant:" + claimantIdentityId, decisionRecord.id);
  await appendIndex(env, "object-claim-decision:index:decision:" + decision, decisionRecord.id);
  await appendIndex(env, "object-claim:index:status:" + nextStatus, claim.id);

  await appendSync(env, decisionRecord.id, {
    type: "object_claim_decision_recorded",
    decision_id: decisionRecord.id,
    claim_id: claim.id,
    object_id: claim.object_id,
    decision,
    previous_status: previousStatus,
    next_status: nextStatus,
    actor_identity_id: actorIdentityId,
    owner_identity_id: ownerIdentityId,
    claimant_identity_id: claimantIdentityId,
    at: now
  });

  await appendSync(env, claim.id, {
    type: "object_claim_decided",
    decision_id: decisionRecord.id,
    claim_id: claim.id,
    object_id: claim.object_id,
    decision,
    previous_status: previousStatus,
    next_status: nextStatus,
    actor_identity_id: actorIdentityId,
    at: now
  });

  await appendSync(env, claim.object_id, {
    type: "object_claim_decision_applied",
    decision_id: decisionRecord.id,
    claim_id: claim.id,
    decision,
    previous_claim_status: previousStatus,
    next_claim_status: nextStatus,
    object_status: updatedObject.status,
    owner_identity_id: ownerIdentityId,
    claimant_identity_id: claimantIdentityId,
    at: now
  });

  await appendSync(env, ownerIdentityId, {
    type: "owned_object_claim_decided",
    decision_id: decisionRecord.id,
    claim_id: claim.id,
    object_id: claim.object_id,
    decision,
    next_status: nextStatus,
    claimant_identity_id: claimantIdentityId,
    at: now
  });

  await appendSync(env, claimantIdentityId, {
    type: "object_claim_decision_received",
    decision_id: decisionRecord.id,
    claim_id: claim.id,
    object_id: claim.object_id,
    decision,
    next_status: nextStatus,
    owner_identity_id: ownerIdentityId,
    at: now
  });

  if (claim.ping_id) {
    await appendSync(env, claim.ping_id, {
      type: "ping_object_claim_decided",
      decision_id: decisionRecord.id,
      claim_id: claim.id,
      object_id: claim.object_id,
      decision,
      next_status: nextStatus,
      at: now
    });
  }

  if (claim.relevance_id) {
    await appendSync(env, claim.relevance_id, {
      type: "relevance_object_claim_decided",
      decision_id: decisionRecord.id,
      claim_id: claim.id,
      object_id: claim.object_id,
      decision,
      next_status: nextStatus,
      at: now
    });
  }

  return json({
    ok: true,
    created: true,
    decision_id: decisionRecord.id,
    claim_id: claim.id,
    object_id: claim.object_id,
    object_handle: claim.object_handle || null,
    owner_identity_id: ownerIdentityId,
    claimant_identity_id: claimantIdentityId,
    actor_identity_id: actorIdentityId,
    decision,
    previous_status: previousStatus,
    next_status: nextStatus,
    object_status: updatedObject.status,
    ping_created: false,
    payment_created: false,
    next: {
      route: "/api/sync-trail",
      method: "GET",
      reason: "claim_decision_recorded"
    }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env || !env.IDENTITY) {
    return json({
      ok: false,
      error: "IDENTITY_KV_MISSING"
    }, 500);
  }

  const session = await readVerifiedSession(request, env);

  if (!session) {
    return json({
      ok: false,
      error: "SESSION_REQUIRED"
    }, 401);
  }

  const identityId = cleanText(
    session.identity_id ||
    session.identityId ||
    session.idl ||
    session.email
  );

  if (!identityId) {
    return json({
      ok: false,
      error: "SESSION_IDENTITY_MISSING"
    }, 401);
  }

  const url = new URL(request.url);

  const claimId = cleanText(
    url.searchParams.get("claim_id") ||
    url.searchParams.get("claimId")
  );

  if (!claimId) {
    return json({
      ok: false,
      error: "CLAIM_ID_REQUIRED"
    }, 400);
  }

  const claim = await readClaim(env, claimId);

  if (!claim) {
    return json({
      ok: false,
      error: "CLAIM_NOT_FOUND"
    }, 404);
  }

  if (claim.owner_identity_id !== identityId && claim.claimant_identity_id !== identityId) {
    return json({
      ok: false,
      error: "CLAIM_ACCESS_DENIED"
    }, 403);
  }

  const ids = await readIndex(env, "object-claim-decision:index:claim:" + claim.id);
  const decisions = [];

  for (const id of ids) {
    const decision = await readDecision(env, id);

    if (!decision) continue;

    decisions.push(cleanDecisionForReturn(decision));
  }

  return json({
    ok: true,
    claim_id: claim.id,
    object_id: claim.object_id,
    count: decisions.length,
    decisions,
    ping_created: false
  });
}

function updateObjectForDecision(input) {
  const object = {
    ...input.object
  };

  const claim = input.claim;
  const decision = input.decision;
  const now = input.now;

  if (decision === "accept") {
    object.status = "reserved";
    object.reserved_by_identity_id = claim.claimant_identity_id;
    object.reserved_claim_id = claim.id;
    object.reserved_at = now;
  }

  if (decision === "reject" || decision === "cancel" || decision === "reopen") {
    if (object.reserved_claim_id === claim.id) {
      delete object.reserved_by_identity_id;
      delete object.reserved_claim_id;
      delete object.reserved_at;
    }

    if (object.status === "reserved") {
      object.status = "available";
    }
  }

  if (decision === "fulfill") {
    object.status = "fulfilled";
    object.fulfilled_by_identity_id = claim.claimant_identity_id;
    object.fulfilled_claim_id = claim.id;
    object.fulfilled_at = now;
  }

  if (decision === "archive") {
    object.status = "archived";
    object.archived_at = now;
  }

  object.updated_at = now;

  return object;
}

async function readVerifiedSession(request, env) {
  const token =
    getCookie(request, "session") ||
    getCookie(request, "cc_session") ||
    getBearerToken(request);

  if (!token) {
    return null;
  }

  const raw = await env.IDENTITY.get("session:" + token);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function readClaim(env, claimId) {
  const id = cleanText(claimId);

  if (!id) return null;

  const raw = await env.IDENTITY.get("object-claim:" + id);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readObject(env, objectId) {
  const id = cleanText(objectId);

  if (!id) return null;

  const raw =
    await env.IDENTITY.get("object:" + id) ||
    await env.IDENTITY.get("obj:" + id);

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

  const raw = await env.IDENTITY.get("object-claim-decision:" + id);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
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

      if (Array.isArray(parsed)) {
        list = parsed;
      }
    } catch {
      list = [];
    }
  }

  list = list.filter((item) => item !== value);
  list.unshift(value);
  list = list.slice(0, MAX_INDEX_ITEMS);

  await env.IDENTITY.put(
    key,
    JSON.stringify(list),
    {
      expirationTtl: INDEX_TTL_SECONDS
    }
  );
}

async function appendSync(env, targetId, event) {
  if (!targetId) return;

  const key = "sync:" + targetId;
  const raw = await env.IDENTITY.get(key);

  let trail = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        trail = parsed;
      }
    } catch {
      trail = [];
    }
  }

  trail.unshift({
    sync_id: makeId("SYNC"),
    ...event
  });

  trail = trail.slice(0, MAX_INDEX_ITEMS);

  await env.IDENTITY.put(
    key,
    JSON.stringify(trail),
    {
      expirationTtl: INDEX_TTL_SECONDS
    }
  );
}

function cleanDecisionForReturn(decision) {
  return {
    id: decision.id,
    claim_id: decision.claim_id,
    object_id: decision.object_id,
    object_handle: decision.object_handle || null,
    owner_identity_id: decision.owner_identity_id,
    claimant_identity_id: decision.claimant_identity_id,
    actor_identity_id: decision.actor_identity_id,
    decision: decision.decision,
    previous_status: decision.previous_status,
    next_status: decision.next_status,
    note: decision.note || null,
    ping_id: decision.ping_id || null,
    relevance_id: decision.relevance_id || null,
    intent_id: decision.intent_id || null,
    field_id: decision.field_id || null,
    proximity_id: decision.proximity_id || null,
    created_at: decision.created_at || null,
    updated_at: decision.updated_at || null
  };
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

  if (!match) {
    return "";
  }

  return match[1].trim();
}

function cleanText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
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
      lower.includes("cookie")
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
