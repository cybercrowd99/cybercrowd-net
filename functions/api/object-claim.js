/**
 * functions/api/object-claim.js
 *
 * CyberCrowd Object Claim
 *
 * ONE JOB:
 * Let a verified identity claim or request an object after relevance creates movement.
 *
 * This is NOT payment.
 * This is NOT checkout.
 * This is NOT search.
 * This is NOT chat.
 * This does NOT create a PING.
 *
 * Object Handle says:
 * the item exists and carries a handle.
 *
 * Relevance says:
 * this item matters to this identity.
 *
 * PING says:
 * movement reached the identity.
 *
 * Object Claim says:
 * the identity wants to claim, request, reserve, inspect, buy later,
 * pick up, or attach proof to the object.
 */

const CLAIM_TTL_SECONDS = 60 * 60 * 24 * 90;
const OBJECT_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 90;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_CLAIM_KIND = new Set([
  "claim",
  "request",
  "reserve",
  "inspect",
  "buy_later",
  "pickup",
  "proof_attach",
  "question",
  "other"
]);

const ALLOWED_STATUS = new Set([
  "open",
  "pending",
  "accepted",
  "rejected",
  "cancelled",
  "fulfilled",
  "archived"
]);

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

  const claimantIdentityId = cleanText(
    session.identity_id ||
    session.identityId ||
    session.idl ||
    session.email
  );

  if (!claimantIdentityId) {
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

  const pingId = cleanText(body.ping_id || body.pingId);
  const relevanceId = cleanText(body.relevance_id || body.relevanceId);

  let ping = null;

  if (pingId) {
    ping = await readPing(env, pingId);

    if (!ping) {
      return json({
        ok: false,
        error: "PING_NOT_FOUND"
      }, 404);
    }

    if (ping.to_identity_id !== claimantIdentityId && ping.from_identity_id !== claimantIdentityId) {
      return json({
        ok: false,
        error: "PING_ACCESS_DENIED"
      }, 403);
    }
  }

  let relevance = null;

  if (relevanceId) {
    relevance = await readRelevance(env, relevanceId);

    if (!relevance) {
      return json({
        ok: false,
        error: "RELEVANCE_NOT_FOUND"
      }, 404);
    }

    if (relevance.identity_id !== claimantIdentityId) {
      return json({
        ok: false,
        error: "RELEVANCE_ACCESS_DENIED"
      }, 403);
    }
  }

  const objectId = cleanText(
    body.object_id ||
    body.objectId ||
    ping?.object_id ||
    relevance?.object_id
  );

  const objectHandle = cleanHandle(
    body.object_handle ||
    body.objectHandle ||
    body.handle ||
    ping?.object_handle ||
    relevance?.object_handle
  );

  let object = null;

  if (objectId) {
    object = await readObject(env, objectId);
  }

  if (!object && objectHandle) {
    const resolvedObjectId = await resolveObjectHandle(env, objectHandle);

    if (resolvedObjectId) {
      object = await readObject(env, resolvedObjectId);
    }
  }

  if (!object) {
    return json({
      ok: false,
      error: "OBJECT_REQUIRED"
    }, 400);
  }

  const ownerIdentityId = cleanText(
    object.owner_identity_id ||
    object.ownerIdentityId
  );

  if (!ownerIdentityId) {
    return json({
      ok: false,
      error: "OBJECT_OWNER_MISSING"
    }, 500);
  }

  if (ownerIdentityId === claimantIdentityId) {
    return json({
      ok: false,
      error: "SELF_CLAIM_IGNORED",
      reason: "object_owner_cannot_claim_own_object"
    }, 400);
  }

  const claimKind = normalizeClaimKind(
    body.kind ||
    body.claim_kind ||
    body.claimKind ||
    "claim"
  );

  if (!ALLOWED_CLAIM_KIND.has(claimKind)) {
    return json({
      ok: false,
      error: "CLAIM_KIND_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_CLAIM_KIND)
    }, 400);
  }

  const status = cleanText(body.status || "open").toLowerCase();

  if (!ALLOWED_STATUS.has(status)) {
    return json({
      ok: false,
      error: "CLAIM_STATUS_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_STATUS)
    }, 400);
  }

  const now = new Date().toISOString();

  const claimId = cleanText(
    body.claim_id ||
    body.claimId ||
    body.id
  ) || makeId("OBJECT_CLAIM");

  const existingClaimId = await firstIndexValue(
    env,
    "object-claim:index:object-claimant:" + object.id + ":" + claimantIdentityId
  );

  if (existingClaimId) {
    const existingClaim = await readClaim(env, existingClaimId);

    if (existingClaim && existingClaim.status !== "cancelled" && existingClaim.status !== "archived") {
      return json({
        ok: true,
        created: false,
        existing: true,
        claim_id: existingClaim.id,
        object_id: object.id,
        claimant_identity_id: claimantIdentityId,
        owner_identity_id: ownerIdentityId,
        status: existingClaim.status,
        ping_created: false,
        reason: "active_claim_already_exists"
      });
    }
  }

  const claim = {
    id: claimId,

    object_id: object.id,
    object_handle: object.handle || objectHandle || null,

    owner_identity_id: ownerIdentityId,
    claimant_identity_id: claimantIdentityId,

    kind: claimKind,
    status,

    ping_id: ping?.id || pingId || null,
    relevance_id: relevance?.id || relevanceId || null,
    intent_id: ping?.intent_id || relevance?.intent_id || cleanText(body.intent_id || body.intentId) || null,
    field_id: ping?.field_id || relevance?.field_id || cleanText(body.field_id || body.fieldId) || null,
    proximity_id: ping?.proximity_id || relevance?.proximity_id || cleanText(body.proximity_id || body.proximityId) || null,

    title: cleanText(body.title) || object.title || null,
    note: cleanText(body.note || body.message || body.description) || null,

    quantity: body.quantity || null,
    proposed_value: body.proposed_value || body.proposedValue || null,

    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  await env.IDENTITY.put(
    "object-claim:" + claim.id,
    JSON.stringify(claim),
    {
      expirationTtl: CLAIM_TTL_SECONDS
    }
  );

  await appendIndex(env, "object-claim:index:object:" + object.id, claim.id);
  await appendIndex(env, "object-claim:index:owner:" + ownerIdentityId, claim.id);
  await appendIndex(env, "object-claim:index:claimant:" + claimantIdentityId, claim.id);
  await appendIndex(env, "object-claim:index:status:" + status, claim.id);
  await appendIndex(env, "object-claim:index:kind:" + claimKind, claim.id);
  await appendIndex(env, "object-claim:index:object-claimant:" + object.id + ":" + claimantIdentityId, claim.id);

  if (claim.ping_id) {
    await appendIndex(env, "object-claim:index:ping:" + claim.ping_id, claim.id);
  }

  if (claim.relevance_id) {
    await appendIndex(env, "object-claim:index:relevance:" + claim.relevance_id, claim.id);
  }

  const updatedObject = maybeUpdateObjectStatus({
    object,
    claim,
    now
  });

  await env.IDENTITY.put(
    "object:" + updatedObject.id,
    JSON.stringify(updatedObject),
    {
      expirationTtl: OBJECT_TTL_SECONDS
    }
  );

  await appendSync(env, claim.id, {
    type: "object_claim_created",
    claim_id: claim.id,
    object_id: claim.object_id,
    claimant_identity_id: claimantIdentityId,
    owner_identity_id: ownerIdentityId,
    kind: claim.kind,
    status: claim.status,
    ping_id: claim.ping_id,
    relevance_id: claim.relevance_id,
    at: now
  });

  await appendSync(env, claimantIdentityId, {
    type: "identity_claimed_object",
    claim_id: claim.id,
    object_id: claim.object_id,
    object_handle: claim.object_handle,
    owner_identity_id: ownerIdentityId,
    kind: claim.kind,
    status: claim.status,
    ping_id: claim.ping_id,
    relevance_id: claim.relevance_id,
    at: now
  });

  await appendSync(env, ownerIdentityId, {
    type: "owned_object_claimed",
    claim_id: claim.id,
    object_id: claim.object_id,
    object_handle: claim.object_handle,
    claimant_identity_id: claimantIdentityId,
    kind: claim.kind,
    status: claim.status,
    ping_id: claim.ping_id,
    relevance_id: claim.relevance_id,
    at: now
  });

  await appendSync(env, object.id, {
    type: "object_claim_received",
    claim_id: claim.id,
    claimant_identity_id: claimantIdentityId,
    owner_identity_id: ownerIdentityId,
    kind: claim.kind,
    status: claim.status,
    ping_id: claim.ping_id,
    relevance_id: claim.relevance_id,
    at: now
  });

  if (claim.ping_id) {
    await appendSync(env, claim.ping_id, {
      type: "ping_created_object_claim",
      claim_id: claim.id,
      object_id: claim.object_id,
      claimant_identity_id: claimantIdentityId,
      owner_identity_id: ownerIdentityId,
      kind: claim.kind,
      status: claim.status,
      at: now
    });
  }

  if (claim.relevance_id) {
    await appendSync(env, claim.relevance_id, {
      type: "relevance_created_object_claim",
      claim_id: claim.id,
      object_id: claim.object_id,
      claimant_identity_id: claimantIdentityId,
      owner_identity_id: ownerIdentityId,
      kind: claim.kind,
      status: claim.status,
      at: now
    });
  }

  return json({
    ok: true,
    created: true,
    claim_id: claim.id,
    object_id: claim.object_id,
    object_handle: claim.object_handle,
    claimant_identity_id: claimantIdentityId,
    owner_identity_id: ownerIdentityId,
    kind: claim.kind,
    status: claim.status,
    ping_id: claim.ping_id,
    relevance_id: claim.relevance_id,
    object_status: updatedObject.status,
    ping_created: false,
    payment_created: false,
    next: {
      route: "/api/object-claim-decision",
      method: "POST",
      reason: "owner_can_accept_or_reject_claim"
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
    url.searchParams.get("claimId") ||
    url.searchParams.get("id")
  );

  if (claimId) {
    const claim = await readClaim(env, claimId);

    if (!claim) {
      return json({
        ok: false,
        error: "CLAIM_NOT_FOUND"
      }, 404);
    }

    if (claim.claimant_identity_id !== identityId && claim.owner_identity_id !== identityId) {
      return json({
        ok: false,
        error: "CLAIM_ACCESS_DENIED"
      }, 403);
    }

    return json({
      ok: true,
      claim: cleanClaimForReturn(claim),
      ping_created: false
    });
  }

  const role = cleanText(url.searchParams.get("role") || "claimant").toLowerCase();

  const indexKey = role === "owner"
    ? "object-claim:index:owner:" + identityId
    : "object-claim:index:claimant:" + identityId;

  const ids = await readIndex(env, indexKey);
  const claims = [];

  for (const id of ids) {
    const claim = await readClaim(env, id);

    if (!claim) continue;

    if (claim.claimant_identity_id !== identityId && claim.owner_identity_id !== identityId) {
      continue;
    }

    claims.push(cleanClaimForReturn(claim));
  }

  return json({
    ok: true,
    identity_id: identityId,
    role,
    count: claims.length,
    claims,
    ping_created: false
  });
}

function maybeUpdateObjectStatus(input) {
  const object = {
    ...input.object
  };

  const claim = input.claim;
  const now = input.now;

  if (claim.kind === "reserve" || claim.kind === "claim" || claim.kind === "pickup") {
    if (object.status === "available" || object.status === "waiting") {
      object.status = "reserved";
      object.reserved_by_identity_id = claim.claimant_identity_id;
      object.reserved_claim_id = claim.id;
      object.reserved_at = now;
    }
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

async function resolveObjectHandle(env, handle) {
  const clean = cleanHandle(handle);

  if (!clean) return "";

  const raw = await env.IDENTITY.get("object-handle:" + clean);

  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw);

    if (typeof parsed === "string") {
      return cleanText(parsed);
    }

    if (parsed && typeof parsed === "object") {
      return cleanText(parsed.object_id || parsed.objectId || parsed.id);
    }

    return "";
  } catch {
    return cleanText(raw);
  }
}

async function readPing(env, pingId) {
  const id = cleanText(pingId);

  if (!id) return null;

  const raw = await env.IDENTITY.get("ping:" + id);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readRelevance(env, relevanceId) {
  const id = cleanText(relevanceId);

  if (!id) return null;

  const raw = await env.IDENTITY.get("relevance:" + id);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
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

async function firstIndexValue(env, key) {
  const list = await readIndex(env, key);
  return list[0] || "";
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

function cleanClaimForReturn(claim) {
  return {
    id: claim.id,
    object_id: claim.object_id,
    object_handle: claim.object_handle || null,
    owner_identity_id: claim.owner_identity_id,
    claimant_identity_id: claim.claimant_identity_id,
    kind: claim.kind,
    status: claim.status,
    ping_id: claim.ping_id || null,
    relevance_id: claim.relevance_id || null,
    intent_id: claim.intent_id || null,
    field_id: claim.field_id || null,
    proximity_id: claim.proximity_id || null,
    title: claim.title || null,
    note: claim.note || null,
    quantity: claim.quantity || null,
    proposed_value: claim.proposed_value || null,
    created_at: claim.created_at || null,
    updated_at: claim.updated_at || null
  };
}

function normalizeClaimKind(value) {
  const clean = cleanText(value).toLowerCase();

  if (!clean) return "claim";

  if (clean === "buy") return "buy_later";
  if (clean === "purchase") return "buy_later";
  if (clean === "hold") return "reserve";
  if (clean === "ask") return "question";
  if (clean === "look") return "inspect";

  return clean;
}

function cleanHandle(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .replace(/^cc:\/\//i, "")
    .replace(/^object:/i, "")
    .replace(/^obj:/i, "")
    .replace(/^\/+/, "")
    .toLowerCase();
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
