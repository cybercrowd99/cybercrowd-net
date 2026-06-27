/**
 * functions/api/object-handoff.js
 *
 * CyberCrowd Object Handoff
 *
 * ONE JOB:
 * Record the handoff of an object after an accepted or fulfilled claim.
 *
 * This is NOT payment.
 * This is NOT checkout.
 * This is NOT chat.
 * This does NOT create a PING.
 *
 * Object Claim Decision says:
 * the claim was accepted or fulfilled.
 *
 * Object Handoff says:
 * the object actually moved from one identity boundary to another.
 *
 * Flow:
 * claim accepted / fulfilled
 *   ↓
 * object handoff recorded
 *   ↓
 * custody movement written to SYNC
 */

const HANDOFF_TTL_SECONDS = 60 * 60 * 24 * 180;
const OBJECT_TTL_SECONDS = 60 * 60 * 24 * 365;
const INDEX_TTL_SECONDS = 60 * 60 * 24 * 180;
const MAX_INDEX_ITEMS = 100;

const ALLOWED_HANDOFF_KIND = new Set([
  "pickup",
  "delivery",
  "transfer",
  "proof_transfer",
  "service_handoff",
  "return",
  "other"
]);

const ALLOWED_STATUS = new Set([
  "pending",
  "completed",
  "cancelled",
  "disputed",
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
    body.claimId
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

  if (actorIdentityId !== ownerIdentityId && actorIdentityId !== claimantIdentityId) {
    return json({
      ok: false,
      error: "HANDOFF_ACCESS_DENIED"
    }, 403);
  }

  if (
    claim.status !== "accepted" &&
    claim.status !== "fulfilled" &&
    body.force !== true
  ) {
    return json({
      ok: false,
      error: "CLAIM_NOT_READY_FOR_HANDOFF",
      claim_status: claim.status,
      required: ["accepted", "fulfilled"]
    }, 409);
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

  const handoffKind = normalizeHandoffKind(
    body.kind ||
    body.handoff_kind ||
    body.handoffKind ||
    "transfer"
  );

  if (!ALLOWED_HANDOFF_KIND.has(handoffKind)) {
    return json({
      ok: false,
      error: "HANDOFF_KIND_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_HANDOFF_KIND)
    }, 400);
  }

  const status = cleanText(body.status || "completed").toLowerCase();

  if (!ALLOWED_STATUS.has(status)) {
    return json({
      ok: false,
      error: "HANDOFF_STATUS_NOT_ALLOWED",
      allowed: Array.from(ALLOWED_STATUS)
    }, 400);
  }

  const now = new Date().toISOString();

  const handoffId = cleanText(
    body.handoff_id ||
    body.handoffId ||
    body.id
  ) || makeId("OBJECT_HANDOFF");

  const fromIdentityId = cleanText(
    body.from_identity_id ||
    body.fromIdentityId ||
    ownerIdentityId
  );

  const toIdentityId = cleanText(
    body.to_identity_id ||
    body.toIdentityId ||
    claimantIdentityId
  );

  if (fromIdentityId !== ownerIdentityId && fromIdentityId !== claimantIdentityId) {
    return json({
      ok: false,
      error: "HANDOFF_FROM_IDENTITY_INVALID"
    }, 400);
  }

  if (toIdentityId !== ownerIdentityId && toIdentityId !== claimantIdentityId) {
    return json({
      ok: false,
      error: "HANDOFF_TO_IDENTITY_INVALID"
    }, 400);
  }

  if (fromIdentityId === toIdentityId) {
    return json({
      ok: false,
      error: "HANDOFF_REQUIRES_TWO_IDENTITIES"
    }, 400);
  }

  const handoff = {
    id: handoffId,

    object_id: object.id,
    object_handle: object.handle || claim.object_handle || null,

    claim_id: claim.id,
    decision_id: claim.decision_id || null,

    owner_identity_id: ownerIdentityId,
    claimant_identity_id: claimantIdentityId,

    from_identity_id: fromIdentityId,
    to_identity_id: toIdentityId,
    actor_identity_id: actorIdentityId,

    kind: handoffKind,
    status,

    ping_id: claim.ping_id || null,
    relevance_id: claim.relevance_id || null,
    intent_id: claim.intent_id || null,
    field_id: claim.field_id || null,
    proximity_id: claim.proximity_id || null,

    proof_shot_id: cleanText(body.proof_shot_id || body.proofShotId || body.shot_id || body.shotId) || null,
    note: cleanText(body.note || body.message || body.description) || null,

    area: normalizeArea(body.area),

    created_at: now,
    updated_at: now,

    metadata: cleanMetadata(body.metadata)
  };

  const updatedClaim = {
    ...claim,
    status: status === "completed" ? "fulfilled" : claim.status,
    handoff_id: handoff.id,
    handoff_status: status,
    handed_off_at: status === "completed" ? now : claim.handed_off_at || null,
    updated_at: now
  };

  const updatedObject = updateObjectForHandoff({
    object,
    handoff,
    now
  });

  await env.IDENTITY.put(
    "object-handoff:" + handoff.id,
    JSON.stringify(handoff),
    {
      expirationTtl: HANDOFF_TTL_SECONDS
    }
  );

  await env.IDENTITY.put(
    "object-claim:" + updatedClaim.id,
    JSON.stringify(updatedClaim),
    {
      expirationTtl: HANDOFF_TTL_SECONDS
    }
  );

  await env.IDENTITY.put(
    "object:" + updatedObject.id,
    JSON.stringify(updatedObject),
    {
      expirationTtl: OBJECT_TTL_SECONDS
    }
  );

  await appendIndex(env, "object-handoff:index:object:" + object.id, handoff.id);
  await appendIndex(env, "object-handoff:index:claim:" + claim.id, handoff.id);
  await appendIndex(env, "object-handoff:index:from:" + fromIdentityId, handoff.id);
  await appendIndex(env, "object-handoff:index:to:" + toIdentityId, handoff.id);
  await appendIndex(env, "object-handoff:index:owner:" + ownerIdentityId, handoff.id);
  await appendIndex(env, "object-handoff:index:claimant:" + claimantIdentityId, handoff.id);
  await appendIndex(env, "object-handoff:index:status:" + status, handoff.id);
  await appendIndex(env, "object-handoff:index:kind:" + handoffKind, handoff.id);

  await appendSync(env, handoff.id, {
    type: "object_handoff_recorded",
    handoff_id: handoff.id,
    object_id: object.id,
    claim_id: claim.id,
    from_identity_id: fromIdentityId,
    to_identity_id: toIdentityId,
    actor_identity_id: actorIdentityId,
    kind: handoff.kind,
    status: handoff.status,
    at: now
  });

  await appendSync(env, object.id, {
    type: "object_handed_off",
    handoff_id: handoff.id,
    claim_id: claim.id,
    from_identity_id: fromIdentityId,
    to_identity_id: toIdentityId,
    kind: handoff.kind,
    status: handoff.status,
    object_status: updatedObject.status,
    at: now
  });

  await appendSync(env, claim.id, {
    type: "claim_handoff_recorded",
    handoff_id: handoff.id,
    object_id: object.id,
    from_identity_id: fromIdentityId,
    to_identity_id: toIdentityId,
    status: handoff.status,
    at: now
  });

  await appendSync(env, fromIdentityId, {
    type: "identity_handed_off_object",
    handoff_id: handoff.id,
    object_id: object.id,
    claim_id: claim.id,
    to_identity_id: toIdentityId,
    status: handoff.status,
    at: now
  });

  await appendSync(env, toIdentityId, {
    type: "identity_received_object_handoff",
    handoff_id: handoff.id,
    object_id: object.id,
    claim_id: claim.id,
    from_identity_id: fromIdentityId,
    status: handoff.status,
    at: now
  });

  if (handoff.ping_id) {
    await appendSync(env, handoff.ping_id, {
      type: "ping_object_handoff_recorded",
      handoff_id: handoff.id,
      object_id: object.id,
      claim_id: claim.id,
      status: handoff.status,
      at: now
    });
  }

  if (handoff.relevance_id) {
    await appendSync(env, handoff.relevance_id, {
      type: "relevance_object_handoff_recorded",
      handoff_id: handoff.id,
      object_id: object.id,
      claim_id: claim.id,
      status: handoff.status,
      at: now
    });
  }

  if (handoff.proof_shot_id) {
    await appendSync(env, handoff.proof_shot_id, {
      type: "shot_proves_object_handoff",
      handoff_id: handoff.id,
      object_id: object.id,
      claim_id: claim.id,
      from_identity_id: fromIdentityId,
      to_identity_id: toIdentityId,
      status: handoff.status,
      at: now
    });
  }

  return json({
    ok: true,
    created: true,
    handoff_id: handoff.id,
    object_id: object.id,
    object_handle: handoff.object_handle,
    claim_id: claim.id,
    owner_identity_id: ownerIdentityId,
    claimant_identity_id: claimantIdentityId,
    from_identity_id: fromIdentityId,
    to_identity_id: toIdentityId,
    kind: handoff.kind,
    status: handoff.status,
    object_status: updatedObject.status,
    ping_created: false,
    payment_created: false,
    next: {
      route: "/api/sync-trail",
      method: "GET",
      reason: "handoff_recorded"
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

  const handoffId = cleanText(
    url.searchParams.get("handoff_id") ||
    url.searchParams.get("handoffId") ||
    url.searchParams.get("id")
  );

  if (handoffId) {
    const handoff = await readHandoff(env, handoffId);

    if (!handoff) {
      return json({
        ok: false,
        error: "HANDOFF_NOT_FOUND"
      }, 404);
    }

    if (!canReadHandoff(handoff, identityId)) {
      return json({
        ok: false,
        error: "HANDOFF_ACCESS_DENIED"
      }, 403);
    }

    return json({
      ok: true,
      handoff: cleanHandoffForReturn(handoff),
      ping_created: false
    });
  }

  const role = cleanText(url.searchParams.get("role") || "to").toLowerCase();

  const key = role === "from"
    ? "object-handoff:index:from:" + identityId
    : role === "owner"
      ? "object-handoff:index:owner:" + identityId
      : role === "claimant"
        ? "object-handoff:index:claimant:" + identityId
        : "object-handoff:index:to:" + identityId;

  const ids = await readIndex(env, key);
  const handoffs = [];

  for (const id of ids) {
    const handoff = await readHandoff(env, id);

    if (!handoff) continue;
    if (!canReadHandoff(handoff, identityId)) continue;

    handoffs.push(cleanHandoffForReturn(handoff));
  }

  return json({
    ok: true,
    identity_id: identityId,
    role,
    count: handoffs.length,
    handoffs,
    ping_created: false
  });
}

function updateObjectForHandoff(input) {
  const object = {
    ...input.object
  };

  const handoff = input.handoff;
  const now = input.now;

  if (handoff.status === "completed") {
    object.status = "handed_off";
    object.handoff_id = handoff.id;
    object.current_holder_identity_id = handoff.to_identity_id;
    object.previous_holder_identity_id = handoff.from_identity_id;
    object.handed_off_at = now;
  }

  if (handoff.status === "cancelled") {
    if (object.handoff_id === handoff.id) {
      delete object.handoff_id;
      delete object.current_holder_identity_id;
      delete object.previous_holder_identity_id;
      delete object.handed_off_at;
    }

    if (object.status === "handed_off") {
      object.status = "reserved";
    }
  }

  object.updated_at = now;

  return object;
}

function canReadHandoff(handoff, identityId) {
  return (
    handoff.owner_identity_id === identityId ||
    handoff.claimant_identity_id === identityId ||
    handoff.from_identity_id === identityId ||
    handoff.to_identity_id === identityId ||
    handoff.actor_identity_id === identityId
  );
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

async function readHandoff(env, handoffId) {
  const id = cleanText(handoffId);

  if (!id) return null;

  const raw = await env.IDENTITY.get("object-handoff:" + id);

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

function cleanHandoffForReturn(handoff) {
  return {
    id: handoff.id,
    object_id: handoff.object_id,
    object_handle: handoff.object_handle || null,
    claim_id: handoff.claim_id,
    decision_id: handoff.decision_id || null,
    owner_identity_id: handoff.owner_identity_id,
    claimant_identity_id: handoff.claimant_identity_id,
    from_identity_id: handoff.from_identity_id,
    to_identity_id: handoff.to_identity_id,
    actor_identity_id: handoff.actor_identity_id,
    kind: handoff.kind,
    status: handoff.status,
    ping_id: handoff.ping_id || null,
    relevance_id: handoff.relevance_id || null,
    intent_id: handoff.intent_id || null,
    field_id: handoff.field_id || null,
    proximity_id: handoff.proximity_id || null,
    proof_shot_id: handoff.proof_shot_id || null,
    note: handoff.note || null,
    area: handoff.area || null,
    created_at: handoff.created_at || null,
    updated_at: handoff.updated_at || null
  };
}

function normalizeHandoffKind(value) {
  const clean = cleanText(value).toLowerCase();

  if (!clean) return "transfer";

  if (clean === "pick_up") return "pickup";
  if (clean === "handoff") return "transfer";
  if (clean === "proof") return "proof_transfer";
  if (clean === "service") return "service_handoff";

  return clean;
}

function normalizeArea(area) {
  if (!area || typeof area !== "object") return null;

  const lat = Number(area.lat || area.latitude);
  const lng = Number(area.lng || area.longitude);

  return {
    label: cleanText(area.label || area.name),
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null
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
